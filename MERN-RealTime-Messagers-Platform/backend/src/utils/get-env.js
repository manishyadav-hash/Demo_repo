"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvOptional = exports.getEnv = void 0;
const getEnv = (key, defaultValue = "") => {
    const val = process.env[key] ?? defaultValue;
    if (!val)
        throw new Error("Missing env variable: " + key);
    return val;
};
exports.getEnv = getEnv;
const getEnvOptional = (key) => {
    const val = process.env[key];
    return val ? val : undefined;
};
exports.getEnvOptional = getEnvOptional;
