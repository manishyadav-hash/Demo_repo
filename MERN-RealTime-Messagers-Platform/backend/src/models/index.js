"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLocationModel = exports.UserModel = exports.MessageModel = exports.ChatParticipantModel = exports.ChatModel = void 0;
const chat_model_1 = require("./chat.model");
const chat_model_1_default = chat_model_1.default || chat_model_1;
exports.ChatModel = chat_model_1_default;
const chat_participant_model_1 = require("./chat-participant.model");
const chat_participant_model_1_default = chat_participant_model_1.default || chat_participant_model_1;
exports.ChatParticipantModel = chat_participant_model_1_default;
const message_model_1 = require("./message.model");
const message_model_1_default = message_model_1.default || message_model_1;
exports.MessageModel = message_model_1_default;
const user_model_1 = require("./user.model");
const user_model_1_default = user_model_1.default || user_model_1;
exports.UserModel = user_model_1_default;
const user_location_model_1 = require("./user-location.model");
const user_location_model_1_default = user_location_model_1.default || user_location_model_1;
exports.UserLocationModel = user_location_model_1_default;
chat_model_1_default.belongsToMany(user_model_1_default, {
    through: chat_participant_model_1_default,
    foreignKey: "chatId",
    otherKey: "userId",
    as: "participants",
});

user_model_1_default.belongsToMany(chat_model_1_default, {
    through: chat_participant_model_1_default,
    foreignKey: "userId",
    otherKey: "chatId",
    as: "chats",
});

chat_model_1_default.belongsTo(user_model_1_default, {
    foreignKey: "createdBy",
    as: "creator",
});

chat_model_1_default.belongsTo(message_model_1_default, {
    foreignKey: "lastMessageId",
    as: "lastMessage",
});
chat_model_1_default.hasMany(message_model_1_default, {
    foreignKey: "chatId",
    as: "messages",
});
message_model_1_default.belongsTo(chat_model_1_default, {
    foreignKey: "chatId",
    as: "chat",
});
message_model_1_default.belongsTo(user_model_1_default, {
    foreignKey: "senderId",
    as: "sender",
});
message_model_1_default.belongsTo(message_model_1_default, {
    foreignKey: "replyToId",
    as: "replyTo",
});

// User Location associations
user_model_1_default.hasOne(user_location_model_1_default, {
    foreignKey: "userId",
    as: "location",
});

user_location_model_1_default.belongsTo(user_model_1_default, {
    foreignKey: "userId",
    as: "user",
});
