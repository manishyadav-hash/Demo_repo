
const db_1 = require("../lib/db");
const socket_1 = require("../lib/socket");
const app_error_1 = require("../utils/app-error");

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

const hasUserSeenMessage = (message, userId) => {
    const receipts = Array.isArray(message?.seenBy) ? message.seenBy : [];
    return receipts.some((receipt) => receipt?.userId === userId);
};

const addSeenReceipt = (message, userId, seenAt) => {
    const currentReceipts = Array.isArray(message?.seenBy) ? message.seenBy : [];
    if (currentReceipts.some((receipt) => receipt?.userId === userId)) {
        return currentReceipts;
    }
    return [
        ...currentReceipts,
        {
            userId,
            seenAt: seenAt.toISOString(),
        },
    ];
};

const getParticipantsByChatId = async (chatId, client = null) => {
    const result = await (0, db_1.query)(`
        SELECT u.id, u.name, u.avatar
        FROM chat_participants cp
        JOIN users u ON u.id = cp."userId"
        WHERE cp."chatId" = $1
        ORDER BY cp."userId" ASC
    `, [chatId], client);
    return result.rows.map(mapUser);
};

const getMessageByIdWithSender = async (messageId, client = null) => {
    if (!messageId)
        return null;

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

    const senderResult = await (0, db_1.query)(`
        SELECT id, name, avatar
        FROM users
        WHERE id = $1
        LIMIT 1
    `, [message.senderId], client);

    return {
        ...message,
        sender: mapUser(senderResult.rows[0]),
    };
};

const getChatWithParticipantsById = async (chatId, client = null) => {
    const chatResult = await (0, db_1.query)(`
        SELECT id, "isGroup", "groupName", "createdBy", "lastMessageId", "createdAt", "updatedAt"
        FROM chats
        WHERE id = $1
        LIMIT 1
    `, [chatId], client);
    const chat = mapChat(chatResult.rows[0]);
    if (!chat)
        return null;

    const [participants, lastMessage] = await Promise.all([
        getParticipantsByChatId(chatId, client),
        getMessageByIdWithSender(chat.lastMessageId, client),
    ]);

    return {
        ...chat,
        participants,
        lastMessage,
    };
};

const getMessagesForChat = async (chatId, client = null) => {
    const messagesResult = await (0, db_1.query)(`
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
        ORDER BY "createdAt" ASC
    `, [chatId], client);
    const messages = messagesResult.rows.map(mapMessage);
    if (!messages.length)
        return [];

    const senderIds = [...new Set(messages.map((msg) => msg.senderId).filter(Boolean))];
    const replyIds = [...new Set(messages.map((msg) => msg.replyToId).filter(Boolean))];

    const usersResult = senderIds.length
        ? await (0, db_1.query)(`
            SELECT id, name, avatar
            FROM users
            WHERE id = ANY($1::uuid[])
        `, [senderIds], client)
        : { rows: [] };
    const userMap = new Map(usersResult.rows.map((row) => [row.id, mapUser(row)]));

    const replyRowsResult = replyIds.length
        ? await (0, db_1.query)(`
            SELECT id, "senderId", content, image
            FROM messages
            WHERE id = ANY($1::uuid[])
        `, [replyIds], client)
        : { rows: [] };

    const replySenderIds = [...new Set(replyRowsResult.rows.map((row) => row.senderId).filter(Boolean))];
    if (replySenderIds.length) {
        const replySendersResult = await (0, db_1.query)(`
            SELECT id, name, avatar
            FROM users
            WHERE id = ANY($1::uuid[])
        `, [replySenderIds], client);
        replySendersResult.rows.forEach((row) => {
            if (!userMap.has(row.id)) {
                userMap.set(row.id, mapUser(row));
            }
        });
    }

    const replyMap = new Map(replyRowsResult.rows.map((replyRow) => [
        replyRow.id,
        {
            ...replyRow,
            _id: replyRow.id,
            sender: userMap.get(replyRow.senderId) || null,
        },
    ]));

    return messages.map((message) => ({
        ...message,
        sender: userMap.get(message.senderId) || null,
        replyTo: message.replyToId ? (replyMap.get(message.replyToId) || null) : null,
    }));
};

