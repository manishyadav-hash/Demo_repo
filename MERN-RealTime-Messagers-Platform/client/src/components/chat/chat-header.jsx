import { useEffect, useState } from "react";
import { getOtherUserAndGroup } from "@/lib/helper";
import { PROTECTED_ROUTES } from "@/routes/routes";
import { ArrowLeft, Info, LogOut, MoreVertical, UserPlus, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AvatarWithBadge from "../avatar-with-badge";
import CallMenu from "./call-menu";
import { AddMemberPopover } from "./add-member-popover";
import { Button } from "@/components/ui/button";
import LiveLocationPanel from "./live-location-panel";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import GroupInfoPanel from "./group-info-panel";
import { useSocket } from "@/hooks/use-socket";

const resolveId = (entity) => entity?._id || entity?.id || null;

const ChatHeader = ({
    chat,
    currentUserId,
    onVoiceCall,
    onVideoCall,
    onExitGroup,
    isLeavingGroup = false,
    typingText = "",
}) => {
    const { onlineUsers } = useSocket();
    const navigate = useNavigate();
    const [typingDots, setTypingDots] = useState(0);
    const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
    const [isLocationOpen, setIsLocationOpen] = useState(false);

    const { name, subheading, avatar, isOnline, isGroup } = getOtherUserAndGroup(
        chat,
        currentUserId,
        onlineUsers
    );

    const otherUser = chat?.participants?.find(
        (participant) => resolveId(participant) !== currentUserId
    );

    useEffect(() => {
        if (!typingText) {
            setTypingDots(0);
            return;
        }

        const interval = setInterval(() => {
            setTypingDots((prev) => (prev + 1) % 4);
        }, 350);

        return () => clearInterval(interval);
    }, [typingText]);

    useEffect(() => {
        setIsGroupInfoOpen(false);
        setIsLocationOpen(false);
    }, [chat?._id]);

    const handleExitGroup = async () => {
        const confirmed = window.confirm(`Exit ${name}?`);
        if (!confirmed) return;
        await onExitGroup?.();
    };

    return (
        <>
            <div className="sticky top-0 z-50 space-y-2 border-b border-border bg-card/95 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="rounded-full lg:hidden"
                            onClick={() => navigate(PROTECTED_ROUTES.CHAT)}
                            aria-label="Back to chats"
                        >
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </Button>

                        <button
                            type="button"
                            className="flex min-w-0 items-center gap-3 text-left"
                            onClick={() => isGroup && setIsGroupInfoOpen(true)}
                        >
                            <AvatarWithBadge
                                name={name}
                                src={avatar}
                                isGroup={isGroup}
                                isOnline={isOnline}
                                size="h-11 w-11"
                            />
                            <div className="min-w-0">
                                <h5 className="truncate text-sm font-semibold text-foreground sm:text-base">
                                    {name}
                                </h5>
                                <p
                                    className={`truncate text-xs sm:text-sm ${
                                        typingText
                                            ? "text-primary"
                                            : isOnline
                                                ? "text-green-500"
                                                : "text-muted-foreground"
                                    }`}
                                >
                                    {typingText ? (
                                        <span className="inline-flex items-center gap-1 transition-opacity duration-200">
                                            {typingText}
                                            <span className="inline-block min-w-4 text-left">{".".repeat(typingDots)}</span>
                                        </span>
                                    ) : (
                                        subheading
                                    )}
                                </p>

                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        {isGroup ? (
                            <>
                                <AddMemberPopover
                                    chatId={chat?._id}
                                    currentMembers={chat?.participants || []}
                                >
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="rounded-full"
                                        aria-label="Add member"
                                    >
                                        <UserPlus className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </AddMemberPopover>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="rounded-full"
                                            aria-label="Open group menu"
                                        >
                                            <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => setIsGroupInfoOpen(true)}>
                                            <Info className="h-4 w-4" />
                                            Group info
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleExitGroup} variant="destructive">
                                            <LogOut className="h-4 w-4" />
                                            Exit group
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                {otherUser?._id && (
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className={`rounded-full transition-colors ${
                                            isLocationOpen
                                                ? "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
                                                : "text-muted-foreground"
                                        }`}
                                        onClick={() => setIsLocationOpen((v) => !v)}
                                        aria-label="Toggle live location"
                                    >
                                        <MapPin className="h-5 w-5" />
                                    </Button>
                                )}
                                <CallMenu
                                    name={name}
                                    disabled={false}
                                    onVoiceCall={onVoiceCall}
                                    onVideoCall={onVideoCall}
                                />
                            </>
                        )}
                    </div>
                </div>

                {!isGroup && isLocationOpen && resolveId(otherUser) && (
                    <LiveLocationPanel
                        otherUserId={resolveId(otherUser)}
                        currentUserId={currentUserId}
                        otherUserName={name}
                        onClose={() => setIsLocationOpen(false)}
                    />
                )}

            </div>

            {isGroup && (
                <GroupInfoPanel
                    chat={chat}
                    currentUserId={currentUserId}
                    open={isGroupInfoOpen}
                    onClose={() => setIsGroupInfoOpen(false)}
                    onExitGroup={handleExitGroup}
                    isLeavingGroup={isLeavingGroup}
                />
            )}
        </>
    );
};

export default ChatHeader;
