"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModel = void 0;
const sequelize_1 = require("sequelize");
const sequelize_config_1 = require("../config/sequelize.config");
class ChatModel extends sequelize_1.Model {
    toJSON() {
        const values = { ...this.get() };
        if (values.id) {
            values._id = values.id;
        }
        return values;
    }
}
exports.ChatModel = ChatModel;
ChatModel.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    isGroup: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    groupName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
    },
    lastMessageId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: "messages",
            key: "id",
        },
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: sequelize_config_1.sequelize,
    tableName: "chats",
});

exports.default = ChatModel;
