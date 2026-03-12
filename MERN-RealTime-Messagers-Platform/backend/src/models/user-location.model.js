"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLocationModel = void 0;
const sequelize_1 = require("sequelize");
const sequelize_config_1 = require("../config/sequelize.config");

class UserLocationModel extends sequelize_1.Model {
    toJSON() {
        const values = { ...this.get() };
        if (values.id) {
            values._id = values.id;
        }
        return values;
    }
}

exports.UserLocationModel = UserLocationModel;

UserLocationModel.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: "users",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    latitude: {
        type: sequelize_1.DataTypes.DECIMAL(10, 8),
        allowNull: false,
    },
    longitude: {
        type: sequelize_1.DataTypes.DECIMAL(11, 8),
        allowNull: false,
    },
    address: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    city: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    country: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    isShared: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    lastUpdated: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: sequelize_config_1.sequelize,
    tableName: "user_locations",
    indexes: [
        {
            fields: ["userId"],
        },
        {
            fields: ["latitude", "longitude"],
        },
        {
            fields: ["isShared", "isActive"],
        },
    ],
});

exports.default = UserLocationModel;
