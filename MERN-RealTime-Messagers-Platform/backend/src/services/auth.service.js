"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPhoneOtpService = exports.sendPhoneOtpService = exports.loginService = exports.registerService = void 0;
const user_model_1 = require("../models/user.model");
const user_model_1_default = user_model_1.default || user_model_1;
const app_error_1 = require("../utils/app-error");
const HARDCODED_OTP = "12345";
const registerService = async (body) => {
    const { email } = body;
    const existingUser = await user_model_1_default.findOne({ where: { email } });
    if (existingUser)
        throw new app_error_1.UnauthorizedException("User already exist");
    return await user_model_1_default.create({
        name: body.name,
        email: body.email,
        password: body.password,
        avatar: body.avatar,
    });
};

exports.registerService = registerService;
const loginService = async (body) => {
    const { email, password } = body;
    const user = await user_model_1_default.findOne({ where: { email } });
    if (!user)
        throw new app_error_1.NotFoundException("Email or Password not found");
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid)
        throw new app_error_1.UnauthorizedException("Invaild email or password");
    return user;
};

exports.loginService = loginService;
const sendPhoneOtpService = async (body) => {
    const { phoneNumber } = body;
    return {
        phoneNumber,
        otp: HARDCODED_OTP,
    };
};

exports.sendPhoneOtpService = sendPhoneOtpService;
const verifyPhoneOtpService = async (body) => {
    const { email, phoneNumber, otp } = body;
    if (otp !== HARDCODED_OTP)
        throw new app_error_1.UnauthorizedException("Invalid OTP");
    const user = await user_model_1_default.findOne({ where: { email } });
    if (!user)
        throw new app_error_1.NotFoundException("Account not found for this email");
    if (user.phoneNumber && user.phoneNumber !== phoneNumber) {
        throw new app_error_1.UnauthorizedException("Phone number does not match this account");
    }
    if (!user.phoneNumber) {
        user.phoneNumber = phoneNumber;
        await user.save();
    }
    return user;
};

exports.verifyPhoneOtpService = verifyPhoneOtpService;
