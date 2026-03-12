import { useEffect, useState } from "react";
import { API } from "@/lib/axios-client";
import { useAuth } from "@/hooks/use-auth";

export const UserDistanceBadge = ({ otherUserId, currentUserId, showLocation = false }) => {
    const { user } = useAuth();
    const [distance, setDistance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [otherUserLocation, setOtherUserLocation] = useState(null);

    // Haversine formula to calculate distance between two coordinates
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Format distance for display
    const formatDistance = (km) => {
        if (km < 0.001) return "0m away";
        if (km < 1) {
            return `${Math.round(km * 1000)}m away`;
        }
        if (km < 100) {
            return `${km.toFixed(1)}km away`;
        }
        return `${Math.round(km)}km away`;
    };

    // Get color class and background based on distance
    const getDistanceStyles = (km) => {
        if (km < 0.1) {
            return {
                textColor: "text-green-600 dark:text-green-400",
                bgColor: "bg-green-50 dark:bg-green-950/30",
                borderColor: "border-green-200 dark:border-green-900/50",
            }; // Less than 100m
        }
        if (km < 0.5) {
            return {
                textColor: "text-emerald-600 dark:text-emerald-400",
                bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
                borderColor: "border-emerald-200 dark:border-emerald-900/50",
            }; // Less than 500m
        }
        if (km < 1) {
            return {
                textColor: "text-blue-600 dark:text-blue-400",
                bgColor: "bg-blue-50 dark:bg-blue-950/30",
                borderColor: "border-blue-200 dark:border-blue-900/50",
            }; // Less than 1km
        }
        if (km < 5) {
            return {
                textColor: "text-purple-600 dark:text-purple-400",
                bgColor: "bg-purple-50 dark:bg-purple-950/30",
                borderColor: "border-purple-200 dark:border-purple-900/50",
            }; // Less than 5km
        }
        return {
            textColor: "text-gray-600 dark:text-gray-400",
            bgColor: "bg-gray-50 dark:bg-gray-950/30",
            borderColor: "border-gray-200 dark:border-gray-900/50",
        }; // 5km+
    };

    useEffect(() => {
        const fetchAndCalculateDistance = async () => {
            try {
                setLoading(true);
                console.log("[Distance Badge] Fetching locations for users:", { otherUserId, currentUserId });
                
                // Fetch current user's location
                const currentUserRes = await API.get("/location/me");
                console.log("[Distance Badge] Current user location response:", currentUserRes.data);
                const currentUserLocation = currentUserRes.data?.data;

                // Fetch other user's location
                const otherUserRes = await API.get(`/location/user/${otherUserId}`);
                console.log("[Distance Badge] Other user location response:", otherUserRes.data);
                const otherUserLocation = otherUserRes.data?.data;

                if (
                    currentUserLocation?.latitude &&
                    currentUserLocation?.longitude &&
                    otherUserLocation?.latitude &&
                    otherUserLocation?.longitude
                ) {
                    const dist = calculateDistance(
                        currentUserLocation.latitude,
                        currentUserLocation.longitude,
                        otherUserLocation.latitude,
                        otherUserLocation.longitude
                    );
                    setDistance(dist);
                    setOtherUserLocation(otherUserLocation);
                } else {
                    setDistance(null);
                    setOtherUserLocation(null);
                }
            } catch (error) {
                if (error?.response?.status === 401) {
                    setDistance(null);
                    setOtherUserLocation(null);
                    return;
                }
                console.log("Error fetching locations:", error.message);
                setDistance(null);
                setOtherUserLocation(null);
            } finally {
                setLoading(false);
            }
        };

        if (user && otherUserId && currentUserId) {
            fetchAndCalculateDistance();
            
            // Refresh distance every 10 seconds for real-time updates
            const interval = setInterval(fetchAndCalculateDistance, 10000);
            return () => clearInterval(interval);
        }
    }, [user, otherUserId, currentUserId]);

    if (!user) {
        return null;
    }

    if (loading) {
        return (
            <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 6px",
                fontSize: "11px",
                color: "rgb(107, 114, 128)"
            }}>
                ⏳
            </span>
        );
    }

    if (distance === null) {
        return null;
    }

    const styles = getDistanceStyles(distance);

    return (
        <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "16px",
            fontSize: "12px",
            fontWeight: "500",
            border: `1px solid ${styles.borderColor}`,
            backgroundColor: styles.bgColor,
            color: styles.textColor
        }}>
            <span>📍</span>
            <span>{formatDistance(distance)}</span>
        </div>
    );
};

export default UserDistanceBadge;
