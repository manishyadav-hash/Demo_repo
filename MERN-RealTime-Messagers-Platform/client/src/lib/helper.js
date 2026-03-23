import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { v4 as uuidv4 } from "uuid";

const resolveId = (entity) => entity?._id || entity?.id || "";

export const isUserOnline = (userId, onlineUsers = []) => {
    if (!userId)
        return false;
    return onlineUsers.includes(String(userId));
};
export const getOtherUserAndGroup = (chat, currentUserId, onlineUsers = []) => {
    const isGroup = chat?.isGroup;
    if (isGroup) {
        return {
            name: chat.groupName || "Unnamed Group",
            subheading: `${chat.participants.length} members`,
            avatar: "",
            isGroup,
        };
    }
    const normalizedCurrentUserId = String(currentUserId || "");
    const other = chat?.participants.find((p) => String(resolveId(p)) !== normalizedCurrentUserId);
    const isOnline = isUserOnline(resolveId(other), onlineUsers);
    return {
        name: other?.name || "Unknown",
        subheading: isOnline ? "Online" : "Offline",
        avatar: other?.avatar || "",
        isGroup: false,
        isOnline,
        isAI: other?.isAI || false,
        otherUserId: resolveId(other),
    };
};
export const formatChatTime = (date) => {
    if (!date)
        return "";
    const newDate = new Date(date);
    if (isNaN(newDate.getTime()))
        return "Invalid date";
    if (isToday(newDate))
        return format(newDate, "h:mm a");
    if (isYesterday(newDate))
        return "Yesterday";
    if (isThisWeek(newDate))
        return format(newDate, "EEEE");
    return format(newDate, "M/d");
};
export function generateUUID() {
    return uuidv4();
}
