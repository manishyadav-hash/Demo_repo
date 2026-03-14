"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveGroupService = exports.addMembersService = exports.deleteDirectChatService = exports.markChatMessagesSeenService = exports.validateChatParticipant = exports.getSingleChatService = exports.getUserChatsService = exports.createChatService = void 0;
const sequelize_1 = require("sequelize");
const sequelize_config_1 = require("../config/sequelize.config");
const socket_1 = require("../lib/socket");
const models_1 = require("../models");
const app_error_1 = require("../utils/app-error");

const getChatWithParticipantsById = async (chatId) => {
    return models_1.ChatModel.findByPk(chatId, {
        include: [
            {
                model: models_1.UserModel,
                as: "participants",
                attributes: ["id", "name", "avatar"],
                through: { attributes: [] },
            },
            {
                model: models_1.MessageModel,
                as: "lastMessage",
                include: [
                    {
                        model: models_1.UserModel,
                        as: "sender",
                        attributes: ["id", "name", "avatar"],
                    },
                ],
            },
        ],
    });
};

const hasUserSeenMessage = (message, userId) => {
    const receipts = Array.isArray(message?.seenBy) ? message.seenBy : [];
    return receipts.some((receipt) => receipt?.userId === userId);
};

const addSeenReceipt = (message, userId, seenAt) => {
    const currentReceipts = Array.isArray(message?.seenBy) ? message.seenBy : [];
    if (currentReceipts.some((receipt) => receipt?.userId === userId)) {
        return currentReceipts;
    }
    return [
        ...currentReceipts,
        {
            userId,
            seenAt: seenAt.toISOString(),
        },
    ];
};

const createChatService = async (userId, body) => {
    const { participantId, isGroup, participants, groupName } = body;
    let chat = null;
    let allParticipantIds = [];
    if (isGroup && participants?.length && groupName) {
        allParticipantIds = [...new Set([userId, ...participants])];
        const existingUsers = await models_1.UserModel.findAll({
            where: { id: { [sequelize_1.Op.in]: allParticipantIds } },
            attributes: ["id"],
            raw: true,
        });
        if (existingUsers.length !== allParticipantIds.length) {
            throw new app_error_1.BadRequestException("One or more selected users do not exist");
        }
        chat = await models_1.ChatModel.create({
            isGroup: true,
            groupName: groupName.trim(),
            createdBy: userId,
        });
        await chat.setParticipants(allParticipantIds);
    }

    else if (participantId) {
        if (participantId === userId) {
            throw new app_error_1.BadRequestException("You cannot create a chat with yourself");
        }
        const otherUser = await models_1.UserModel.findByPk(participantId);
        if (!otherUser)
            throw new app_error_1.NotFoundException("User not found");
        allParticipantIds = [userId, participantId];
        const matchingChatIds = await models_1.ChatParticipantModel.findAll({
            attributes: ["chatId"],
            where: { userId: { [sequelize_1.Op.in]: allParticipantIds } },
            group: ["chatId"],
            having: sequelize_config_1.sequelize.literal('COUNT(DISTINCT "userId") = 2'),
            raw: true,
        });
        const existingChatId = matchingChatIds[0]?.chatId;
        if (existingChatId) {
            const existingChat = await models_1.ChatModel.findOne({
                where: { id: existingChatId, isGroup: false },
                include: [
                    {
                        model: models_1.UserModel,
                        as: "participants",
                        attributes: ["id", "name", "avatar"],
                        through: { attributes: [] },
                    },
                ],
            });
            if (existingChat)
                return existingChat;
        }
        chat = await models_1.ChatModel.create({
            isGroup: false,
            createdBy: userId,
        });
        await chat.setParticipants(allParticipantIds);
    }
    if (!chat)
        return null;
    const populatedChat = await getChatWithParticipantsById(chat.id);
    const participantIdStrings = populatedChat?.participants?.map((p) => p.id);
    (0, socket_1.emitNewChatToParticpants)(participantIdStrings, populatedChat);
    return populatedChat ?? chat;
};
exports.createChatService = createChatService;



