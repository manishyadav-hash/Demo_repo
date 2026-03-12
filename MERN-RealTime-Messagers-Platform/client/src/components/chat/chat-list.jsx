import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { Spinner } from "../ui/spinner";
import ChatListItem from "./chat-list-item";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import ChatListHeader from "./chat-list-header";
import { useSocket } from "@/hooks/use-socket";
const ChatList = () => {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { fetchChats, chats, isChatsLoading, addNewChat, updateChatLastMessage, } = useChat();
    const { user } = useAuth();
    const currentUserId = user?._id || null;
    const [searchQuery, setSearchQuery] = useState("");
    const filteredChats = chats?.filter((chat) => chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.participants?.some((p) => p._id !== currentUserId &&
            p.name?.toLowerCase().includes(searchQuery.toLowerCase()))) || [];
    useEffect(() => {
        fetchChats();
    }, [fetchChats]);
    useEffect(() => {
        if (!socket)
            return;
        const handleNewChat = (newChat) => {
            console.log("Recieved new chat", newChat);
            addNewChat(newChat);
        };
        socket.on("chat:new", handleNewChat);
        return () => {
            socket.off("chat:new", handleNewChat);
        };
    }, [addNewChat, socket]);
    useEffect(() => {
        if (!socket)
            return;
        const handleChatUpdate = (data) => {
            console.log("Recieved update on chat", data.lastMessage);
            updateChatLastMessage(data.chatId, data.lastMessage);
        };
        socket.on("chat:update", handleChatUpdate);
        return () => {
            socket.off("chat:update", handleChatUpdate);
        };
    }, [socket, updateChatLastMessage]);
    const onRoute = (id) => {
        navigate(`/chat/${id}`);
    };
    return (_jsx("div", { className: "fixed inset-y-0\r\n      pb-20 lg:pb-0\r\n      lg:max-w-[379px]\r\n      lg:block\r\n      border-r\r\n      border-border\r\n      bg-sidebar\r\n      max-w-[calc(100%-40px)]\r\n      w-full\r\n      left-10\r\n      z-[98]\r\n    ", children: _jsxs("div", { className: "flex-col", children: [_jsx(ChatListHeader, { onSearch: setSearchQuery }), _jsx("div", { className: "\r\n         flex-1 h-[calc(100vh-100px)]\r\n         overflow-y-auto        ", children: _jsx("div", { className: "px-2 pb-10 pt-1 space-y-1", children: isChatsLoading ? (_jsx("div", { className: "flex items-center justify-center", children: _jsx(Spinner, { className: "w-7 h-7" }) })) : filteredChats?.length === 0 ? (_jsx("div", { className: "flex items-center justify-center", children: searchQuery ? "No chat found" : "No chats created" })) : (filteredChats?.map((chat) => (_jsx(ChatListItem, { chat: chat, currentUserId: currentUserId, onClick: () => onRoute(chat._id) }, chat._id)))) }) })] }) }));
};
export default ChatList;
