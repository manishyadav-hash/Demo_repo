import { io } from "socket.io-client";
import { create } from "zustand";
// Dynamically determine Socket.IO URL based on current host
const getSocketUrl = () => {
    if (import.meta.env.MODE === "production") {
        return "/";
    }
    // In development, use the current hostname to determine backend URL
    const hostname = window.location.hostname;
    const backendPort = 3001;
    return `http://${hostname}:${backendPort}`;
};
const BASE_URL = getSocketUrl();
export const useSocket = create()((set, get) => ({
    socket: null,
    onlineUsers: [],
    activeLocations: {}, // userId -> { latitude, longitude, distance, ...}
    connectSocket: () => {
        const { socket } = get();
        console.log(socket, "socket");
        if (socket?.connected)
            return;
        const newSocket = io(BASE_URL, {
            withCredentials: true,
            autoConnect: true,
        });
        set({ socket: newSocket });
        newSocket.on("connect", () => {
            console.log("Socket connected", newSocket.id);
        });
        newSocket.on("online:users", (userIds) => {
            console.log("Online users", userIds);
            set({ onlineUsers: userIds });
        });
        
        // ========== AIR LOCATION SOCKET LISTENERS ==========
        
        /**
         * Listen for location shares from other users
         */
        newSocket.on("location:shared", (locationData) => {
            console.log("Location shared:", locationData);
            const { userId: sharedUserId, latitude, longitude, nearbyUsers, ...rest } = locationData;
            
            set((state) => ({
                activeLocations: {
                    ...state.activeLocations,
                    [sharedUserId]: {
                        userId: sharedUserId,
                        latitude,
                        longitude,
                        nearbyUsers: nearbyUsers || [],
                        ...rest,
                    },
                },
            }));
        });
        
        /**
         * Listen for location stop events
         */
        newSocket.on("location:stopped", ({ userId: stoppedUserId }) => {
            console.log("Location stopped:", stoppedUserId);
            set((state) => {
                const { [stoppedUserId]: _, ...rest } = state.activeLocations;
                return { activeLocations: rest };
            });
        });
        
        /**
         * Listen for location requests from other users
         */
        newSocket.on("location:requesting", ({ fromUserId }) => {
            console.log("Location requested by:", fromUserId);
        });
    },
    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    },
    
    // ========== AIR LOCATION METHODS ==========
    
    /**
     * Share current location with all users
     */
    shareLocation: (latitude, longitude, address, city, country, accuracy) => {
        const { socket } = get();
        if (socket?.connected) {
            socket.emit("location:share", {
                latitude,
                longitude,
                address,
                city,
                country,
                accuracy,
            });
        }
    },
    
    /**
     * Stop sharing location
     */
    stopSharingLocation: () => {
        const { socket } = get();
        if (socket?.connected) {
            socket.emit("location:stop");
        }
    },
    
    /**
     * Request another user's location
     */
    requestUserLocation: (toUserId) => {
        const { socket } = get();
        if (socket?.connected) {
            socket.emit("location:request", { toUserId });
        }
    },
    
    /**
     * Get all active locations
     */
    getAllLocations: () => {
        const { activeLocations } = get();
        return activeLocations;
    },
    
    /**
     * Get specific user's location
     */
    getUserLocation: (userId) => {
        const { activeLocations } = get();
        return activeLocations[userId] || null;
    },
    
    /**
     * Get nearby users for current location
     */
    getNearbyUsers: (userId) => {
        const { activeLocations } = get();
        const userLocation = activeLocations[userId];
        return userLocation?.nearbyUsers || [];
    },
}));
