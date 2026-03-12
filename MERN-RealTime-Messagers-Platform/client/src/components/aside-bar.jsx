import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "./theme-provider";
import { isUserOnline } from "@/lib/helper";
import Logo from "./logo";
import { PROTECTED_ROUTES } from "@/routes/routes";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, } from "./ui/dropdown-menu";
import AvatarWithBadge from "./avatar-with-badge";
import { useNavigate } from "react-router-dom";
const AsideBar = () => {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const isOnline = isUserOnline(user?._id);
    return (_jsx("aside", { className: "\r\n  top-0 fixed inset-y-0\r\n  w-11 left-0 z-[9999]\r\n  h-svh bg-primary/85 shadow-sm", children: _jsxs("div", { className: "\r\n       w-full h-full px-1 pt-1 pb-6 flex flex-col\r\n       items-center justify-between", children: [_jsx(Logo, { url: PROTECTED_ROUTES.CHAT, imgClass: "size-7", textClass: "text-white", showText: false }), _jsxs("div", { className: "\r\n         flex flex-col items-center gap-3\r\n        ", children: [_jsx(Button, { variant: "outline", size: "icon", className: "border-0 rounded-full", onClick: () => setTheme(theme === "light" ? "dark" : "light"), children: [_jsx(Sun, { className: "\r\n              h-[1.2rem]\r\n              w-[1.2rem]\r\n              scale-100\r\n              rotate-0\r\n              transition-all dark:scale-0 dark:-rotate-90\r\n            " }), _jsx(Moon, { className: "\r\n             absolute\r\n              h-[1.2rem]\r\n              w-[1.2rem]\r\n              scale-0\r\n              rotate-90\r\n              transition-all dark:scale-100\r\n              dark:-rotate-0\r\n              " })] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("div", { role: "button", children: _jsx(AvatarWithBadge, { name: user?.name || "unKnown", src: user?.avatar || "", isOnline: isOnline, className: "!bg-white" }) }) }), _jsxs(DropdownMenuContent, { className: "w-48 rounded-lg z-[99999]", align: "end", children: [_jsx(DropdownMenuLabel, { children: "My Account" }), _jsx(DropdownMenuItem, { onClick: logout, children: "Logout" })] })] })] })] }) }));
};
export default AsideBar;
