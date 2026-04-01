import { useState, useEffect } from "react";
import { useOtherUserAirLocation, formatDistance } from "../../hooks/use-air-location";
import { MapPin, Navigation, Info } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

/**
 * Component to view another user's air location
 * Shows real-time distance and location details
 */
export const ViewUserAirLocation = ({ userId, userName }) => {
    const { location, distance, distanceFormatted, hasLocation } = useOtherUserAirLocation(userId);
    const [showCoordinates, setShowCoordinates] = useState(false);

    if (!hasLocation) {
        return (
            <Card className="p-6 text-center bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20">
                <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {userName || "User"} hasn't shared their location yet
                </p>
            </Card>
        );
    }

    // Determine proximity category and colors
    const proximityInfo = distance < 0.1
        ? {
            badge: "Very Close",
            bgGradient: "from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30",
            borderColor: "border-green-200 dark:border-green-800",
            badgeColor: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
            icon: "🟢",
            pulseColor: "#10b981"
        }
        : distance < 0.5
        ? {
            badge: "Within 500m",
            bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30",
            borderColor: "border-blue-200 dark:border-blue-800",
            badgeColor: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
            icon: "🔵",
            pulseColor: "#3b82f6"
        }
        : distance < 2
        ? {
            badge: "Close",
            bgGradient: "from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30",
            borderColor: "border-yellow-200 dark:border-yellow-800",
            badgeColor: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300",
            icon: "🟡",
            pulseColor: "#eab308"
        }
        : {
            badge: "Far",
            bgGradient: "from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20",
            borderColor: "border-gray-200 dark:border-gray-700",
            badgeColor: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
            icon: "⚪",
            pulseColor: "#9ca3af"
        };

    return (
        <Card className={`bg-gradient-to-br ${proximityInfo.bgGradient} ${proximityInfo.borderColor} p-6 shadow-lg`}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {userName || "User"}'s Location
                        </h3>
                        <p className={`text-sm font-medium ${
                            proximityInfo.badgeColor.includes("green")
                                ? "text-green-600 dark:text-green-400"
                                : proximityInfo.badgeColor.includes("blue")
                                ? "text-blue-600 dark:text-blue-400"
                                : proximityInfo.badgeColor.includes("yellow")
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-gray-600 dark:text-gray-400"
                        }`}>
                            {proximityInfo.icon} {proximityInfo.badge}
                        </p>
                    </div>
                </div>

                {/* Distance Display */}
                <div className="relative p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-white dark:border-gray-700 overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{
                        background: `radial-gradient(circle at center, ${proximityInfo.pulseColor} 0%, transparent 70%)`
                    }}></div>
                    
                    <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                                Distance
                            </p>
                            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                                {distanceFormatted?.formatted || "Calculating..."}
                            </p>
                        </div>

                        <div className="relative flex items-center justify-center">
                            <div className="absolute animate-ping rounded-full h-16 w-16 opacity-20"
                                style={{ backgroundColor: proximityInfo.pulseColor }}></div>
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl">
                                📍
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location Details */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                            Latitude
                        </p>
                        <p className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">
                            {location?.latitude?.toFixed(6) || "N/A"}
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                            Longitude
                        </p>
                        <p className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">
                            {location?.longitude?.toFixed(6) || "N/A"}
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                            Update Status
                        </p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                            • Live
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                            Accuracy
                        </p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            ±{location?.accuracy ? Math.round(location.accuracy) : '?'}m
                        </p>
                    </div>
                </div>

                {/* Coordinates Toggle */}
                <button
                    onClick={() => setShowCoordinates(!showCoordinates)}
                    className="w-full flex items-center justify-center gap-2 p-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                    <Info className="w-4 h-4" />
                    {showCoordinates ? "Hide Full Coordinates" : "View Full Coordinates"}
                </button>

                {showCoordinates && (
                    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Full Location Data:
                        </p>
                        <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono overflow-x-auto">
                            {JSON.stringify(location, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            // Copy coordinates to clipboard
                            const coordText = `${location?.latitude},${location?.longitude}`;
                            navigator.clipboard.writeText(coordText);
                        }}
                    >
                        📋 Copy Coords
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            // Open in Google Maps
                            window.open(
                                `https://maps.google.com/?q=${location?.latitude},${location?.longitude}`,
                                "_blank"
                            );
                        }}
                    >
                        🗺️ Open Map
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default ViewUserAirLocation;
