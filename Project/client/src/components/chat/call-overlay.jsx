import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Video } from "lucide-react";
const CallOverlay = ({ status, callType, name, avatar, localVideoRef, remoteVideoRef, remoteAudioRef, onAccept, onReject, onEnd, }) => {
    if (status === "idle")
        return null;
    const isIncoming = status === "ringing";
    const isCalling = status === "calling";
    const isInCall = status === "in-call";
    const isVideo = callType === "video";
    return (_jsxs("div", { className: "fixed inset-0 z-[99999] flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black/40 backdrop-blur-sm" }), _jsxs("div", { className: "relative w-[min(92vw,520px)] rounded-2xl bg-card shadow-xl border border-border overflow-hidden", children: [_jsxs("div", { className: "px-5 py-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: isIncoming
                                            ? "Incoming call"
                                            : isCalling
                                                ? "Calling..."
                                                : "In call" }), _jsx("h3", { className: "text-lg font-semibold", children: name })] }), _jsx("div", { className: "h-9 w-9 rounded-full bg-muted overflow-hidden", children: avatar ? (_jsx("img", { src: avatar, alt: name, className: "h-full w-full object-cover" })) : null })] }), _jsxs("div", { className: "relative bg-black", children: [isVideo ? (_jsxs("div", { className: "relative aspect-video w-full", children: [_jsx("video", { ref: remoteVideoRef, autoPlay: true, playsInline: true, className: "h-full w-full object-cover" }), _jsx("video", { ref: localVideoRef, autoPlay: true, playsInline: true, muted: true, className: "absolute bottom-3 right-3 h-28 w-20 rounded-lg object-cover ring-2 ring-white/70" })] })) : (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "h-20 w-20 rounded-full bg-muted flex items-center justify-center", children: _jsx(Phone, { className: "size-8 text-muted-foreground" }) }) })), _jsx("audio", { ref: remoteAudioRef, autoPlay: true })] }), _jsx("div", { className: "px-5 py-4 flex items-center justify-center gap-3", children: isIncoming ? (_jsxs(_Fragment, { children: [_jsxs(Button, { className: "bg-emerald-500 text-white hover:bg-emerald-600", onClick: onAccept, children: [isVideo ? _jsx(Video, { className: "size-4" }) : _jsx(Phone, { className: "size-4" }), "Accept"] }), _jsxs(Button, { variant: "destructive", onClick: onReject, children: [_jsx(PhoneOff, { className: "size-4" }), "Reject"] })] })) : (_jsxs(Button, { variant: "destructive", onClick: onEnd, children: [_jsx(PhoneOff, { className: "size-4" }), isCalling ? "Cancel" : "End"] })) })] })] }));
};
export default CallOverlay;
