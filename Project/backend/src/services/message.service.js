
const db_1 = require("../lib/db");
const app_error_1 = require("../utils/app-error");
const socket_1 = require("../lib/socket");
const firebase_service_1 = require("./firebase.service");

const mapUser = (row) => {
    if (!row)
        return null;
    return {
        id: row.id,
        _id: row.id,
        name: row.name,
        avatar: row.avatar,
    };
};

const mapChat = (row) => {
    if (!row)
        return null;
    return {
        ...row,
        _id: row.id,
    };
};

const mapMessage = (row) => {
    if (!row)
        return null;
    return {
        ...row,
        _id: row.id,
        seenBy: Array.isArray(row.seenBy) ? row.seenBy : [],
        reactions: Array.isArray(row.reactions) ? row.reactions : [],
    };
};


const getMessageById = async (messageId, client = null) => {
    const messageResult = await (0, db_1.query)(`
        SELECT id,
               "chatId",
               "senderId",
               content,
               image,
               "voiceUrl",
               "locationLatitude",
               "locationLongitude",
               "locationAddress",
               "replyToId",
               "seenAt",
               "seenBy",
               reactions,
               "createdAt",
               "updatedAt"
        FROM messages
        WHERE id = $1
        LIMIT 1
    `, [messageId], client);
    const message = mapMessage(messageResult.rows[0]);
    if (!message)
        return null;

    const [chatResult, senderResult] = await Promise.all([
        (0, db_1.query)(`
            SELECT id, "isGroup", "groupName", "createdBy", "lastMessageId", "createdAt", "updatedAt"
            FROM chats
            WHERE id = $1
            LIMIT 1
        `, [message.chatId], client),
        (0, db_1.query)(`
            SELECT id, name, avatar
            FROM users
            WHERE id = $1
            LIMIT 1
        `, [message.senderId], client),
    ]);

    let replyTo = null;
    if (message.replyToId) {
        const replyResult = await (0, db_1.query)(`
            SELECT id, "senderId", content, image
            FROM messages
            WHERE id = $1
            LIMIT 1
        `, [message.replyToId], client);
        const reply = replyResult.rows[0];
        if (reply) {
            const replySenderResult = await (0, db_1.query)(`
                SELECT id, name, avatar
                FROM users
                WHERE id = $1
                LIMIT 1
            `, [reply.senderId], client);
            replyTo = {
                ...reply,
                _id: reply.id,
                sender: mapUser(replySenderResult.rows[0]),
            };
        }
    }

    return {
        ...message,
        chat: mapChat(chatResult.rows[0]),
        sender: mapUser(senderResult.rows[0]),
        replyTo,
    };
};

const getChatParticipants = async (chatId, client = null) => {
    const result = await (0, db_1.query)(`
        SELECT "userId"
        FROM chat_participants
        WHERE "chatId" = $1
    `, [chatId], client);
    return result.rows.map((row) => row.userId);
};

const sendMessageService = async (userId, body) => {
    const { chatId, content, image, voiceData, replyToId, locationLatitude, locationLongitude, locationAddress } = body;

    const chatResult = await (0, db_1.query)(`
        SELECT id, "isGroup", "groupName", "createdBy", "lastMessageId", "createdAt", "updatedAt"
        FROM chats
        WHERE id = $1
        LIMIT 1
    `, [chatId]);
    const chat = mapChat(chatResult.rows[0]);
    if (!chat)
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");

    const participantResult = await (0, db_1.query)(`
        SELECT 1
        FROM chat_participants
        WHERE "chatId" = $1 AND "userId" = $2
        LIMIT 1
    `, [chatId, userId]);
    if (!participantResult.rows[0]) {
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");
    }

    if (replyToId) {
        const replyCheckResult = await (0, db_1.query)(`
            SELECT id
            FROM messages
            WHERE id = $1 AND "chatId" = $2
            LIMIT 1
        `, [replyToId, chatId]);
        if (!replyCheckResult.rows[0]) {
            throw new app_error_1.NotFoundException("Reply message not found");
        }
    }

    const insertResult = await (0, db_1.query)(`
        INSERT INTO messages (
            "chatId", "senderId", content, image, "voiceUrl", "locationLatitude", "locationLongitude", "locationAddress", "replyToId", "seenBy", reactions, "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '[]'::jsonb, '[]'::jsonb, NOW(), NOW())
        RETURNING id
    `, [
        chatId,
        userId,
        content || null,
        image || null,
        voiceData || null,
        locationLatitude || null,
        locationLongitude || null,
        locationAddress || null,
        replyToId || null,
    ]);
    const newMessageId = insertResult.rows[0].id;

    await (0, db_1.query)(`
        UPDATE chats
        SET "lastMessageId" = $1,
            "updatedAt" = NOW()
        WHERE id = $2
    `, [newMessageId, chatId]);

    const populatedMessage = await getMessageById(newMessageId);
    (0, socket_1.emitNewMessageToChatRoom)(userId, chatId, populatedMessage);

    const allParticipantIds = await getChatParticipants(chatId);
    (0, socket_1.emitLastMessageToParticipants)(allParticipantIds, chatId, populatedMessage);
    (0, socket_1.emitMessageNotificationToParticipants)(allParticipantIds, userId, chatId, populatedMessage);

    const recipientIds = allParticipantIds.filter((participantId) => participantId !== userId);
    if (recipientIds.length > 0) {
        const recipientRowsResult = await (0, db_1.query)(`
            SELECT id, "fcmToken"
            FROM users
            WHERE id = ANY($1::uuid[])
        `, [recipientIds]);

        const recipientTokens = recipientRowsResult.rows
            .map((recipient) => recipient.fcmToken)
            .filter(Boolean);

        const senderName = populatedMessage?.sender?.name || "New message";
        const textContent = String((typeof content === "string" ? content : "") || "").trim();
        const notificationBody = textContent || "You received a new message";

        const pushResult = await (0, firebase_service_1.sendPushToTokens)({
            tokens: recipientTokens,
            title: senderName,
            body: notificationBody,
            data: {
                chatId,
                senderId: userId,
                type: "new_message",
                messageId: String(populatedMessage?.id || ""),
                senderName: String(senderName || "New message"),
                messageText: String(notificationBody || "You received a new message"),
            },
        });

        if (pushResult.invalidTokens.length > 0) {
            await (0, db_1.query)(`
                UPDATE users
                SET "fcmToken" = NULL,
                    "updatedAt" = NOW()
                WHERE "fcmToken" = ANY($1::text[])
            `, [pushResult.invalidTokens]);
        }
    }

    return {
        userMessage: populatedMessage,
        chat,
    };
};
exports.sendMessageService = sendMessageService;

