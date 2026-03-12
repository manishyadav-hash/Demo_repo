import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useEffect, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { ArrowLeft, PenBoxIcon, Search, UsersIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput, } from "../ui/input-group";
import { Spinner } from "../ui/spinner";
import AvatarWithBadge from "../avatar-with-badge";
import { Checkbox } from "../ui/checkbox";
import { useNavigate } from "react-router-dom";
export const NewChatPopover = memo(() => {
    const navigate = useNavigate();
    const { fetchAllUsers, users, isUsersLoading, createChat, isCreatingChat } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [isGroupMode, setIsGroupMode] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loadingUserId, setLoadingUserId] = useState(null);
    useEffect(() => {
        fetchAllUsers();
    }, [fetchAllUsers]);
    const toggleUserSelection = (id) => {
        setSelectedUsers((prev) => prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]);
    };
    const handleBack = () => {
        resetState();
    };
    const resetState = () => {
        setIsGroupMode(false);
        setGroupName("");
        setSelectedUsers([]);
    };
    const handleOpenChange = (open) => {
        setIsOpen(open);
        resetState();
    };
    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers?.length === 0)
            return;
        const response = await createChat({
            isGroup: true,
            participants: selectedUsers,
            groupName: groupName,
        });
        setIsOpen(false);
        resetState();
        navigate(`/chat/${response?._id}`);
    };
    const handleCreateChat = async (userId) => {
        setLoadingUserId(userId);
        try {
            const response = await createChat({
                isGroup: false,
                participantId: userId,
            });
            setIsOpen(false);
            resetState();
            navigate(`/chat/${response?._id}`);
        }
        finally {
            setLoadingUserId(null);
            setIsOpen(false);
            resetState();
        }
    };
    return (_jsxs(Popover, { open: isOpen, onOpenChange: handleOpenChange, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(Button, { onClick: () => setIsOpen(true), variant: "ghost", size: "icon", className: "h-8 w-8", children: _jsx(PenBoxIcon, { className: "!h-5 !w-5 !stroke-1" }) }) }), _jsxs(PopoverContent, { align: "start", className: "w-80 z-[999] p-0\r\n         rounded-xl min-h-[400px]\r\n         max-h-[80vh] flex flex-col\r\n        ", children: [_jsxs("div", { className: "border-b p-3 flex flex-col gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [isGroupMode && (_jsx(Button, { variant: "ghost", size: "icon", onClick: handleBack, children: _jsx(ArrowLeft, { size: 16 }) })), _jsx("h3", { className: "text-lg font-semibold", children: isGroupMode ? "New Group" : "New Chat" })] }), _jsxs(InputGroup, { children: [_jsx(InputGroupInput, { value: isGroupMode ? groupName : "", onChange: isGroupMode ? (e) => setGroupName(e.target.value) : undefined, placeholder: isGroupMode ? "Enter group name" : "Search name" }), _jsx(InputGroupAddon, { children: isGroupMode ? _jsx(UsersIcon, {}) : _jsx(Search, {}) })] })] }), _jsx("div", { className: "flex-1 justify-center overflow-y-auto\r\n         px-1 py-1 space-y-1\r\n        ", children: isUsersLoading ? (_jsx(Spinner, { className: "w-6 h-6" })) : users && users?.length === 0 ? (_jsx("div", { className: "text-center text-muted-foreground", children: "No users found" })) : (users?.map((user) => (_jsx(ChatUserItem, { user: user, isLoading: loadingUserId === user._id, disabled: loadingUserId !== null, onClick: handleCreateChat }, user._id)))) }), isGroupMode && (_jsx("div", { className: "border-t p-3", children: _jsxs(Button, { onClick: handleCreateGroup, className: "w-full", disabled: isCreatingChat ||
                                !groupName.trim() ||
                                selectedUsers.length === 0, children: [isCreatingChat && _jsx(Spinner, { className: "w-4 h-4" }), "Create Group"] }) }))] })] }));
});
NewChatPopover.displayName = "NewChatPopover";
const UserAvatar = memo(({ user }) => (_jsxs(_Fragment, { children: [_jsx(AvatarWithBadge, { name: user.name, src: user.avatar ?? "" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h5", { className: "text-[13.5px] font-medium truncate", children: user.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Hey there! I'm using Spark" })] })] })));
UserAvatar.displayName = "UserAvatar";
const ChatUserItem = memo(({ user, isLoading, disabled, onClick, }) => (_jsxs("button", { className: "\r\n      relative w-full flex items-center gap-2 p-2\r\n    rounded-sm hover:bg-accent\r\n       transition-colors text-left disabled:opacity-50", disabled: isLoading || disabled, onClick: () => onClick(user._id), children: [_jsx(UserAvatar, { user: user }), isLoading && _jsx(Spinner, { className: "absolute right-2 w-4 h-4 ml-auto" })] })));
ChatUserItem.displayName = "ChatUserItem";
const GroupUserItem = memo(({ user, isSelected, onToggle, }) => (_jsxs("label", { role: "button", className: "w-full flex items-center gap-2 p-2\r\n      rounded-sm hover:bg-accent\r\n       transition-colors text-left\r\n      ", children: [_jsx(UserAvatar, { user: user }), _jsx(Checkbox, { checked: isSelected, onCheckedChange: () => onToggle(user._id) })] })));
GroupUserItem.displayName = "GroupUserItem";
