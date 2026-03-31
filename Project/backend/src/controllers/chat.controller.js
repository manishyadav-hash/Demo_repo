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



exports.addMembersController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new app_error_1.UnauthorizedException("Unauthorized");
    const body = chat_validator_1.addMembersSchema.parse(req.body);
    const result = await (0, chat_service_1.addMembersService)(userId, body.chatId, body.participants);
    return res.status(http_config_1.HTTPSTATUS.OK).json(result);
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

exports.deleteDirectChatController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new app_error_1.UnauthorizedException("Unauthorized");
    const { id } = chat_validator_1.chatIdSchema.parse(req.params);
    const result = await (0, chat_service_1.deleteDirectChatService)(id, userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Direct chat deleted successfully",
        ...result,
    });
});


exports.leaveGroupController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new app_error_1.UnauthorizedException("Unauthorized");
    const { id } = chat_validator_1.chatIdSchema.parse(req.params);
    const result = await (0, chat_service_1.leaveGroupService)(id, userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "You exited the group successfully",
        ...result,
    });
});

exports.markChatAsReadController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new app_error_1.UnauthorizedException("Unauthorized");
    const { id } = chat_validator_1.chatIdSchema.parse(req.params);
    const result = await (0, chat_service_1.markChatMessagesSeenService)(id, userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Messages marked as seen",
        ...result,
    });

});

