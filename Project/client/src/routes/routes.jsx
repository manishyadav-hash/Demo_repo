import { jsx as _jsx } from "react/jsx-runtime";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import Chat from "@/pages/chat";
import SingleChat from "@/pages/chat/chatId";
import Discover from "@/pages/discover";
export const AUTH_ROUTES = {
    SIGN_IN: "/",
    SIGN_UP: "/sign-up",
};
export const PROTECTED_ROUTES = {
    CHAT: "/chat",
    SINGLE_CHAT: "/chat/:chatId",
    DISCOVER: "/discover",
};
export const authRoutesPaths = [
    {
        path: AUTH_ROUTES.SIGN_IN,
        element: _jsx(SignIn, {}),
    },
    {
        path: AUTH_ROUTES.SIGN_UP,
        element: _jsx(SignUp, {}),
    },
];
export const protectedRoutesPaths = [
    {
        path: PROTECTED_ROUTES.CHAT,
        element: _jsx(Chat, {}),
    },
    {
        path: PROTECTED_ROUTES.SINGLE_CHAT,
        element: _jsx(SingleChat, {}),
    },
    {
        path: PROTECTED_ROUTES.DISCOVER,
        element: _jsx(Discover, {}),
    },
];
export const isAuthRoute = (pathname) => {
    return Object.values(AUTH_ROUTES).includes(pathname);
};
