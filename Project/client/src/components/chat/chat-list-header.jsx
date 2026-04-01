import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { NewChatPopover } from "./newchat-popover";

const ChatListHeader = ({ onSearch }) => {
  return (
    <div className="pb-3 border-b border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gradient">
          Chats
        </h1>
        <div className="glow-effect rounded-full">
          <NewChatPopover />
        </div>
      </div>
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <InputGroup className="bg-background/80 backdrop-blur-sm border-white/10 rounded-full text-sm overflow-hidden transition-all group-focus-within:bg-background/90 group-focus-within:border-primary/50 shadow-sm">
          <InputGroupAddon className="pl-3">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search messages..."
            onChange={(e) => onSearch(e.target.value)}
            className="border-none focus-visible:ring-0 bg-transparent pl-2 outline-none h-10 w-full text-foreground/90 placeholder:text-muted-foreground/60"
          />
        </InputGroup>
      </div>
    </div>
  );
};

export default ChatListHeader;
