import { memo, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { formatChatTime } from "@/lib/helper";
import AvatarWithBadge from "../avatar-with-badge";
import { Button } from "../ui/button";
import { LocationMessage } from "../location";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
    Check,
    CheckCheck,
    ChevronDown,
    Copy,
    Info,
    Pause,
    Pin,
    Play,
    ReplyIcon,
    SmilePlus,
    Star,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import MessageInfoModal from "./message-info-modal";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const ChatMessageBody = memo(({ message, onReply, isGroup = false }) => {
    const { user } = useAuth();
    const { deleteMessage, reactToMessage, localMessageReactions, singleChat, toggleLocalMessageReaction } = useChat();

    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isSelected, setIsSelected] = useState(false);
    const [isStarred, setIsStarred] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    const userId = user?._id || null;
    const isCurrentUser = message.sender?._id === userId;
    const hasImage = Boolean(message?.image);
    const hasLocation = Boolean(message?.locationLatitude && message?.locationLongitude);
    const senderName = isCurrentUser ? "You" : message.sender?.name;
    const replySendername = message.replyTo?.sender?._id === userId ? "You" : message.replyTo?.sender?.name;
    const isSeen = Boolean(message?.seenAt);
    const messageId = message?._id || message?.id;
    const localSelfReaction = localMessageReactions[messageId] || "";
    const participants = singleChat?.chat?.participants || [];
    const reactions = Array.isArray(message?.reactions)
        ? message.reactions.filter((reaction) => reaction?.userId !== message.sender?._id)
        : [];
    const currentUserReaction = isCurrentUser
        ? localSelfReaction
        : reactions.find((reaction) => reaction?.userId === userId)?.emoji || "";

    const reactionSummary = useMemo(() => {
        const summaryMap = new Map();

        reactions.forEach((reaction) => {
            if (!reaction?.emoji)
                return;
            const currentCount = summaryMap.get(reaction.emoji) || 0;
            summaryMap.set(reaction.emoji, currentCount + 1);
        });

        if (isCurrentUser && localSelfReaction) {
            const currentCount = summaryMap.get(localSelfReaction) || 0;
            summaryMap.set(localSelfReaction, currentCount + 1);
        }

        return Array.from(summaryMap.entries()).map(([emoji, count]) => ({ emoji, count }));
    }, [isCurrentUser, localSelfReaction, reactions]);

    const readers = useMemo(() => {
        const receipts = Array.isArray(message?.seenBy) ? message.seenBy : [];
        return receipts
            .map((receipt) => {
                const participant = participants.find((item) => item._id === receipt?.userId);
                if (!participant) return null;
                return {
                    ...participant,
                    seenAt: receipt?.seenAt,
                };
            })
            .filter(Boolean);
    }, [message?.seenBy, participants]);

    const deliveredTo = useMemo(() => {
        return participants
            .filter((participant) => participant._id !== message.sender?._id)
            .map((participant) => {
                const readReceipt = readers.find((reader) => reader._id === participant._id);
                return {
                    ...participant,
                    seenAt: readReceipt?.seenAt || null,
                };
            });
    }, [message.sender?._id, participants, readers]);

    const handleDelete = async () => {
        if (!window.confirm("Delete this message?")) return;
        const messageId = message?._id || message?.id;
        const messageChatId = message?.chatId || message?.chat?._id;
        await deleteMessage(messageId, messageChatId);
    };

    const handleCopyMessage = async () => {
        const textToCopy = [message?.content, message?.image ? "Photo" : "", message?.voiceUrl ? "Voice message" : ""]
            .filter(Boolean)
            .join("\n")
            .trim();

        if (!textToCopy) {
            toast.info("Nothing to copy from this message");
            return;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            toast.success("Message copied");
        }
        catch (_error) {
            toast.error("Failed to copy message");
        }
    };

    const handleShowMessageInfo = () => {
        if (!isCurrentUser) {
            return;
        }
        setIsInfoOpen(true);
    };

    const handleReaction = async (emoji) => {
        if (isCurrentUser) {
            toggleLocalMessageReaction(messageId, emoji);
            return;
        }
        await reactToMessage(messageId, emoji);
    };

    const formatAudioTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handlePlayVoice = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
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

    const containerClass = cn(
        "group flex gap-2 py-1 first:mt-1 sm:py-2.5 sm:first:mt-2",
        isCurrentUser
            ? "flex-row-reverse pl-4 pr-1 text-left sm:pl-10 sm:pr-3"
            : "pl-1 pr-4 sm:pl-3 sm:pr-10"
    );
    const contentWrapperClass = cn(
        "relative flex flex-col pt-4 md:pt-0",
        (hasImage || hasLocation) ? "max-w-[85%] sm:max-w-[72%]" : "max-w-[70%]",
        isCurrentUser && "items-end"
    );
    const messageClass = cn(
        "relative break-words text-[13px] leading-5 shadow-sm transition-all duration-200 sm:text-sm",
        isSelected && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        isCurrentUser
            ? cn(
                "rounded-tr-xl rounded-l-xl bg-accent dark:bg-primary/40",
                hasImage
                    ? "min-w-[170px] px-2 py-2 pr-2 sm:min-w-[200px] sm:px-3 sm:py-3 sm:pr-3"
                    : "min-w-[150px] px-3 py-2.5 pr-12 sm:min-w-[170px] sm:px-4 sm:py-3 sm:pr-14"
            )
            : "min-w-[170px] rounded-bl-xl rounded-r-xl bg-[#F5F5F5] px-3.5 py-2.5 dark:bg-accent sm:min-w-[200px] sm:px-5 sm:py-4"
    );
    const replyBoxClass = cn(
        "mb-2 p-2 text-xs rounded-md border-l-4 shadow-md !text-left",
        isCurrentUser ? "bg-primary/20 border-l-primary" : "bg-gray-200 dark:bg-secondary border-l-[#CC4A31]"
    );
    const hoverActionsClass = cn(
        "absolute z-20 flex items-center gap-0.5 rounded-full border border-white/10 bg-card/95 p-0.5 shadow-xl backdrop-blur-md transition-all duration-200 sm:gap-1 sm:p-1",
        isCurrentUser
            ? "-top-4 right-1 md:top-2 md:right-full md:mr-3"
            : "-top-4 left-1 md:top-2 md:left-full md:ml-3",
        "opacity-100 pointer-events-auto translate-y-0 md:opacity-0 md:pointer-events-none md:-translate-y-1 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
    );

    return (
        <div className={containerClass}>
            {!isCurrentUser && (
                <div className="flex-shrink-0 flex items-start">
                    <AvatarWithBadge name={message.sender?.name || "No name"} src={message.sender?.avatar || ""} />
                </div>
            )}

            <div className={contentWrapperClass}>
                <div className={cn("relative flex items-center gap-1", isCurrentUser && "flex-row-reverse")}>
                    <div className={hoverActionsClass}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary sm:h-8 sm:w-8"
                                >
                                    <SmilePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                side={isCurrentUser ? "left" : "right"}
                                align="start"
                                className="w-auto rounded-2xl border-white/10 bg-card/95 p-2 shadow-2xl backdrop-blur-md"
                            >
                                <div className="flex items-center gap-1">
                                    {QUICK_REACTIONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-full text-lg transition-transform duration-150 hover:scale-110 hover:bg-primary/10",
                                                currentUserReaction === emoji && "bg-primary/15"
                                            )}
                                            onClick={() => handleReaction(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary sm:h-8 sm:w-8"
                                >
                                    <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isCurrentUser ? "end" : "start"} className="w-48">
                                {isCurrentUser && (
                                    <DropdownMenuItem onClick={handleShowMessageInfo}>
                                        <Info className="h-4 w-4" />
                                        Message info
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => onReply(message)}>
                                    <ReplyIcon className={cn("h-4 w-4", isCurrentUser && "scale-x-[-1]")} />
                                    Reply
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCopyMessage}>
                                    <Copy className="h-4 w-4" />
                                    Copy
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsPinned((value) => !value)}>
                                    <Pin className="h-4 w-4" />
                                    {isPinned ? "Unpin" : "Pin"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsStarred((value) => !value)}>
                                    <Star className="h-4 w-4" />
                                    {isStarred ? "Unstar" : "Star"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsSelected((value) => !value)}>
                                    <Check className="h-4 w-4" />
                                    {isSelected ? "Unselect" : "Select"}
                                </DropdownMenuItem>
                                {isCurrentUser && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleDelete} variant="destructive">
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className={messageClass}>
                        {(isPinned || isStarred) && (
                            <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                                {isPinned && (
                                    <span className="inline-flex items-center gap-1">
                                        <Pin className="h-3 w-3" />
                                        Pinned
                                    </span>
                                )}
                                {isStarred && (
                                    <span className="inline-flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-current" />
                                        Starred
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
                            <span className="block py-0.5 text-[11px] font-bold leading-5 sm:py-1 sm:text-sm sm:leading-loose">{senderName}</span>
                            <span className="translate-y-[1px] text-[9px] text-gray-700 dark:text-gray-300 sm:translate-y-[2px] sm:text-xs">{formatChatTime(message?.createdAt)}</span>
                        </div>

                        {message.replyTo && (
                            <div className={replyBoxClass}>
                                <h5 className="font-medium">{replySendername}</h5>
                                <p className="font-normal text-muted-foreground max-w-[250px] truncate">
                                    {message?.replyTo?.content || (message?.replyTo?.image ? "📷 Photo" : "")}
                                </p>
                            </div>
                        )}

                        {message?.image && (
                            <img
                                src={message?.image || ""}
                                alt="Shared image"
                                className="block h-auto w-full max-w-[240px] rounded-lg object-contain sm:max-w-xs"
                            />
                        )}

                        {message?.voiceUrl && (
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                                <audio
                                    ref={audioRef}
                                    src={message.voiceUrl}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onEnded={handleAudioEnded}
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={handlePlayVoice}
                                    className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
                                >
                                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                                <div className="flex items-center gap-1 flex-1">
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-gray-400 dark:bg-gray-600 rounded-sm transition-all"
                                                style={{ height: `${isPlaying && currentTime > (duration / 5) * i ? 16 : 12}px` }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-2 whitespace-nowrap">
                                        {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {message?.locationLatitude && message?.locationLongitude && (
                            <LocationMessage
                                latitude={message.locationLatitude}
                                longitude={message.locationLongitude}
                                address={message.locationAddress}
                            />
                        )}

                        {message.content && <p className="text-[13px] leading-5 sm:text-sm sm:leading-6">{message.content}</p>}

                        {reactionSummary.length > 0 && (
                            <div className={cn(
                                "absolute -bottom-3 flex items-center gap-1 rounded-full border border-white/10 bg-card px-2 py-1 text-xs shadow-lg",
                                isCurrentUser ? "right-3" : "left-3"
                            )}>
                                {reactionSummary.map(({ emoji, count }) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => handleReaction(emoji)}
                                        className={cn(
                                            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-colors hover:bg-primary/10",
                                            currentUserReaction === emoji && "bg-primary/10 text-primary"
                                        )}
                                    >
                                        <span>{emoji}</span>
                                        {count > 1 && <span>{count}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <span className="mt-0.5 text-[10px] text-gray-400 inline-flex items-center gap-1">
                    {message.status || ""}
                    {!message.status && isCurrentUser && !isGroup && (
                        isSeen ? <CheckCheck className="h-3.5 w-3.5 text-sky-500" /> : <Check className="h-3.5 w-3.5" />
                    )}
                </span>
            </div>
            {isCurrentUser && (
                <MessageInfoModal
                    open={isInfoOpen}
                    onClose={() => setIsInfoOpen(false)}
                    message={message}
                    readers={readers}
                    deliveredTo={deliveredTo}
                />
            )}
        </div>
    );
});

ChatMessageBody.displayName = "ChatMessageBody";
export default ChatMessageBody;
