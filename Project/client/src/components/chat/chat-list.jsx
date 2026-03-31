import { useEffect, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { Spinner } from "../ui/spinner";
import ChatListItem from "./chat-list-item";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import ChatListHeader from "./chat-list-header";
import { useSocket } from "@/hooks/use-socket";

const resolveId = (entity) => entity?._id || entity?.id || null;

const ChatList = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { socket } = useSocket();
  const {
    fetchChats,
    chats,
    isChatsLoading,
    addNewChat,
    syncChat,
    removeChat,
    updateChatLastMessage,
    deleteDirectChat,
  } = useChat();
  const { user } = useAuth();

  const currentUserId = resolveId(user);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats =
    chats?.filter(
      (chat) =>
        chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.participants?.some(
          (p) =>
            resolveId(p) !== currentUserId &&
            p.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    ) || [];

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!socket) return;

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
    if (!socket) return;
    const handleChatUpdate = (data) => {
      console.log("Recieved update on chat", data.lastMessage);
      updateChatLastMessage(data.chatId, data.lastMessage);
    };

    socket.on("chat:update", handleChatUpdate);

    return () => {
      socket.off("chat:update", handleChatUpdate);
    };
  }, [socket, updateChatLastMessage]);

  useEffect(() => {
    if (!socket) return;

    const handleChatSync = (chat) => {
      syncChat(chat);
    };

    const handleChatRemoved = ({ chatId }) => {
      removeChat(chatId);

      if (pathname.includes(`/chat/${chatId}`)) {
        navigate("/chat");
      }
    };

    socket.on("chat:sync", handleChatSync);
    socket.on("chat:removed", handleChatRemoved);

    return () => {
      socket.off("chat:sync", handleChatSync);
      socket.off("chat:removed", handleChatRemoved);
    };
  }, [navigate, pathname, removeChat, socket, syncChat]);

  const onRoute = (id) => {
    navigate(`/chat/${id}`);
  };

  const handleDeleteChat = async (chatId, name) => {
    const confirmed = window.confirm(`Delete chat with ${name}?`);
    if (!confirmed) return;

    const ok = await deleteDirectChat(chatId);
    if (!ok) return;

    if (pathname.includes(`/chat/${chatId}`)) {
      navigate("/chat");
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-sidebar/50 backdrop-blur-sm transition-all duration-300">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-sidebar/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
        <ChatListHeader onSearch={setSearchQuery} />
      </div>

      <div
        className="flex-1 overflow-y-auto overscroll-contain px-2 pt-5 pb-3 sm:pt-6 lg:pt-7"
        style={{
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          scrollPaddingTop: "24px",
        }}
      >
        <div className="space-y-1.5 pt-2 pb-8 sm:space-y-2 sm:pt-3 sm:pb-10">
          {isChatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          ) : filteredChats?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
              {searchQuery ? "No chat found" : "No chats created"}
            </div>
          ) : (
            <>
              <div className="h-2 w-full" aria-hidden="true" />
              {filteredChats?.map((chat) => (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  currentUserId={currentUserId}
                  onClick={() => onRoute(chat._id)}
                  onDelete={handleDeleteChat}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
