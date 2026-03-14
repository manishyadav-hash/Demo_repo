import Logo from "./logo";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";

const EmptyState = ({
  title = "No chat selected",
  description = "Pick a chat or start a new one...",
}) => {
  return (
    <Empty className="w-full h-full flex-1 flex flex-col items-center justify-center bg-transparent">
      <EmptyHeader className="relative flex flex-col items-center gap-4">
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10 animate-pulse w-64 h-64 mx-auto" />
        <EmptyMedia variant="icon" className="relative group">
          <div className="absolute -inset-4 bg-primary/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative transform transition-transform duration-700 group-hover:scale-110">
            <Logo showText={false} imgClass="w-20 h-20" />
          </div>
        </EmptyMedia>
        <div className="flex flex-col items-center mt-6 space-y-2">
          <EmptyTitle className="text-3xl font-bold text-gradient tracking-tight">
            {title}
          </EmptyTitle>
          <EmptyDescription className="text-muted-foreground text-base max-w-[250px] text-center">
            {description}
          </EmptyDescription>
        </div>
      </EmptyHeader>
    </Empty>
  );
};

export default EmptyState;
