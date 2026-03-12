import { useState, useRef } from "react";
export const useVoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];
            setRecordingTime(0);
            setIsRecording(true);
            mediaRecorder.onstart = () => {
                timerIntervalRef.current = setInterval(() => {
                    setRecordingTime((prev) => prev + 1);
                }, 1000);
            };
            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorder.onstop = () => {
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                }
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/webm",
                });
                setRecordedAudio(audioBlob);
                setIsRecording(false);
                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());
            };
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
        }
        catch (error) {
            console.error("Error accessing microphone:", error);
            setIsRecording(false);
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
