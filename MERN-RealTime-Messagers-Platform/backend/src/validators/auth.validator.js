"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPhoneOtpSchema = exports.sendPhoneOtpSchema = exports.loginSchema = exports.registerSchema = exports.passwordSchema = exports.emailSchema = void 0;
const zod_1 = require("zod");
exports.emailSchema = zod_1.z
    .string()
    .trim()
    .email("Invalid email address")
    .min(1);
exports.passwordSchema = zod_1.z.string().trim().min(1);
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    email: exports.emailSchema,
    password: exports.passwordSchema,
    avatar: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
});
exports.sendPhoneOtpSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});
exports.verifyPhoneOtpSchema = zod_1.z.object({
    email: exports.emailSchema,
    phoneNumber: zod_1.z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    otp: zod_1.z.string().trim().min(1, "OTP is required"),
});
