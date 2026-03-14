import { useState, useRef } from "react";
import { toast } from "sonner";

const getSupportedMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
    ];
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
};

export const useVoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);
    const startRecording = async () => {
        // Requires HTTPS on mobile browsers
        if (!window.isSecureContext) {
            toast.error("Voice recording requires a secure connection (HTTPS).");
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            toast.error("Microphone is not supported in this browser.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = getSupportedMimeType();
            const options = mimeType ? { mimeType } : {};
            const mediaRecorder = new MediaRecorder(stream, options);
            // Use the actual MIME type the recorder chose (may differ from requested)
            const actualMimeType = mediaRecorder.mimeType || mimeType || "audio/webm";
            audioChunksRef.current = [];
            setRecordingTime(0);
            setIsRecording(true);
            mediaRecorder.onstart = () => {
                timerIntervalRef.current = setInterval(() => {
                    setRecordingTime((prev) => prev + 1);
                }, 1000);
            };
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            mediaRecorder.onstop = () => {
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                }
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: actualMimeType,
                });
                setRecordedAudio(audioBlob);
                setIsRecording(false);
                stream.getTracks().forEach((track) => track.stop());
            };
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
        }
        catch (error) {
            console.error("Error accessing microphone:", error);
            setIsRecording(false);
            if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                toast.error("Microphone permission denied. Please allow microphone access.");
            } else if (error.name === "NotFoundError") {
                toast.error("No microphone found on this device.");
            } else {
                toast.error("Could not start recording. Please try again.");
            }
        }
    };
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };
    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        audioChunksRef.current = [];
        setRecordedAudio(null);
        setRecordingTime(0);
        setIsRecording(false);
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
    };
    const playRecording = () => {
        if (recordedAudio) {
            const url = URL.createObjectURL(recordedAudio);
            const audio = new Audio(url);
            audio.play();
        }
    };
    return {
        isRecording,
        recordedAudio,
        recordingTime,
        startRecording,
        stopRecording,
        cancelRecording,
        playRecording,
    };
};
