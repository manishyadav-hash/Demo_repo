"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const sequelize_1 = require("sequelize");
const sequelize_config_1 = require("../config/sequelize.config");
const bcrypt_1 = require("../utils/bcrypt");
class UserModel extends sequelize_1.Model {
    toJSON() {
        const values = { ...this.get() };
        if (values.id) {
            values._id = values.id;
        }
        delete values.password;
        return values;
    }
}
exports.UserModel = UserModel;
UserModel.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    avatar: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: sequelize_config_1.sequelize,
    tableName: "users",
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await (0, bcrypt_1.hashValue)(user.password);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed("password")) {
                user.password = await (0, bcrypt_1.hashValue)(user.password);
            }
        },
    },
});
UserModel.prototype.comparePassword = async function (value) {
    return (0, bcrypt_1.compareValue)(value, this.password);
};
exports.default = UserModel;
