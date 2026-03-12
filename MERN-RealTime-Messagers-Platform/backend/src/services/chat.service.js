"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChatParticipant = exports.getSingleChatService = exports.getUserChatsService = exports.createChatService = void 0;
const sequelize_1 = require("sequelize");
const sequelize_config_1 = require("../config/sequelize.config");
const socket_1 = require("../lib/socket");
const models_1 = require("../models");
const app_error_1 = require("../utils/app-error");

const createChatService = async (userId, body) => {
    const { participantId, isGroup, participants, groupName } = body;
    let chat = null;
    let allParticipantIds = [];
    if (isGroup && participants?.length && groupName) {
        allParticipantIds = [userId, ...participants];
        chat = await models_1.ChatModel.create({
            isGroup: true,
            groupName,
            createdBy: userId,
        });
        await chat.setParticipants(allParticipantIds);
    }

    else if (participantId) {
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
    const populatedChat = await models_1.ChatModel.findByPk(chat.id, {
        include: [
            {
                model: models_1.UserModel,
                as: "participants",
                attributes: ["id", "name", "avatar"],
                through: { attributes: [] },
            },
        ],
    });
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

