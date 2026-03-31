const db_1 = require("../lib/db");
const firebase_service_1 = require("./firebase.service");

/**
 * Optimized Batch Push Service
 * - Uses Keyset Pagination for memory efficiency.
 * - Uses Parallel Processing (Concurrency) for speed.
 * - Reduces total time from minutes to seconds.
 */
const sendBatchPushByLanguageService = async (language, title, body) => {
    let lastId = 0;
    let hasMoreUsers = true;
    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let totalInvalid = 0;


    const activePromises = [];
    const CONCURRENCY_LIMIT = 200; // Unleashing maximum parallel threads (100,000 users at once)

    console.log(`🚀 Starting EXTREME-SPEED batch push for Language: ${language}`);
    const overallTimer = `Total Processing Time (${language})`;
    console.time(overallTimer);

    let batchNumber = 1;
    const startTime = Date.now();

    // Create tracking record in DB
    const broadcastLogResult = await (0, db_1.query)(`
        INSERT INTO fcm_broadcast_history (language, title, body, status, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'processing', NOW(), NOW())
        RETURNING id
    `, [language, title, body]);
    const broadcastId = broadcastLogResult.rows[0]?.id;
    
    while (hasMoreUsers) {
        const devicesBatchResult = await (0, db_1.query)(`
            SELECT id, "fcmToken"
            FROM fcm_devices
            WHERE language = $1
              AND id > $2
              AND "fcmToken" IS NOT NULL
            ORDER BY id ASC
            LIMIT 500
        `, [language, lastId]);
        const devicesBatch = devicesBatchResult.rows;

        if (devicesBatch.length === 0) {
            hasMoreUsers = false;
            break;
        }

        totalProcessed += devicesBatch.length;
        const tokensChunk = devicesBatch.map((device) => device.fcmToken);
        lastId = devicesBatch[devicesBatch.length - 1].id;

        // Step: Track statistics for each parallel batch
        const sendTask = (async (bNum, tokens) => {
            try {
                const pushResult = await (0, firebase_service_1.sendPushToTokens)({
                    tokens,
                    title,
                    body,
                    data: { language, type: "batch_announcement" }
                });
                // Atomic updates (JS is single-threaded for +=)
                totalSent += pushResult.sentCount;
                totalFailed += pushResult.failedCount;
                totalInvalid += pushResult.invalidTokens.length;
                console.log(`✅ Batch ${bNum} done.`);
            } catch (err) {
                console.error(`❌ Batch ${bNum} error:`, err.message);
                totalFailed += tokens.length;
            }
        })(batchNumber, tokensChunk);

        activePromises.push(sendTask);
        batchNumber++;

        if (activePromises.length % CONCURRENCY_LIMIT === 0) {
            await Promise.all(activePromises.slice(-CONCURRENCY_LIMIT));
        }
    }
    
    await Promise.all(activePromises);

    const completionTimeMs = Date.now() - startTime;
    
    // Update tracking record with final stats
    if (broadcastId) {
        await (0, db_1.query)(`
            UPDATE fcm_broadcast_history
            SET "totalProcessed" = $1,
                "totalSent" = $2,
                "totalFailed" = $3,
                "totalInvalid" = $4,
                status = 'completed',
                "completionTimeMs" = $5,
                "updatedAt" = NOW()
            WHERE id = $6
        `, [totalProcessed, totalSent, totalFailed, totalInvalid, completionTimeMs, broadcastId]);
    }

    console.timeEnd(overallTimer);
    console.log(`🏁 Done. Processed: ${totalProcessed}, Sent: ${totalSent}`);
    return {
        totalProcessed,
        totalSent,
        totalFailed,
        totalInvalid,
        processingTime: "Optimized Parallel"
    };
};


exports.sendBatchPushByLanguageService = sendBatchPushByLanguageService;

const getBroadcastHistoryService = async () => {
    const result = await (0, db_1.query)(`
        SELECT id,
               language,
               title,
               body,
               "totalProcessed",
               "totalSent",
               "totalFailed",
               "totalInvalid",
               status,
               "completionTimeMs",
               "createdAt",
               "updatedAt"
        FROM fcm_broadcast_history
        ORDER BY "createdAt" DESC
        LIMIT 50
    `);
    return result.rows;
};
exports.getBroadcastHistoryService = getBroadcastHistoryService;

