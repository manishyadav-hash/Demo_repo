import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ChatBody from "@/components/chat/chat-body";
import ChatFooter from "@/components/chat/chat-footer";
import ChatHeader from "@/components/chat/chat-header";
import CallOverlay from "@/components/chat/call-overlay";
import EmptyState from "@/components/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useCall } from "@/hooks/use-call";
import { useChat } from "@/hooks/use-chat";
import useChatId from "@/hooks/use-chat-id";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";
import { useEffect, useState } from "react";
const SingleChat = () => {
    const chatId = useChatId();
    const { fetchSingleChat, isSingleChatLoading, singleChat } = useChat();
    const { socket } = useSocket();
    const { user } = useAuth();
    const [replyTo, setReplyTo] = useState(null);
    const currentUserId = user?._id || null;
    const chat = singleChat?.chat;
    const messages = singleChat?.messages || [];
    const otherUser = chat?.participants.find((p) => p._id !== currentUserId);
    const otherUserId = otherUser?._id || null;
    const { status, callType, startCall, acceptCall, rejectCall, endCall, localVideoRef, remoteVideoRef, remoteAudioRef, } = useCall({
        socket,
        chatId,
        currentUserId,
        otherUserId,
    });
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
    if (isSingleChatLoading) {
        return (_jsx("div", { className: "h-screen flex items-center justify-center", children: _jsx(Spinner, { className: "w-11 h-11 !text-primary" }) }));
    }
    if (!chat) {
        return (_jsx("div", { className: "h-screen flex items-center justify-center", children: _jsx("p", { className: "text-lg", children: "Chat not found" }) }));
    }
    return (_jsxs("div", { className: "relative h-svh flex flex-col", children: [_jsx(ChatHeader, { chat: chat, currentUserId: currentUserId, onVoiceCall: () => {
                    if (chat.isGroup) {
                        toast.info("Group calls are not supported yet");
                        return;
                    }
                    startCall("voice");
                }, onVideoCall: () => {
                    if (chat.isGroup) {
                        toast.info("Group calls are not supported yet");
                        return;
                    }
                    startCall("video");
                } }), _jsx(CallOverlay, { status: status, callType: callType, name: otherUser?.name || "Unknown", avatar: otherUser?.avatar || null, localVideoRef: localVideoRef, remoteVideoRef: remoteVideoRef, remoteAudioRef: remoteAudioRef, onAccept: acceptCall, onReject: rejectCall, onEnd: endCall }), _jsx("div", { className: "flex-1 overflow-y-auto bg-background", children: messages.length === 0 ? (_jsx(EmptyState, { title: "Start a conversation", description: "No messages yet. Send the first message" })) : (_jsx(ChatBody, { chatId: chatId, messages: messages, onReply: setReplyTo })) }), _jsx(ChatFooter, { replyTo: replyTo, chatId: chatId, currentUserId: currentUserId, onCancelReply: () => setReplyTo(null) })] }));
};
export default SingleChat;
