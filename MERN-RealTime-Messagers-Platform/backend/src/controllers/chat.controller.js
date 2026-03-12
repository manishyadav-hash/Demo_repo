"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleChatController = exports.getUserChatsController = exports.createChatController = void 0;
const chat_service_1 = require("../services/chat.service");
const app_error_1 = require("../utils/app-error");
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const http_config_1 = require("../config/http.config");
const chat_validator_1 = require("../validators/chat.validator");

exports.createChatController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new app_error_1.UnauthorizedException("Unauthorized");
    const body = chat_validator_1.createChatSchema.parse(req.body);
    const chat = await (0, chat_service_1.createChatService)(userId, body);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Chat created or retrieved successfully",
        chat,
    });
});

exports.getUserChatsController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new app_error_1.UnauthorizedException("Unauthorized");
    const chats = await (0, chat_service_1.getUserChatsService)(userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "User chats retrieved successfully",
        chats,
    });
});

exports.getSingleChatController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new app_error_1.UnauthorizedException("Unauthorized");
    const { id } = chat_validator_1.chatIdSchema.parse(req.params);
    const { chat, messages } = await (0, chat_service_1.getSingleChatService)(id, userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "User chats retrieved successfully",
        chat,
        messages,
    });
});
