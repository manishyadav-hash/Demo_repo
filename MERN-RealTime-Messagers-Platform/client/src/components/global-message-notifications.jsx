import { useEffect, useRef, useState } from "react";
import NotificationToast from "@/components/notification-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { playReceiveSound, primeChatSounds } from "@/lib/chat-sounds";

const getEntityId = (value) => {
  if (!value || typeof value !== "object") return null;
  return value._id || value.id || value.userId || value.uuid || value?.dataValues?.id || null;
};

const normalizeId = (value) => {
  if (value === null || value === undefined) return null;
  return String(value).trim();
};

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
  return (
    message?.senderId ||
    message?.sender_id ||
    getEntityId(message?.sender) ||
    getEntityId(message?.from) ||
    null
  );
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

const showNativeNotification = ({ senderName, messageText, notificationId, senderAvatar, chatId }) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const notification = new Notification(senderName || "New message", {
      body: messageText || "You received a new message",
      tag: notificationId || `msg-${Date.now()}`,
      icon: senderAvatar || undefined,
      renotify: true,
      data: { chatId },
    });

    notification.onclick = () => {
      window.focus();
      if (chatId) {
        window.location.href = `/chat/${chatId}`;
      }
      notification.close();
    };
  } catch (_error) {
    // Ignore browser notification failures and keep in-app toast behavior.
  }
};

const GlobalMessageNotifications = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [notification, setNotification] = useState(null);
  const seenMessageIdsRef = useRef(new Set());
  const currentUserId = user?._id || user?.id || null;

  useEffect(() => {
    primeChatSounds();
  }, []);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleIncomingMessage = (payload) => {
      const message = payload?.message || payload?.lastMessage || payload?.userMessage || payload;
      const senderId = getMessageSenderId(message);
      const normalizedSenderId = normalizeId(senderId);
      const normalizedCurrentUserId = normalizeId(currentUserId);

      if (!message) return;
      if (normalizedSenderId && normalizedCurrentUserId && normalizedSenderId === normalizedCurrentUserId) return;

      const notificationId = getMessageIdentifier(payload?.chatId || message?.chatId, message);
      if (seenMessageIdsRef.current.has(notificationId)) return;

      seenMessageIdsRef.current.add(notificationId);
      if (seenMessageIdsRef.current.size > 200) {
        const [firstKey] = seenMessageIdsRef.current;
        if (firstKey) {
          seenMessageIdsRef.current.delete(firstKey);
        }
      }

      playReceiveSound();

      const notificationMessage = getNotificationMessage(message);

      const isTabHidden = typeof document !== "undefined" && (document.hidden || !document.hasFocus());
      if (isTabHidden) {
        showNativeNotification({
          senderName: getMessageSenderName(message),
          messageText: notificationMessage,
          notificationId,
          senderAvatar: getMessageSenderAvatar(message),
          chatId: payload?.chatId || message?.chatId,
        });
      }

      setNotification({
        id: notificationId,
        message: notificationMessage,
        senderName: getMessageSenderName(message),
        senderAvatar: getMessageSenderAvatar(message),
      });
    };

    socket.on("message:notify", handleIncomingMessage);
    socket.on("message:new", handleIncomingMessage);

    return () => {
      socket.off("message:notify", handleIncomingMessage);
      socket.off("message:new", handleIncomingMessage);
    };
  }, [socket, currentUserId]);

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