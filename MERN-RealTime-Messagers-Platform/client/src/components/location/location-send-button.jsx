import { useState } from "react";
import { Button } from "../ui/button";
import { MapPin, X, Send } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useLocation } from "../../hooks/use-location";
import { Spinner } from "../ui/spinner";

export const LocationSendButton = ({ onSendLocation, disabled }) => {
    const [open, setOpen] = useState(false);
    const {
        location,
        loading,
        error,
        getCurrentPosition,
        getAddressFromCoords,
    } = useLocation();

    const [address, setAddress] = useState(null);
    const [sending, setSending] = useState(false);

    const handleGetLocation = async () => {
        try {
            const position = await getCurrentPosition();
            const addressData = await getAddressFromCoords(
                position.latitude,
                position.longitude
            );
            if (addressData) {
                setAddress(addressData);
            }
        } catch (err) {
            console.error("Error getting location:", err);
        }
    };

    const handleSend = async () => {
        if (!location || !onSendLocation) return;

        setSending(true);
        try {
            await onSendLocation({
                latitude: location.latitude,
                longitude: location.longitude,
                address: address?.address || null,
            });
            setOpen(false);
            setAddress(null);
        } catch (err) {
            console.error("Error sending location:", err);
        } finally {
            setSending(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={disabled}
                    className="rounded-full"
                    title="Send Location"
                >
                    <MapPin className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Send Location</h4>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {error && (
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-100 rounded text-xs">
                            {error}
                        </div>
                    )}

                    {!location ? (
                        <Button
                            onClick={handleGetLocation}
                            disabled={loading}
                            className="w-full"
                            size="sm"
                        >
                            {loading ? (
                                <>
                                    <Spinner className="w-3 h-3 mr-2" />
                                    Getting Location...
                                </>
                            ) : (
                                <>
                                    <MapPin className="w-3 h-3 mr-2" />
                                    Get My Location
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="space-y-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-1 flex-1 min-w-0">
                                        {address && (
                                            <p className="text-xs text-blue-900 dark:text-blue-100 line-clamp-2">
                                                {address.address}
                                            </p>
                                        )}
                                        <p className="text-xs text-blue-600 dark:text-blue-300">
                                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleGetLocation}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    disabled={loading || sending}
                                >
                                    Update
                                </Button>
                                <Button
                                    onClick={handleSend}
                                    size="sm"
                                    className="flex-1"
                                    disabled={sending}
                                >
                                    {sending ? (
                                        <>
                                            <Spinner className="w-3 h-3 mr-1" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3 h-3 mr-1" />
                                            Send
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
