import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getOtherUserAndGroup } from "@/lib/helper";
import { PROTECTED_ROUTES } from "@/routes/routes";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AvatarWithBadge from "../avatar-with-badge";
import CallMenu from "./call-menu";
import UserDistanceBadge from "./user-distance-badge";
import LocationDetailsPanel from "./location-details-panel";
import LocationPermissionPrompt from "./location-permission-prompt";
const ChatHeader = ({ chat, currentUserId, onVoiceCall, onVideoCall, }) => {
    const navigate = useNavigate();
    const { name, subheading, avatar, isOnline, isGroup } = getOtherUserAndGroup(chat, currentUserId);
    const otherUser = chat?.participants?.find((participant) => participant?._id !== currentUserId);
    return (_jsxs("div", { className: "sticky top-0 z-50 space-y-2 bg-card border-b border-border", children: [_jsxs("div", { className: "flex items-center gap-4 border-b border-border px-2", children: [_jsxs("div", { className: "h-14 px-4 flex items-center shrink-0", children: [_jsx("div", { children: _jsx(ArrowLeft, { className: "w-5 h-5 inline-block lg:hidden\r\n          text-muted-foreground cursor-pointer\r\n          mr-2\r\n          ", onClick: () => navigate(PROTECTED_ROUTES.CHAT) }) }), _jsx(AvatarWithBadge, { name: name, src: avatar, isGroup: isGroup, isOnline: isOnline }), _jsxs("div", { className: "ml-2 flex flex-col", children: [_jsx("h5", { className: "font-semibold", children: name }), _jsx("p", { className: `text-sm ${isOnline ? "text-green-500" : "text-muted-foreground"}`, children: subheading }), !isGroup && otherUser?._id && (_jsx(UserDistanceBadge, { otherUserId: otherUser._id, currentUserId: currentUserId }))] })] }), _jsx("div", { className: "flex-1", children: _jsx("div", { className: `text-center
            py-4 h-full
            border-b-2
            border-primary
            font-medium
            text-primary`, children: "Chat" }) }), _jsx("div", { className: "pr-2", children: _jsx(CallMenu, { name: name, disabled: isGroup, onVoiceCall: onVoiceCall, onVideoCall: onVideoCall }) })] }), _jsx("div", { className: "px-4 py-2", children: _jsx(LocationPermissionPrompt, {}) }), !isGroup && otherUser?._id && (_jsx("div", { className: "px-4 pb-2", children: _jsx(LocationDetailsPanel, { otherUserId: otherUser._id, currentUserId: currentUserId }) }))] }));
};
export default ChatHeader;
