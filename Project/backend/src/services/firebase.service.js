const fs_1 = require("fs");
const admin = require("firebase-admin");
const env_config_1 = require("../config/env.config");
let firebaseApp = undefined;

const parseServiceAccountFromEnv = () => {
    const projectId = env_config_1.Env.FIREBASE_PROJECT_ID;
    const clientEmail = env_config_1.Env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = env_config_1.Env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKeyRaw) {
        return null;
    }
    return {
        projectId,
        clientEmail,
        privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
    };
};
  

 


const parseServiceAccountFromFile = () => {
    const accountPath = env_config_1.Env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!accountPath) {
        return null;
    }
    try {
        const raw = (0, fs_1.readFileSync)(accountPath, "utf8");
        return JSON.parse(raw);
    }
    catch (error) {
        console.warn("Failed to read FIREBASE_SERVICE_ACCOUNT_PATH:", error?.message || error);
        return null;
    }
};

const getFirebaseApp = () => {
    if (firebaseApp !== undefined) {
        return firebaseApp;
    }
    if (admin.apps.length > 0) {
        firebaseApp = admin.app();
        return firebaseApp;
    }
    const serviceAccount = parseServiceAccountFromFile() || parseServiceAccountFromEnv();
    if (!serviceAccount) {
        console.warn("Firebase push is disabled: missing service account configuration.");
        firebaseApp = null;
        return firebaseApp;
    }
    try {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
    catch (error) {
        console.warn("Firebase initialize failed:", error?.message || error);
        firebaseApp = null;
    }
    return firebaseApp;
};
//////////////////////////////////////////////////////////////////////////////////

const sendPushToTokens = async ({ tokens, title, body, data = {} }) => {
    const app = getFirebaseApp();
    const uniqueTokens = Array.from(new Set((tokens || []).filter(Boolean)));
    if (!app || uniqueTokens.length === 0) {
        return {
            sentCount: 0,
            failedCount: 0,
            invalidTokens: [],
        };
    }

    const messaging = admin.messaging(app);
    const dataPayload = {
        ...Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key, String(value ?? "")])),
        title: String(title || "New message"),
        body: String(body || "You received a new message"),
    };

    const chunkSize = 500;
    let totalSentCount = 0;
    let totalFailedCount = 0;
    const allInvalidTokens = [];

    // Chunk the tokens into arrays of 500 (Firebase limit)
    for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
        const tokenChunk = uniqueTokens.slice(i, i + chunkSize);

        try {
            const response = await messaging.sendEachForMulticast({
                tokens: tokenChunk,
                notification: {
                    title: String(title || "New message"),
                    body: String(body || "You received a new message"),
                },
                data: dataPayload,
                webpush: {
                    headers: {
                        Urgency: "high",
                    },
                    notification: {
                        title: String(title || "New message"),
                        body: String(body || "You received a new message"),
                        tag: String(data?.messageId || data?.chatId || "chat-message"),
                        renotify: false,
                    },
                    fcmOptions: {
                        link: "/chat",
                    },
                },
            });

            

            totalSentCount += response.successCount;
            totalFailedCount += response.failureCount;

            response.responses.forEach((item, index) => {
                if (!item.success) {
                    const code = item.error?.code || "";
                    if (code.includes("registration-token-not-registered") || code.includes("invalid-argument")) {
                        allInvalidTokens.push(tokenChunk[index]);
                    }
                }
            });
        } catch (error) {
            console.warn(`Failed to send push chunk ${Math.floor(i / chunkSize) + 1}`, error?.message || error);
        }
    }

    return {
        sentCount: totalSentCount,
        failedCount: totalFailedCount,
        invalidTokens: allInvalidTokens,
    };
};
exports.sendPushToTokens = sendPushToTokens;
