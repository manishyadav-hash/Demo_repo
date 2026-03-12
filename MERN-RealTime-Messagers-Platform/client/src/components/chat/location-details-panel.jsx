import { useEffect, useState } from "react";
import { API } from "@/lib/axios-client";

export const LocationDetailsPanel = ({ otherUserId, currentUserId }) => {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [otherLocation, setOtherLocation] = useState(null);
    const [distance, setDistance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bearing, setBearing] = useState(null);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 1000) / 1000;
    };

    const calculateBearing = (lat1, lon1, lat2, lon2) => {
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
        const x =
            Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
            Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
        const bearingRad = Math.atan2(y, x);
        const bearingDeg = ((bearingRad * 180) / Math.PI + 360) % 360;
        return Math.round(bearingDeg);
    };

    const getDirectionLabel = (bearing) => {
        if (bearing < 45) return "North";
        if (bearing < 90) return "Northeast";
        if (bearing < 135) return "East";
        if (bearing < 180) return "Southeast";
        if (bearing < 225) return "South";
        if (bearing < 270) return "Southwest";
        if (bearing < 315) return "West";
        return "Northwest";
    };

    const formatDistance = (km) => {
        if (km < 1) {
            return `${Math.round(km * 1000)}m`;
        }
        return `${km.toFixed(1)}km`;
    };

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoading(true);

                const currentRes = await API.get("/location/me");
                const otherRes = await API.get(`/location/user/${otherUserId}`);

                const currLoc = currentRes.data?.data;
                const otherLoc = otherRes.data?.data;

                setCurrentLocation(currLoc);
                setOtherLocation(otherLoc);

                if (currLoc && otherLoc && currLoc.latitude && otherLoc.latitude) {
                    const dist = calculateDistance(
                        currLoc.latitude,
                        currLoc.longitude,
                        otherLoc.latitude,
                        otherLoc.longitude
                    );
                    const brng = calculateBearing(
                        currLoc.latitude,
                        currLoc.longitude,
                        otherLoc.latitude,
                        otherLoc.longitude
                    );
                    setDistance(dist);
                    setBearing(brng);
                }
            } catch (error) {
                console.warn("Error fetching locations:", error.message);
            } finally {
                setLoading(false);
            }
        };

        if (otherUserId && currentUserId) {
            fetchLocations();
            const interval = setInterval(fetchLocations, 15000);
            return () => clearInterval(interval);
        }
    }, [otherUserId, currentUserId]);

    if (loading) {
        return (
            <div style={{
                padding: "8px",
                backgroundColor: "rgba(156, 163, 175, 0.1)",
                border: "1px solid rgba(156, 163, 175, 0.3)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "rgb(107, 114, 128)"
            }}>
                ⏳ Fetching distance...
            </div>
        );
    }

    if (!distance) {
        return (
            <div style={{
                padding: "8px",
                backgroundColor: "rgba(156, 163, 175, 0.1)",
                border: "1px solid rgba(156, 163, 175, 0.3)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "rgb(107, 114, 128)"
            }}>
                📍 Location not yet shared
            </div>
        );
    }

    return (
        <div style={{
            padding: "8px",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "14px"
        }}>
            <span style={{ color: "rgb(37, 99, 235)" }}>📍</span>
            <span style={{ fontWeight: "600", color: "rgb(37, 99, 235)" }}>
                Distance: {formatDistance(distance)}
            </span>
            {bearing !== null && (
                <span style={{ color: "rgb(34, 197, 94)", marginLeft: "auto" }}>
                    {getDirectionLabel(bearing)}
                </span>
            )}
        </div>
    );
};

export default LocationDetailsPanel;
