import { useState, useEffect, useRef, useCallback } from "react";
import { API } from "@/lib/axios-client";
import { useAuth } from "./use-auth";

/**
 * Hook to automatically update user location to backend
 * This enables real-time location sharing with other connected users
 */
export const useAutoLocationUpdate = () => {
    const { user } = useAuth();
    const [isTracking, setIsTracking] = useState(false);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const watchIdRef = useRef(null);
    const updateIntervalRef = useRef(null);
    const hasStartedRef = useRef(false);

    /**
     * Start tracking and updating location
     */
    const startTracking = useCallback(async () => {
        if (!user?.id) return;

        if (!("geolocation" in navigator)) {
            setError("Geolocation is not supported");
            return;
        }

        try {
            setIsTracking(true);
            setError(null);

            // Watch for position changes
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setLocation({ latitude, longitude, accuracy });
                },
                (err) => {
                    console.warn("[Location Tracking] Geolocation error:", err);
                    if (err.code === err.PERMISSION_DENIED) {
                        setError("Please enable location permission to use distance features");
                    } else if (err.code === err.POSITION_UNAVAILABLE) {
                        setError("Location information unavailable");
                    } else {
                        setError("Unable to get current location");
                    }
                    // Don't stop tracking on error - keep trying
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        } catch (err) {
            console.error("[Location Tracking] Error starting tracking:", err.message);
            setError(err.message);
            setIsTracking(false);
        }
    }, [user?.id]);

    /**
     * Stop tracking location
     */
    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
        }
        setIsTracking(false);
        setLocation(null);
    }, []);

    /**
     * Update location to backend
     */
    const updateLocationToBackend = useCallback(async (lat, lon, accuracy) => {
        if (!user?.id) return;

        try {
            await API.put("/location/update", {
                latitude: lat,
                longitude: lon,
                accuracy: accuracy,
            });
        } catch (error) {
            console.warn("Failed to update location:", error.message);
        }
    }, [user?.id]);

    /**
     * Setup periodic location updates to backend
     */
    useEffect(() => {
        if (!isTracking || !location) return;

        // Update immediately
        updateLocationToBackend(location.latitude, location.longitude, location.accuracy);

        // Setup interval for periodic updates (every 15 seconds)
        updateIntervalRef.current = setInterval(() => {
            if (location) {
                updateLocationToBackend(location.latitude, location.longitude, location.accuracy);
            }
        }, 15000);

        return () => {
            if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
                updateIntervalRef.current = null;
            }
        };
    }, [isTracking, location, updateLocationToBackend]);

    /**
     * Auto-start tracking when user is authenticated (only once)
     */
    useEffect(() => {
        if (user?.id && !hasStartedRef.current) {
            hasStartedRef.current = true;
            startTracking();
        }

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
            }
        };
    }, [user?.id, startTracking]);

    return {
        isTracking,
        location,
        error,
        startTracking,
        stopTracking,
    };
};
