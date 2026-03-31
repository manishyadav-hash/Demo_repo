const location_service_1 = require("../services/location.service");

class LocationController {
    /**
     * Update user location
     */
    async updateLocation(req, res) {
        const userId = req.user.id;
        const locationData = req.body;

        const location = await location_service_1.default.updateUserLocation(userId, locationData);

        res.status(200).json({
            success: true,
            data: location,
            message: "Location updated successfully",
        });
    }

    /**
     * Get current user's location
     */
    async getMyLocation(req, res) {
        const userId = req.user.id;

        const location = await location_service_1.default.getUserLocation(userId);

        res.status(200).json({
            success: true,
            data: location,
        });
    }

    /**
     * Find nearby users (active and with shared locations)
     */
    async findNearbyUsers(req, res) {
        const userId = req.user.id;
        const { radius = 50, limit = 20 } = req.query;

        const nearbyUsers = await location_service_1.default.findNearbyUsers(
            userId,
            parseInt(radius),
            parseInt(limit)
        );

        res.status(200).json({
            success: true,
            data: nearbyUsers,
            count: nearbyUsers.length,
        });
    }

    /**
     * Get all active users with shared locations
     */
    async getActiveUsers(req, res) {
        const userId = req.user?.id;

        const activeUsers = await location_service_1.default.getActiveUsers(userId);

        res.status(200).json({
            success: true,
            data: activeUsers,
            count: activeUsers.length,
        });
    }

    /**
     * Delete user location
     */
    async deleteLocation(req, res) {
        const userId = req.user.id;

        const result = await location_service_1.default.deleteUserLocation(userId);

        res.status(200).json({
            success: true,
            ...result,
        });
    }

    /**
     * Toggle location sharing
     */
    async toggleSharing(req, res) {
        const userId = req.user.id;
        const { isShared } = req.body;

        const location = await location_service_1.default.toggleLocationSharing(userId, isShared);

        res.status(200).json({
            success: true,
            data: location,
            message: `Location sharing ${isShared ? "enabled" : "disabled"}`,
        });
    }

    /**
     * Get another user's location (for distance calculation)
     */
    async getUserLocationById(req, res) {
        const { userId } = req.params;

        const location = await location_service_1.default.getUserLocation(userId);

        res.status(200).json({
            success: true,
            data: location,
        });
    }

    /**
     * Set user inactive (logout/offline)
     */
    async setInactive(req, res) {
        const userId = req.user.id;

        await location_service_1.default.setUserInactive(userId);

        res.status(200).json({
            success: true,
            message: "Status updated to offline",
        });
    }
}

exports.LocationController = LocationController;
exports.default = new LocationController();
