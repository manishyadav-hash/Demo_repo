import { toast } from "sonner";
import { API } from "@/lib/axios-client";
import { getFcmToken, subscribeForegroundMessages } from "@/lib/firebase-messaging";

let foregroundBound = false;
let lastRegisteredToken = null;
let permissionWarned = false;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const registerPushTokenWithServer = async () => {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const token = await getFcmToken();
            if (!token) {
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied" && !permissionWarned) {
                    permissionWarned = true;
                    toast.error("Notifications are blocked in this browser. Enable notifications for localhost to receive alerts.");
                }
                return;
            }

            if (token === lastRegisteredToken) {
                return;
            }

            await API.post("/user/notification-token", { fcmToken: token });
            lastRegisteredToken = token;
            return;
        }
        catch (error) {
            console.warn(`Failed to register push token (attempt ${attempt}/${maxAttempts})`, error?.message || error);
            if (attempt < maxAttempts) {
                await wait(500 * attempt);
                continue;
            }
        }
    }
};

export const removePushTokenFromServer = async () => {
    try {
        await API.delete("/user/notification-token");
        lastRegisteredToken = null;
    }
    catch (error) {
        console.warn("Failed to remove push token", error?.message || error);
    }
};


export const bindForegroundPushListener = async () => {
    if (foregroundBound) {
        return;
    }

    await subscribeForegroundMessages((payload) => {
        const title = payload?.data?.senderName || payload?.notification?.title || payload?.data?.title || "New message";
        const body = payload?.data?.messageText || payload?.notification?.body || payload?.data?.body || "You received a new message";

        const isTabHidden = typeof document !== "undefined" && document.hidden;
        if (isTabHidden) {
            // Hidden-tab notifications are handled by service worker/background FCM.
            return;
        }

        toast.info(`${title}: ${body}`);
    });

    foregroundBound = true;
};

