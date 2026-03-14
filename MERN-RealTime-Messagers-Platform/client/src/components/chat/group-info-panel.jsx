import { useEffect, useMemo, useState } from "react";
import { Search, Shield, Users, X } from "lucide-react";
import AvatarWithBadge from "../avatar-with-badge";
import { Button } from "../ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";
import { cn } from "@/lib/utils";

const sortMembers = (members, currentUserId, createdBy) => {
  return [...(members || [])].sort((left, right) => {
    if (left._id === currentUserId) return -1;
    if (right._id === currentUserId) return 1;
    if (left._id === createdBy) return -1;
    if (right._id === createdBy) return 1;
    return (left.name || "").localeCompare(right.name || "");
  });
};

const GroupInfoPanel = ({
  chat,
  currentUserId,
  open,
  onClose,
  onExitGroup,
  isLeavingGroup = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  const members = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    const sortedMembers = sortMembers(chat?.participants, currentUserId, chat?.createdBy);

    if (!normalizedTerm) {
      return sortedMembers;
    }

    return sortedMembers.filter((member) =>
      member?.name?.toLowerCase().includes(normalizedTerm)
    );
  }, [chat?.createdBy, chat?.participants, currentUserId, searchTerm]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[90] transition-all duration-300",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col overflow-hidden border-l border-white/10 bg-card shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full"
            onClick={onClose}
            aria-label="Close group info"
          >
            <X className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Group info</p>
            <h2 className="text-base font-semibold text-foreground">{chat?.groupName || "Unnamed Group"}</h2>
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-6">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-primary/10 p-2 ring-1 ring-primary/20">
              <AvatarWithBadge
                name={chat?.groupName || "G"}
                src=""
                isGroup
                size="h-16 w-16"
              />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-xl font-semibold text-foreground">
                {chat?.groupName || "Unnamed Group"}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{chat?.participants?.length || 0} members</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 px-4 py-4">
          <InputGroup className="h-11 rounded-2xl border-white/10 bg-background/60">
            <InputGroupAddon>
              <Search className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search members"
              className="text-sm"
            />
          </InputGroup>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {members.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-muted-foreground">
              No members found
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const isCurrentUser = member._id === currentUserId;
                const isAdmin = member._id === chat?.createdBy;

                return (
                  <div
                    key={member._id}
                    className="flex items-center gap-3 rounded-2xl border border-transparent bg-background/40 px-3 py-3 transition-colors hover:border-white/10 hover:bg-background/70"
                  >
                    <AvatarWithBadge name={member.name} src={member.avatar} size="h-11 w-11" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {isCurrentUser ? "You" : member.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {isAdmin ? "Group admin" : "Member"}
                      </p>
                    </div>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                        <Shield className="h-3.5 w-3.5" />
                        Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 bg-card px-4 py-4 pb-6">
          <Button
            type="button"
            variant="destructive"
            className="h-11 w-full rounded-2xl"
            disabled={isLeavingGroup}
            onClick={onExitGroup}
          >
            {isLeavingGroup ? "Exiting..." : "Exit group"}
          </Button>
        </div>
      </aside>
    </div>
  );
};

export default GroupInfoPanel;