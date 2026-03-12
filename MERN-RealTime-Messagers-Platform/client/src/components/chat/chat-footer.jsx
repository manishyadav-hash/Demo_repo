import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { z } from "zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Paperclip, Send, X } from "lucide-react";
import { Form, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import ChatReplyBar from "./chat-reply-bar";
import { useChat } from "@/hooks/use-chat";
import VoiceRecorder from "./voice-recorder";
import { LocationSendButton } from "../location";
const ChatFooter = ({ chatId, currentUserId, replyTo, onCancelReply, }) => {
    const messageSchema = z.object({
        message: z.string().optional(),
    });
    const { sendMessage, isSendingMsg } = useChat();
    const [image, setImage] = useState(null);
    const [location, setLocation] = useState(null);
    const imageInputRef = useRef(null);
    const form = useForm({
        resolver: zodResolver(messageSchema),
        defaultValues: {
            message: "",
        },
    });
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setImage(reader.result);
        reader.readAsDataURL(file);
    };
    const handleRemoveImage = () => {
        setImage(null);
        if (imageInputRef.current)
            imageInputRef.current.value = "";
    };
    const onSubmit = (values) => {
        if (isSendingMsg)
            return;
        if (!values.message?.trim() && !image && !location) {
            toast.error("Please enter a message, select an image, or share a location");
            return;
        }
        const payload = {
            chatId,
            content: values.message,
            image: image || undefined,
            replyTo: replyTo,
            location: location || undefined,
        };
        //Send Message
        sendMessage(payload);
        onCancelReply();
        handleRemoveImage();
        setLocation(null);
        form.reset();
    };
    const handleSendVoice = (audioBlob) => {
        if (isSendingMsg)
            return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const voiceData = reader.result; // base64 encoded audio
            const payload = {
                chatId,
                voiceData,
                replyTo: replyTo,
            };
            sendMessage(payload);
            onCancelReply();
        };
        reader.readAsDataURL(audioBlob);
    };
    const handleSendLocation = (locationData) => {
        setLocation(locationData);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "sticky bottom-0\r\n       inset-x-0 z-[999]\r\n       bg-card border-t border-border py-4\r\n      ", children: [image && !isSendingMsg && (_jsx("div", { className: "max-w-6xl mx-auto px-8.5", children: _jsxs("div", { className: "relative w-fit", children: [_jsx("img", { src: image, className: "object-contain h-16 bg-muted min-w-16" }), _jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "absolute top-px right-1\r\n                 bg-black/50 text-white rounded-full\r\n                 cursor-pointer\r\n                ", onClick: handleRemoveImage, children: _jsx(X, { className: "h-3 w-3" }) })] }) })), location && !isSendingMsg && (_jsx("div", { className: "max-w-6xl mx-auto px-8.5", children: _jsxs("div", { className: "relative text-sm bg-muted p-3 rounded-lg", children: [_jsx("div", { className: "font-medium text-foreground", children: "📍 Location Selected" }), _jsx("div", { className: "text-xs text-muted-foreground mt-1", children: location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute top-2 right-2", onClick: () => setLocation(null), children: _jsx(X, { className: "h-3 w-3" }) })] }) })), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "max-w-6xl px-8.5 mx-auto\r\n            flex items-end gap-2\r\n            ", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Button, { type: "button", variant: "outline", size: "icon", disabled: isSendingMsg, className: "rounded-full", onClick: () => imageInputRef.current?.click(), children: _jsx(Paperclip, { className: "h-4 w-4" }) }), _jsx(VoiceRecorder, { onSendVoice: handleSendVoice, disabled: isSendingMsg }), _jsx(LocationSendButton, { onSendLocation: handleSendLocation, disabled: isSendingMsg }), _jsx("input", { type: "file", className: "hidden", accept: "image/*", disabled: isSendingMsg, ref: imageInputRef, onChange: handleImageChange })] }), _jsx(FormField, { control: form.control, name: "message", disabled: isSendingMsg, render: ({ field }) => (_jsx(FormItem, { className: "flex-1", children: _jsx(Input, { ...field, autoComplete: "off", placeholder: "Type new message", className: "min-h-[40px] bg-background" }) })) }), _jsx(Button, { type: "submit", size: "icon", className: "rounded-lg", disabled: isSendingMsg, children: _jsx(Send, { className: "h-3.5 w-3.5" }) })] }) })] }), replyTo && !isSendingMsg && (_jsx(ChatReplyBar, { replyTo: replyTo, currentUserId: currentUserId, onCancel: onCancelReply }))] }));
};
export default ChatFooter;
