import { useState, useEffect } from "react";
import { API } from "../../lib/axios-client";
import { useDistance } from "../../hooks/use-distance";
import { Spinner } from "../ui/spinner";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { MapPin, Users, RefreshCw, MessageCircle, Navigation } from "lucide-react";

export const NearbyUsers = ({ radius = 5, onUserSelect, onStartChat }) => {
    const [nearbyUsers, setNearbyUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { formatDistance } = useDistance();

    const fetchNearbyUsers = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await API.get(
                `/location/nearby?radius=${radius}&limit=20`
            );
            setNearbyUsers(response.data.data || []);
        } catch (err) {
            console.error("Error fetching nearby users:", err);
            setError(
                err.response?.data?.message || 
                "Failed to fetch nearby users. Please share your location first."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNearbyUsers();
        // Refresh every 30 seconds
        const interval = setInterval(fetchNearbyUsers, 30000);
        return () => clearInterval(interval);
    }, [radius]);

    // Helper function to get distance in km with proper formatting
    const getDistanceDisplay = (distanceKm) => {
        if (distanceKm < 1) {
            const meters = Math.round(distanceKm * 1000);
            return { label: `${meters}m`, value: meters, unit: "m", km: distanceKm };
        }
        return { label: `${distanceKm.toFixed(1)}km`, value: distanceKm.toFixed(1), unit: "km", km: distanceKm };
    };

    // Helper function to get proximity category and colors
    const getProximityInfo = (distanceKm) => {
        if (distanceKm < 0.1) {
            return {
                category: "Very Close",
                bgColor: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30",
                borderColor: "border-green-200 dark:border-green-700",
                badgeColor: "bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-100",
                dotColor: "bg-green-500",
                icon: "🟢"
            };
        } else if (distanceKm < 0.5) {
            return {
                category: "Within 500m",
                bgColor: "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30",
                borderColor: "border-emerald-200 dark:border-emerald-700",
                badgeColor: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-100",
                dotColor: "bg-emerald-500",
                icon: "🟢"
            };
        } else if (distanceKm < 1) {
            return {
                category: "Close",
                bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30",
                borderColor: "border-blue-200 dark:border-blue-700",
                badgeColor: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-100",
                dotColor: "bg-blue-500",
                icon: "🔵"
            };
        } else if (distanceKm < 5) {
            return {
                category: "Nearby",
                bgColor: "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30",
                borderColor: "border-purple-200 dark:border-purple-700",
                badgeColor: "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-100",
                dotColor: "bg-purple-500",
                icon: "🟣"
            };
        } else {
            return {
                category: "Far",
                bgColor: "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30",
                borderColor: "border-gray-200 dark:border-gray-700",
                badgeColor: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
                dotColor: "bg-gray-400",
                icon: "⚪"
            };
        }
    };

    if (loading && nearbyUsers.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner className="w-6 h-6" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Finding nearby users...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-100 rounded-lg space-y-3">
                <p className="text-sm">{error}</p>
                <Button onClick={fetchNearbyUsers} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </div>
        );
    }

    // Sort by distance
    const sortedUsers = [...nearbyUsers].sort((a, b) => a.distance - b.distance);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="absolute -top-2 -right-2 bg-blue-600 dark:bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {nearbyUsers.length}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Nearby Users
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Within {radius} km
                        </p>
                    </div>
                </div>
                <Button
                    onClick={fetchNearbyUsers}
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {nearbyUsers.length === 0 ? (
                <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">No users found nearby</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Try increasing the search radius or sharing your location
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {sortedUsers.map((userLocation, index) => {
                        const distanceInfo = getDistanceDisplay(userLocation.distance);
                        const proximityInfo = getProximityInfo(userLocation.distance);

                        return (
                            <Card
                                key={userLocation.userId}
                                className={`p-5 border-2 transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl cursor-pointer transform hover:scale-102 ${proximityInfo.bgColor} ${proximityInfo.borderColor}`}
                                onClick={() => onUserSelect?.(userLocation)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Left: Avatar & User Info */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="relative flex-shrink-0">
                                            {userLocation.user?.avatar ? (
                                                <img
                                                    src={userLocation.user.avatar}
                                                    alt={userLocation.user.name}
                                                    className="w-16 h-16 rounded-full object-cover border-3 border-white dark:border-gray-700 shadow-lg"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg border-3 border-white dark:border-gray-700">
                                                    {userLocation.user?.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${proximityInfo.dotColor} rounded-full border-3 border-white dark:border-gray-700 shadow-md`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg">
                                                {userLocation.user?.name}
                                            </h3>
                                            {userLocation.city && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                    {userLocation.city}
                                                    {userLocation.country && `, ${userLocation.country}`}
                                                </p>
                                            )}
                                            
                                            {/* Distance Badge - Inline */}
                                            <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${proximityInfo.badgeColor} shadow-sm`}>
                                                <span className="text-base">{proximityInfo.icon}</span>
                                                <span>{proximityInfo.category}</span>
                                                <span className="text-xs opacity-75">•</span>
                                                <span className="font-mono">{distanceInfo.label}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Large Distance Display & Actions */}
                                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                        {/* Prominent Distance Circle */}
                                        <div className={`relative w-24 h-24 rounded-full ${proximityInfo.bgColor} border-3 ${proximityInfo.borderColor} flex flex-col items-center justify-center shadow-lg`}>
                                            <div className="text-center">
                                                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                                    {distanceInfo.value}
                                                </div>
                                                <div className="text-xs font-bold text-gray-600 dark:text-gray-400 mt-1 tracking-widest">
                                                    {distanceInfo.unit}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chat Button */}
                                        {onStartChat && (
                                            <Button
                                                size="sm"
                                                className="h-9 px-4 gap-2 text-xs font-bold shadow-lg hover:shadow-xl transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onStartChat?.(userLocation.user);
                                                }}
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Chat
                                            </Button>
                                        )}

                                        {/* Rank Badge */}
                                        {index < 3 && (
                                            <div className="text-2xl animated" title={`#${index + 1} closest user`}>
                                                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Additional Info Bar */}
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>Air distance: {distanceInfo.label}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">
                                        {index === 0 ? "Closest to you" : index === 1 ? "2nd closest" : index === 2 ? "3rd closest" : ""}
                                    </span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
