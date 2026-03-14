"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactToMessageService = exports.deleteMessageService = exports.sendMessageService = void 0;
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
const deleteMessageService = async (messageId, userId) => {
    const message = await models_1.MessageModel.findByPk(messageId);
    if (!message)
        throw new app_error_1.NotFoundException("Message not found");
    if (message.senderId !== userId)
        throw new app_error_1.BadRequestException("You can only delete your own messages");
    const chatId = message.chatId;
    // If this was the chat's lastMessageId, find previous message to replace it
    const chat = await models_1.ChatModel.findByPk(chatId);
    if (chat && chat.lastMessageId === messageId) {
        const previousMessage = await models_1.MessageModel.findOne({
            where: { chatId },
            order: [["createdAt", "DESC"]],
            offset: 1,
        });
        await chat.update({ lastMessageId: previousMessage ? previousMessage.id : null });
        // Notify participants of updated last message
        const allParticipants = await models_1.ChatParticipantModel.findAll({
            attributes: ["userId"],
            where: { chatId },
            raw: true,
        });
        const allParticipantIds = allParticipants.map((p) => p.userId);
        (0, socket_1.emitLastMessageToParticipants)(allParticipantIds, chatId, previousMessage || null);
    }
    await message.destroy();
    (0, socket_1.emitMessageDeleted)(chatId, messageId, userId);
    return { messageId, chatId };
};
exports.deleteMessageService = deleteMessageService;

const reactToMessageService = async (messageId, userId, emoji) => {
    const message = await models_1.MessageModel.findByPk(messageId);
    if (!message)
        throw new app_error_1.NotFoundException("Message not found");

    const chatId = message.chatId;
    const membership = await models_1.ChatParticipantModel.findOne({
        where: { chatId, userId },
    });
    if (!membership)
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");

    if (message.senderId === userId) {
        const filteredReactions = Array.isArray(message.reactions)
            ? message.reactions.filter((reaction) => reaction?.userId !== userId)
            : [];
        if (filteredReactions.length !== (Array.isArray(message.reactions) ? message.reactions.length : 0)) {
            await message.update({ reactions: filteredReactions });
            (0, socket_1.emitMessageReactionUpdated)(chatId, message.id, filteredReactions);
        }
        return {
            chatId,
            messageId: message.id,
            reactions: filteredReactions,
            localOnly: true,
        };
    }

    const existingReactions = Array.isArray(message.reactions) ? message.reactions : [];
    const reactionIndex = existingReactions.findIndex((reaction) => reaction?.userId === userId);

    let nextReactions = [...existingReactions];
    if (reactionIndex >= 0) {
        const existingReaction = nextReactions[reactionIndex];
        if (existingReaction?.emoji === emoji) {
            nextReactions.splice(reactionIndex, 1);
        }
        else {
            nextReactions[reactionIndex] = {
                userId,
                emoji,
                reactedAt: new Date().toISOString(),
            };
        }
    }
    else {
        nextReactions.push({
            userId,
            emoji,
            reactedAt: new Date().toISOString(),
        });
    }

    await message.update({ reactions: nextReactions });
    (0, socket_1.emitMessageReactionUpdated)(chatId, message.id, nextReactions);

    return {
        chatId,
        messageId: message.id,
        reactions: nextReactions,
    };
};
exports.reactToMessageService = reactToMessageService;