const createChatService = async (userId, body) => {
    const { participantId, isGroup, participants, groupName } = body;
    let createdChatId = null;

    if (isGroup && participants?.length && groupName) {
        const allParticipantIds = [...new Set([userId, ...participants])];

        const existingUsersResult = await (0, db_1.query)(`
            SELECT id
            FROM users
            WHERE id = ANY($1::uuid[])
        `, [allParticipantIds]);
        if (existingUsersResult.rows.length !== allParticipantIds.length) {
            throw new app_error_1.BadRequestException("One or more selected users do not exist");
        }

        const chatResult = await (0, db_1.query)(`
            INSERT INTO chats ("isGroup", "groupName", "createdBy", "createdAt", "updatedAt")
            VALUES (true, $1, $2, NOW(), NOW())
            RETURNING id
        `, [String(groupName).trim(), userId]);
        createdChatId = chatResult.rows[0].id;

        await (0, db_1.query)(`
            INSERT INTO chat_participants ("chatId", "userId")
            SELECT $1, unnest($2::uuid[])
            ON CONFLICT ("chatId", "userId") DO NOTHING
        `, [createdChatId, allParticipantIds]);
    }
    else if (participantId) {
        if (participantId === userId) {
            throw new app_error_1.BadRequestException("You cannot create a chat with yourself");
        }

        const otherUserResult = await (0, db_1.query)(`
            SELECT id
            FROM users
            WHERE id = $1
            LIMIT 1
        `, [participantId]);
        if (!otherUserResult.rows[0]) {
            throw new app_error_1.NotFoundException("User not found");
        }

        const existingChatResult = await (0, db_1.query)(`
            SELECT c.id
            FROM chats c
            JOIN chat_participants cp ON cp."chatId" = c.id
            WHERE c."isGroup" = false
              AND cp."userId" = ANY($1::uuid[])
            GROUP BY c.id
            HAVING COUNT(DISTINCT cp."userId") = 2
               AND (SELECT COUNT(*) FROM chat_participants cp2 WHERE cp2."chatId" = c.id) = 2
            LIMIT 1
        `, [[userId, participantId]]);

        if (existingChatResult.rows[0]) {
            const existingChat = await getChatWithParticipantsById(existingChatResult.rows[0].id);
            if (existingChat)
                return existingChat;
        }

        const chatResult = await (0, db_1.query)(`
            INSERT INTO chats ("isGroup", "groupName", "createdBy", "createdAt", "updatedAt")
            VALUES (false, NULL, $1, NOW(), NOW())
            RETURNING id
        `, [userId]);
        createdChatId = chatResult.rows[0].id;

        await (0, db_1.query)(`
            INSERT INTO chat_participants ("chatId", "userId")
            VALUES ($1, $2), ($1, $3)
            ON CONFLICT ("chatId", "userId") DO NOTHING
        `, [createdChatId, userId, participantId]);
    }

    if (!createdChatId)
        return null;

    const populatedChat = await getChatWithParticipantsById(createdChatId);
    const participantIdStrings = populatedChat?.participants?.map((participant) => participant.id);
    (0, socket_1.emitNewChatToParticpants)(participantIdStrings, populatedChat);
    return populatedChat;
};
exports.createChatService = createChatService;

const getUserChatsService = async (userId) => {
    const chatLinksResult = await (0, db_1.query)(`
        SELECT "chatId"
        FROM chat_participants
        WHERE "userId" = $1
    `, [userId]);

    const chatIds = [...new Set(chatLinksResult.rows.map((row) => row.chatId))];
    if (!chatIds.length)
        return [];

    const chatsResult = await (0, db_1.query)(`
        SELECT id, "isGroup", "groupName", "createdBy", "lastMessageId", "createdAt", "updatedAt"
        FROM chats
        WHERE id = ANY($1::uuid[])
        ORDER BY "updatedAt" DESC
    `, [chatIds]);

    const chats = await Promise.all(chatsResult.rows.map(async (chatRow) => {
        return getChatWithParticipantsById(chatRow.id);
    }));

    return chats.filter(Boolean);
};
exports.getUserChatsService = getUserChatsService;

