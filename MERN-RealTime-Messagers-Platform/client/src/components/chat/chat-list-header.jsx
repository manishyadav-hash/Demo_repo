import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput, } from "../ui/input-group";
import { NewChatPopover } from "./newchat-popover";
const ChatListHeader = ({ onSearch }) => {
    return (_jsxs("div", { className: "px-3 py-3 border-b border-border", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Chat" }), _jsx("div", { children: _jsx(NewChatPopover, {}) })] }), _jsx("div", { children: _jsxs(InputGroup, { className: "bg-background text-sm", children: [_jsx(InputGroupInput, { placeholder: "Search...", onChange: (e) => onSearch(e.target.value) }), _jsx(InputGroupAddon, { children: _jsx(Search, { className: "h-4 w-4 text-muted-foreground" }) })] }) })] }));
};
export default ChatListHeader;
