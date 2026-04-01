import { create } from "zustand";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { generateUUID } from "@/lib/helper";
import { playSendSound, primeChatSounds } from "@/lib/chat-sounds";
export const useChat = create()((set, get) => ({
    chats: [],
    users: [],
    singleChat: null,
    isChatsLoading: false,
    isUsersLoading: false,
    isCreatingChat: false,
    isSingleChatLoading: false,
    isSendingMsg: false,
    isDeletingChat: false,
    isAddingMembers: false,
    isLeavingGroup: false,
    isReactingToMessage: false,
    localMessageReactions: {},
    currentAIStreamId: null,
    addMembersToGroup: async (chatId, participants) => {
        set({ isAddingMembers: true });
        try {
            const { data } = await API.post("/chat/group/add", {
                chatId,
                participants,
            });

            set((state) => {
                if (state.singleChat?.chat?._id === chatId) {
                    return {
                        singleChat: {
                            ...state.singleChat,
                            chat: {
                                ...state.singleChat.chat,
                                participants: [
                                    ...state.singleChat.chat.participants,
                                    ...data.addedMembers
                                ],
                            },
                            messages: [...state.singleChat.messages, data.message],
                        },
                    };
                }
                return state;
            });

            if (data?.chat) {
                get().syncChat(data.chat);
            }

            toast.success("Members added successfully");
            return true;
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to add members");
            return false;
        }
        finally {
            set({ isAddingMembers: false });
        }
    },
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
            set({ singleChat: data, localMessageReactions: {} });
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch chats");
        }
        finally {
            set({ isSingleChatLoading: false });
        }
    },
    sendMessage: async (payload) => {
        primeChatSounds();
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
            playSendSound();
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to send message");
        }
        finally {
            set({ isSendingMsg: false });
        }
    },
    deleteDirectChat: async (chatId) => {
        if (!chatId)
            return false;
        set({ isDeletingChat: true });
        try {
            await API.delete(`/chat/${chatId}/direct`);
            set((state) => ({
                chats: state.chats.filter((chat) => chat._id !== chatId),
                singleChat: state.singleChat?.chat?._id === chatId ? null : state.singleChat,
            }));
            toast.success("Chat deleted");
            return true;
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete chat");
            return false;
        }
        finally {
            set({ isDeletingChat: false });
        }
    },
    leaveGroup: async (chatId) => {
        if (!chatId)
            return false;
        set({ isLeavingGroup: true });
        try {
            await API.delete(`/chat/${chatId}/group/leave`);
            get().removeChat(chatId);
            toast.success("You exited the group");
            return true;
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to exit group");
            return false;
        }
        finally {
            set({ isLeavingGroup: false });
        }
    },
    removeChat: (chatId) => {
        if (!chatId)
            return;
        set((state) => ({
            chats: state.chats.filter((chat) => chat._id !== chatId),
            singleChat: state.singleChat?.chat?._id === chatId ? null : state.singleChat,
        }));
    },
    syncChat: (chat) => {
        if (!chat?._id)
            return;
        set((state) => {
            const existingChat = state.chats.find((item) => item._id === chat._id);
            const nextChats = existingChat
                ? [
                    { ...existingChat, ...chat },
                    ...state.chats.filter((item) => item._id !== chat._id),
                ]
                : [chat, ...state.chats];

            if (state.singleChat?.chat?._id !== chat._id) {
                return { chats: nextChats };
            }

            return {
                chats: nextChats,
                singleChat: {
                    ...state.singleChat,
                    chat: {
                        ...state.singleChat.chat,
                        ...chat,
                    },
                },
            };
        });
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
    deleteMessage: async (messageId, chatId) => {
        if (!messageId)
            return false;
        try {
            await API.delete(`/chat/message/${messageId}`);
            set((state) => {
                if (!state.singleChat)
                    return state;
                if (chatId && state.singleChat.chat?._id !== chatId)
                    return state;
                return {
                    singleChat: {
                        ...state.singleChat,
                        messages: state.singleChat.messages.filter((m) => (m._id || m.id) !== messageId),
                    },
                };
            });
            toast.success("Message deleted");
            return true;
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete message");
            return false;
        }
    },
    reactToMessage: async (messageId, emoji) => {
        if (!messageId || !emoji)
            return false;
        set({ isReactingToMessage: true });
        try {
            const { data } = await API.post(`/chat/message/${messageId}/react`, { emoji });
            get().updateMessageReaction(data.messageId, data.reactions, data.chatId);
            return true;
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update reaction");
            return false;
        }
        finally {
            set({ isReactingToMessage: false });
        }
    },
    toggleLocalMessageReaction: (messageId, emoji) => {
        if (!messageId || !emoji)
            return;
        set((state) => {
            const currentEmoji = state.localMessageReactions[messageId] || "";
            return {
                localMessageReactions: {
                    ...state.localMessageReactions,
                    [messageId]: currentEmoji === emoji ? "" : emoji,
                },
            };
        });
    },
    clearLocalMessageReaction: (messageId) => {
        if (!messageId)
            return;
        set((state) => {
            const nextLocalReactions = { ...state.localMessageReactions };
            delete nextLocalReactions[messageId];
            return { localMessageReactions: nextLocalReactions };
        });
    },
    removeMessage: (messageId, chatId) => {
        if (!messageId)
            return;
        set((state) => {
            if (!state.singleChat)
                return state;
            if (chatId && state.singleChat.chat?._id !== chatId)
                return state;
            const nextLocalReactions = { ...state.localMessageReactions };
            delete nextLocalReactions[messageId];
            return {
                localMessageReactions: nextLocalReactions,
                singleChat: {
                    ...state.singleChat,
                    messages: state.singleChat.messages.filter((m) => (m._id || m.id) !== messageId),
                },
            };
        });
    },
    updateMessageReaction: (messageId, reactions = [], chatId) => {
        if (!messageId)
            return;
        set((state) => {
            if (!state.singleChat)
                return state;
            if (chatId && state.singleChat.chat?._id !== chatId)
                return state;
            const nextLocalReactions = { ...state.localMessageReactions };
            const targetMessage = state.singleChat.messages.find((message) => (message._id || message.id) === messageId);
            if (targetMessage?.sender?._id !== useAuth.getState().user?._id) {
                delete nextLocalReactions[messageId];
            }
            return {
                localMessageReactions: nextLocalReactions,
                singleChat: {
                    ...state.singleChat,
                    messages: state.singleChat.messages.map((message) => {
                        const currentId = message._id || message.id;
                        if (currentId !== messageId)
                            return message;
                        return {
                            ...message,
                            reactions,
                        };
                    }),
                },
            };
        });
    },
    markChatAsRead: async (chatId) => {
        if (!chatId)
            return;
        try {
            const { data } = await API.post(`/chat/${chatId}/read`);
            const seenMessageIds = data?.seenMessageIds || [];
            const seenAt = data?.seenAt || new Date().toISOString();
            const seenBy = data?.seenBy || useAuth.getState().user?._id;
            if (!seenMessageIds.length)
                return;
            set((state) => {
                if (state.singleChat?.chat?._id !== chatId)
                    return state;
                return {
                    singleChat: {
                        ...state.singleChat,
                        messages: state.singleChat.messages.map((m) => {
                            const id = m._id || m.id;
                            if (!seenMessageIds.includes(id))
                                return m;
                            const seenByReceipts = Array.isArray(m.seenBy) ? m.seenBy : [];
                            const hasReceipt = seenByReceipts.some((receipt) => receipt?.userId === seenBy);
                            return {
                                ...m,
                                seenAt,
                                seenBy: hasReceipt
                                    ? seenByReceipts
                                    : [...seenByReceipts, { userId: seenBy, seenAt }],
                            };
                        }),
                    },
                };
            });
        }
        catch (_error) {
            // no-op: read receipts should not interrupt chat usage
        }
    },
    applyMessagesSeen: (chatId, messageIds = [], seenAt, seenBy) => {
        if (!chatId || !messageIds.length)
            return;
        set((state) => {
            if (state.singleChat?.chat?._id !== chatId)
                return state;
            return {
                singleChat: {
                    ...state.singleChat,
                    messages: state.singleChat.messages.map((m) => {
                        const id = m._id || m.id;
                        if (!messageIds.includes(id))
                            return m;
                        const seenByReceipts = Array.isArray(m.seenBy) ? m.seenBy : [];
                        const hasReceipt = seenByReceipts.some((receipt) => receipt?.userId === seenBy);
                        return {
                            ...m,
                            seenAt: seenAt || m.seenAt || new Date().toISOString(),
                            seenBy: seenBy && !hasReceipt
                                ? [...seenByReceipts, { userId: seenBy, seenAt: seenAt || new Date().toISOString() }]
                                : seenByReceipts,
                        };
                    }),
                },
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
