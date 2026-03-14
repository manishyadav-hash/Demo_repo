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
    const firstFixTimeoutRef = useRef(null);
    const hasStartedRef = useRef(false);

    const getGeoErrorMessage = useCallback((err) => {
        if (err?.code === err.PERMISSION_DENIED) {
            return "Location permission denied. Enable it in browser settings.";
        }
        if (err?.code === err.POSITION_UNAVAILABLE) {
            return "Location unavailable. Turn on GPS/location services on your phone.";
        }
        if (err?.code === err.TIMEOUT) {
            return "Location request timed out. Try moving near a window and retry.";
        }
        return "Unable to get current location";
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
        } catch (requestError) {
            console.warn("Failed to update location:", requestError.message);
        }
    }, [user?.id]);

    const pushLocation = useCallback(async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({ latitude, longitude, accuracy });
        setError(null);
        await updateLocationToBackend(latitude, longitude, accuracy);
    }, [updateLocationToBackend]);

    const requestCurrentPosition = useCallback((options) => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    }, []);

    /**
     * Start tracking and updating location
     */
    const startTracking = useCallback(async () => {
        if (!user?.id) return;

        if (!("geolocation" in navigator)) {
            setError("Geolocation is not supported");
            return;
        }

        // On mobile, http://IP is not a secure context for geolocation.
        if (!window.isSecureContext) {
            setIsTracking(false);
            setError("Phone location requires HTTPS (or localhost). Open this app over HTTPS.");
            return;
        }

        try {
            setIsTracking(true);
            setError(null);

            // Clear any previous tracking before starting a fresh session.
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            if (firstFixTimeoutRef.current) {
                clearTimeout(firstFixTimeoutRef.current);
                firstFixTimeoutRef.current = null;
            }

            // Try to get an initial position quickly so UI does not stay in "Locating" forever.
            try {
                const initialPosition = await requestCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000,
                });
                await pushLocation(initialPosition);
            } catch (initialErr) {
                // Fallback mode for devices where high-accuracy GPS is slow/blocked.
                try {
                    const fallbackPosition = await requestCurrentPosition({
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 30000,
                    });
                    await pushLocation(fallbackPosition);
                } catch (fallbackErr) {
                    setError(getGeoErrorMessage(fallbackErr));
                    if (fallbackErr?.code === fallbackErr.PERMISSION_DENIED) {
                        setIsTracking(false);
                        return;
                    }
                }
            }

            // Watch for position changes
            watchIdRef.current = navigator.geolocation.watchPosition(
                async (position) => {
                    await pushLocation(position);
                },
                (err) => {
                    console.warn("[Location Tracking] Geolocation error:", err);
                    setError(getGeoErrorMessage(err));
                    if (err.code === err.PERMISSION_DENIED) {
                        setIsTracking(false);
                        if (watchIdRef.current !== null) {
                            navigator.geolocation.clearWatch(watchIdRef.current);
                            watchIdRef.current = null;
                        }
                    }
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 10000,
                }
            );

            // If no location fix appears soon, surface actionable error instead of endless locating.
            firstFixTimeoutRef.current = setTimeout(() => {
                setLocation((prev) => {
                    if (!prev) {
                        setError("Could not get GPS fix. Enable phone location services and retry.");
                        setIsTracking(false);
                    }
                    return prev;
                });
            }, 20000);
        } catch (err) {
            console.error("[Location Tracking] Error starting tracking:", err.message);
            setError(err.message);
            setIsTracking(false);
        }
    }, [user?.id, getGeoErrorMessage, pushLocation, requestCurrentPosition]);

    /**
     * Stop tracking location
     */
    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (firstFixTimeoutRef.current) {
            clearTimeout(firstFixTimeoutRef.current);
            firstFixTimeoutRef.current = null;
        }
        if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
        }
        setIsTracking(false);
        setLocation(null);
    }, []);

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
            if (firstFixTimeoutRef.current) {
                clearTimeout(firstFixTimeoutRef.current);
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
