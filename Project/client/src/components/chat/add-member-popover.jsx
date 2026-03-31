import { memo, useEffect, useMemo, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";
import AvatarWithBadge from "../avatar-with-badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const AddMemberPopover = memo(({ children, chatId, currentMembers = [] }) => {
    const { fetchAllUsers, users, isUsersLoading, addMembersToGroup, isAddingMembers } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchAllUsers();
        }
    }, [isOpen, fetchAllUsers]);

    const handleOpenChange = (open) => {
        setIsOpen(open);
        if (!open) {
            setSelectedUsers([]);
            setSearchTerm("");
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return;

        const success = await addMembersToGroup(chatId, selectedUsers);
        if (success) {
            setIsOpen(false);
            setSelectedUsers([]);
        }
    };

    const eligibleUsers = useMemo(() => {
        if (!users) return [];
        const currentMemberIds = currentMembers.map(m => m._id);
        const term = searchTerm.trim().toLowerCase();
        
        return users.filter(user => {
            // Filter out existing members
            if (currentMemberIds.includes(user._id)) return false;
            
            // Filter by search term
            if (!term) return true;
            return user.name.toLowerCase().includes(term);
        });
    }, [users, currentMembers, searchTerm]);

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b space-y-3">
                    <h3 className="font-semibold text-sm">Add Members</h3>
                    <InputGroup className="h-9">
                        <InputGroupAddon>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </InputGroupAddon>
                        <InputGroupInput 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                    
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {selectedUsers.map(userId => {
                                const user = users.find(u => u._id === userId);
                                return (
                                    <div key={userId} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        {user?.name}
                                        <X 
                                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleUserSelection(userId);
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="max-h-[300px] overflow-y-auto p-1">
                    {isUsersLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : eligibleUsers.length === 0 ? (
                        <div className="text-center p-4 text-sm text-muted-foreground">
                            {searchTerm ? "No users found" : "No users available to add"}
                        </div>
                    ) : (
                        eligibleUsers.map((user) => {
                            const isSelected = selectedUsers.includes(user._id);
                            return (
                                <div
                                    key={user._id}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                                        isSelected && "bg-muted"
                                    )}
                                    onClick={() => toggleUserSelection(user._id)}
                                >
                                    <AvatarWithBadge 
                                        name={user.name} 
                                        src={user.avatar} 
                                        isOnline={user.isOnline} // Assuming user object has this or we mock it
                                    />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium text-sm truncate">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-3 border-t">
                    <Button 
                        className="w-full" 
                        disabled={selectedUsers.length === 0 || isAddingMembers}
                        onClick={handleAddMembers}
                        size="sm"
                    >
                        {isAddingMembers ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
                            </>
                        )}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
});
