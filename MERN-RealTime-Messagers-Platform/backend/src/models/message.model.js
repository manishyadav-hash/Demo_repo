"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = void 0;
const sequelize_1 = require("sequelize");
const sequelize_config_1 = require("../config/sequelize.config");
class MessageModel extends sequelize_1.Model {
    toJSON() {
        const values = { ...this.get() };
        if (values.id) {
            values._id = values.id;
        }
        return values;
    }
}
exports.MessageModel = MessageModel;
MessageModel.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    chatId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: "chats",
            key: "id",
        },
    },
    senderId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    image: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    voiceUrl: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    locationLatitude: {
        type: sequelize_1.DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },
    locationLongitude: {
        type: sequelize_1.DataTypes.DECIMAL(11, 8),
        allowNull: true,
    },
    locationAddress: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    replyToId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: "messages",
            key: "id",
        },
    },
    seenAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    seenBy: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    reactions: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: sequelize_config_1.sequelize,
    tableName: "messages",
});
exports.default = MessageModel;
