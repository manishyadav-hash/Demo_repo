"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Env = void 0;
const get_env_1 = require("../utils/get-env");
exports.Env = {
    NODE_ENV: (0, get_env_1.getEnv)("NODE_ENV", "development"),
    PORT: (0, get_env_1.getEnv)("PORT", "8000"),
    PG_HOST: (0, get_env_1.getEnv)("PG_HOST", "localhost"),
    PG_PORT: (0, get_env_1.getEnv)("PG_PORT", "5432"),
    PG_USER: (0, get_env_1.getEnv)("PG_USER", "postgres"),
    PG_PASSWORD: (0, get_env_1.getEnv)("PG_PASSWORD"),
    PG_DATABASE: (0, get_env_1.getEnv)("PG_DATABASE", "realtimechat"),
    JWT_SECRET: (0, get_env_1.getEnv)("JWT_SECRET", "secret_jwt"),
    JWT_EXPIRES_IN: (0, get_env_1.getEnv)("JWT_EXPIRES_IN", "15m"),
    FRONTEND_ORIGIN: (0, get_env_1.getEnv)("FRONTEND_ORIGIN", "http://localhost:5173"),
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: (0, get_env_1.getEnvOptional)("CLOUDINARY_CLOUD_NAME"),
    CLOUDINARY_API_KEY: (0, get_env_1.getEnvOptional)("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: (0, get_env_1.getEnvOptional)("CLOUDINARY_API_SECRET"),
    // Firebase (optional in local/dev until configured)
    FIREBASE_PROJECT_ID: (0, get_env_1.getEnvOptional)("FIREBASE_PROJECT_ID"),
    FIREBASE_CLIENT_EMAIL: (0, get_env_1.getEnvOptional)("FIREBASE_CLIENT_EMAIL"),
    FIREBASE_PRIVATE_KEY: (0, get_env_1.getEnvOptional)("FIREBASE_PRIVATE_KEY"),
    FIREBASE_SERVICE_ACCOUNT_PATH: (0, get_env_1.getEnvOptional)("FIREBASE_SERVICE_ACCOUNT_PATH"),
};
