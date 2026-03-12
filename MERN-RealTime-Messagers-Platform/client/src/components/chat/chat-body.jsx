import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef, useState } from "react";
import ChatBodyMessage from "./chat-body-message";
import NotificationToast from "@/components/notification-toast";
const ChatBody = ({ chatId, messages, onReply }) => {
    const { socket } = useSocket();
    const { addNewMessage } = useChat();
    const { user: currentUser } = useAuth();
    const bottomRef = useRef(null);
    const [notification, setNotification] = useState(null);
    useEffect(() => {
        if (!chatId)
            return;
        if (!socket)
            return;
        const handleNewMessage = (msg) => {
            addNewMessage(chatId, msg);
            // Show notification only if message is from another user
            if (msg.senderId !== currentUser?._id) {
                setNotification({
                    id: msg._id,
                    message: msg.content || msg.message || msg.text || "📎 Shared a location",
                    senderName: msg.senderName || msg.sender?.name || "Unknown",
                    senderAvatar: msg.senderAvatar || msg.sender?.avatar || null
                });
            }
        };
        socket.on("message:new", handleNewMessage);
        return () => {
            socket.off("message:new", handleNewMessage);
        };
    }, [socket, chatId, addNewMessage, currentUser]);
    useEffect(() => {
        if (!messages.length)
            return;
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);
    return (_jsxs("div", { className: "w-full max-w-6xl mx-auto flex flex-col px-3 py-2", children: [notification && (_jsx(NotificationToast, { message: notification.message, senderName: notification.senderName, senderAvatar: notification.senderAvatar, onDismiss: () => setNotification(null) })), messages.map((message) => (_jsx(ChatBodyMessage, { message: message, onReply: onReply }, message._id))), _jsx("div", { ref: bottomRef })] }));
};
export default ChatBody;
