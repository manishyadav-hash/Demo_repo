import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { Env } from "../config/env.config";
import { validateChatParticipant } from "../services/chat.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server | null = null;

const onlineUsers = new Map<string, string>();
const activeCalls = new Map<string, string>();

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests from localhost and any local IP address
        const allowedPatterns = [
          /^http:\/\/localhost:\d+$/,
          /^http:\/\/127\.0\.0\.1:\d+$/,
          /^http:\/\/\d+\.\d+\.\d+\.\d+:\d+$/, // Allow any local IP with any port
        ];

        if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const getCookieValue = (rawCookie: string, name: string) => {
    const target = rawCookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));
    if (!target) return "";
    return decodeURIComponent(target.slice(name.length + 1));
  };

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;

      if (!rawCookie) return next(new Error("Unauthorized"));

      const token = getCookieValue(rawCookie, "accessToken");
      if (!token) return next(new Error("Unauthorized"));

      const decodedToken = jwt.verify(token, Env.JWT_SECRET) as {
        userId: string;
      };
      if (!decodedToken) return next(new Error("Unauthorized"));

      socket.userId = decodedToken.userId;
      next();
    } catch (error) {
      next(new Error("Internal server error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const newSocketId = socket.id;
    if (!socket.userId) {
      socket.disconnect(true);
      return;
    }

    //register socket for the user
    onlineUsers.set(userId, newSocketId);

    //BroadCast online users to all socket
    io?.emit("online:users", Array.from(onlineUsers.keys()));

    //create personnal room for user
    socket.join(`user:${userId}`);

    socket.on(
      "chat:join",
      async (chatId: string, callback?: (err?: string) => void) => {
        try {
          await validateChatParticipant(chatId, userId);
          socket.join(`chat:${chatId}`);
          console.log(`User ${userId} join room chat:${chatId}`);

          callback?.();
        } catch (error) {
          callback?.("Error joining chat");
        }
      }
    );

    socket.on("chat:leave", (chatId: string) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
        console.log(`User ${userId} left room chat:${chatId}`);
      }
    });

    const emitToUser = (targetUserId: string, event: string, payload: any) => {
      io?.to(`user:${targetUserId}`).emit(event, payload);
    };

    const clearActiveCall = (targetUserId: string) => {
      const peerId = activeCalls.get(targetUserId);
      if (peerId) {
        activeCalls.delete(targetUserId);
        if (activeCalls.get(peerId) === targetUserId) {
          activeCalls.delete(peerId);
        }
        emitToUser(peerId, "call:ended", {
          fromUserId: targetUserId,
          reason: "ended",
        });
      }
    };

    socket.on(
      "call:request",
      (payload: { toUserId?: string; chatId?: string; callType?: string }) => {
        const { toUserId, chatId, callType } = payload || {};
        if (!toUserId || !chatId) return;
        if (!onlineUsers.has(toUserId)) {
          socket.emit("call:unavailable", { toUserId, chatId });
          return;
        }
        if (activeCalls.has(userId) || activeCalls.has(toUserId)) {
          socket.emit("call:busy", { toUserId, chatId });
          return;
        }
        emitToUser(toUserId, "call:incoming", {
          fromUserId: userId,
          chatId,
          callType,
        });
      }
    );

    socket.on(
      "call:accept",
      (payload: { toUserId?: string; chatId?: string; callType?: string }) => {
        const { toUserId, chatId, callType } = payload || {};
        if (!toUserId || !chatId) return;
        activeCalls.set(userId, toUserId);
        activeCalls.set(toUserId, userId);
        emitToUser(toUserId, "call:accepted", {
          fromUserId: userId,
          chatId,
          callType,
        });
      }
    );

    socket.on(
      "call:reject",
      (payload: { toUserId?: string; chatId?: string }) => {
        const { toUserId, chatId } = payload || {};
        if (!toUserId || !chatId) return;
        emitToUser(toUserId, "call:rejected", {
          fromUserId: userId,
          chatId,
        });
      }
    );

    socket.on(
      "call:offer",
      (payload: {
        toUserId?: string;
        chatId?: string;
        callType?: string;
        sdp?: any;
      }) => {
        const { toUserId, chatId, callType, sdp } = payload || {};
        if (!toUserId || !chatId || !sdp) return;
        emitToUser(toUserId, "call:offer", {
          fromUserId: userId,
          chatId,
          callType,
          sdp,
        });
      }
    );

    socket.on(
      "call:answer",
      (payload: { toUserId?: string; chatId?: string; sdp?: any }) => {
        const { toUserId, chatId, sdp } = payload || {};
        if (!toUserId || !chatId || !sdp) return;
        emitToUser(toUserId, "call:answer", {
          fromUserId: userId,
          chatId,
          sdp,
        });
      }
    );

    socket.on(
      "call:ice",
      (payload: {
        toUserId?: string;
        chatId?: string;
        candidate?: any;
      }) => {
        const { toUserId, chatId, candidate } = payload || {};
        if (!toUserId || !chatId || !candidate) return;
        emitToUser(toUserId, "call:ice", {
          fromUserId: userId,
          chatId,
          candidate,
        });
      }
    );

    socket.on(
      "call:end",
      (payload: { toUserId?: string; chatId?: string }) => {
        const { toUserId, chatId } = payload || {};
        if (toUserId && chatId) {
          emitToUser(toUserId, "call:ended", {
            fromUserId: userId,
            chatId,
            reason: "ended",
          });
        }
        clearActiveCall(userId);
      }
    );

    socket.on("disconnect", () => {
      clearActiveCall(userId);
      if (onlineUsers.get(userId) === newSocketId) {
        if (userId) onlineUsers.delete(userId);

        io?.emit("online:users", Array.from(onlineUsers.keys()));

        console.log("socket disconnected", {
          userId,
          newSocketId,
        });
      }
    });
  });
};

function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

export const emitNewChatToParticpants = (
  participantIds: string[] = [],
  chat: any
) => {
  const io = getIO();
  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:new", chat);
  }
};

export const emitNewMessageToChatRoom = (
  senderId: string, //userId that sent the message
  chatId: string,
  message: any
) => {
  const io = getIO();
  const senderSocketId = onlineUsers.get(senderId?.toString());

  console.log(senderId, "senderId");
  console.log(senderSocketId, "sender socketid exist");
  console.log("All online users:", Object.fromEntries(onlineUsers));

  if (senderSocketId) {
    io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
  } else {
    io.to(`chat:${chatId}`).emit("message:new", message);
  }
};

export const emitLastMessageToParticipants = (
  participantIds: string[],
  chatId: string,
  lastMessage: any
) => {
  const io = getIO();
  const payload = { chatId, lastMessage };

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:update", payload);
  }
};
