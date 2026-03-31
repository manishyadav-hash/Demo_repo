require("dotenv").config();
const crypto = require("crypto");
const { withClient } = require("../lib/db");

const generateRandomMobile = () => {
    // Starting from 6, 7, 8, 9 as requested for indian mobiles
    const startDigits = ['6', '7', '8', '9'];
    let num = startDigits[Math.floor(Math.random() * startDigits.length)];
    for (let i = 0; i < 9; i++) {
        num += Math.floor(Math.random() * 10).toString();
    }
    return num;
};

const generateRandomToken = () => {
    return "fcm_dummy_" + crypto.randomBytes(32).toString('hex');
};

// 5 languages as requested
const languages = ["Hindi", "English", "Tamil", "Telugu", "Marathi"];

// Random application name
const apps = ["ChatAppPro", "MessagerPlatform", "SuperChat", "CommunicateV2"];

const seedFcmDevices = async () => {
    try {
        console.log("Connecting and syncing database table...");
        await withClient(async (client) => {
            await client.query("SELECT 1");
            await client.query(`
                CREATE TABLE IF NOT EXISTS fcm_devices (
                    id SERIAL PRIMARY KEY,
                    "mobileNumber" VARCHAR(10) NOT NULL,
                    "fcmToken" TEXT NOT NULL,
                    "applicationName" VARCHAR(255) NOT NULL,
                    language VARCHAR(255) NOT NULL
                )
            `);
            await client.query("CREATE INDEX IF NOT EXISTS idx_fcm_devices_language ON fcm_devices (language)");
        });
        
        console.log("Starting to seed 1,00,000 FCM devices... This will take a moment.");
        
        // Let's clear the old ones if we run this script multiple times
        await withClient(async (client) => {
            await client.query("TRUNCATE TABLE fcm_devices RESTART IDENTITY");
        });
        
        // We do it in chunks of 5000 so Node.js doesn't run out of memory
        const BATCH_SIZE = 5000;
        const TOTAL_RECORDS = 100000;

        for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
            const batch = [];
            for (let j = 0; j < BATCH_SIZE; j++) {
                batch.push({
                    mobileNumber: generateRandomMobile(),
                    fcmToken: generateRandomToken(),
                    applicationName: apps[Math.floor(Math.random() * apps.length)],
                    language: languages[Math.floor(Math.random() * languages.length)],
                });
            }
            
            const mobileNumbers = batch.map((item) => item.mobileNumber);
            const fcmTokens = batch.map((item) => item.fcmToken);
            const applicationNames = batch.map((item) => item.applicationName);
            const batchLanguages = batch.map((item) => item.language);

            await withClient(async (client) => {
                await client.query(`
                    INSERT INTO fcm_devices ("mobileNumber", "fcmToken", "applicationName", language)
                    SELECT *
                    FROM unnest($1::varchar[], $2::text[], $3::varchar[], $4::varchar[])
                `, [mobileNumbers, fcmTokens, applicationNames, batchLanguages]);
            });
            console.log(`✅ Inserted batch: ${i + BATCH_SIZE} / ${TOTAL_RECORDS} rows`);
        }
        
        console.log("🚀 Successfully seeded exactly 1 Lakh (100,000) records!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to seed:", error);
        process.exit(1);
    }
};

seedFcmDevices();
