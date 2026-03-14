import { memo, useEffect, useMemo, useState } from "react";
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
    const [searchTerm, setSearchTerm] = useState("");

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
        setSearchTerm("");
    };

    const handleOpenChange = (open) => {
        setIsOpen(open);
        resetState();
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers?.length < 2)
            return;

        const response = await createChat({
            isGroup: true,
            participants: selectedUsers,
            groupName: groupName.trim(),
        });

        if (!response?._id)
            return;

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

            if (!response?._id)
                return;

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

    const filteredUsers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term)
            return users || [];
        return (users || []).filter((user) => user?.name?.toLowerCase().includes(term));
    }, [users, searchTerm]);

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button onClick={() => setIsOpen(true)} variant="ghost" size="icon" className="h-8 w-8">
                    <PenBoxIcon className="!h-5 !w-5 !stroke-1" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                className="w-80 z-[999] p-0 rounded-xl min-h-[400px] max-h-[80vh] flex flex-col"
            >
                <div className="border-b p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        {isGroupMode && (
                            <Button variant="ghost" size="icon" onClick={handleBack}>
                                <ArrowLeft size={16} />
                            </Button>
                        )}
                        <h3 className="text-lg font-semibold">{isGroupMode ? "New Group" : "New Chat"}</h3>
                    </div>

                    {isGroupMode && (
                        <InputGroup>
                            <InputGroupInput
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Enter group name"
                            />
                            <InputGroupAddon>
                                <UsersIcon />
                            </InputGroupAddon>
                        </InputGroup>
                    )}

                    <InputGroup>
                        <InputGroupInput
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search users"
                        />
                        <InputGroupAddon>
                            <Search />
                        </InputGroupAddon>
                    </InputGroup>
                </div>

                <div className="flex-1 justify-center overflow-y-auto px-1 py-1 space-y-1">
                    {isUsersLoading ? (
                        <Spinner className="w-6 h-6" />
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center text-muted-foreground">No users found</div>
                    ) : isGroupMode ? (
                        filteredUsers.map((user) => (
                            <GroupUserItem
                                key={user._id}
                                user={user}
                                isSelected={selectedUsers.includes(user._id)}
                                onToggle={toggleUserSelection}
                            />
                        ))
                    ) : (
                        filteredUsers.map((user) => (
                            <ChatUserItem
                                key={user._id}
                                user={user}
                                isLoading={loadingUserId === user._id}
                                disabled={loadingUserId !== null}
                                onClick={handleCreateChat}
                            />
                        ))
                    )}
                </div>

                {isGroupMode && (
                    <div className="border-t p-3">
                        <Button
                            onClick={handleCreateGroup}
                            className="w-full"
                            disabled={isCreatingChat || !groupName.trim() || selectedUsers.length < 2}
                        >
                            {isCreatingChat && <Spinner className="w-4 h-4" />}
                            Create Group
                        </Button>
                    </div>
                )}

                <div className="border-t p-3">
                    {!isGroupMode ? (
                        <Button variant="outline" className="w-full" onClick={() => setIsGroupMode(true)}>
                            <UsersIcon className="w-4 h-4 mr-2" />
                            New Group
                        </Button>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Select at least 2 members to create a group.
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
});

NewChatPopover.displayName = "NewChatPopover";

const UserAvatar = memo(({ user }) => (
    <>
        <AvatarWithBadge name={user.name} src={user.avatar ?? ""} />
        <div className="flex-1 min-w-0">
            <h5 className="text-[13.5px] font-medium truncate">{user.name}</h5>
            <p className="text-xs text-muted-foreground">Hey there! I&apos;m using Spark</p>
        </div>
    </>
));

UserAvatar.displayName = "UserAvatar";

const ChatUserItem = memo(({ user, isLoading, disabled, onClick, }) => (
    <button
        className="relative w-full flex items-center gap-2 p-2 rounded-sm hover:bg-accent transition-colors text-left disabled:opacity-50"
        disabled={isLoading || disabled}
        onClick={() => onClick(user._id)}
    >
        <UserAvatar user={user} />
        {isLoading && <Spinner className="absolute right-2 w-4 h-4 ml-auto" />}
    </button>
));

ChatUserItem.displayName = "ChatUserItem";

const GroupUserItem = memo(({ user, isSelected, onToggle, }) => (
    <label
        role="button"
        className="w-full flex items-center gap-2 p-2 rounded-sm hover:bg-accent transition-colors text-left"
    >
        <UserAvatar user={user} />
        <Checkbox checked={isSelected} onCheckedChange={() => onToggle(user._id)} />
    </label>
));

GroupUserItem.displayName = "GroupUserItem";
