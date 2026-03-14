import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef, useState } from "react";
import ChatBodyMessage from "./chat-body-message";
import NotificationToast from "@/components/notification-toast";
import { playReceiveSound, primeChatSounds } from "@/lib/chat-sounds";
const ChatBody = ({ chatId, messages, onReply, isGroup = false }) => {
    const { socket } = useSocket();
    const { addNewMessage, removeMessage, markChatAsRead, applyMessagesSeen, updateMessageReaction } = useChat();
    const { user: currentUser } = useAuth();
    const bottomRef = useRef(null);
    const [notification, setNotification] = useState(null);
    useEffect(() => {
        primeChatSounds();
    }, []);
    useEffect(() => {
        if (!chatId)
            return;
        if (!socket)
            return;
        const handleNewMessage = (msg) => {
            addNewMessage(chatId, msg);
            // Show notification only if message is from another user
            if (msg.senderId !== currentUser?._id) {
                playReceiveSound();
                setNotification({
                    id: msg._id,
                    message: msg.content || msg.message || msg.text || "📎 Shared a location",
                    senderName: msg.senderName || msg.sender?.name || "Unknown",
                    senderAvatar: msg.senderAvatar || msg.sender?.avatar || null
                });
                markChatAsRead(chatId);
            }
        };
        socket.on("message:new", handleNewMessage);
        return () => {
            socket.off("message:new", handleNewMessage);
        };
    }, [socket, chatId, addNewMessage, currentUser, markChatAsRead, isGroup]);
    useEffect(() => {
        if (!chatId || !socket) return;
        const handleMessageDeleted = ({ messageId, chatId: deletedChatId }) => {
            removeMessage(messageId, deletedChatId);
        };
        socket.on("message:deleted", handleMessageDeleted);
        return () => {
            socket.off("message:deleted", handleMessageDeleted);
        };
    }, [socket, chatId, removeMessage]);
    useEffect(() => {
        if (!chatId || !socket)
            return;
        const handleMessageSeen = ({ chatId: seenChatId, messageIds, seenAt, seenBy }) => {
            applyMessagesSeen(seenChatId, messageIds, seenAt, seenBy);
        };
        socket.on("message:seen", handleMessageSeen);
        return () => {
            socket.off("message:seen", handleMessageSeen);
        };
    }, [socket, chatId, applyMessagesSeen]);
    useEffect(() => {
        if (!chatId || !socket)
            return;
        const handleMessageReaction = ({ chatId: reactionChatId, messageId, reactions }) => {
            updateMessageReaction(messageId, reactions, reactionChatId);
        };
        socket.on("message:reaction", handleMessageReaction);
        return () => {
            socket.off("message:reaction", handleMessageReaction);
        };
    }, [socket, chatId, updateMessageReaction]);
    useEffect(() => {
        if (!chatId)
            return;
        markChatAsRead(chatId);
    }, [chatId, markChatAsRead, messages.length]);
    useEffect(() => {
        if (!messages.length)
            return;
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-6xl flex-col px-2.5 pt-3 pb-2 sm:px-3 sm:pt-4", children: [notification && (_jsx(NotificationToast, { message: notification.message, senderName: notification.senderName, senderAvatar: notification.senderAvatar, onDismiss: () => setNotification(null) })), messages.map((message) => (_jsx(ChatBodyMessage, { message: message, onReply: onReply, isGroup: isGroup }, message._id))), _jsx("div", { ref: bottomRef })] }));
};
export default ChatBody;
