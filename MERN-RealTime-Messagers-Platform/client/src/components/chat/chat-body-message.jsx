import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import AvatarWithBadge from "../avatar-with-badge";
import { formatChatTime } from "@/lib/helper";
import { Button } from "../ui/button";
import { ReplyIcon, Play, Pause } from "lucide-react";
import { useState, useRef } from "react";
import { LocationMessage } from "../location";
const ChatMessageBody = memo(({ message, onReply }) => {
    const { user } = useAuth();
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const userId = user?._id || null;
    const isCurrentUser = message.sender?._id === userId;
    const senderName = isCurrentUser ? "You" : message.sender?.name;
    const replySendername = message.replyTo?.sender?._id === userId
        ? "You"
        : message.replyTo?.sender?.name;
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };
    const handlePlayVoice = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            }
            else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };
    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };
    const handleAudioEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };
    const containerClass = cn("group flex gap-2 py-3 px-4", isCurrentUser && "flex-row-reverse text-left");
    const contentWrapperClass = cn("max-w-[70%]  flex flex-col relative", isCurrentUser && "items-end");
    const messageClass = cn("min-w-[200px] px-3 py-2 text-sm break-words shadow-sm", isCurrentUser
        ? "bg-accent dark:bg-primary/40 rounded-tr-xl rounded-l-xl"
        : "bg-[#F5F5F5] dark:bg-accent rounded-bl-xl rounded-r-xl");
    const replyBoxClass = cn(`mb-2 p-2 text-xs rounded-md border-l-4 shadow-md !text-left`, isCurrentUser
        ? "bg-primary/20 border-l-primary"
        : "bg-gray-200 dark:bg-secondary border-l-[#CC4A31]");
    return (_jsxs("div", { className: containerClass, children: [!isCurrentUser && (_jsx("div", { className: "flex-shrink-0 flex items-start", children: _jsx(AvatarWithBadge, { name: message.sender?.name || "No name", src: message.sender?.avatar || "" }) })), _jsxs("div", { className: contentWrapperClass, children: [_jsxs("div", { className: cn("flex items-center gap-1", isCurrentUser && "flex-row-reverse"), children: [_jsxs("div", { className: messageClass, children: [_jsxs("div", { className: "flex items-center gap-2 mb-0.5 pb-1", children: [_jsx("span", { className: "text-xs font-semibold", children: senderName }), _jsx("span", { className: "text-[11px] text-gray-700 dark:text-gray-300", children: formatChatTime(message?.createdAt) })] }), message.replyTo && (_jsxs("div", { className: replyBoxClass, children: [_jsx("h5", { className: "font-medium", children: replySendername }), _jsx("p", { className: "font-normal text-muted-foreground\r\n                 max-w-[250px]  truncate\r\n                ", children: message?.replyTo?.content ||
                                                    (message?.replyTo?.image ? "📷 Photo" : "") })] })), message?.image && (_jsx("img", { src: message?.image || "", alt: "", className: "rounded-lg max-w-xs" })), message?.voiceUrl && (_jsxs("div", { className: "flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg", children: [_jsx("audio", { ref: audioRef, src: message.voiceUrl, onTimeUpdate: handleTimeUpdate, onLoadedMetadata: handleLoadedMetadata, onEnded: handleAudioEnded }), _jsx(Button, { type: "button", size: "icon", variant: "ghost", onClick: handlePlayVoice, className: "h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0", children: isPlaying ? (_jsx(Pause, { className: "h-4 w-4" })) : (_jsx(Play, { className: "h-4 w-4" })) }), _jsxs("div", { className: "flex items-center gap-1 flex-1", children: [_jsx("div", { className: "flex gap-0.5", children: [...Array(5)].map((_, i) => (_jsx("div", { className: "w-1 bg-gray-400 dark:bg-gray-600 rounded-sm transition-all", style: {
                                                                height: `${isPlaying && currentTime > (duration / 5) * i ? 16 : 12}px`,
                                                            } }, i))) }), _jsxs("span", { className: "text-xs text-gray-600 dark:text-gray-400 ml-2 whitespace-nowrap", children: [formatTime(currentTime), " / ", formatTime(duration)] })] })] })), (message?.locationLatitude && message?.locationLongitude) && _jsx(LocationMessage, { latitude: message.locationLatitude, longitude: message.locationLongitude, address: message.locationAddress }), message.content && _jsx("p", { children: message.content })] }), _jsx(Button, { variant: "outline", size: "icon", onClick: () => onReply(message), className: "flex opacity-0 group-hover:opacity-100\r\n            transition-opacity rounded-full !size-8\r\n            ", children: _jsx(ReplyIcon, { size: 16, className: cn("text-gray-500 dark:text-white !stroke-[1.9]", isCurrentUser && "scale-x-[-1]") }) })] }), message.status && (_jsx("span", { className: "block\r\n           text-[10px] text-gray-400 mt-0.5", children: message.status }))] })] }));
});
ChatMessageBody.displayName = "ChatMessageBody";
export default ChatMessageBody;
