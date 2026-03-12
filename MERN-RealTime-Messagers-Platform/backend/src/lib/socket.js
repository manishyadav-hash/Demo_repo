"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitLastMessageToParticipants = exports.emitNewMessageToChatRoom = exports.emitNewChatToParticpants = exports.initializeSocket = void 0;

const jsonwebtoken_1 = require("jsonwebtoken");
const jsonwebtoken_1_default = jsonwebtoken_1.default || jsonwebtoken_1;
const socket_io_1 = require("socket.io");
const env_config_1 = require("../config/env.config");
const chat_service_1 = require("../services/chat.service");

// ========== GLOBAL STATE ==========
// io holds the Socket.IO server instance (used across the app)
let io = null;

// Map stores userId -> socketId for tracking who's online
// Example: Map { "user123" => "socket456" }
const onlineUsers = new Map();

// Map tracks active calls between users (prevents duplicate calls)
// Example: Map { "user1" => "user2", "user2" => "user1" } (bidirectional tracking)
const activeCalls = new Map();

/**
 * Initialize Socket.IO server and set up all real-time event handlers
 * This runs once when the Express server starts
 */
const initializeSocket = (httpServer) => {
    // Create Socket.IO server attached to the HTTP server
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: function (origin, callback) {
                // CORS for WebSocket connections (similar to Express CORS)
                // Allows frontend to establish WebSocket connections from different origins
                const allowedPatterns = [
                    /^http:\/\/localhost:\d+$/,
                    /^http:\/\/127\.0\.0\.1:\d+$/,
                    /^http:\/\/\d+\.\d+\.\d+\.\d+:\d+$/, // Allow any local IP with any port
                ];
                if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ["GET", "POST"],
            credentials: true, // Allow cookies for authentication
        },
    });
    
    /**
     * Helper function to extract a specific cookie value from raw cookie string
     * Example: "sessionId=abc; accessToken=xyz" => getCookieValue(..., "accessToken") returns "xyz"
     */
    const getCookieValue = (rawCookie, name) => {
        const target = rawCookie
            .split(";")                          // Split "cookie1=val1; cookie2=val2" into array
            .map((part) => part.trim())          // Remove extra spaces
            .find((part) => part.startsWith(`${name}=`)); // Find the one starting with our name
        
        if (!target)
            return "";
        
        // Extract just the value part and decode special characters
        return decodeURIComponent(target.slice(name.length + 1));
    };
    
    /**
     * MIDDLEWARE: Authentication check before allowing WebSocket connection
     * Runs before the "connection" event for every new socket
     * Similar to passport.authenticate() for HTTP routes
     */
    io.use(async (socket, next) => {
        try {
            // Get cookies from WebSocket handshake (initial connection request)
            const rawCookie = socket.handshake.headers.cookie;
            if (!rawCookie)
                return next(new Error("Unauthorized"));
            
            // Extract JWT token from cookies
            const token = getCookieValue(rawCookie, "accessToken");
            if (!token)
                return next(new Error("Unauthorized"));
            
            // Verify JWT token is valid and not expired
            const decodedToken = jsonwebtoken_1_default.verify(token, env_config_1.Env.JWT_SECRET);
            if (!decodedToken)
                return next(new Error("Unauthorized"));
            
            // Attach userId to socket object for use in event handlers
            // Now every event handler can access socket.userId
            socket.userId = decodedToken.userId;
            
            next(); // Allow connection to proceed
        }
        catch (error) {
            next(new Error("Internal server error"));
        }
    });
    
    /**
     * EVENT HANDLER: "connection" fires when a client successfully connects
     * Everything inside this function handles events for ONE specific socket connection
     */
    io.on("connection", (socket) => {
        const userId = socket.userId;  // Get authenticated user ID
        const newSocketId = socket.id; // Unique ID for this socket connection
        
        // Safety check: disconnect if authentication failed
        if (!socket.userId) {
            socket.disconnect(true);
            return;
        }
        
        // ========== ONLINE STATUS TRACKING ==========
        
        // Register this user as online with their socket ID
        onlineUsers.set(userId, newSocketId);
        
        // Broadcast updated online users list to ALL connected clients
        // Array.from converts Map keys to array: [userId1, userId2, ...]
        io?.emit("online:users", Array.from(onlineUsers.keys()));
        
        // ========== ROOM MANAGEMENT ==========
        
        // Create a personal room for this user (for direct notifications)
        // Rooms allow targeting specific users: io.to(`user:${userId}`).emit(...)
        socket.join(`user:${userId}`);
        
        /**
         * EVENT: "chat:join" - User opens a specific chat
         * They join a room to receive real-time messages for that chat
         */
        socket.on("chat:join", async (chatId, callback) => {
            try {
                // Verify user is actually a participant of this chat (security check)
                await (0, chat_service_1.validateChatParticipant)(chatId, userId);
                
                // Join the chat room to receive messages
                socket.join(`chat:${chatId}`);
                console.log(`User ${userId} join room chat:${chatId}`);
                
                // Call the client's callback to confirm success
                callback?.();
            }
            catch (error) {
                // Send error back to client via callback
                callback?.("Error joining chat");
            }
        });
        
        /**
         * EVENT: "chat:leave" - User closes/leaves a chat
         */
        socket.on("chat:leave", (chatId) => {
            if (chatId) {
                socket.leave(`chat:${chatId}`);
                console.log(`User ${userId} left room chat:${chatId}`);
            }
        });
        
        // ========== WEBRTC CALL SIGNALING ==========
        // These events facilitate peer-to-peer audio/video calls using WebRTC
        // The server acts as a "signaling server" to exchange connection info between peers
        
        /**
         * Helper: Send event to a specific user's personal room
         */
        const emitToUser = (targetUserId, event, payload) => {
            io?.to(`user:${targetUserId}`).emit(event, payload);
        };
        
        /**
         * Helper: Clean up call state when a call ends
         * Removes both users from activeCalls Map and notifies peer
         */
        const clearActiveCall = (targetUserId) => {
            // Get who this user was calling
            const peerId = activeCalls.get(targetUserId);
            
            if (peerId) {
                // Remove both sides of the call tracking
                activeCalls.delete(targetUserId);
                
                // If peer also has this user tracked, remove it
                if (activeCalls.get(peerId) === targetUserId) {
                    activeCalls.delete(peerId);
                }
                
                // Notify the peer that call ended
                emitToUser(peerId, "call:ended", {
                    fromUserId: targetUserId,
                    reason: "ended",
                });
            }
        };
        
        /**
         * EVENT: "call:request" - User initiates a call to another user
         * Checks if recipient is online and not already in a call
         */
        socket.on("call:request", (payload) => {
            const { toUserId, chatId, callType } = payload || {};
            
            // Validate required fields
            if (!toUserId || !chatId)
                return;
            
            // Check if recipient is online
            if (!onlineUsers.has(toUserId)) {
                socket.emit("call:unavailable", { toUserId, chatId });
                return;
            }
            
            // Check if either user is already in a call (prevent overlapping calls)
            if (activeCalls.has(userId) || activeCalls.has(toUserId)) {
                socket.emit("call:busy", { toUserId, chatId });
                return;
            }
            
            // Forward call request to recipient
            emitToUser(toUserId, "call:incoming", {
                fromUserId: userId,
                chatId,
                callType,  // "audio" or "video"
            });
        });
        
        /**
         * EVENT: "call:accept" - Recipient accepts the incoming call
         * Marks both users as in an active call
         */
        socket.on("call:accept", (payload) => {
            const { toUserId, chatId, callType } = payload || {};
            if (!toUserId || !chatId)
                return;
            
            // Mark both users as in active call (bidirectional tracking)
            activeCalls.set(userId, toUserId);
            activeCalls.set(toUserId, userId);
            
            // Notify caller that call was accepted
            emitToUser(toUserId, "call:accepted", {
                fromUserId: userId,
                chatId,
                callType,
            });
        });
        
        /**
         * EVENT: "call:reject" - Recipient rejects the incoming call
         */
        socket.on("call:reject", (payload) => {
            const { toUserId, chatId } = payload || {};
            if (!toUserId || !chatId)
                return;
            
            // Notify caller that call was rejected
            emitToUser(toUserId, "call:rejected", {
                fromUserId: userId,
                chatId,
            });
        });
        
        /**
         * EVENT: "call:offer" - WebRTC SDP offer (connection details from caller)
         * SDP contains information about media capabilities, codecs, IP addresses
         * This is part of WebRTC's offer/answer negotiation
         */
        socket.on("call:offer", (payload) => {
            const { toUserId, chatId, callType, sdp } = payload || {};
            if (!toUserId || !chatId || !sdp)
                return;
            
            // Forward SDP offer to the other peer
            emitToUser(toUserId, "call:offer", {
                fromUserId: userId,
                chatId,
                callType,
                sdp,
            });
        });
        
        /**
         * EVENT: "call:answer" - WebRTC SDP answer (response from recipient)
         * The recipient sends back their connection details in response to the offer
         */
        socket.on("call:answer", (payload) => {
            const { toUserId, chatId, sdp } = payload || {};
            if (!toUserId || !chatId || !sdp)
                return;
            
            // Forward SDP answer back to the caller
            emitToUser(toUserId, "call:answer", {
                fromUserId: userId,
                chatId,
                sdp,  // Session Description Protocol answer
            });
        });
        
        /**
         * EVENT: "call:ice" - ICE candidate exchange for NAT traversal
         * ICE candidates are potential network paths for connecting peers
         * Both peers exchange multiple candidates to find the best connection path
         * This is crucial for mobile devices behind NAT/firewalls
         */
        socket.on("call:ice", (payload) => {
            const { toUserId, chatId, candidate } = payload || {};
            if (!toUserId || !chatId || !candidate)
                return;
            
            // Forward ICE candidate to peer for connection establishment
            emitToUser(toUserId, "call:ice", {
                fromUserId: userId,
                chatId,
                candidate,  // Network path information
            });
        });
        /**
         * EVENT: "call:end" - User explicitly ends the call
         */
        socket.on("call:end", (payload) => {
            const { toUserId, chatId } = payload || {};
            
            if (toUserId && chatId) {
                // Notify peer that call ended
                emitToUser(toUserId, "call:ended", {
                    fromUserId: userId,
                    chatId,
                    reason: "ended",
                });
            }
            
            // Clean up call state
            clearActiveCall(userId);
        });
        
        // ========== AIR LOCATION SYSTEM ==========
        // Real-time GPS location sharing with Haversine formula distance calculation
        
        // Store active user locations in memory (userId -> {latitude, longitude, ...})
        const userLocations = new Map();
        
        /**
         * EVENT: "location:share" - User shares their GPS location in real-time
         * Broadcasts to all users with calculated distances using Haversine formula
         */
        socket.on("location:share", (payload) => {
            const { latitude, longitude, address, city, country, accuracy } = payload || {};
            
            // Validate coordinates
            if (latitude === null || latitude === undefined || 
                longitude === null || longitude === undefined) {
                return;
            }
            
            // Store user's location
            userLocations.set(userId, {
                userId,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address: address || null,
                city: city || null,
                country: country || null,
                accuracy: accuracy || null,
                timestamp: new Date(),
            });
            
            // Haversine formula helper function
            const calculateDistance = (lat1, lon1, lat2, lon2) => {
                const R = 6371; // Earth's radius in kilometers
                const dLat = (lat2 - lat1) * (Math.PI / 180);
                const dLon = (lon2 - lon1) * (Math.PI / 180);
                
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;
                
                return distance;
            };
            
            // Create broadcast message with all user locations nearby
            const broadcastData = {
                userId,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address: address || null,
                city: city || null,
                country: country || null,
                accuracy: accuracy || null,
                timestamp: new Date(),
                nearbyUsers: Array.from(userLocations.entries()).map(([id, loc]) => {
                    if (id === userId) return null;
                    
                    const distance = calculateDistance(
                        parseFloat(latitude),
                        parseFloat(longitude),
                        loc.latitude,
                        loc.longitude
                    );
                    
                    return {
                        userId: id,
                        distance: Math.round(distance * 100) / 100, // Round to 2 decimals
                        ...loc
                    };
                }).filter(Boolean).sort((a, b) => a.distance - b.distance)
            };
            
            // Broadcast to all connected users
            io?.emit("location:shared", broadcastData);
        });
        
        /**
         * EVENT: "location:request" - Request another user's location
         */
        socket.on("location:request", (payload) => {
            const { toUserId } = payload || {};
            
            if (!toUserId) return;
            
            // Send location request to specific user
            emitToUser(toUserId, "location:requesting", {
                fromUserId: userId,
                timestamp: new Date(),
            });
        });
        
        /**
         * EVENT: "location:stop" - User stops sharing their location
         */
        socket.on("location:stop", () => {
            userLocations.delete(userId);
            
            // Notify all users that this user stopped sharing
            io?.emit("location:stopped", {
                userId,
                timestamp: new Date(),
            });
        });
        
        /**
         * EVENT: "disconnect" - Socket connection closed (user closes tab, loses internet, etc.)
         * Built-in Socket.io event that fires automatically
         */
        socket.on("disconnect", () => {
            // If user was in a call, end it
            clearActiveCall(userId);
            
            // Only remove from online list if this is the current socket for this user
            // (prevents race condition if user reconnects quickly)
            if (onlineUsers.get(userId) === newSocketId) {
                if (userId)
                    onlineUsers.delete(userId);
                
                // Broadcast updated online users list to everyone
                io?.emit("online:users", Array.from(onlineUsers.keys()));
                
                console.log("socket disconnected", {
                    userId,
                    newSocketId,
                });
            }
        });
    });
};
exports.initializeSocket = initializeSocket;

