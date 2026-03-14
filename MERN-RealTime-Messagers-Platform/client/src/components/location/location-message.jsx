import { useEffect, useState } from "react";
import { MapPin, Navigation, ExternalLink, Ruler, Lock } from "lucide-react";
import { API } from "@/lib/axios-client";
import { useDistance } from "@/hooks/use-distance";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import { AUTH_ROUTES } from "@/routes/routes";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export const LocationMessage = ({ 
    latitude, 
    longitude, 
    address,
    className = "" 
}) => {
    const { user } = useAuth();
    const { calculateDistance, formatDistance } = useDistance();
    const [distanceKm, setDistanceKm] = useState(null);
    // Convert to numbers if they come as strings from database
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lon = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

    useEffect(() => {
        let isActive = true;

        const fetchCurrentLocation = async () => {
            try {
                const response = await API.get("/location/me");
                const currentLocation = response.data?.location;

                if (currentLocation?.latitude && currentLocation?.longitude) {
                    const distance = calculateDistance(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        lat,
                        lon
                    );
                    if (isActive) {
                        setDistanceKm(distance);
                    }
                } else if (isActive) {
                    setDistanceKm(null);
                }
            } catch (error) {
                if (error?.response?.status === 401) {
                    if (isActive) {
                        setDistanceKm(null);
                    }
                    return;
                }
                if (isActive) {
                    setDistanceKm(null);
                }
            }
        };

        if (user && !isNaN(lat) && !isNaN(lon)) {
            fetchCurrentLocation();
        }

        return () => {
            isActive = false;
        };
    }, [user, lat, lon]);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lon)) {
        return (
            <Card className={`overflow-hidden max-w-sm bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 ${className}`}>
                <div className="p-4">
                    <p className="text-sm text-red-600 dark:text-red-400">Invalid location data</p>
                </div>
            </Card>
        );
    }

    const openInMaps = () => {
        // Open in Google Maps
        const url = `https://www.google.com/maps?q=${lat},${lon}`;
        window.open(url, "_blank");
    };

    const getDirections = () => {
        // Open directions in Google Maps
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
        window.open(url, "_blank");
    };

    const distanceLabel = !user
        ? "Sign in to see distance"
        : distanceKm !== null
        ? `${formatDistance(distanceKm)} away`
        : "Distance unavailable";

    return (
        <Card className={`overflow-hidden w-full max-w-[280px] sm:max-w-sm bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 ${className}`}>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-blue-100 dark:border-blue-800/60 bg-white/70 dark:bg-gray-900/40 sm:px-4 sm:py-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 sm:gap-2 sm:text-sm flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>Location Shared</span>
                </div>
                {user ? (
                    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold min-w-0 flex-shrink sm:px-2.5 sm:py-1 sm:text-xs sm:gap-1.5 ${distanceKm !== null ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                        <Ruler className="w-3 h-3 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                        <span className="truncate">{distanceLabel}</span>
                    </div>
                ) : (
                    <Link
                        to={AUTH_ROUTES.SIGN_IN}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold min-w-0 flex-shrink bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors sm:px-2.5 sm:py-1 sm:text-xs sm:gap-1.5"
                    >
                        <Lock className="w-3 h-3 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                        <span className="truncate">{distanceLabel}</span>
                    </Link>
                )}
            </div>

            {/* Map Preview */}
            <div className="relative h-48 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                        <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                    </svg>
                </div>
                <MapPin className="w-12 h-12 text-red-500 drop-shadow-lg relative z-10" fill="currentColor" />
            </div>

            {/* Location Info */}
            <div className="p-3 space-y-2.5 sm:p-4 sm:space-y-3">
                {address && (
                    <div className="flex items-start gap-1.5 sm:gap-2">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 sm:text-sm">
                            {address}
                        </p>
                    </div>
                )}
                
                <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1.5 rounded overflow-hidden sm:gap-2 sm:text-xs">
                    <span className="font-mono truncate">{lat.toFixed(6)}</span>
                    <span className="flex-shrink-0">,</span>
                    <span className="font-mono truncate">{lon.toFixed(6)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5 sm:gap-2">
                    <Button
                        onClick={openInMaps}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs sm:h-9 sm:text-sm"
                    >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Open Map
                    </Button>
                    <Button
                        onClick={getDirections}
                        size="sm"
                        className="flex-1 h-8 text-xs sm:h-9 sm:text-sm"
                    >
                        <Navigation className="w-3 h-3 mr-1" />
                        Directions
                    </Button>
                </div>
            </div>
        </Card>
    );
};
