import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import type { CallStatus, CallType } from "@/components/chat/call-overlay";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  // Public TURN servers for mobile NAT traversal
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
];

type IncomingCall = {
  fromUserId: string;
  chatId: string;
  callType: CallType;
};

interface UseCallArgs {
  socket: Socket | null;
  chatId: string | null;
  currentUserId: string | null;
  otherUserId: string | null;
}

export const useCall = ({
  socket,
  chatId,
  currentUserId,
  otherUserId,
}: UseCallArgs) => {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [callType, setCallType] = useState<CallType | null>(null);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const peerUserIdRef = useRef<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const cleanup = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    peerUserIdRef.current = null;
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setIncoming(null);
    setCallType(null);
    setStatus("idle");
  }, [localStream]);

  const ensureLocalStream = useCallback(
    async (type: CallType) => {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const isLocalIP = window.location.hostname.match(/^(10|172\.16|192\.168)\.\d+\.\d+$/);
        const isHTTP = window.location.protocol === 'http:';
        
        if (isHTTP && isLocalIP) {
          throw new Error(
            "Mobile browsers require HTTPS for microphone access. " +
            "On Chrome mobile: Go to chrome://flags, search 'insecure origins', " +
            "add 'http://" + window.location.hostname + ":5177' and restart browser. " +
            "Or use laptop browser for testing."
          );
        }
        throw new Error("Your browser doesn't support media access. Please use Chrome or Edge.");
      }
      
      const needsVideo = type === "video";
      if (localStream) {
        const hasVideo = localStream.getVideoTracks().length > 0;
        if (!needsVideo || hasVideo) return localStream;
      }
      
      // Enhanced constraints for better mobile compatibility
      const enhancedConstraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: needsVideo ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "user",
        } : false,
      };
      
      const basicConstraints: MediaStreamConstraints = {
        audio: true,
        video: needsVideo ? { facingMode: "user" } : false,
      };
      
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
          const errorMessage = basicError instanceof Error ? basicError.message : "Unknown error";
          if (errorMessage.includes("Permission") || errorMessage.includes("NotAllowed")) {
            throw new Error("Please allow microphone access in your browser settings");
          } else if (errorMessage.includes("NotFound") || errorMessage.includes("Device")) {
            throw new Error("No microphone found on your device");
          } else if (errorMessage.includes("NotReadable") || errorMessage.includes("InUse")) {
            throw new Error("Microphone is already in use by another app");
          } else if (errorMessage.includes("NotSupported") || errorMessage.includes("https")) {
            throw new Error("Please use HTTPS to access media devices");
          }
          throw new Error("Failed to access microphone: " + errorMessage);
        }
      }
    },
    [localStream]
  );

  const ensureLocalStreamWithFallback = useCallback(
    async (requestedType: CallType) => {
      try {
        return await ensureLocalStream(requestedType);
      } catch (error) {
        if (requestedType === "video") {
          toast.info("Camera not available, using audio only");
          return await ensureLocalStream("voice");
        }
        throw error;
      }
    },
    [ensureLocalStream]
  );

  const getPeer = useCallback(() => {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection({ 
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
    });

    peer.onicecandidate = (event) => {
      if (!event.candidate || !socket || !peerUserIdRef.current || !chatId) {
        return;
      }
      socket.emit("call:ice", {
        toUserId: peerUserIdRef.current,
        chatId,
        candidate: event.candidate,
      });
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
      }
    };

    peerRef.current = peer;
    return peer;
  }, [chatId, socket]);

  const addLocalTracks = useCallback((peer: RTCPeerConnection, stream: MediaStream) => {
    const existingSenders = peer.getSenders();
    stream.getTracks().forEach((track) => {
      const sender = existingSenders.find(
        (candidate) => candidate.track?.kind === track.kind
      );
      if (sender) {
        sender.replaceTrack(track);
      } else {
        peer.addTrack(track, stream);
      }
    });
  }, []);

  const startCall = useCallback(
    async (type: CallType) => {
      if (!socket || !chatId || !currentUserId || !otherUserId) {
        toast.error("Unable to start call");
        return;
      }
      if (status !== "idle") return;
      let actualType: CallType = type;

      try {
        if (type === "video") {
          try {
            await ensureLocalStream("video");
          } catch (error) {
            toast.info("Camera not available, starting voice call");
            actualType = "voice";
            await ensureLocalStream("voice");
          }
        } else {
          // For voice calls, ensure we can access microphone first
          await ensureLocalStream("voice");
        }
      } catch (mediaError) {
        const errorMessage = mediaError instanceof Error ? mediaError.message : "Unable to access microphone";
        toast.error(errorMessage);
        return;
      }

      setCallType(actualType);
      setStatus("calling");
      peerUserIdRef.current = otherUserId;

      socket.emit("call:request", {
        toUserId: otherUserId,
        chatId,
        callType: actualType,
      });
    },
    [socket, chatId, currentUserId, otherUserId, status, ensureLocalStream]
  );

  const acceptCall = useCallback(async () => {
    if (!socket || !incoming) return;
    peerUserIdRef.current = incoming.fromUserId;

    const requestedType: CallType = incoming.callType || "voice";

    try {
      const peer = getPeer();
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
      const errorMessage = error instanceof Error ? error.message : "Unable to access media devices";
      toast.error(errorMessage);
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

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (payload: IncomingCall) => {
      if (status !== "idle") {
        socket.emit("call:reject", {
          toUserId: payload.fromUserId,
          chatId: payload.chatId,
        });
        return;
      }
      const normalizedCallType = payload.callType || "voice";
      setIncoming({ ...payload, callType: normalizedCallType });
      setCallType(normalizedCallType);
      setStatus("ringing");
      peerUserIdRef.current = payload.fromUserId;
    };

    const handleAccepted = async (payload: IncomingCall) => {
      if (status !== "calling") return;
      peerUserIdRef.current = payload.fromUserId;
      try {
        const normalizedCallType = payload.callType || "voice";
        const stream = await ensureLocalStreamWithFallback(normalizedCallType);
        const peer = getPeer();
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
        const errorMessage = error instanceof Error ? error.message : "Failed to start call";
        toast.error(errorMessage);
        cleanup();
      }
    };

    const handleOffer = async (payload: {
      fromUserId: string;
      chatId: string;
      callType: CallType;
      sdp: RTCSessionDescriptionInit;
    }) => {
      try {
        peerUserIdRef.current = payload.fromUserId;
        const normalizedCallType = payload.callType || "voice";
        const stream = await ensureLocalStreamWithFallback(normalizedCallType);
        const peer = getPeer();
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
        toast.error("Unable to accept call");
        cleanup();
      }
    };

    const handleAnswer = async (payload: {
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      try {
        const peer = getPeer();
        await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        setStatus("in-call");
      } catch (error) {
        toast.error("Unable to connect call");
        cleanup();
      }
    };

    const handleIce = async (payload: { candidate: RTCIceCandidateInit }) => {
      try {
        const peer = getPeer();
        await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (error) {
        toast.error("ICE connection failed");
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
  }, [addLocalTracks, cleanup, ensureLocalStreamWithFallback, getPeer, socket, status]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return {
    status,
    callType,
    incoming,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
  };
};
