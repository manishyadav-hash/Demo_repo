import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../ui/button";
import { X } from "lucide-react";
const ChatReplyBar = ({ replyTo, currentUserId, onCancel }) => {
    if (!replyTo)
        return null;
    const senderName = replyTo.sender?._id === currentUserId ? "You" : replyTo.sender?.name;
    return (_jsx("div", { className: "absolute bottom-16 left-0 right-0\r\n    bg-card border-t animate-in slide-in-from-bottom\r\n pb-4 px-6\r\n\r\n    ", children: _jsxs("div", { className: "flex flex-1 justify-between mt-2 p-3 text-sm\r\n        border-l-4 border-l-primary\r\n        bg-primary/10 rounded-md shadow-sm\r\n        ", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h5", { className: "font-medium", children: senderName }), replyTo?.image ? (_jsx("p", { className: "text-muted-foreground", children: "\uD83D\uDCF7 Photo" })) : (_jsx("p", { className: "max-w-4xl\r\n            truncate text-ellipsis", children: replyTo.content }))] }), _jsx(Button, { variant: "ghost", size: "icon", onClick: onCancel, className: "shrink-0 siz-6", children: _jsx(X, { size: 14 }) })] }) }));
};
export default ChatReplyBar;
