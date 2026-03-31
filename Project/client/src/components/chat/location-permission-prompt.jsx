import { useState, useCallback } from "react";
import { MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAutoLocationUpdate } from "@/hooks/use-auto-location-update";

const LocationPermissionPrompt = () => {
    const { isTracking, error, startTracking, stopTracking } = useAutoLocationUpdate();
    const [manualAttempt, setManualAttempt] = useState(false);

    const handleEnableLocation = useCallback(async () => {
        setManualAttempt(true);
        await startTracking();
    }, [startTracking]);

    const handleDisableLocation = useCallback(() => {
        setManualAttempt(false);
        stopTracking();
    }, [stopTracking]);

    if (isTracking && !error) {
        return null;
    }

    return (
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/30 rounded-lg">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Enable Location Sharing
                    </p>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                    Allow location access to see the distance between you and your contacts. Your location data is only shared with connected users.
                </p>
                {error && manualAttempt && (
                    <div className="flex items-start gap-2 p-2 rounded bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 mb-3">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}
            </div>
            <Button
                onClick={handleEnableLocation}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white whitespace-nowrap flex-shrink-0"
                size="sm"
            >
                Enable
            </Button>
        </div>
    );
};

export default LocationPermissionPrompt;
