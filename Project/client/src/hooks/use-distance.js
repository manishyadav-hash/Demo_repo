/**
 * Hook to calculate distance between two geographic coordinates
 */
export const useDistance = () => {
    /**
     * Convert degrees to radians
     */
    const toRadians = (degrees) => {
        return degrees * (Math.PI / 180);
    };

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return distance;
    };

    /**
     * Format distance in a human-readable format
     * @param {number} distanceKm - Distance in kilometers
     * @returns {string} Formatted distance string
     */
    const formatDistance = (distanceKm) => {
        if (distanceKm < 1) {
            return `${Math.round(distanceKm * 1000)} m`;
        } else if (distanceKm < 10) {
            return `${distanceKm.toFixed(1)} km`;
        } else {
            return `${Math.round(distanceKm)} km`;
        }
    };

    /**
     * Get distance category
     */
    const getDistanceCategory = (distanceKm) => {
        if (distanceKm < 1) return "very-close";
        if (distanceKm < 5) return "close";
        if (distanceKm < 25) return "nearby";
        if (distanceKm < 100) return "far";
        return "very-far";
    };

    /**
     * Calculate distance and return formatted result
     */
    const getFormattedDistance = (lat1, lon1, lat2, lon2) => {
        const distance = calculateDistance(lat1, lon1, lat2, lon2);
        return {
            distance,
            formatted: formatDistance(distance),
            category: getDistanceCategory(distance),
        };
    };

    /**
     * Sort locations by distance from a reference point
     */
    const sortByDistance = (refLat, refLon, locations) => {
        return locations
            .map((location) => ({
                ...location,
                distance: calculateDistance(
                    refLat,
                    refLon,
                    location.latitude,
                    location.longitude
                ),
            }))
            .sort((a, b) => a.distance - b.distance);
    };

    /**
     * Filter locations within a certain radius
     */
    const filterByRadius = (refLat, refLon, locations, radiusKm) => {
        return locations.filter((location) => {
            const distance = calculateDistance(
                refLat,
                refLon,
                location.latitude,
                location.longitude
            );
            return distance <= radiusKm;
        });
    };

    return {
        calculateDistance,
        formatDistance,
        getDistanceCategory,
        getFormattedDistance,
        sortByDistance,
        filterByRadius,
    };
};
