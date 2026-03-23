"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationTokenSchema = void 0;
const zod_1 = require("zod");
exports.notificationTokenSchema = zod_1.z.object({
    fcmToken: zod_1.z.string().trim().min(20, "Invalid FCM token"),
});
