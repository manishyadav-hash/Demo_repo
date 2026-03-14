"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactToMessageSchema = exports.sendMessageSchema = void 0;
const zod_1 = require("zod");
exports.sendMessageSchema = zod_1.z
    .object({
    chatId: zod_1.z.string().trim().min(1),
    content: zod_1.z.string().trim().optional(),
    image: zod_1.z.string().trim().optional(),
    voiceData: zod_1.z.string().trim().optional(),
    replyToId: zod_1.z.string().trim().optional(),
    locationLatitude: zod_1.z.number().min(-90).max(90).optional(),
    locationLongitude: zod_1.z.number().min(-180).max(180).optional(),
    locationAddress: zod_1.z.string().trim().optional(),
})
    .refine((data) => data.content || data.image || data.voiceData || (data.locationLatitude && data.locationLongitude), {
    message: "Either content, image, voice message, or location must be provided",
    path: ["content"],
});
exports.reactToMessageSchema = zod_1.z.object({
    emoji: zod_1.z.string().trim().min(1).max(16),
});