const addMembersService = async (requesterId, chatId, newParticipantIds) => {
    const chatResult = await (0, db_1.query)(`
        SELECT id, "isGroup", "createdBy", "lastMessageId"
        FROM chats
        WHERE id = $1
        LIMIT 1
    `, [chatId]);
    const chat = chatResult.rows[0];
    if (!chat) {
        throw new app_error_1.NotFoundException("Chat not found");
    }
    if (!chat.isGroup) {
        throw new app_error_1.BadRequestException("Cannot add members to a one-to-one chat");
    }

    const isMemberResult = await (0, db_1.query)(`
        SELECT 1
        FROM chat_participants
        WHERE "chatId" = $1 AND "userId" = $2
        LIMIT 1
    `, [chatId, requesterId]);
    if (!isMemberResult.rows[0]) {
        throw new app_error_1.ForbiddenException("You must be a member of the group to add others");
    }

    const existingParticipantsResult = await (0, db_1.query)(`
        SELECT "userId"
        FROM chat_participants
        WHERE "chatId" = $1
          AND "userId" = ANY($2::uuid[])
    `, [chatId, newParticipantIds]);
    const existingIds = new Set(existingParticipantsResult.rows.map((row) => row.userId));
    const idsToAdd = newParticipantIds.filter((id) => !existingIds.has(id));

    if (idsToAdd.length === 0) {
        throw new app_error_1.BadRequestException("All selected users are already in the group");
    }

    const validUsersResult = await (0, db_1.query)(`
        SELECT id, name, avatar
        FROM users
        WHERE id = ANY($1::uuid[])
    `, [idsToAdd]);
    const validUsers = validUsersResult.rows.map(mapUser);
    const validIdsToAdd = validUsers.map((user) => user.id);

    if (!validIdsToAdd.length) {
        throw new app_error_1.BadRequestException("No valid users found to add");
    }

    await (0, db_1.query)(`
        INSERT INTO chat_participants ("chatId", "userId")
        SELECT $1, unnest($2::uuid[])
        ON CONFLICT ("chatId", "userId") DO NOTHING
    `, [chatId, validIdsToAdd]);

    const requesterResult = await (0, db_1.query)(`
        SELECT name
        FROM users
        WHERE id = $1
        LIMIT 1
    `, [requesterId]);
    const requesterName = requesterResult.rows[0]?.name || "Someone";
    const addedNames = validUsers.map((u) => u.name).join(", ");

    const systemMessageInsertResult = await (0, db_1.query)(`
        INSERT INTO messages ("chatId", "senderId", content, "seenBy", reactions, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, '[]'::jsonb, '[]'::jsonb, NOW(), NOW())
        RETURNING id
    `, [chatId, requesterId, `${requesterName} added ${addedNames}`]);
    const systemMessage = await getMessageByIdWithSender(systemMessageInsertResult.rows[0].id);

    await (0, db_1.query)(`
        UPDATE chats
        SET "lastMessageId" = $1,
            "updatedAt" = NOW()
        WHERE id = $2
    `, [systemMessage.id, chatId]);

    (0, socket_1.emitNewMessageToChatRoom)(requesterId, chatId, systemMessage);
    const syncedChat = await getChatWithParticipantsById(chatId);
    const syncedParticipantIds = syncedChat?.participants?.map((participant) => participant.id) || [];
    (0, socket_1.emitNewChatToParticpants)(validIdsToAdd, syncedChat);
    (0, socket_1.emitChatSyncToParticipants)(syncedParticipantIds, syncedChat);

    return {
        addedCount: validUsers.length,
        addedNames,
        message: systemMessage,
        addedMembers: validUsers,
        chat: syncedChat,
    };
};
exports.addMembersService = addMembersService;

