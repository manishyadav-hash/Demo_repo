const http_config_1 = require("../config/http.config");
const app_error_1 = require("../utils/app-error");
const zod_1 = require("zod");
const errorHandler = (error, req, res, next) => {
    console.log(`Error occurred: ${req.path}`, error);
    if (error instanceof zod_1.ZodError) {
        const firstMessage = error.issues?.[0]?.message || "Validation failed";
        return res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
            message: firstMessage,
            errors: error.issues,
            errorCode: app_error_1.ErrorCodes.ERR_BAD_REQUEST,
        });
    }

    if (error instanceof app_error_1.AppError) {
        return res.status(error.statusCode).json({
            message: error.message,
            errorCode: error.errorCode,
        });
    }

    return res.status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        error: error?.message || "Something went wrong",
        errorCode: app_error_1.ErrorCodes.ERR_INTERNAL,
    });
};

exports.errorHandler = errorHandler;
