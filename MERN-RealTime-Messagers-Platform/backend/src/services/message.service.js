"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageService = void 0;
const models_1 = require("../models");
const app_error_1 = require("../utils/app-error");
const socket_1 = require("../lib/socket");
const sendMessageService = async (userId, body) => {
    const { chatId, content, image, voiceData, replyToId, locationLatitude, locationLongitude, locationAddress } = body;
    const chat = await models_1.ChatModel.findByPk(chatId);
    if (!chat)
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");
    const isParticipant = await models_1.ChatParticipantModel.findOne({
        where: { chatId, userId },
    });
    if (!isParticipant)
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");
    if (replyToId) {
        const replyMessage = await models_1.MessageModel.findOne({
            where: { id: replyToId, chatId },
        });
        if (!replyMessage)
            throw new app_error_1.NotFoundException("Reply message not found");
    }
    let imageUrl;
    // Store image as base64 data URL (no Cloudinary needed)
    if (image) {
        imageUrl = image;
    }
    let voiceUrl_processed = voiceData || null;
    const newMessage = await models_1.MessageModel.create({
        chatId,
        senderId: userId,
        content,
        image: imageUrl,
        voiceUrl: voiceUrl_processed,
        locationLatitude: locationLatitude || null,
        locationLongitude: locationLongitude || null,
        locationAddress: locationAddress || null,
        replyToId: replyToId || null,
    });
    await chat.update({ lastMessageId: newMessage.id });
    const populatedMessage = await models_1.MessageModel.findByPk(newMessage.id, {
        include: [
            { model: models_1.ChatModel, as: "chat" },
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
    });
    //websocket emit the new Message to the chat room
    (0, socket_1.emitNewMessageToChatRoom)(userId, chatId, populatedMessage || newMessage);
    //websocket emit the lastmessage to members (personnal room user)
    const allParticipants = await models_1.ChatParticipantModel.findAll({
        attributes: ["userId"],
        where: { chatId },
        raw: true,
    });
    
    const allParticipantIds = allParticipants.map((p) => p.userId);
    (0, socket_1.emitLastMessageToParticipants)(allParticipantIds, chatId, populatedMessage || newMessage);
    return {
        userMessage: populatedMessage || newMessage,
        chat,
    };
};
exports.sendMessageService = sendMessageService;