const getUserChatsService = async (userId) => {
    const chatLinks = await models_1.ChatParticipantModel.findAll({
        attributes: ["chatId"],
        where: { userId },
        raw: true,
    });

    const chatIds = [...new Set(chatLinks.map((link) => link.chatId))];
    if (!chatIds.length)
        return [];
    const chats = await models_1.ChatModel.findAll({
        where: { id: { [sequelize_1.Op.in]: chatIds } },
        include: [
            {
                model: models_1.UserModel,
                as: "participants",
                attributes: ["id", "name", "avatar"],
                through: { attributes: [] },
            },
            {
                model: models_1.MessageModel,
                as: "lastMessage",
                include: [
                    {
                        model: models_1.UserModel,
                        as: "sender",
                        attributes: ["id", "name", "avatar"],
                    },
                ],
            },
        ],
        order: [["updatedAt", "DESC"]],
    });
    return chats;
};
exports.getUserChatsService = getUserChatsService;
const addMembersService = async (requesterId, chatId, newParticipantIds) => {
    const chat = await models_1.ChatModel.findByPk(chatId);
    if (!chat) {
        throw new app_error_1.NotFoundException("Chat not found");
    }
    if (!chat.isGroup) {
        throw new app_error_1.BadRequestException("Cannot add members to a one-to-one chat");
    }
    const isMember = await models_1.ChatParticipantModel.findOne({
        where: { chatId, userId: requesterId },
    });
    if (!isMember) {
        throw new app_error_1.ForbiddenException("You must be a member of the group to add others");
    }
    const existingParticipants = await models_1.ChatParticipantModel.findAll({
        where: {
            chatId,
            userId: { [sequelize_1.Op.in]: newParticipantIds },
        },
    });
    const existingIds = new Set(existingParticipants.map((p) => p.userId));
    const idsToAdd = newParticipantIds.filter((id) => !existingIds.has(id));
    if (idsToAdd.length === 0) {
        throw new app_error_1.BadRequestException("All selected users are already in the group");
    }
    const validUsers = await models_1.UserModel.findAll({
        where: { id: { [sequelize_1.Op.in]: idsToAdd } },
        attributes: ["id", "name", "avatar"],
    });
    const validIdsToAdd = validUsers.map((u) => u.id);
    const participantsPayload = validIdsToAdd.map((userId) => ({
        chatId,
        userId,
    }));
    await models_1.ChatParticipantModel.bulkCreate(participantsPayload);
    const requester = await models_1.UserModel.findByPk(requesterId, { attributes: ["name"] });
    const addedNames = validUsers.map((u) => u.name).join(", ");
    const systemMessage = await models_1.MessageModel.create({
        chatId,
        senderId: requesterId,
        content: `${requester?.name} added ${addedNames}`,
    });
    
    // Populate sender for frontend consistency
    await systemMessage.reload({
        include: [
            {
                model: models_1.UserModel,
                as: "sender",
                attributes: ["id", "name", "avatar"],
            },
        ],
    });

    await chat.update({ lastMessageId: systemMessage.id });
    
    // Notify existing room members (except requester)
    (0, socket_1.emitNewMessageToChatRoom)(requesterId, chatId, systemMessage);
    const syncedChat = await getChatWithParticipantsById(chatId);
    const syncedParticipantIds = syncedChat?.participants?.map((participant) => participant.id) || [];
    (0, socket_1.emitNewChatToParticpants)(validIdsToAdd, syncedChat);
    (0, socket_1.emitChatSyncToParticipants)(syncedParticipantIds, syncedChat);
    
    return {
        addedCount: validUsers.length,
        addedNames,
        message: systemMessage,
        addedMembers: validUsers,
        chat: syncedChat,
    };
};
exports.addMembersService = addMembersService;


const getSingleChatService = async (chatId, userId) => {
    const isParticipant = await models_1.ChatParticipantModel.findOne({
        where: { chatId, userId },
    });
    if (!isParticipant) {
        throw new app_error_1.BadRequestException("Chat not found or you are not authorized to view this chat");
    }
    const chat = await models_1.ChatModel.findByPk(chatId, {
        include: [
            {
                model: models_1.UserModel,
                as: "participants",
                attributes: ["id", "name", "avatar"],
                through: { attributes: [] },
            },
        ],
    });
    if (!chat) {
        throw new app_error_1.BadRequestException("Chat not found or you are not authorized to view this chat");
    }
    const messages = await models_1.MessageModel.findAll({
        where: { chatId },
        include: [
            {
                model: models_1.UserModel,
                as: "sender",
                attributes: ["id", "name", "avatar"],
            },
            {
                model: models_1.MessageModel,
                as: "replyTo",
                attributes: ["id", "content", "image", "senderId"],
                include: [
                    {
                        model: models_1.UserModel,
                        as: "sender",
                        attributes: ["id", "name", "avatar"],
                    },
                ],
            },
        ],
        order: [["createdAt", "ASC"]],
    });

    const unreadMessages = messages.filter((msg) => msg.senderId !== userId && !hasUserSeenMessage(msg, userId));

    if (unreadMessages.length) {
        const seenAt = new Date();
        await Promise.all(unreadMessages.map((msg) => msg.update({
            seenBy: addSeenReceipt(msg, userId, seenAt),
            ...(chat.isGroup ? {} : { seenAt }),
        })));

        for (const msg of messages) {
            if (unreadMessages.some((unreadMessage) => unreadMessage.id === msg.id)) {
                msg.seenBy = addSeenReceipt(msg, userId, seenAt);
                if (!chat.isGroup) {
                    msg.seenAt = seenAt;
                }
            }
        }

        (0, socket_1.emitMessagesSeen)(chatId, unreadMessages.map((msg) => msg.id), userId, seenAt);
    }

    return {
        chat,
        messages,
    };
};
exports.getSingleChatService = getSingleChatService;


