import AppWrapper from "@/components/app-wrapper";
import ChatList from "@/components/chat/chat-list";
import useChatId from "@/hooks/use-chat-id";
import { cn } from "@/lib/utils";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  const chatId = useChatId();
  return (
    <AppWrapper>
      <div className="flex h-full min-h-0 flex-col gap-1 p-1 sm:gap-4 sm:p-4">
        <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl sm:rounded-3xl glass-panel">
          <div className={cn(
            "min-h-0 shrink-0 transition-all duration-300",
            chatId ? "hidden lg:block lg:w-[350px] xl:w-[400px]" : "w-full lg:w-[350px] xl:w-[400px]"
          )}>
            <ChatList />
          </div>
          <div className={cn(
            "relative min-h-0 flex-1 border-l border-white/5 transition-all duration-300",
            !chatId ? "hidden lg:block" : "block"
          )}>
            <div className="absolute inset-0 min-h-0 bg-background/50 backdrop-blur-[2px]">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </AppWrapper>
  );
};

export default AppLayout;
