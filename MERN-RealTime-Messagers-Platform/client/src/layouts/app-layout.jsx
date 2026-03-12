import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import AppWrapper from "@/components/app-wrapper";
import ChatList from "@/components/chat/chat-list";
import useChatId from "@/hooks/use-chat-id";
import { cn } from "@/lib/utils";
import { Outlet } from "react-router-dom";
const AppLayout = () => {
    const chatId = useChatId();
    return (_jsx(AppWrapper, { children: _jsxs("div", { className: "h-full", children: [_jsx("div", { className: cn(chatId ? "hidden lg:block" : "block"), children: _jsx(ChatList, {}) }), _jsx("div", { className: cn("lg:!pl-95 pl-7", !chatId ? "hidden lg:block" : "block"), children: _jsx(Outlet, {}) })] }) }));
};
export default AppLayout;
