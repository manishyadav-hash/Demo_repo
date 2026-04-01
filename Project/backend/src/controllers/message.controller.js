const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const message_validator_1 = require("../validators/message.validator");
const http_config_1 = require("../config/http.config");
const message_service_1 = require("../services/message.service");
const app_error_1 = require("../utils/app-error");

exports.sendMessageController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new app_error_1.UnauthorizedException("Unauthorized");
    const body = message_validator_1.sendMessageSchema.parse(req.body);
    const result = await (0, message_service_1.sendMessageService)(userId, body);
    return res.status(http_config_1.HTTPSTATUS.OK).json({

        message: "Message sent successfully",
        ...result,
    });
});

exports.deleteMessageController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new app_error_1.UnauthorizedException("Unauthorized");
    const messageId = req.params.messageId;
    if (!messageId)
        throw new app_error_1.BadRequestException("Message ID required");
    const result = await (0, message_service_1.deleteMessageService)(messageId, userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Message deleted successfully",
        ...result,
    });
});




exports.reactToMessageController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new app_error_1.UnauthorizedException("Unauthorized");
    const messageId = req.params.messageId;
    if (!messageId)
        throw new app_error_1.BadRequestException("Message ID required");
    const body = message_validator_1.reactToMessageSchema.parse(req.body);
    const result = await (0, message_service_1.reactToMessageService)(messageId, userId, body.emoji);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Message reaction updated successfully",
        ...result,
    });
});
