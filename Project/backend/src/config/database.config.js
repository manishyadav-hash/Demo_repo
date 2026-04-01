const db_1 = require("../lib/db");

const bootstrapSchema = async (client) => {
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            "phoneNumber" VARCHAR(255),
            password VARCHAR(255) NOT NULL,
            avatar VARCHAR(255),
            "fcmToken" TEXT,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "chatId" UUID,
            "senderId" UUID REFERENCES users(id),
            content TEXT,
            image TEXT,
            "voiceUrl" TEXT,
            "locationLatitude" DECIMAL(10, 8),
            "locationLongitude" DECIMAL(11, 8),
            "locationAddress" VARCHAR(255),
            "replyToId" UUID,
            "seenAt" TIMESTAMPTZ,
            "seenBy" JSONB NOT NULL DEFAULT '[]'::jsonb,
            reactions JSONB NOT NULL DEFAULT '[]'::jsonb,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS chats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "isGroup" BOOLEAN NOT NULL DEFAULT false,
            "groupName" VARCHAR(255),
            "createdBy" UUID NOT NULL REFERENCES users(id),
            "lastMessageId" UUID REFERENCES messages(id),
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS chat_participants (
            "chatId" UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
            "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            PRIMARY KEY ("chatId", "userId")
        )
    `);

    await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'messages_chat_fk'
            ) THEN
                ALTER TABLE messages
                ADD CONSTRAINT messages_chat_fk
                FOREIGN KEY ("chatId") REFERENCES chats(id) ON DELETE CASCADE;
            END IF;
        END$$;
    `);

    await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'messages_reply_fk'
            ) THEN
                ALTER TABLE messages
                ADD CONSTRAINT messages_reply_fk
                FOREIGN KEY ("replyToId") REFERENCES messages(id) ON DELETE SET NULL;
            END IF;
        END$$;
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS user_locations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            address VARCHAR(255),
            city VARCHAR(255),
            country VARCHAR(255),
            "isShared" BOOLEAN NOT NULL DEFAULT false,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "lastUpdated" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS fcm_devices (
            id SERIAL PRIMARY KEY,
            "mobileNumber" VARCHAR(10) NOT NULL,
            "fcmToken" TEXT NOT NULL,
            "applicationName" VARCHAR(255) NOT NULL,
            language VARCHAR(255) NOT NULL
        )
    `);

    await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fcm_broadcast_status') THEN
                CREATE TYPE fcm_broadcast_status AS ENUM ('processing', 'completed', 'failed');
            END IF;
        END$$;
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS fcm_broadcast_history (
            id SERIAL PRIMARY KEY,
            language VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            "totalProcessed" INTEGER NOT NULL DEFAULT 0,
            "totalSent" INTEGER NOT NULL DEFAULT 0,
            "totalFailed" INTEGER NOT NULL DEFAULT 0,
            "totalInvalid" INTEGER NOT NULL DEFAULT 0,
            status fcm_broadcast_status NOT NULL DEFAULT 'processing',
            "completionTimeMs" INTEGER,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "phoneNumber" VARCHAR(255)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "fcmToken" TEXT');

    await client.query('CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants ("userId")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages ("chatId")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages ("senderId")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats ("updatedAt" DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations ("userId")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_locations_lat_long ON user_locations (latitude, longitude)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_locations_shared_active ON user_locations ("isShared", "isActive")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_fcm_devices_language ON fcm_devices (language)');
};

const connectDatabaseWithRetry = async (maxRetries = 10, delayMs = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await (0, db_1.withClient)(async (client) => {
                await client.query("SELECT 1");
                await bootstrapSchema(client);
            });
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