const deleteMessageService = async (messageId, userId) => {
    const messageResult = await (0, db_1.query)(`
        SELECT id, "chatId", "senderId"
        FROM messages
        WHERE id = $1
        LIMIT 1
    `, [messageId]);
    const message = messageResult.rows[0];
    if (!message)
        throw new app_error_1.NotFoundException("Message not found");
    if (message.senderId !== userId)
        throw new app_error_1.BadRequestException("You can only delete your own messages");

    const chatId = message.chatId;

    const chatResult = await (0, db_1.query)(`
        SELECT id, "lastMessageId"
        FROM chats
        WHERE id = $1
        LIMIT 1
    `, [chatId]);
    const chat = chatResult.rows[0];

    if (chat && chat.lastMessageId === messageId) {
        const previousMessageResult = await (0, db_1.query)(`
            SELECT id,
                   "chatId",
                   "senderId",
                   content,
                   image,
                   "voiceUrl",
                   "locationLatitude",
                   "locationLongitude",
                   "locationAddress",
                   "replyToId",
                   "seenAt",
                   "seenBy",
                   reactions,
                   "createdAt",
                   "updatedAt"
            FROM messages
            WHERE "chatId" = $1
            ORDER BY "createdAt" DESC
            OFFSET 1
            LIMIT 1
        `, [chatId]);
        const previousMessage = mapMessage(previousMessageResult.rows[0]);

        await (0, db_1.query)(`
            UPDATE chats
            SET "lastMessageId" = $1,
                "updatedAt" = NOW()
            WHERE id = $2
        `, [previousMessage ? previousMessage.id : null, chatId]);

        const allParticipantIds = await getChatParticipants(chatId);
        (0, socket_1.emitLastMessageToParticipants)(allParticipantIds, chatId, previousMessage || null);
    }

    await (0, db_1.query)(`DELETE FROM messages WHERE id = $1`, [messageId]);
    (0, socket_1.emitMessageDeleted)(chatId, messageId, userId);
    return { messageId, chatId };
};
exports.deleteMessageService = deleteMessageService;

const reactToMessageService = async (messageId, userId, emoji) => {
    const messageResult = await (0, db_1.query)(`
        SELECT id, "chatId", "senderId", reactions
        FROM messages
        WHERE id = $1
        LIMIT 1
    `, [messageId]);
    const message = mapMessage(messageResult.rows[0]);
    if (!message)
        throw new app_error_1.NotFoundException("Message not found");

    const chatId = message.chatId;
    const membershipResult = await (0, db_1.query)(`
        SELECT 1
        FROM chat_participants
        WHERE "chatId" = $1 AND "userId" = $2
        LIMIT 1
    `, [chatId, userId]);
    if (!membershipResult.rows[0]) {
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");
    }

    if (message.senderId === userId) {
        const filteredReactions = Array.isArray(message.reactions)
            ? message.reactions.filter((reaction) => reaction?.userId !== userId)
            : [];

        if (filteredReactions.length !== (Array.isArray(message.reactions) ? message.reactions.length : 0)) {
            await (0, db_1.query)(`
                UPDATE messages
                SET reactions = $1::jsonb,
                    "updatedAt" = NOW()
                WHERE id = $2
            `, [JSON.stringify(filteredReactions), message.id]);
            (0, socket_1.emitMessageReactionUpdated)(chatId, message.id, filteredReactions);
        }

        return {
            chatId,
            messageId: message.id,
            reactions: filteredReactions,
            localOnly: true,
        };
    }

    const existingReactions = Array.isArray(message.reactions) ? message.reactions : [];
    const reactionIndex = existingReactions.findIndex((reaction) => reaction?.userId === userId);

    const nextReactions = [...existingReactions];
    if (reactionIndex >= 0) {
        const existingReaction = nextReactions[reactionIndex];
        if (existingReaction?.emoji === emoji) {
            nextReactions.splice(reactionIndex, 1);
        }
        else {
            nextReactions[reactionIndex] = {
                userId,
                emoji,
                reactedAt: new Date().toISOString(),
            };
        }
    }
    else {
        nextReactions.push({
            userId,
            emoji,
            reactedAt: new Date().toISOString(),
        });
    }

    await (0, db_1.query)(`
        UPDATE messages
        SET reactions = $1::jsonb,
            "updatedAt" = NOW()
        WHERE id = $2
    `, [JSON.stringify(nextReactions), message.id]);

    (0, socket_1.emitMessageReactionUpdated)(chatId, message.id, nextReactions);

    return {
        chatId,
        messageId: message.id,
        reactions: nextReactions,
    };
};
exports.reactToMessageService = reactToMessageService;
