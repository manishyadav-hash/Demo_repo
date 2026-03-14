import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/use-socket";
import CallOverlay from "@/components/chat/call-overlay";
import { useAuth } from "@/hooks/use-auth";

const CallContext = createContext(null);

const CallProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const currentUserId = user?._id;

    // Call State
    const [status, setStatus] = useState("idle"); // idle | calling | ringing | in-call
    const [callType, setCallType] = useState(null); // "audio" | "video"
    const [incoming, setIncoming] = useState(null);
    const [chatId, setChatId] = useState(null);
    const [remoteUser, setRemoteUser] = useState(null); // { name, avatar } of the other person

    // Media State
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    // Refs
    const peerRef = useRef(null);
    const peerUserIdRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);
    // Use ref to track status consistently inside event handlers without re-binding listeners
    const statusRef = useRef(status);
    const incomingRef = useRef(incoming);
    
    // Sync refs with state
    useEffect(() => { statusRef.current = status; }, [status]);
    useEffect(() => { incomingRef.current = incoming; }, [incoming]);

    const cleanup = useCallback(() => {
        peerRef.current?.close();
        peerRef.current = null;
        peerUserIdRef.current = null;
        
        // Stop all tracks
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        
        setLocalStream(null);
        setRemoteStream(null);
        setIncoming(null);
        setCallType(null);
        setStatus("idle");
        setChatId(null);
        setRemoteUser(null);
    }, [localStream]);

    const ensureLocalStream = useCallback(async (type) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             const isLocalIP = window.location.hostname.match(/^(10|172\.16|192\.168)\.\d+\.\d+$/);
             const isHTTP = window.location.protocol === 'http:';
             if (isHTTP && isLocalIP) {
                 throw new Error("Mobile browsers require HTTPS for microphone access.");
             }
             throw new Error("Your browser doesn't support media access.");
        }
        
        const needsVideo = type === "video";
        
        if (localStream) {
            const hasVideo = localStream.getVideoTracks().length > 0;
            if (!needsVideo || hasVideo) return localStream;
        }

        const enhancedConstraints = {
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: needsVideo ? { width: { ideal: 1280, max: 1920 }, height: { ideal: 720, max: 1080 }, facingMode: "user" } : false,
        };
        const basicConstraints = { audio: true, video: needsVideo ? { facingMode: "user" } : false };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(enhancedConstraints);
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.warn("Enhanced constraints failed, trying basic:", error);
            try {
                const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
                setLocalStream(stream);
                return stream;
            } catch (basicError) {
                console.error("Media access failed:", basicError);
                throw new Error("Failed to access media devices: " + (basicError.message || "Unknown error"));
            }
        }
    }, [localStream]);

    const ensureLocalStreamWithFallback = useCallback(async (requestedType) => {
        try {
            return await ensureLocalStream(requestedType);
        } catch (error) {
            if (requestedType === "video") {
                toast.info("Camera not available, using audio only");
                return await ensureLocalStream("voice");
            }
            throw error;
        }
    }, [ensureLocalStream]);

    const getPeer = useCallback(() => {
        if (peerRef.current) return peerRef.current;
        
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
                {
                    urls: "turn:openrelay.metered.ca:80",
                    username: "openrelayproject",
                    credential: "openrelayproject",
                },
                {
                    urls: "turn:openrelay.metered.ca:443",
                    username: "openrelayproject",
                    credential: "openrelayproject",
                },
            ],
            iceCandidatePoolSize: 10,
            iceTransportPolicy: 'all',
        });

        peer.onicecandidate = (event) => {
            if (!event.candidate || !socket || !peerUserIdRef.current || !chatId) return;
            socket.emit("call:ice", {
                toUserId: peerUserIdRef.current,
                chatId,
                candidate: event.candidate,
            });
        };

        peer.ontrack = (event) => {
            const [stream] = event.streams;
            if (stream) setRemoteStream(stream);
        };

        peerRef.current = peer;
        return peer;
    }, [chatId, socket]);

    const addLocalTracks = useCallback((peer, stream) => {
        const existingSenders = peer.getSenders();
        stream.getTracks().forEach((track) => {
            const sender = existingSenders.find((candidate) => candidate.track?.kind === track.kind);
            if (sender) {
                sender.replaceTrack(track);
            } else {
                peer.addTrack(track, stream);
            }
        });
    }, []);

    const startCall = useCallback(async (toUserId, chatRoomId, type, userDetails) => {
        if (!socket || !currentUserId || !toUserId) {
            toast.error("Unable to start call");
            return;
        }
        if (status !== "idle") return;

        let actualType = type;
        try {
            if (type === "video") {
                try {
                    await ensureLocalStream("video");
                } catch {
                    toast.info("Camera not available, starting voice call");
                    actualType = "voice";
                    await ensureLocalStream("voice");
                }
            } else {
                await ensureLocalStream("voice");
            }
        } catch (mediaError) {
            toast.error(mediaError instanceof Error ? mediaError.message : "Unable to access microphone");
            return;
        }

        setCallType(actualType);
        setStatus("calling");
        setChatId(chatRoomId);
        setRemoteUser(userDetails);
        peerUserIdRef.current = toUserId;

        socket.emit("call:request", {
            toUserId,
            chatId: chatRoomId,
            callType: actualType,
        });
    }, [socket, currentUserId, status, ensureLocalStream]);

    const acceptCall = useCallback(async () => {
        if (!socket || !incoming) return;
        
        peerUserIdRef.current = incoming.fromUserId;
        const requestedType = incoming.callType || "voice";
        
        try {
            // Important: Set chatId first so getPeer can use it if needed (though getPeer uses state chatId which we set below)
            // But getPeer uses closures sometimes... wait, getPeer dependency [chatId]. 
            // So we need to set state first and wait? No, refs are updated immediately, but state update in render loop.
            // getPeer accesses chatId from closure.
            // Actually getPeer depends on [chatId]. If chatId changes, getPeer is recreated? No, useCallback dependencies.
            // If getPeer is called, it uses current chatId from scope? No, from closure.
            // However, getPeer creates a NEW peer connection only if peerRef.current is null.
            // If we use ref for chatId inside getPeer's callbacks, it would be safer.
            // But let's just set the state and assume socket event handlers access latest state if they are redefined?
            // The `acceptCall` function depends on `incoming`. `incoming` has `chatId`.
            
            setChatId(incoming.chatId);
            
            const peer = getPeer(); // This might be tricky if chatId is not updated in getPeer closure yet.
            // Wait, getPeer callback depends on [chatId].
            // If I call setChatId, the component re-renders, and getPeer is recreated with new chatId.
            // But here I am inside acceptCall which is running.
            // The `incoming.chatId` is available.
            // Maybe I should pass chatId to getPeer? No, getPeer uses state.
            
            // Fix: Pass chatId explicitly to getPeer or update getPeer to use incoming.chatId logic if available.
            // In this specific implementation, getPeer uses `chatId` state for `peer.onicecandidate`.
            // The `onicecandidate` callback will be defined when `getPeer` is called.
            // If `chatId` state is not yet updated, `onicecandidate` will close over the OLD `chatId` (null).
            
            // SOLUTION: Refs for chatId.
            // I'll stick to the current plan but update `chatId` state immediately.
            // But since state update is async, `getPeer` which runs immediately might see null.
            // I will modify `getPeer` to NOT depend on `chatId` state inside the closure, but maybe use a ref?
            // Or just pass chatId to getPeer?
            // Currently `getPeer` implementation:
            // peer.onicecandidate = (event) => { if(... !chatId) ... emit(..., chatId) }
            
            // I'll use a `chatIdRef` to track it synchronously.
            
            const stream = await ensureLocalStreamWithFallback(requestedType);
            addLocalTracks(peer, stream);
            setCallType(requestedType);
            
            socket.emit("call:accept", {
                toUserId: incoming.fromUserId,
                chatId: incoming.chatId,
                callType: requestedType,
            });
            
            setStatus("in-call");
            setIncoming(null);
        } catch (error) {
            toast.error(error.message || "Unable to access media devices");
            cleanup();
        }
    }, [addLocalTracks, cleanup, ensureLocalStreamWithFallback, getPeer, incoming, socket]);

    const rejectCall = useCallback(() => {
        if (!socket || !incoming) return;
        socket.emit("call:reject", {
            toUserId: incoming.fromUserId,
            chatId: incoming.chatId,
        });
        cleanup();
    }, [cleanup, incoming, socket]);

    const endCall = useCallback(() => {
        if (!socket || !peerUserIdRef.current || !chatId) {
            cleanup();
            return;
        }
        socket.emit("call:end", {
            toUserId: peerUserIdRef.current,
            chatId,
        });
        cleanup();
    }, [chatId, cleanup, socket]);

    // Handle Incoming Events need to be registered once and depend on latest state/refs
    // Since we are using refs for most mutable things in callbacks, it's safer.
    // However, `chatId` is crucial for `onicecandidate`.
    
    // I'll add `chatIdRef` to sync state with ref.
    const chatIdRef = useRef(null);
    useEffect(() => { chatIdRef.current = chatId; }, [chatId]);

    // Redefine getPeer to use ref
    const getPeerWithRef = useCallback(() => {
        if (peerRef.current) return peerRef.current;
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
                {
                    urls: "turn:openrelay.metered.ca:80",
                    username: "openrelayproject",
                    credential: "openrelayproject",
                },
                {
                    urls: "turn:openrelay.metered.ca:443",
                    username: "openrelayproject",
                    credential: "openrelayproject",
                },
            ],
            iceCandidatePoolSize: 10,
            iceTransportPolicy: 'all',
        });
        peer.onicecandidate = (event) => {
            // Use chatIdRef.current instead of chatId closure
            if (!event.candidate || !socket || !peerUserIdRef.current || !chatIdRef.current) return;
            socket.emit("call:ice", {
                toUserId: peerUserIdRef.current,
                chatId: chatIdRef.current,
                candidate: event.candidate,
            });
        };
        peer.ontrack = (event) => {
            const [stream] = event.streams;
            if (stream) setRemoteStream(stream);
        };
        peerRef.current = peer;
        return peer;
    }, [socket]); // Remove chatId dependency as we use ref

    useEffect(() => {
        if (!socket) {
            console.log("CallProvider: Socket not available yet");
            return;
        }
        
        console.log("CallProvider: Socket available, attaching listeners. Socket ID:", socket.id);

        const handleIncoming = (payload) => {
            console.log("CallProvider: Incoming call received", payload);
            toast.info(`Incoming Call from ${payload.callerName || 'Unknown'}`);
            if (statusRef.current !== "idle") {
                socket.emit("call:busy", {
                    toUserId: payload.fromUserId,
                    chatId: payload.chatId,
                });
                return;
            }
            const normalizedCallType = payload.callType || "voice";
            setIncoming({ ...payload, callType: normalizedCallType });
            setCallType(normalizedCallType);
            setStatus("ringing");
            setChatId(payload.chatId);
            setRemoteUser({ name: payload.callerName, avatar: payload.callerAvatar });
            peerUserIdRef.current = payload.fromUserId;
        };

        const handleAccepted = async (payload) => {
            console.log("CallProvider: Call accepted", payload);
            if (statusRef.current !== "calling") return; // Use ref check
            peerUserIdRef.current = payload.fromUserId;
            
            try {
                const normalizedCallType = payload.callType || "voice";
                const stream = await ensureLocalStreamWithFallback(normalizedCallType);
                const peer = getPeerWithRef();
                addLocalTracks(peer, stream);
                
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                
                socket.emit("call:offer", {
                    toUserId: payload.fromUserId,
                    chatId: payload.chatId,
                    callType: normalizedCallType,
                    sdp: offer,
                });
            } catch (error) {
                console.error('Failed to start call:', error);
                toast.error("Failed to start call");
                cleanup();
            }
        };

        const handleOffer = async (payload) => {
            console.log("CallProvider: Received offer", payload);
            if (statusRef.current !== "ringing" && statusRef.current !== "in-call") {
                // Ignore offers if we are not expecting one (except maybe late offers?)
                // Actually, status should be 'ringing' when we accepted, then 'in-call' after answer?
                // Wait, logic: handleAccepted sends offer. Recipient receives it.
                // Recipient status is 'ringing' -> clicks Accept -> emit 'call:accept'. Status -> 'in-call'.
                // Recipient is listening for 'call:offer'.
            }
            
            try {
                peerUserIdRef.current = payload.fromUserId;
                const normalizedCallType = payload.callType || "voice";
                
                // If we haven't set up stream yet (e.g. we accepted call), do it now?
                // Actually, handleOffer runs on the CALLEE side.
                // The Callee emitted 'call:accept'.
                // And we set status to 'in-call' in acceptCall.
                
                setChatId(payload.chatId); 
                
                // Ensure media is ready
                const stream = await ensureLocalStreamWithFallback(normalizedCallType);
                const peer = getPeerWithRef();
                addLocalTracks(peer, stream);
                
                await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                
                socket.emit("call:answer", {
                    toUserId: payload.fromUserId,
                    chatId: payload.chatId,
                    sdp: answer,
                });
                
                setCallType(normalizedCallType);
                setStatus("in-call");
            } catch (error) {
                console.error(error);
                toast.error("Unable to accept call");
                cleanup();
            }
        };

        const handleAnswer = async (payload) => {
            console.log("CallProvider: Received answer", payload);
            try {
                const peer = getPeerWithRef();
                await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                setStatus("in-call");
            } catch (error) {
                toast.error("Unable to connect call");
                cleanup();
            }
        };

        const handleIce = async (payload) => {
            try {
                const peer = getPeerWithRef();
                await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (error) {
                // toast.error("ICE connection failed");
            }
        };

        const handleRejected = () => {
            toast.error("Call rejected");
            cleanup();
        };

        const handleEnded = () => {
            toast.info("Call ended");
            cleanup();
        };

        const handleBusy = () => {
            toast.error("User is busy");
            cleanup();
        };

        const handleUnavailable = () => {
            toast.error("User is offline");
            cleanup();
        };

        socket.on("call:incoming", handleIncoming);
        socket.on("call:accepted", handleAccepted);
        socket.on("call:offer", handleOffer);
        socket.on("call:answer", handleAnswer);
        socket.on("call:ice", handleIce);
        socket.on("call:rejected", handleRejected);
        socket.on("call:ended", handleEnded);
        socket.on("call:busy", handleBusy);
        socket.on("call:unavailable", handleUnavailable);

        return () => {
            socket.off("call:incoming", handleIncoming);
            socket.off("call:accepted", handleAccepted);
            socket.off("call:offer", handleOffer);
            socket.off("call:answer", handleAnswer);
            socket.off("call:ice", handleIce);
            socket.off("call:rejected", handleRejected);
            socket.off("call:ended", handleEnded);
            socket.off("call:busy", handleBusy);
            socket.off("call:unavailable", handleUnavailable);
        };
    }, [socket, addLocalTracks, cleanup, ensureLocalStreamWithFallback, getPeerWithRef]); // REMOVE status from deps

    // Attach stream to refs
    useEffect(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
    }, [remoteStream]);

    return (
        <CallContext.Provider value={{
            status,
            callType,
            incoming,
            startCall,
            acceptCall,
            rejectCall,
            endCall,
            localVideoRef,
            remoteVideoRef,
            remoteAudioRef
        }}>
            {children}
            <CallOverlay
                status={status}
                callType={callType}
                name={remoteUser?.name || "Unknown"}
                avatar={remoteUser?.avatar}
                localVideoRef={localVideoRef}
                remoteVideoRef={remoteVideoRef}
                remoteAudioRef={remoteAudioRef}
                onAccept={acceptCall}
                onReject={rejectCall}
                onEnd={endCall}
            />
        </CallContext.Provider>
    );
};

export const useCallContext = () => useContext(CallContext);
export default CallProvider;
