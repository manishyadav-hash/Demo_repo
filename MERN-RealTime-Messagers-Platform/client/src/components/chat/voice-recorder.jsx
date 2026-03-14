import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useState } from "react";
import { Button } from "../ui/button";
import { Mic, Send, X, Play } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";
const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
};
const VoiceRecorder = memo(({ onSendVoice, disabled = false, buttonClassName = "" }) => {
    const { isRecording, recordedAudio, recordingTime, startRecording, stopRecording, cancelRecording, playRecording, } = useVoiceRecorder();
    //isPlaying state is only for UI purposes to toggle play/pause icon, actual play/pause is handled inside useVoiceRecorder hook
    const [isPlaying, setIsPlaying] = useState(false);
    // Toggle play/pause state when playRecording is called
    const handlePlayClick = () => {
        setIsPlaying(true);
        playRecording();
    };
    const handleSend = () => {
        if (recordedAudio) {
            onSendVoice(recordedAudio);
            cancelRecording();
        }
    };
    if (isRecording) {
        return (_jsxs("div", { className: "flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1", children: [_jsxs("div", { className: "flex gap-1", children: [_jsx("div", { className: "w-1 h-3 bg-red-500 rounded-full animate-pulse" }), _jsx("div", { className: "w-1 h-3 bg-red-500 rounded-full animate-pulse", style: { animationDelay: "0.1s" } }), _jsx("div", { className: "w-1 h-3 bg-red-500 rounded-full animate-pulse", style: { animationDelay: "0.2s" } })] }), _jsxs("span", { className: "text-sm font-semibold text-red-600 dark:text-red-400", children: ["Recording: ", formatTime(recordingTime)] })] }), _jsx(Button, { type: "button", size: "icon", variant: "ghost", onClick: stopRecording, className: "h-8 w-8 rounded-full", children: _jsx("div", { className: "w-3 h-3 bg-red-500 rounded-sm" }) }), _jsx(Button, { type: "button", size: "icon", variant: "ghost", onClick: cancelRecording, className: "h-8 w-8 rounded-full hover:bg-red-200 dark:hover:bg-red-800", children: _jsx(X, { className: "h-4 w-4" }) })] }));
    }
    if (recordedAudio) {
        return (_jsxs("div", { className: "flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2", children: [_jsx(Button, { type: "button", size: "icon", variant: "ghost", onClick: handlePlayClick, className: "h-8 w-8 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800", children: _jsx(Play, { className: "h-4 w-4" }) }), _jsxs("span", { className: "text-sm text-blue-600 dark:text-blue-400", children: [formatTime(recordingTime), " voice message"] }), _jsx(Button, { type: "button", size: "icon", variant: "ghost", onClick: cancelRecording, className: "h-8 w-8 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800", children: _jsx(X, { className: "h-4 w-4" }) }), _jsx(Button, { type: "button", size: "icon", onClick: handleSend, className: "h-8 w-8 rounded-full ml-auto", children: _jsx(Send, { className: "h-3.5 w-3.5" }) })] }));
    }
    return (_jsx(Button, { type: "button", variant: "outline", size: "icon", disabled: disabled, className: cn("rounded-full h-8 w-8 sm:h-9 sm:w-9", buttonClassName), onClick: startRecording, title: "Record voice message", children: _jsx(Mic, { className: "h-3.5 w-3.5 sm:h-4 sm:w-4" }) }));
});
VoiceRecorder.displayName = "VoiceRecorder";
export default VoiceRecorder;
