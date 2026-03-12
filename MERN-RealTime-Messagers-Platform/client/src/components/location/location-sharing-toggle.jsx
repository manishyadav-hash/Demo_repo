import { useState, useEffect } from "react";
import { API } from "../../lib/axios-client";
import { MapPin, Globe } from "lucide-react";
import { Spinner } from "../ui/spinner";

export const LocationSharingToggle = ({ onStatusChange }) => {
    const [isShared, setIsShared] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLocationStatus();
    }, []);

    const fetchLocationStatus = async () => {
        try {
            const response = await API.get("/location/me");
            setIsShared(response.data.data.isShared);
            setLoading(false);
        } catch (err) {
            // User might not have location set yet
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        setUpdating(true);
        setError(null);

        try {
            const response = await API.patch("/location/toggle-sharing", {
                isShared: !isShared,
            });
            
            const newStatus = response.data.data.isShared;
            setIsShared(newStatus);
            onStatusChange?.(newStatus);
        } catch (err) {
            console.error("Error toggling location sharing:", err);
            setError(err.response?.data?.message || "Failed to update sharing settings");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Spinner className="w-4 h-4" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div 
                className={`p-4 rounded-lg border-2 transition-all ${
                    isShared 
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700" 
                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        {isShared ? (
                            <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                            <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        )}
                        
                        <div className="flex-1">
                            <p className={`font-medium ${
                                isShared ? "text-green-900 dark:text-green-100" : "text-gray-900 dark:text-white"
                            }`}>
                                {isShared ? "Location Sharing: ON" : "Location Sharing: OFF"}
                            </p>
                            <p className={`text-sm mt-0.5 ${
                                isShared 
                                    ? "text-green-700 dark:text-green-300" 
                                    : "text-gray-600 dark:text-gray-400"
                            }`}>
                                {isShared 
                                    ? "✓ Others can see your location" 
                                    : "🔒 Your location is private"
                                }
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleToggle}
                        disabled={updating}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isShared ? "bg-green-600 dark:bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                        } ${updating ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isShared ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-100 rounded-lg text-sm">
                    {error}
                </div>
            )}
        </div>
    );
};