const validateChatParticipant = async (chatId, userId) => {
    const chat = await models_1.ChatParticipantModel.findOne({
        where: { chatId, userId },
    });
    if (!chat)
        throw new app_error_1.BadRequestException("User not a participant in chat");
    return chat;
};
exports.validateChatParticipant = validateChatParticipant;

const markChatMessagesSeenService = async (chatId, userId) => {
    await (0, exports.validateChatParticipant)(chatId, userId);
    const chat = await models_1.ChatModel.findByPk(chatId);
    if (!chat) {
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");
    }

    const unseenMessages = await models_1.MessageModel.findAll({
        where: {
            chatId,
            senderId: { [sequelize_1.Op.ne]: userId },
        },
    });

    const unreadMessages = unseenMessages.filter((message) => !hasUserSeenMessage(message, userId));
    const seenMessageIds = unreadMessages.map((message) => message.id);
    if (!seenMessageIds.length) {
        return { chatId, seenMessageIds: [], seenAt: null, seenBy: userId };
    }

    const seenAt = new Date();
    await Promise.all(unreadMessages.map((message) => message.update({
        seenBy: addSeenReceipt(message, userId, seenAt),
        ...(chat.isGroup ? {} : { seenAt }),
    })));

    (0, socket_1.emitMessagesSeen)(chatId, seenMessageIds, userId, seenAt);

    return { chatId, seenMessageIds, seenAt, seenBy: userId };
};
exports.markChatMessagesSeenService = markChatMessagesSeenService;

const deleteDirectChatService = async (chatId, userId) => {
    const membership = await models_1.ChatParticipantModel.findOne({
        where: { chatId, userId },
    });
    if (!membership) {
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");
    }

    const chat = await models_1.ChatModel.findByPk(chatId);
    if (!chat) {
        throw new app_error_1.NotFoundException("Chat not found");
    }
    if (chat.isGroup) {
        throw new app_error_1.BadRequestException("Group chats cannot be deleted from this action");
    }

    await models_1.ChatParticipantModel.destroy({ where: { chatId, userId } });

    const remainingParticipants = await models_1.ChatParticipantModel.count({ where: { chatId } });
    if (remainingParticipants === 0) {
        await models_1.MessageModel.destroy({ where: { chatId } });
        await models_1.ChatModel.destroy({ where: { id: chatId } });
    }

    return { chatId };
};
exports.deleteDirectChatService = deleteDirectChatService;

const leaveGroupService = async (chatId, userId) => {
    const membership = await models_1.ChatParticipantModel.findOne({
        where: { chatId, userId },
    });
    if (!membership) {
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");
    }

    const chat = await models_1.ChatModel.findByPk(chatId);
    if (!chat) {
        throw new app_error_1.NotFoundException("Chat not found");
    }
    if (!chat.isGroup) {
        throw new app_error_1.BadRequestException("Only group chats can be exited");
    }

    const leavingUser = await models_1.UserModel.findByPk(userId, {
        attributes: ["id", "name", "avatar"],
    });

    await models_1.ChatParticipantModel.destroy({ where: { chatId, userId } });

    const remainingParticipants = await models_1.ChatParticipantModel.findAll({
        attributes: ["userId"],
        where: { chatId },
        raw: true,
    });
    const remainingParticipantIds = remainingParticipants.map((participant) => participant.userId);

    if (remainingParticipantIds.length === 0) {
        await models_1.MessageModel.destroy({ where: { chatId } });
        await models_1.ChatModel.destroy({ where: { id: chatId } });
        (0, socket_1.emitChatRemovedToParticipants)([userId], chatId);
        return { chatId, removed: true, chat: null, message: null };
    }

    if (chat.createdBy === userId) {
        await chat.update({ createdBy: remainingParticipantIds[0] });
    }

    const systemMessage = await models_1.MessageModel.create({
        chatId,
        senderId: userId,
        content: `${leavingUser?.name || "A member"} left the group`,
    });

    await systemMessage.reload({
        include: [
            {
                model: models_1.UserModel,
                as: "sender",
                attributes: ["id", "name", "avatar"],
            },
        ],
    });

    await chat.update({ lastMessageId: systemMessage.id });

    const syncedChat = await getChatWithParticipantsById(chatId);
    (0, socket_1.emitNewMessageToChatRoom)(userId, chatId, systemMessage);
    (0, socket_1.emitLastMessageToParticipants)(remainingParticipantIds, chatId, systemMessage);
    (0, socket_1.emitChatSyncToParticipants)(remainingParticipantIds, syncedChat);
    (0, socket_1.emitChatRemovedToParticipants)([userId], chatId);

    return {
        chatId,
        removed: true,
        chat: syncedChat,
        message: systemMessage,
    };
};
exports.leaveGroupService = leaveGroupService;

