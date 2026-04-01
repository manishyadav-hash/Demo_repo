import { useState } from "react";

/**
 * Hook to get and track user's current location
 */
export const useLocation = () => {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Check if geolocation is supported
    const isSupported = () => {
        return "geolocation" in navigator;
    };

    // Get current position
    const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
            if (!isSupported()) {
                reject(new Error("Geolocation is not supported by your browser"));
                return;
            }

            setLoading(true);
            setError(null);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date(position.timestamp),
                    };
                    setLocation(locationData);
                    setPermissionGranted(true);
                    setLoading(false);
                    resolve(locationData);
                },
                (err) => {
                    let errorMessage = "Unable to retrieve your location";
                    
                    switch(err.code) {
                        case err.PERMISSION_DENIED:
                            errorMessage = "Location permission denied";
                            setPermissionGranted(false);
                            break;
                        case err.POSITION_UNAVAILABLE:
                            errorMessage = "Location information unavailable";
                            break;
                        case err.TIMEOUT:
                            errorMessage = "Location request timed out";
                            break;
                        default:
                            errorMessage = "An unknown error occurred";
                    }
                    
                    setError(errorMessage);
                    setLoading(false);
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    };

    // Watch position changes
    const watchPosition = (callback) => {
        if (!isSupported()) {
            setError("Geolocation is not supported by your browser");
            return null;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date(position.timestamp),
                };
                setLocation(locationData);
                setPermissionGranted(true);
                if (callback) callback(locationData);
            },
            (err) => {
                let errorMessage = "Unable to watch your location";
                
                switch(err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = "Location permission denied";
                        setPermissionGranted(false);
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable";
                        break;
                    case err.TIMEOUT:
                        errorMessage = "Location request timed out";
                        break;
                }
                
                setError(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );

        return watchId;
    };

    // Stop watching position
    const clearWatch = (watchId) => {
        if (watchId && isSupported()) {
            navigator.geolocation.clearWatch(watchId);
        }
    };

    // Get address from coordinates (reverse geocoding)
    const getAddressFromCoords = async (latitude, longitude) => {
        try {
            // Using OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            
            if (!response.ok) {
                throw new Error("Failed to fetch address");
            }

            const data = await response.json();
            return {
                address: data.display_name,
                city: data.address?.city || data.address?.town || data.address?.village || "",
                country: data.address?.country || "",
                details: data.address,
            };
        } catch (err) {
            console.error("Error fetching address:", err);
            return null;
        }
    };

    return {
        location,
        loading,
        error,
        permissionGranted,
        isSupported: isSupported(),
        getCurrentPosition,
        watchPosition,
        clearWatch,
        getAddressFromCoords,
    };
};