const getSingleChatService = async (chatId, userId) => {
    await (0, exports.validateChatParticipant)(chatId, userId);

    const chat = await getChatWithParticipantsById(chatId);
    if (!chat) {
        throw new app_error_1.BadRequestException("Chat not found or you are not authorized to view this chat");
    }

    const messages = await getMessagesForChat(chatId);
    const unreadMessages = messages.filter((msg) => msg.senderId !== userId && !hasUserSeenMessage(msg, userId));

    if (unreadMessages.length) {
        const seenAt = new Date();

        await Promise.all(unreadMessages.map((msg) => {
            const nextSeenBy = addSeenReceipt(msg, userId, seenAt);
            if (chat.isGroup) {
                return (0, db_1.query)(`
                    UPDATE messages
                    SET "seenBy" = $1::jsonb,
                        "updatedAt" = NOW()
                    WHERE id = $2
                `, [JSON.stringify(nextSeenBy), msg.id]);
            }

            return (0, db_1.query)(`
                UPDATE messages
                SET "seenBy" = $1::jsonb,
                    "seenAt" = $2,
                    "updatedAt" = NOW()
                WHERE id = $3
            `, [JSON.stringify(nextSeenBy), seenAt, msg.id]);
        }));

        messages.forEach((msg) => {
            if (unreadMessages.some((unreadMessage) => unreadMessage.id === msg.id)) {
                msg.seenBy = addSeenReceipt(msg, userId, seenAt);
                if (!chat.isGroup) {
                    msg.seenAt = seenAt;
                }
            }
        });

        (0, socket_1.emitMessagesSeen)(chatId, unreadMessages.map((msg) => msg.id), userId, seenAt);
    }

    return {
        chat,
        messages,
    };
};
exports.getSingleChatService = getSingleChatService;

const validateChatParticipant = async (chatId, userId) => {
    const membershipResult = await (0, db_1.query)(`
        SELECT "chatId", "userId"
        FROM chat_participants
        WHERE "chatId" = $1 AND "userId" = $2
        LIMIT 1
    `, [chatId, userId]);
    const membership = membershipResult.rows[0];

    if (!membership)
        throw new app_error_1.BadRequestException("User not a participant in chat");
    return membership;
};
exports.validateChatParticipant = validateChatParticipant;

const markChatMessagesSeenService = async (chatId, userId) => {
    await (0, exports.validateChatParticipant)(chatId, userId);

    const chatResult = await (0, db_1.query)(`
        SELECT id, "isGroup"
        FROM chats
        WHERE id = $1
        LIMIT 1
    `, [chatId]);
    const chat = chatResult.rows[0];
    if (!chat) {
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");
    }

    const unseenMessagesResult = await (0, db_1.query)(`
        SELECT id, "senderId", "seenBy"
        FROM messages
        WHERE "chatId" = $1
          AND "senderId" <> $2
    `, [chatId, userId]);

    const unseenMessages = unseenMessagesResult.rows.map(mapMessage);
    const unreadMessages = unseenMessages.filter((message) => !hasUserSeenMessage(message, userId));
    const seenMessageIds = unreadMessages.map((message) => message.id);
    if (!seenMessageIds.length) {
        return { chatId, seenMessageIds: [], seenAt: null, seenBy: userId };
    }

    const seenAt = new Date();
    await Promise.all(unreadMessages.map((message) => {
        const nextSeenBy = addSeenReceipt(message, userId, seenAt);
        if (chat.isGroup) {
            return (0, db_1.query)(`
                UPDATE messages
                SET "seenBy" = $1::jsonb,
                    "updatedAt" = NOW()
                WHERE id = $2
            `, [JSON.stringify(nextSeenBy), message.id]);
        }

        return (0, db_1.query)(`
            UPDATE messages
            SET "seenBy" = $1::jsonb,
                "seenAt" = $2,
                "updatedAt" = NOW()
            WHERE id = $3
        `, [JSON.stringify(nextSeenBy), seenAt, message.id]);
    }));

    (0, socket_1.emitMessagesSeen)(chatId, seenMessageIds, userId, seenAt);
    return { chatId, seenMessageIds, seenAt, seenBy: userId };
};
exports.markChatMessagesSeenService = markChatMessagesSeenService;

