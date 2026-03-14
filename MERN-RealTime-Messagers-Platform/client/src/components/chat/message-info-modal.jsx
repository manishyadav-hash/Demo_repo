import AvatarWithBadge from "../avatar-with-badge";
import { Button } from "../ui/button";
import { Check, CheckCheck, X } from "lucide-react";

const formatReceiptTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const MessageInfoModal = ({
  open,
  onClose,
  message,
  readers = [],
  deliveredTo = [],
}) => {
  if (!open || !message) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close message info" />

      <div className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Message info</p>
            <h3 className="mt-1 text-base font-semibold text-foreground">Seen status</h3>
          </div>
          <Button type="button" size="icon" variant="ghost" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="border-b border-white/10 bg-background/40 px-5 py-4">
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-accent px-4 py-3 text-sm shadow-sm dark:bg-primary/40">
            {message?.content || (message?.image ? "Photo" : message?.voiceUrl ? "Voice message" : "Message")}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-2">
          <section className="min-h-0 border-b border-white/10 px-5 py-4 md:border-b-0 md:border-r">
            <div className="mb-4 flex items-center gap-2 text-foreground">
              <CheckCheck className="h-4 w-4 text-sky-400" />
              <h4 className="font-medium">Read</h4>
            </div>
            <div className="max-h-[38vh] space-y-3 overflow-y-auto pr-1">
              {readers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No one has read this message yet.</p>
              ) : (
                readers.map((reader) => (
                  <div key={reader._id} className="flex items-center gap-3 rounded-2xl bg-background/50 px-3 py-3">
                    <AvatarWithBadge name={reader.name} src={reader.avatar} size="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{reader.name}</p>
                      <p className="text-xs text-muted-foreground">{formatReceiptTime(reader.seenAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="min-h-0 px-5 py-4">
            <div className="mb-4 flex items-center gap-2 text-foreground">
              <Check className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Delivered</h4>
            </div>
            <div className="max-h-[38vh] space-y-3 overflow-y-auto pr-1">
              {deliveredTo.length === 0 ? (
                <p className="text-sm text-muted-foreground">No delivery info available.</p>
              ) : (
                deliveredTo.map((recipient) => (
                  <div key={recipient._id} className="flex items-center gap-3 rounded-2xl bg-background/50 px-3 py-3">
                    <AvatarWithBadge name={recipient.name} src={recipient.avatar} size="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{recipient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {recipient.seenAt ? `Read ${formatReceiptTime(recipient.seenAt)}` : "Delivered"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MessageInfoModal;