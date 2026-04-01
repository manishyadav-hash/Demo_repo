import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "./use-socket";

/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in kilometers
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimals
};

/**
 * Convert distance to human-readable format
 */
const formatDistance = (distanceKm) => {
    if (distanceKm < 0.001) {
        return { value: 0, unit: "m", formatted: "0m", km: distanceKm };
    } else if (distanceKm < 1) {
        const meters = Math.round(distanceKm * 1000);
        return { value: meters, unit: "m", formatted: `${meters}m`, km: distanceKm };
    } else {
        return { value: distanceKm, unit: "km", formatted: `${distanceKm.toFixed(1)}km`, km: distanceKm };
    }
};

/**
 * Hook to manage current user's location sharing
 * Automatically gets GPS location and broadcasts it
 */
export const useAirLocation = () => {
    const [location, setLocation] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const locationWatchId = useRef(null);
    const { shareLocation, stopSharingLocation } = useSocket();

    /**
     * Get current GPS location using Geolocation API
     */
    const getCurrentLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!("geolocation" in navigator)) {
                reject(new Error("Geolocation is not supported by your browser"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setLocation({ latitude, longitude });
                    setAccuracy(accuracy);
                    setError(null);
                    resolve({ latitude, longitude, accuracy });
                },
                (error) => {
                    let errorMessage = "Unable to get your location";
                    if (error.code === error.PERMISSION_DENIED) {
                        errorMessage = "Location permission denied";
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMessage = "Location information unavailable";
                    }
                    setError(errorMessage);
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    }, []);

    /**
     * Start sharing location with automatic updates
     */
    const startSharing = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Get initial location
            const currentLoc = await getCurrentLocation();
            setLocation(currentLoc);
            setIsSharing(true);

            // Share initial location
            shareLocation(currentLoc.latitude, currentLoc.longitude, null, null, null, currentLoc.accuracy);

            // Watch for location changes
            locationWatchId.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setLocation({ latitude, longitude });
                    setAccuracy(accuracy);

                    // Broadcast updated location
                    shareLocation(latitude, longitude, null, null, null, accuracy);
                },
                (error) => {
                    console.error("Error watching location:", error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        } catch (err) {
            setError(err.message);
            setIsSharing(false);
        } finally {
            setLoading(false);
        }
    }, [getCurrentLocation, shareLocation]);

    /**
     * Stop sharing location
     */
    const stopSharing = useCallback(() => {
        if (locationWatchId.current !== null) {
            navigator.geolocation.clearWatch(locationWatchId.current);
            locationWatchId.current = null;
        }
        stopSharingLocation();
        setIsSharing(false);
        setLocation(null);
        setAccuracy(null);
    }, [stopSharingLocation]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (locationWatchId.current !== null) {
                navigator.geolocation.clearWatch(locationWatchId.current);
            }
        };
    }, []);

    return {
        location,
        isSharing,
        loading,
        error,
        accuracy,
        startSharing,
        stopSharing,
        getCurrentLocation,
        hasLocation: !!location,
    };
};

/**
 * Hook to track other user's location and calculate distance
 */
export const useOtherUserAirLocation = (userId) => {
    const [distance, setDistance] = useState(null);
    const [otherLocation, setOtherLocation] = useState(null);
    const { getUserLocation, getAllLocations } = useSocket();

    /**
     * Calculate distance between current user and other user
     */
    const calculateDistanceToUser = useCallback(() => {
        const userLoc = getUserLocation(userId);
        if (!userLoc) return null;

        setOtherLocation(userLoc);
        return userLoc;
    }, [userId, getUserLocation]);

    /**
     * Watch for location updates
     */
    useEffect(() => {
        const interval = setInterval(() => {
            const userLoc = calculateDistanceToUser();
            if (userLoc) {
                setDistance(userLoc.distance || 0);
                setOtherLocation(userLoc);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [calculateDistanceToUser]);

    return {
        location: otherLocation,
        distance,
        hasLocation: !!otherLocation,
        distanceFormatted: distance ? formatDistance(distance) : null,
    };
};

/**
 * Hook to manage nearby users with real-time distance updates
 */
export const useNearbyUsersAir = (currentUserLocation) => {
    const [nearbyUsers, setNearbyUsers] = useState([]);
    const [sortedUsers, setSortedUsers] = useState([]);
    const { getAllLocations } = useSocket();

    /**
     * Calculate distances to all nearby users
     */
    const updateNearbyUsers = useCallback(() => {
        if (!currentUserLocation) return;

        const allLocations = getAllLocations();
        const users = Object.values(allLocations).map((userLoc) => ({
            ...userLoc,
            distanceKm: haversineDistance(
                currentUserLocation.latitude,
                currentUserLocation.longitude,
                userLoc.latitude,
                userLoc.longitude
            ),
        }));

        setNearbyUsers(users);
        setSortedUsers(
            users.sort((a, b) => a.distanceKm - b.distanceKm)
        );
    }, [currentUserLocation, getAllLocations]);

    /**
     * Watch for location changes
     */
    useEffect(() => {
        const interval = setInterval(updateNearbyUsers, 2000);
        updateNearbyUsers();

        return () => clearInterval(interval);
    }, [updateNearbyUsers]);

    return {
        nearbyUsers: sortedUsers,
        count: sortedUsers.length,
        total: nearbyUsers.length,
        getDistanceFormatted: (distanceKm) => formatDistance(distanceKm),
    };
};

export { formatDistance, haversineDistance };
