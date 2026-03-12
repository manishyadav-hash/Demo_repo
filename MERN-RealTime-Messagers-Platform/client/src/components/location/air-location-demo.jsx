import { useState, useEffect } from "react";
import { useAirLocation, useNearbyUsersAir, formatDistance } from "../../hooks/use-air-location";
import { useSocket } from "../../hooks/use-socket";
import { MapPin, Radio, Users, Zap, Navigation2, AlertCircle } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

/**
 * Complete Air Location Demo - Shows everything in one place
 */
export const AirLocationDemo = () => {
    const {
        location,
        isSharing,
        loading,
        error,
        accuracy,
        startSharing,
        stopSharing,
    } = useAirLocation();

    const { nearbyUsers } = useNearbyUsersAir(location);
    const { activeLocations } = useSocket();

    const [showDebug, setShowDebug] = useState(false);
    const maxRadiusKm = 5;
    const nearbyUsersWithinRadius = nearbyUsers.filter((user) => user.distanceKm <= maxRadiusKm);
    const nearbyCount = nearbyUsersWithinRadius.length;

    // Auto-connect socket on mount
    const { connectSocket, socket } = useSocket();
    useEffect(() => {
        if (!socket) {
            connectSocket();
        }
    }, [socket, connectSocket]);

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${socket?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="font-medium">
                            Socket: {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                    >
                        {showDebug ? 'Hide Debug' : 'Show Debug'}
                    </button>
                </div>
                {showDebug && (
                    <pre className="mt-3 p-3 bg-white dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify({ 
                            socketId: socket?.id,
                            connected: socket?.connected,
                            activeLocationsCount: Object.keys(activeLocations || {}).length,
                            isSharing,
                            hasLocation: !!location
                        }, null, 2)}
                    </pre>
                )}
            </Card>

            {/* Broadcasting Control */}
            <Card className={`p-6 transition-all ${
                isSharing
                    ? "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-300 dark:border-blue-700 shadow-xl"
                    : "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20"
            }`}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`relative flex items-center justify-center w-14 h-14 rounded-full ${
                                isSharing
                                    ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                                    : "bg-gradient-to-br from-gray-400 to-gray-500"
                            }`}>
                                {isSharing && (
                                    <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75"></div>
                                )}
                                <div className="relative">
                                    {isSharing ? (
                                        <Radio className="w-7 h-7 text-white animate-pulse" />
                                    ) : (
                                        <MapPin className="w-7 h-7 text-white" />
                                    )}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Air Location System
                                </h2>
                                <p className={`text-sm font-medium ${
                                    isSharing
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-600 dark:text-gray-400"
                                }`}>
                                    {isSharing ? "🟢 Broadcasting Your Location" : "⚪ Location Sharing Off"}
                                </p>
                            </div>
                        </div>

                        {!isSharing ? (
                            <Button
                                onClick={startSharing}
                                disabled={loading}
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Starting...
                                    </>
                                ) : (
                                    <>
                                        <Navigation2 className="w-5 h-5 mr-2" />
                                        Start Broadcasting
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={stopSharing}
                                size="lg"
                                variant="destructive"
                                className="shadow-lg"
                            >
                                <Radio className="w-5 h-5 mr-2" />
                                Stop Broadcasting
                            </Button>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-900 dark:text-red-100">{error}</p>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                    Please enable location permissions in your browser
                                </p>
                            </div>
                        </div>
                    )}

                    {isSharing && location && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-4 rounded-xl bg-white dark:bg-gray-800/60 border-2 border-blue-200 dark:border-blue-700 shadow-md">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                                        Latitude
                                    </p>
                                    <p className="text-base font-mono font-bold text-blue-600 dark:text-blue-400">
                                        {location.latitude.toFixed(6)}
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-white dark:bg-gray-800/60 border-2 border-cyan-200 dark:border-cyan-700 shadow-md">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                                        Longitude
                                    </p>
                                    <p className="text-base font-mono font-bold text-cyan-600 dark:text-cyan-400">
                                        {location.longitude.toFixed(6)}
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-white dark:bg-gray-800/60 border-2 border-green-200 dark:border-green-700 shadow-md">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                                        Accuracy
                                    </p>
                                    <p className="text-base font-bold text-green-600 dark:text-green-400">
                                        ±{Math.round(accuracy || 0)}m
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-white dark:bg-gray-800/60 border-2 border-purple-200 dark:border-purple-700 shadow-md">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                                        Status
                                    </p>
                                    <p className="text-base font-bold text-purple-600 dark:text-purple-400">
                                        Active ✓
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Card>

            {/* Nearby Users Section */}
            {isSharing && (
                <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Nearby Users ({nearbyCount})
                        </h3>
                        <span className="text-xs font-semibold text-green-700 dark:text-green-200 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded-full">
                            Within {maxRadiusKm} km
                        </span>
                    </div>

                    {nearbyCount === 0 ? (
                        <div className="text-center py-12">
                            <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                                No users nearby yet
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                Waiting for other users to share their location...
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {nearbyUsersWithinRadius.map((user, idx) => {
                                const distInfo = formatDistance(user.distanceKm);
                                const proximityPercent = Math.max(0, Math.min(100, (1 - user.distanceKm / maxRadiusKm) * 100));

                                return (
                                    <div
                                        key={user.userId || idx}
                                        className="p-4 rounded-xl bg-gradient-to-r from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 border-2 border-green-200 dark:border-green-700 hover:shadow-lg transition-all hover:scale-[1.02]"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        User {idx + 1}
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                                                        {user.latitude?.toFixed(4)}, {user.longitude?.toFixed(4)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className={`text-2xl font-bold ${
                                                    user.distanceKm < 1
                                                        ? "text-green-600 dark:text-green-400"
                                                        : user.distanceKm < 5
                                                        ? "text-blue-600 dark:text-blue-400"
                                                        : "text-gray-600 dark:text-gray-400"
                                                }`}>
                                                    {distInfo.formatted}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    away
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                                                style={{ width: `${proximityPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}

            {/* Info Card */}
            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                            🌍 How Air Location Works
                        </h3>
                        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1.5">
                            <li>✅ Uses <strong>Haversine formula</strong> for accurate straight-line distance</li>
                            <li>✅ Real-time GPS updates via WebSocket</li>
                            <li>✅ No traffic data - pure air distance calculation</li>
                            <li>✅ Updates automatically when users move</li>
                            <li>✅ Works with multiple users simultaneously</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AirLocationDemo;
