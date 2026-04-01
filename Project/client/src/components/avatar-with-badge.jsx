import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import groupImg from "@/assets/group-img.png";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
const AvatarWithBadge = ({ name, src, isOnline, isGroup = false, size = "w-9 h-9", className, }) => {
    const avatar = isGroup ? groupImg : src || "";
    return (_jsxs("div", { className: "relative\r\n    shrink-0", children: [_jsxs(Avatar, { className: size, children: [_jsx(AvatarImage, { src: avatar }), _jsx(AvatarFallback, { className: cn(`bg-primary/10
         text-primary font-semibold
        `, className && className), children: name?.charAt(0) })] }), isOnline && !isGroup && (_jsx("span", { className: "absolute\r\n          bottom-0\r\n          right-0\r\n          h-2.5 w-2.5 rounded-full\r\n          border-2\r\n          bg-green-500\r\n          " }))] }));
};
export default AvatarWithBadge;
