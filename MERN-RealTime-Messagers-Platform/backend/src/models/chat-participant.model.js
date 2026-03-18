"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatParticipantModel = void 0;
const sequelize_1 = require("sequelize");
const sequelize_config_1 = require("../config/sequelize.config");
class ChatParticipantModel extends sequelize_1.Model {
}
exports.ChatParticipantModel = ChatParticipantModel;
ChatParticipantModel.init({
    chatId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
}, {
    sequelize: sequelize_config_1.sequelize,
    tableName: "chat_participants",
    timestamps: false,
});

exports.default = ChatParticipantModel;

