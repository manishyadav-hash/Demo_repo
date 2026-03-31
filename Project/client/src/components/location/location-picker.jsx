import { useState } from "react";
import { useLocation } from "../../hooks/use-location";
import { API } from "../../lib/axios-client";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { MapPin, Check, Share2, X } from "lucide-react";

export const LocationPicker = ({ onLocationShared, autoShare = false }) => {
    const {
        location,
        loading,
        error,
        getCurrentPosition,
        getAddressFromCoords,
    } = useLocation();

    const [address, setAddress] = useState(null);
    const [sharing, setSharing] = useState(false);
    const [shared, setShared] = useState(false);
    const [shareError, setShareError] = useState(null);

    const handleGetLocation = async () => {
        try {
            const position = await getCurrentPosition();
            
            // Get address from coordinates
            const addressData = await getAddressFromCoords(
                position.latitude,
                position.longitude
            );
            
            if (addressData) {
                setAddress(addressData);
            }

            // Auto share if enabled
            if (autoShare) {
                await handleShareLocation(position, addressData);
            }
        } catch (err) {
            console.error("Error getting location:", err);
        }
    };

    const handleShareLocation = async (pos = location, addr = address) => {
        if (!pos) return;

        setSharing(true);
        setShareError(null);

        try {
            const response = await API.put("/location/update", {
                latitude: pos.latitude,
                longitude: pos.longitude,
                address: addr?.address || null,
                city: addr?.city || null,
                country: addr?.country || null,
                isShared: true,
            });

            setShared(true);
            if (onLocationShared) {
                onLocationShared(response.data.data);
            }
        } catch (err) {
            console.error("Error sharing location:", err);
            setShareError(err.response?.data?.message || "Failed to share location");
        } finally {
            setSharing(false);
        }
    };

    const handleReset = () => {
        setShared(false);
        setAddress(null);
    };

    return (
        <div className="space-y-4">
            {shareError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                    <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {shareError}
                </div>
            )}

            {!location && (
                <Button
                    onClick={handleGetLocation}
                    disabled={loading}
                    className="w-full"
                >
                    {loading ? (
                        <>
                            <Spinner className="w-4 h-4 mr-2" />
                            Getting Location...
                        </>
                    ) : (
                        <>
                            <MapPin className="w-4 h-4 mr-2" />
                            Get My Location
                        </>
                    )}
                </Button>
            )}

            {location && (
                <div className="space-y-3">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    Location Found
                                </p>
                                {address && (
                                    <p className="text-sm text-blue-700 dark:text-blue-300 line-clamp-2">
                                        {address.address}
                                    </p>
                                )}
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    Accuracy: ±{Math.round(location.accuracy)}m
                                </p>
                            </div>
                        </div>
                    </div>

                    {!shared && !autoShare && (
                        <Button
                            onClick={() => handleShareLocation()}
                            disabled={sharing}
                            className="w-full"
                        >
                            {sharing ? (
                                <>
                                    <Spinner className="w-4 h-4 mr-2" />
                                    Sharing...
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share Location
                                </>
                            )}
                        </Button>
                    )}

                    {shared && (
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-100 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5" />
                                <span className="text-sm font-medium">
                                    Location shared successfully!
                                </span>
                            </div>
                            <Button
                                onClick={handleReset}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    <Button
                        onClick={handleGetLocation}
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        <MapPin className="w-3 h-3 mr-2" />
                        Update Location
                    </Button>
                </div>
            )}
        </div>
    );
};
