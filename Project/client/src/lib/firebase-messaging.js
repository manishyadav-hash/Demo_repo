import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAybYWx2GlDnPz7-2eq-kNUd6E4uWUjQ1s",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "realtimechat-e0016.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "realtimechat-e0016",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "realtimechat-e0016.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "37965238116",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:37965238116:web:d4ce199b1b50e7e609b471",
};

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let messagingPromise = null;

const getMessagingInstance = async () => {
    if (!messagingPromise) {
        messagingPromise = isSupported()
            .then((supported) => {
                if (!supported) return null;
                return getMessaging(firebaseApp);
            })
            .catch(() => null);
    }
    return messagingPromise;
};



const registerMessagingServiceWorker = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        return null;
    }
    return navigator.serviceWorker.register("/firebase-messaging-sw.js");
};

export const getFcmToken = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
        return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
        return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BPgEzxQSECiBh7YCKhmGXbQ5fOl5qtUZpc3evjqfuLLR3eV-_b5BMXJv63DwV3OZQtzQ2wM7MN_qJgJ5FZzzlsE";
    const serviceWorkerRegistration = await registerMessagingServiceWorker();


    return getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration,
    });
};


export const subscribeForegroundMessages = async (handler) => {
    const messaging = await getMessagingInstance();
    if (!messaging) {
        return () => { };
    }
    return onMessage(messaging, handler);
};
