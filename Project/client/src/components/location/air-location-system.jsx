import { useState, useEffect } from "react";
import { useAirLocation, useNearbyUsersAir, formatDistance } from "../../hooks/use-air-location";
import { MapPin, Radio, Loader2, AlertCircle, Navigation, Zap } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

/**
 * Main Air Location System Component
 * Displays current location sharing status and nearby users
 */
export const AirLocationSystem = () => {
    const { location, isSharing, loading, error, accuracy, startSharing, stopSharing } =
        useAirLocation();
    const { nearbyUsers, count } = useNearbyUsersAir(location);

    return (
        <div className="space-y-4">
            <AirLocationBroadcaster
                isSharing={isSharing}
                loading={loading}
                error={error}
                location={location}
                accuracy={accuracy}
                onStart={startSharing}
                onStop={stopSharing}
            />

            {isSharing && location && (
                <>
                    <NearbyUsersRadar users={nearbyUsers} currentLocation={location} />
                    <NearbyUsersCard users={nearbyUsers} />
                </>
            )}
        </div>
    );
};

/**
 * Location Broadcaster Component
 * Shows controls to start/stop location sharing
 */
export const AirLocationBroadcaster = ({
    isSharing,
    loading,
    error,
    location,
    accuracy,
    onStart,
    onStop,
}) => {
    return (
        <Card className={`p-6 backdrop-blur-sm transition-all ${
            isSharing
                ? "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30"
                : "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-800"
        }`}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {isSharing && (
                                <div className="absolute inset-0 animate-pulse">
                                    <div className="w-full h-full rounded-full bg-blue-400/20"></div>
                                </div>
                            )}
                            <div className={`relative flex items-center justify-center w-12 h-12 rounded-full ${
                                isSharing
                                    ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                                    : "bg-gradient-to-br from-gray-400 to-gray-500"
                            }`}>
                                {isSharing ? (
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                    </span>
                                ) : (
                                    <MapPin className="w-6 h-6 text-white" />
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Air Location
                            </h3>
                            <p className={`text-sm ${
                                isSharing
                                    ? "text-blue-600 dark:text-blue-400 font-medium"
                                    : "text-gray-600 dark:text-gray-400"
                            }`}>
                                {isSharing ? "🟢 Broadcasting your location" : "⚪ Location not shared"}
                            </p>
                        </div>
                    </div>

                    {isSharing ? (
                        <Button
                            onClick={onStop}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg"
                        >
                            <Radio className="w-4 h-4 mr-2" />
                            Stop Broadcasting
                        </Button>
                    ) : (
                        <Button
                            onClick={onStart}
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <Navigation className="w-4 h-4 mr-2" />
                                    Start Broadcasting
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {error && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {isSharing && location && (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                                Latitude
                            </p>
                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                {location.latitude.toFixed(6)}
                            </p>
                        </div>

                        <div className="p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                                Longitude
                            </p>
                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                {location.longitude.toFixed(6)}
                            </p>
                        </div>

                        <div className="p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                                Accuracy
                            </p>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                ±{Math.round(accuracy || 0)}m
                            </p>
                        </div>

                        <div className="p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                                Status
                            </p>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                Active
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

/**
 * Nearby Users Radar Component
 * Shows distance and direction to nearby users
 */
export const NearbyUsersRadar = ({ users, currentLocation }) => {
    if (users.length === 0) {
        return (
            <Card className="p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                    No users nearby
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Share your location to see others
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                📡 Nearby Users ({users.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {users.slice(0, 6).map((user, idx) => {
                    const distance = user.distanceKm;
                    const distInfo = formatDistance(distance);
                    const proximityPercent = Math.max(0, Math.min(100, (1 - distance / 50) * 100));

                    return (
                        <div
                            key={user.userId}
                            className="p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-purple-200 dark:border-purple-700/50 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    User {idx + 1}
                                </span>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${
                                    distance < 0.5
                                        ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                                        : distance < 2
                                        ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300"
                                        : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                }`}>
                                    {distInfo.formatted}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                                        style={{ width: `${proximityPercent}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                    <span>Latitude: {user.latitude.toFixed(4)}</span>
                                    <span>Longitude: {user.longitude.toFixed(4)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

/**
 * Detailed Nearby Users Card Component
 */
export const NearbyUsersCard = ({ users }) => {
    if (users.length === 0) return null;

    return (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Closest Users
                </h3>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user, idx) => {
                    const distance = user.distanceKm;
                    const distInfo = formatDistance(distance);

                    return (
                        <div
                            key={user.userId}
                            className="p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 border border-green-200 dark:border-green-700/50 hover:shadow-lg transition-all hover:translate-x-1"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            User {idx + 1}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            📍 {user.latitude.toFixed(6)}, {user.longitude.toFixed(6)}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                        {distInfo.formatted}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        away
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {users.length > 6 && (
                <p className="text-center text-xs text-gray-600 dark:text-gray-400 mt-4">
                    +{users.length - 6} more users nearby
                </p>
            )}
        </Card>
    );
};

export default AirLocationSystem;
