"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearUserNotificationTokenService = exports.saveUserNotificationTokenService = exports.getUsersService = exports.findByIdUserService = void 0;
const sequelize_1 = require("sequelize");
const user_model_1 = require("../models/user.model");
const user_model_1_default = user_model_1.default || user_model_1;
const findByIdUserService = async (userId) => {
    return await user_model_1_default.findByPk(userId);
};
exports.findByIdUserService = findByIdUserService;
const getUsersService = async (userId) => {
    const users = await user_model_1_default.findAll({
        where: { id: { [sequelize_1.Op.ne]: userId } },
        attributes: { exclude: ["password"] },
    });
    return users;
};
exports.getUsersService = getUsersService;
const saveUserNotificationTokenService = async (userId, fcmToken) => {
    await user_model_1_default.update({ fcmToken }, { where: { id: userId } });
    return { fcmToken };
};
exports.saveUserNotificationTokenService = saveUserNotificationTokenService;
const clearUserNotificationTokenService = async (userId) => {
    await user_model_1_default.update({ fcmToken: null }, { where: { id: userId } });
    return { success: true };
};
exports.clearUserNotificationTokenService = clearUserNotificationTokenService;