const deleteDirectChatService = async (chatId, userId) => {
    const membershipResult = await (0, db_1.query)(`
        SELECT 1
        FROM chat_participants
        WHERE "chatId" = $1 AND "userId" = $2
        LIMIT 1
    `, [chatId, userId]);
    if (!membershipResult.rows[0]) {
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");
    }

    const chatResult = await (0, db_1.query)(`
        SELECT id, "isGroup"
        FROM chats
        WHERE id = $1
        LIMIT 1
    `, [chatId]);
    const chat = chatResult.rows[0];
    if (!chat) {
        throw new app_error_1.NotFoundException("Chat not found");
    }

    if (chat.isGroup) {
        throw new app_error_1.BadRequestException("Group chats cannot be deleted from this action");
    }

    await (0, db_1.query)(`
        DELETE FROM chat_participants
        WHERE "chatId" = $1 AND "userId" = $2
    `, [chatId, userId]);

    const remainingParticipantsResult = await (0, db_1.query)(`
        SELECT COUNT(*)::int AS count
        FROM chat_participants
        WHERE "chatId" = $1
    `, [chatId]);
    const remainingParticipants = remainingParticipantsResult.rows[0]?.count || 0;

    if (remainingParticipants === 0) {
        await (0, db_1.query)(`DELETE FROM messages WHERE "chatId" = $1`, [chatId]);
        await (0, db_1.query)(`DELETE FROM chats WHERE id = $1`, [chatId]);
    }

    return { chatId };
};
exports.deleteDirectChatService = deleteDirectChatService;

const leaveGroupService = async (chatId, userId) => {
    const membershipResult = await (0, db_1.query)(`
        SELECT 1
        FROM chat_participants
        WHERE "chatId" = $1 AND "userId" = $2
        LIMIT 1
    `, [chatId, userId]);
    if (!membershipResult.rows[0]) {
        throw new app_error_1.BadRequestException("Chat not found or unauthorized");
    }

    const chatResult = await (0, db_1.query)(`
        SELECT id, "isGroup", "createdBy"
        FROM chats
        WHERE id = $1
        LIMIT 1
    `, [chatId]);
    const chat = chatResult.rows[0];
    if (!chat) {
        throw new app_error_1.NotFoundException("Chat not found");
    }
    if (!chat.isGroup) {
        throw new app_error_1.BadRequestException("Only group chats can be exited");
    }

    const leavingUserResult = await (0, db_1.query)(`
        SELECT id, name, avatar
        FROM users
        WHERE id = $1
        LIMIT 1
    `, [userId]);
    const leavingUser = mapUser(leavingUserResult.rows[0]);

    await (0, db_1.query)(`
        DELETE FROM chat_participants
        WHERE "chatId" = $1 AND "userId" = $2
    `, [chatId, userId]);

    const remainingParticipantsResult = await (0, db_1.query)(`
        SELECT "userId"
        FROM chat_participants
        WHERE "chatId" = $1
    `, [chatId]);
    const remainingParticipantIds = remainingParticipantsResult.rows.map((row) => row.userId);

    if (remainingParticipantIds.length === 0) {
        await (0, db_1.query)(`DELETE FROM messages WHERE "chatId" = $1`, [chatId]);
        await (0, db_1.query)(`DELETE FROM chats WHERE id = $1`, [chatId]);
        (0, socket_1.emitChatRemovedToParticipants)([userId], chatId);
        return { chatId, removed: true, chat: null, message: null };
    }

    if (chat.createdBy === userId) {
        await (0, db_1.query)(`
            UPDATE chats
            SET "createdBy" = $1,
                "updatedAt" = NOW()
            WHERE id = $2
        `, [remainingParticipantIds[0], chatId]);
    }

    const systemMessageInsertResult = await (0, db_1.query)(`
        INSERT INTO messages ("chatId", "senderId", content, "seenBy", reactions, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, '[]'::jsonb, '[]'::jsonb, NOW(), NOW())
        RETURNING id
    `, [chatId, userId, `${leavingUser?.name || "A member"} left the group`]);
    const systemMessage = await getMessageByIdWithSender(systemMessageInsertResult.rows[0].id);

    await (0, db_1.query)(`
        UPDATE chats
        SET "lastMessageId" = $1,
            "updatedAt" = NOW()
        WHERE id = $2
    `, [systemMessage.id, chatId]);

    const syncedChat = await getChatWithParticipantsById(chatId);
    (0, socket_1.emitNewMessageToChatRoom)(userId, chatId, systemMessage);
    (0, socket_1.emitLastMessageToParticipants)(remainingParticipantIds, chatId, systemMessage);
    (0, socket_1.emitChatSyncToParticipants)(remainingParticipantIds, syncedChat);
    (0, socket_1.emitChatRemovedToParticipants)([userId], chatId);

    return {
        chatId,
        removed: true,
        chat: syncedChat,
        message: systemMessage,
    };
};
exports.leaveGroupService = leaveGroupService;
