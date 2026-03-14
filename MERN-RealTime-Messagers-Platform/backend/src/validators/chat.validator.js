"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMembersSchema = exports.chatIdSchema = exports.createChatSchema = void 0;
const zod_1 = require("zod");
exports.createChatSchema = zod_1.z.object({
    participantId: zod_1.z.string().trim().min(1).optional(),
    isGroup: zod_1.z.boolean().optional(),
    participants: zod_1.z.array(zod_1.z.string().trim().min(1)).optional(),
    groupName: zod_1.z.string().trim().min(1).optional(),
}).superRefine((value, ctx) => {
    if (value.isGroup) {
        if (!value.groupName) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "Group name is required",
                path: ["groupName"],
            });
        }
        if (!value.participants || value.participants.length < 2) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "Select at least 2 participants for a group chat",
                path: ["participants"],
            });
        }
        return;
    }
    if (!value.participantId) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "participantId is required for one-to-one chat",
            path: ["participantId"],
        });
    }
});
exports.chatIdSchema = zod_1.z.object({
    id: zod_1.z.string().trim().min(1),
});
exports.addMembersSchema = zod_1.z.object({
    chatId: zod_1.z.string().trim().min(1),
    participants: zod_1.z.array(zod_1.z.string().trim().min(1)).min(1),
});
