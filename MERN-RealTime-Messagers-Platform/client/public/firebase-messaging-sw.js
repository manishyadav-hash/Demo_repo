/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyAybYWx2GlDnPz7-2eq-kNUd6E4uWUjQ1s",
    authDomain: "realtimechat-e0016.firebaseapp.com",
    projectId: "realtimechat-e0016",
    storageBucket: "realtimechat-e0016.firebasestorage.app",
    messagingSenderId: "37965238116",
    appId: "1:37965238116:web:d4ce199b1b50e7e609b471",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    // If Firebase already supplies a notification payload, avoid rendering a second popup.
    if (payload?.notification?.title || payload?.notification?.body) {
        return;
    }

    const title = payload?.data?.senderName || payload?.data?.title || "New message";
    const options = {
        body: payload?.data?.messageText || payload?.data?.body || "You received a new message",
        data: payload?.data || {},
        tag: payload?.data?.messageId || payload?.data?.chatId || "chat-message",
        renotify: false,
    };


    self.registration.showNotification(title, options);
});

