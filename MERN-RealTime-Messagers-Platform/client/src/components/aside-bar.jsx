import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "./theme-provider";
import { isUserOnline } from "@/lib/helper";
import Logo from "./logo";
import { PROTECTED_ROUTES } from "@/routes/routes";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import AvatarWithBadge from "./avatar-with-badge";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/use-socket";

const AsideBar = () => {
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const isOnline = isUserOnline(user?._id || user?.id, onlineUsers);

  return (
    <aside className="fixed left-1 top-1 bottom-1 z-[9999] flex w-10 flex-col items-center rounded-2xl border border-white/10 bg-card/60 py-3 shadow-lg backdrop-blur-md transition-all hover:bg-card/80 sm:left-2 sm:top-2 sm:bottom-2 sm:w-12 sm:py-4">
      <div className="w-full flex-1 flex flex-col items-center justify-between">
        <div className="glow-effect rounded-full">
          <Logo url={PROTECTED_ROUTES.CHAT} imgClass="size-8 transition-transform hover:scale-110" textClass="hidden" showText={false} />
        </div>
        
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full transition-colors hover:bg-primary/20 hover:text-primary sm:h-10 sm:w-10"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:-rotate-0" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div role="button" className="glow-effect rounded-full ring-2 ring-transparent hover:ring-primary transition-all cursor-pointer">
                <AvatarWithBadge
                  name={user?.name || "unKnown"}
                  src={user?.avatar || ""}
                  isOnline={isOnline}
                  className="!bg-white shadow-sm"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 rounded-xl z-[99999] glass-panel" align="start" side="right" sideOffset={10}>
              <DropdownMenuLabel className="font-semibold text-primary">My Account</DropdownMenuLabel>
              <DropdownMenuItem onClick={logout} className="rounded-md cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
};

export default AsideBar;
