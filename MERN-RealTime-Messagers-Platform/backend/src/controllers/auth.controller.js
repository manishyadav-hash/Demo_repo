"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authStatusController = exports.logoutController = exports.verifyPhoneOtpController = exports.sendPhoneOtpController = exports.loginController = exports.registerController = void 0;
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const auth_validator_1 = require("../validators/auth.validator");
const auth_service_1 = require("../services/auth.service");
const cookie_1 = require("../utils/cookie");
const http_config_1 = require("../config/http.config");

exports.registerController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const body = auth_validator_1.registerSchema.parse(req.body);
    const user = await (0, auth_service_1.registerService)(body);
    const userId = user.id;
    return (0, cookie_1.setJwtAuthCookie)({
        res,
        userId,
    })
        .status(http_config_1.HTTPSTATUS.CREATED)
        .json({
        message: "User created & login successfully",
        user,
    });
});


exports.loginController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const body = auth_validator_1.loginSchema.parse(req.body);
    const user = await (0, auth_service_1.loginService)(body);
    const userId = user.id;
    return (0, cookie_1.setJwtAuthCookie)({
        res,
        userId,
    })
        .status(http_config_1.HTTPSTATUS.OK)
        .json({
        message: "User login successfully",
        user,
    });
});

exports.sendPhoneOtpController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const body = auth_validator_1.sendPhoneOtpSchema.parse(req.body);
    const response = await (0, auth_service_1.sendPhoneOtpService)(body);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "OTP sent successfully",
        notification: `Your OTP is ${response.otp}`,  // Template literal for better readablility
        phoneNumber: response.phoneNumber,
    });
});

exports.verifyPhoneOtpController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const body = auth_validator_1.verifyPhoneOtpSchema.parse(req.body);
    const user = await (0, auth_service_1.verifyPhoneOtpService)(body);
    return (0, cookie_1.setJwtAuthCookie)({
        res,
        userId: user.id,
    })
        .status(http_config_1.HTTPSTATUS.OK)
        .json({
        message: "OTP verified and login successful",
        user,
    });
});


exports.logoutController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    return (0, cookie_1.clearJwtAuthCookie)(res).status(http_config_1.HTTPSTATUS.OK).json({
        message: "User logout successfully",
    });
});


exports.authStatusController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Authenticated User",
        user,
    });
});


