import { useContext, useEffect } from "react";
import { useAirLocation, useNearbyUsersAir } from "../../hooks/use-air-location";
import { MapPin, AlertCircle, Radio } from "lucide-react";

/**
 * Location Context for global air location access
 */
import { createContext } from "react";
export const AirLocationContext = createContext();

/**
 * Air Location Provider Component
 * Wraps app to provide location sharing to all components
 */
export const AirLocationProvider = ({ children, autoShare = false }) => {
    const { location, isSharing, startSharing, stopSharing, error } = useAirLocation();
    const { nearbyUsers } = useNearbyUsersAir(location);

    useEffect(() => {
        if (autoShare && !isSharing) {
            startSharing();
        }
    }, [autoShare, isSharing, startSharing]);

    const value = {
        location,
        isSharing,
        startSharing,
        stopSharing,
        error,
        nearbyUsers,
        nearbyCount: nearbyUsers.length,
    };

    return (
        <AirLocationContext.Provider value={value}>
            {children}
        </AirLocationContext.Provider>
    );
};

/**
 * Hook to use air location context
 */
export const useAirLocationContext = () => {
    const context = useContext(AirLocationContext);
    if (!context) {
        throw new Error("useAirLocationContext must be used within AirLocationProvider");
    }
    return context;
};

/**
 * Floating Location Widget
 * Shows current location status and nearby users count
 */
export const FloatingLocationWidget = ({ position = "bottom-right" }) => {
    const { location, isSharing, nearbyCount, error } = useAirLocationContext();

    if (error && !isSharing) return null;

    const positionClasses = {
        "top-left": "top-4 left-4",
        "top-right": "top-4 right-4",
        "bottom-left": "bottom-4 left-4",
        "bottom-right": "bottom-4 right-4",
    };

    return (
        <div className={`fixed ${positionClasses[position]} z-50`}>
            <div className={`rounded-2xl backdrop-blur-xl shadow-2xl border transition-all ${
                isSharing
                    ? "bg-gradient-to-br from-blue-500/90 to-cyan-500/90 border-white/30 text-white"
                    : "bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700 text-gray-200"
            } p-4 max-w-xs`}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                        {isSharing && (
                            <div className="absolute inset-0 animate-pulse">
                                <div className="w-full h-full rounded-full bg-white/20"></div>
                            </div>
                        )}
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                            {isSharing ? (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                            ) : (
                                <MapPin className="w-4 h-4" />
                            )}
                        </div>
                    </div>

                    <div className="flex-1">
                        <p className="font-semibold text-sm">
                            {isSharing ? "Broadcasting" : "Location Off"}
                        </p>
                        {isSharing && nearbyCount > 0 && (
                            <p className="text-xs opacity-80">
                                {nearbyCount} user{nearbyCount !== 1 ? 's' : ''} nearby
                            </p>
                        )}
                    </div>
                </div>

                {isSharing && location && (
                    <div className="text-xs opacity-80 bg-white/10 rounded p-2 font-mono">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Location Status Bar Component
 * Shows location sharing status in a horizontal bar
 */
export const LocationStatusBar = () => {
    const { location, isSharing, nearbyCount, error, startSharing, stopSharing } =
        useAirLocationContext();

    return (
        <div className={`transition-all border-b ${
            isSharing
                ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800"
                : error
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800"
        }`}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 ${
                        isSharing ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                    }`}>
                        {isSharing ? (
                            <>
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-current"></span>
                                </span>
                                <span className="text-sm font-medium">Broadcasting ({nearbyCount} nearby)</span>
                            </>
                        ) : error ? (
                            <>
                                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                <span className="text-sm font-medium">{error}</span>
                            </>
                        ) : (
                            <>
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-medium">Location sharing disabled</span>
                            </>
                        )}
                    </div>
                </div>

                <button
                    onClick={isSharing ? stopSharing : startSharing}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        isSharing
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                >
                    {isSharing ? "Stop" : "Start"}
                </button>
            </div>
        </div>
    );
};

export default AirLocationProvider;
