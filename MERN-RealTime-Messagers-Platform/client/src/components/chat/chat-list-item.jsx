import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getOtherUserAndGroup } from "@/lib/helper";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import AvatarWithBadge from "../avatar-with-badge";
import { formatChatTime } from "../../lib/helper";
const ChatListItem = ({ chat, currentUserId, onClick }) => {
    const { pathname } = useLocation();
    const { lastMessage, createdAt } = chat;
    const { name, avatar, isOnline, isGroup } = getOtherUserAndGroup(chat, currentUserId);
    const getLastMessageText = () => {
        if (!lastMessage) {
            return isGroup
                ? chat.createdBy === currentUserId
                    ? "Group created"
                    : "You were added"
                : "Send a message";
        }
        if (lastMessage.image)
            return "📷 Photo";
        if (isGroup && lastMessage.sender) {
            return `${lastMessage.sender._id === currentUserId
                ? "You"
                : lastMessage.sender.name}: ${lastMessage.content}`;
        }
        return lastMessage.content;
    };
    return (_jsxs("button", { onClick: onClick, className: cn(`w-full flex items-center gap-2 p-2 rounded-sm
         hover:bg-sidebar-accent transition-colors text-left`, pathname.includes(chat._id) && "!bg-sidebar-accent"), children: [_jsx(AvatarWithBadge, { name: name, src: avatar, isGroup: isGroup, isOnline: isOnline }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "\r\n         flex items-center justify-between mb-0.5\r\n        ", children: [_jsx("h5", { className: "text-sm font-semibold truncate", children: name }), _jsx("span", { className: "text-xs\r\n           ml-2 shrink-0 text-muted-foreground\r\n          ", children: formatChatTime(lastMessage?.updatedAt || createdAt) })] }), _jsx("p", { className: "text-xs truncate text-muted-foreground -mt-px", children: getLastMessageText() })] })] }));
};
export default ChatListItem;
