import { create } from "zustand";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { generateUUID } from "@/lib/helper";
export const useChat = create()((set, get) => ({
    chats: [],
    users: [],
    singleChat: null,
    isChatsLoading: false,
    isUsersLoading: false,
    isCreatingChat: false,
    isSingleChatLoading: false,
    isSendingMsg: false,
    currentAIStreamId: null,
    fetchAllUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const { data } = await API.get("/user/all");
            set({ users: data.users });
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch users");
        }
        finally {
            set({ isUsersLoading: false });
        }
    },
    fetchChats: async () => {
        set({ isChatsLoading: true });
        try {
            const { data } = await API.get("/chat/all");
            set({ chats: data.chats });
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch chats");
        }
        finally {
            set({ isChatsLoading: false });
        }
    },
    createChat: async (payload) => {
        set({ isCreatingChat: true });
        try {
            const response = await API.post("/chat/create", {
                ...payload,
            });
            get().addNewChat(response.data.chat);
            toast.success("Chat created successfully");
            return response.data.chat;
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch chats");
            return null;
        }
        finally {
            set({ isCreatingChat: false });
        }
    },
    fetchSingleChat: async (chatId) => {
        set({ isSingleChatLoading: true });
        try {
            const { data } = await API.get(`/chat/${chatId}`);
            set({ singleChat: data });
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch chats");
        }
        finally {
            set({ isSingleChatLoading: false });
        }
    },
    sendMessage: async (payload) => {
        set({ isSendingMsg: true });
        const { chatId, replyTo, content, image, voiceData, location } = payload;
        const { user } = useAuth.getState();
        if (!chatId || !user?._id)
            return;
        const tempUserId = generateUUID();
        const tempMessage = {
            _id: tempUserId,
            chatId,
            content: content || "",
            image: image || null,
            voiceUrl: voiceData || null,
            locationLatitude: location?.latitude || null,
            locationLongitude: location?.longitude || null,
            locationAddress: location?.address || null,
            sender: user,
            replyTo: replyTo || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "sending...",
        };
        // if (isAI) {
        //  // AI Feature Source code link =>
        // }
        set((state) => {
            if (state.singleChat?.chat?._id !== chatId)
                return state;
            return {
                singleChat: {
                    ...state.singleChat,
                    messages: [...state.singleChat.messages, tempMessage],
                },
            };
        });
        try {
            const payload = {
                chatId,
                content,
                image,
                voiceData,
                replyToId: replyTo?._id,
            };
            
            if (location) {
                payload.locationLatitude = location.latitude;
                payload.locationLongitude = location.longitude;
                payload.locationAddress = location.address;
            }
            
            const { data } = await API.post("/chat/message/send", payload);
            const { userMessage } = data;
            //replace the temp user message
            set((state) => {
                if (!state.singleChat)
                    return state;
                return {
                    singleChat: {
                        ...state.singleChat,
                        messages: state.singleChat.messages.map((msg) => msg._id === tempUserId ? userMessage : msg),
                    },
                };
            });
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to send message");
        }
        finally {
            set({ isSendingMsg: false });
        }
    },
    addNewChat: (newChat) => {
        set((state) => {
            const existingChatIndex = state.chats.findIndex((c) => c._id === newChat._id);
            if (existingChatIndex !== -1) {
                //move the chat to the top
                return {
                    chats: [newChat, ...state.chats.filter((c) => c._id !== newChat._id)],
                };
            }
            else {
                return {
                    chats: [newChat, ...state.chats],
                };
            }
        });
    },
    updateChatLastMessage: (chatId, lastMessage) => {
        set((state) => {
            const chat = state.chats.find((c) => c._id === chatId);
            if (!chat)
                return state;
            return {
                chats: [
                    { ...chat, lastMessage },
                    ...state.chats.filter((c) => c._id !== chatId),
                ],
            };
        });
    },
    addNewMessage: (chatId, message) => {
        const chat = get().singleChat;
        if (chat?.chat._id === chatId) {
            set({
                singleChat: {
                    chat: chat.chat,
                    messages: [...chat.messages, message],
                },
            });
        }
    },
}));
