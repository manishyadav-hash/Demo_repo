const db_1 = require("../lib/db");

const toPublicUser = (row) => {
    if (!row)
        return null;
    return {
        id: row.id,
        _id: row.id,
        name: row.name,
        email: row.email,
        phoneNumber: row.phoneNumber,
        avatar: row.avatar,
        fcmToken: row.fcmToken,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
};

const findByIdUserService = async (userId) => {
    const result = await (0, db_1.query)(`
        SELECT id, name, email, "phoneNumber", avatar, "fcmToken", "createdAt", "updatedAt"
        FROM users
        WHERE id = $1
        LIMIT 1
    `, [userId]);
    return toPublicUser(result.rows[0]);
};
exports.findByIdUserService = findByIdUserService;
const getUsersService = async (userId) => {
    const usersResult = await (0, db_1.query)(`
        SELECT id, name, email, "phoneNumber", avatar, "fcmToken", "createdAt", "updatedAt"
        FROM users
        WHERE id <> $1
        ORDER BY "createdAt" DESC
    `, [userId]);
    return usersResult.rows.map(toPublicUser);
};


exports.getUsersService = getUsersService;
const saveUserNotificationTokenService = async (userId, fcmToken) => {
    await (0, db_1.query)(`
        UPDATE users
        SET "fcmToken" = $1, "updatedAt" = NOW()
        WHERE id = $2
    `, [fcmToken, userId]);
    return { fcmToken };
};
exports.saveUserNotificationTokenService = saveUserNotificationTokenService;
const clearUserNotificationTokenService = async (userId) => {
    await (0, db_1.query)(`
        UPDATE users
        SET "fcmToken" = NULL, "updatedAt" = NOW()
        WHERE id = $1
    `, [userId]);
    return { success: true };
};
exports.clearUserNotificationTokenService = clearUserNotificationTokenService;
