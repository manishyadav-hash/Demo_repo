"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_config_1 = require("./sequelize.config");
require("../models");
const connectDatabaseWithRetry = async (maxRetries = 10, delayMs = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await sequelize_config_1.sequelize.authenticate();
            await sequelize_config_1.sequelize.sync();
            console.log("Database connected successfully");
            return;
        }
        catch (error) {
            console.error(`Database connection attempt ${attempt}/${maxRetries} failed:`, error.message);
            if (attempt === maxRetries) {
                console.error("Max retries reached. Exiting.");
                process.exit(1);
            }
            const waitTime = delayMs * attempt;
            console.log(`Retrying in ${waitTime}ms...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
    }
};
exports.default = connectDatabaseWithRetry;