/**
 * Helper function to get the Socket.IO instance from other files
 * Throws error if called before initializeSocket()
 */
function getIO() {
    if (!io)
        throw new Error("Socket.IO not initialized");
    return io;
}

/**
 * EXPORTED HELPER: Notify participants when a new chat is created
 * Used by chat.service.js when creating group chats
 */
const emitNewChatToParticpants = (participantIds = [], chat) => {
    const io = getIO();
    
    // Send "chat:new" event to each participant's personal room
    for (const participantId of participantIds) {
        io.to(`user:${participantId}`).emit("chat:new", chat);
    }
};
exports.emitNewChatToParticpants = emitNewChatToParticpants;

/**
 * EXPORTED HELPER: Broadcast new message to chat room
 * Used by message.service.js when a user sends a message
 * Important: Excludes sender to prevent duplicate (they already have it locally)
 */
const emitNewMessageToChatRoom = (senderId, // userId that sent the message
chatId, message) => {
    const io = getIO();
    
    // Get sender's socket ID from online users
    const senderSocketId = onlineUsers.get(senderId?.toString());
    
    console.log(senderId, "senderId");
    console.log(senderSocketId, "sender socketid exist");
    console.log("All online users:", Object.fromEntries(onlineUsers));
    
    if (senderSocketId) {
        // Send to everyone in chat EXCEPT sender (prevents echo)
        // .except() excludes specific socket IDs from receiving the event
        io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
    }
    else {
        // If sender is offline (shouldn't happen), send to everyone
        io.to(`chat:${chatId}`).emit("message:new", message);
    }
};
exports.emitNewMessageToChatRoom = emitNewMessageToChatRoom;

/**
 * EXPORTED HELPER: Update chat preview with last message
 * Used to update the "last message" shown in chat list for all participants
 * Sent to personal rooms (not chat room) so even users not viewing chat get update
 */
const emitLastMessageToParticipants = (participantIds, chatId, lastMessage) => {
    const io = getIO();
    const payload = { chatId, lastMessage };
    
    // Send to each participant's personal room
    for (const participantId of participantIds) {
        io.to(`user:${participantId}`).emit("chat:update", payload);
    }
};
exports.emitLastMessageToParticipants = emitLastMessageToParticipants;
