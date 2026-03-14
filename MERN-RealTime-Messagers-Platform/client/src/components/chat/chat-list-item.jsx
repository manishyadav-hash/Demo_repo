import { getOtherUserAndGroup } from "@/lib/helper";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import AvatarWithBadge from "../avatar-with-badge";
import { formatChatTime } from "../../lib/helper";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";

const ChatListItem = ({ chat, currentUserId, onClick, onDelete }) => {
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
    if (lastMessage.image) return "📷 Photo";
    if (isGroup && lastMessage.sender) {
      return `${
        lastMessage.sender._id === currentUserId ? "You" : lastMessage.sender.name
      }: ${lastMessage.content}`;
    }
    return lastMessage.content;
  };

  const isActive = pathname.includes(chat._id);
  const timeStr = formatChatTime(lastMessage?.updatedAt || createdAt);

  return (
    <div
      className={cn(
        "group relative flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-transparent p-2.5 transition-colors duration-200 ease-out sm:gap-3 sm:rounded-2xl sm:p-3",
        isActive
          ? "bg-primary/30 border-primary/70 shadow-[inset_0_0_0_1px_rgba(167,139,250,0.55),0_0_24px_rgba(139,92,246,0.42),0_0_48px_rgba(139,92,246,0.22)]"
          : "hover:bg-sidebar-accent/50 hover:border-white/5"
      )}
      onClick={onClick}
    >
      <button className="min-w-0 flex-1 flex items-center gap-3 text-left focus:outline-none">
        <div className="transition-transform duration-200 group-hover:scale-105">
          <AvatarWithBadge name={name} src={avatar} isGroup={isGroup} isOnline={isOnline} />
        </div>
        <div className="min-w-0 flex-1">
          <h5 className={cn("truncate text-[13px] font-semibold transition-colors sm:text-sm", isActive ? "text-primary" : "text-foreground")}>
            {name}
          </h5>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">
            {getLastMessageText()}
          </p>
        </div>
      </button>
      <div className="relative flex min-w-[44px] shrink-0 items-center justify-end sm:min-w-[50px]">
        <span
          className={cn(
            "text-[10px] font-medium text-muted-foreground transition-all duration-300",
            !isGroup && "group-hover:opacity-0 group-hover:translate-x-2"
          )}
        >
          {timeStr}
        </span>
        {!isGroup && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={`Delete chat with ${name}`}
            className="absolute right-[-4px] opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.(chat._id, name);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatListItem;
