import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ChatBody from "@/components/chat/chat-body";
import ChatFooter from "@/components/chat/chat-footer";
import ChatHeader from "@/components/chat/chat-header";
import EmptyState from "@/components/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useCallContext } from "@/context/call-context";
import { useChat } from "@/hooks/use-chat";
import useChatId from "@/hooks/use-chat-id";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
const SingleChat = () => {
    const chatId = useChatId();
    const navigate = useNavigate();
    const { fetchSingleChat, isSingleChatLoading, isLeavingGroup, leaveGroup, singleChat } = useChat();
    const { socket } = useSocket();
    const { user } = useAuth();
    const [replyTo, setReplyTo] = useState(null);
    const [typingUserIds, setTypingUserIds] = useState([]);
    const typingTimersRef = useRef({});
    const currentUserId = user?._id || null;
    const chat = singleChat?.chat;
    const messages = singleChat?.messages || [];
    const otherUser = chat?.participants.find((p) => p._id !== currentUserId);
    const otherUserId = otherUser?._id || null;
    
    const { startCall } = useCallContext();

    useEffect(() => {
        if (!chatId)
            return;
        fetchSingleChat(chatId);
    }, [fetchSingleChat, chatId]);
    //Socket Chat room
    useEffect(() => {
        if (!chatId || !socket)
            return;
        socket.emit("chat:join", chatId);
        return () => {
            socket.emit("chat:leave", chatId);
        };
    }, [chatId, socket]);
    useEffect(() => {
        if (!chatId || !socket)
            return;
        const handleTypingStart = ({ chatId: eventChatId, userId: typingUserId }) => {
            if (eventChatId !== chatId || !typingUserId || typingUserId === currentUserId)
                return;
            setTypingUserIds((prev) => (prev.includes(typingUserId) ? prev : [...prev, typingUserId]));
            if (typingTimersRef.current[typingUserId]) {
                clearTimeout(typingTimersRef.current[typingUserId]);
            }
            typingTimersRef.current[typingUserId] = setTimeout(() => {
                setTypingUserIds((prev) => prev.filter((id) => id !== typingUserId));
                delete typingTimersRef.current[typingUserId];
            }, 1800);
        };
        const handleTypingStop = ({ chatId: eventChatId, userId: typingUserId }) => {
            if (eventChatId !== chatId || !typingUserId)
                return;
            if (typingTimersRef.current[typingUserId]) {
                clearTimeout(typingTimersRef.current[typingUserId]);
                delete typingTimersRef.current[typingUserId];
            }
            setTypingUserIds((prev) => prev.filter((id) => id !== typingUserId));
        };
        socket.on("typing:start", handleTypingStart);
        socket.on("typing:stop", handleTypingStop);
        return () => {
            socket.off("typing:start", handleTypingStart);
            socket.off("typing:stop", handleTypingStop);
            Object.values(typingTimersRef.current).forEach((timer) => clearTimeout(timer));
            typingTimersRef.current = {};
            setTypingUserIds([]);
        };
    }, [chatId, socket, currentUserId]);

    const typingNames = typingUserIds
        .map((id) => chat?.participants?.find((p) => p._id === id)?.name)
        .filter(Boolean);
    const typingText = typingNames.length === 0
        ? ""
        : typingNames.length === 1
            ? `${typingNames[0]} is typing`
            : `${typingNames.length} people are typing`;
    if (isSingleChatLoading) {
        return (_jsx("div", { className: "h-dvh min-h-svh flex items-center justify-center", children: _jsx(Spinner, { className: "w-11 h-11 !text-primary" }) }));
    }
    if (!chat) {
        return (_jsx("div", { className: "h-dvh min-h-svh flex items-center justify-center", children: _jsx("p", { className: "text-lg", children: "Chat not found" }) }));
    }
    return (_jsxs("div", { className: "relative h-svh flex flex-col", children: [_jsx(ChatHeader, { chat: chat, currentUserId: currentUserId, isLeavingGroup: isLeavingGroup, onExitGroup: async () => {
                    const ok = await leaveGroup(chatId);
                    if (ok) {
                        navigate("/chat");
                    }
                }, typingText: typingText, onVoiceCall: () => {
                    if (chat.isGroup) {
                        toast.info("Group calls are not supported yet");
                        return;
                    }
                    startCall(otherUserId, chatId, "voice", { name: otherUser.name, avatar: otherUser.avatar });
                }, onVideoCall: () => {
                    if (chat.isGroup) {
                        toast.info("Group calls are not supported yet");
                        return;
                    }
                    startCall(otherUserId, chatId, "video", { name: otherUser.name, avatar: otherUser.avatar });
                } }), _jsx("div", { className: "flex-1 overflow-y-auto bg-background", children: messages.length === 0 ? (_jsx(EmptyState, { title: "Start a conversation", description: "No messages yet. Send the first message" })) : (_jsx(ChatBody, { chatId: chatId, messages: messages, onReply: setReplyTo, isGroup: !!chat?.isGroup })) }), _jsx(ChatFooter, { replyTo: replyTo, chatId: chatId, currentUserId: currentUserId, onCancelReply: () => setReplyTo(null) })] }));
};
export default SingleChat;
