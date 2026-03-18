import { useEffect, useRef, useState } from "react";
import NotificationToast from "@/components/notification-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { playReceiveSound, primeChatSounds } from "@/lib/chat-sounds";

const getNotificationMessage = (rawMessage) => {
  const base = rawMessage || {};
  const nestedMessage = typeof base?.message === "object" ? base.message : null;
  const nestedLastMessage = typeof base?.lastMessage === "object" ? base.lastMessage : null;
  const msg = {
    ...base,
    ...(nestedLastMessage || {}),
    ...(nestedMessage || {}),
  };

  const attachments = Array.isArray(msg?.attachments) ? msg.attachments : [];
  const mediaTypeValue = String(msg?.mediaType || msg?.type || "").toLowerCase();

  const hasImage = Boolean(
    msg?.image ||
      msg?.imageUrl ||
      msg?.photo ||
      msg?.photoUrl ||
      mediaTypeValue === "image" ||
      attachments.some((item) => String(item?.type || item?.mediaType || "").toLowerCase() === "image")
  );

  const hasVoice = Boolean(
    msg?.voiceUrl ||
      msg?.voiceData ||
      msg?.audioUrl ||
      msg?.audioData ||
      mediaTypeValue === "voice" ||
      mediaTypeValue === "audio" ||
      attachments.some((item) => {
        const type = String(item?.type || item?.mediaType || "").toLowerCase();
        return type === "voice" || type === "audio";
      })
  );

  if (hasImage && hasVoice) return "Sent a photo and voice message";
  if (hasImage) return "Sent a photo";
  if (hasVoice) return "Sent a voice message";

  const textCandidate = [msg.content, msg.text, typeof msg.message === "string" ? msg.message : ""].find(
    (value) => typeof value === "string" && value.trim().length > 0
  );
  if (textCandidate) return textCandidate.trim();

  const latitude = msg?.locationLatitude ?? msg?.location?.latitude;
  const longitude = msg?.locationLongitude ?? msg?.location?.longitude;
  const hasLocationCoordinates = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;
  const hasExplicitLocationFlag = Boolean(
    msg?.locationAddress ||
      msg?.location?.address ||
      mediaTypeValue === "location" ||
      msg?.isLocation === true ||
      attachments.some((item) => String(item?.type || item?.mediaType || "").toLowerCase() === "location")
  );
  if (hasLocationCoordinates && hasExplicitLocationFlag) return "Shared a location";

  return "Sent an attachment";
};

const getMessageSenderId = (message) => {
  return message?.senderId || message?.sender?._id || message?.sender?.id || null;
};

const getMessageSenderName = (message) => {
  return message?.senderName || message?.sender?.name || "Unknown";
};

const getMessageSenderAvatar = (message) => {
  return message?.senderAvatar || message?.sender?.avatar || null;
};

const getMessageIdentifier = (chatId, message) => {
  return (
    message?._id ||
    message?.id ||
    [chatId || message?.chatId || "unknown-chat", getMessageSenderId(message) || "unknown-sender", message?.createdAt || message?.updatedAt || Date.now()].join(":")
  );
};

const GlobalMessageNotifications = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [notification, setNotification] = useState(null);
  const seenMessageIdsRef = useRef(new Set());

  useEffect(() => {
    primeChatSounds();
  }, []);

  useEffect(() => {
    if (!socket || !user?._id) return;

    const handleMessageNotification = (payload) => {
      const message = payload?.message || payload?.lastMessage || payload;
      const senderId = getMessageSenderId(message);

      if (!message || !senderId || senderId === user._id) return;

      const notificationId = getMessageIdentifier(payload?.chatId, message);
      if (seenMessageIdsRef.current.has(notificationId)) return;

      seenMessageIdsRef.current.add(notificationId);
      if (seenMessageIdsRef.current.size > 200) {
        const [firstKey] = seenMessageIdsRef.current;
        if (firstKey) {
          seenMessageIdsRef.current.delete(firstKey);
        }
      }

      playReceiveSound();
      setNotification({
        id: notificationId,
        message: getNotificationMessage(message),
        senderName: getMessageSenderName(message),
        senderAvatar: getMessageSenderAvatar(message),
      });
    };

    socket.on("message:notify", handleMessageNotification);

    return () => {
      socket.off("message:notify", handleMessageNotification);
    };
  }, [socket, user]);

  if (!notification) return null;

  return (
    <NotificationToast
      message={notification.message}
      senderName={notification.senderName}
      senderAvatar={notification.senderAvatar}
      onDismiss={() => setNotification(null)}
    />
  );
};

export default GlobalMessageNotifications;