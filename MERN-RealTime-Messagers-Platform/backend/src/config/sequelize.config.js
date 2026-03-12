"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const env_config_1 = require("./env.config");
exports.sequelize = new sequelize_1.Sequelize(env_config_1.Env.PG_DATABASE, env_config_1.Env.PG_USER, env_config_1.Env.PG_PASSWORD, {
    host: env_config_1.Env.PG_HOST,
    port: Number(env_config_1.Env.PG_PORT),
    dialect: "postgres",
    logging: false,
});

