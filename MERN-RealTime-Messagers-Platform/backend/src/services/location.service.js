"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const models_1 = require("../models");
const app_error_1 = require("../utils/app-error");
const sequelize_1 = require("sequelize");

class LocationService {
    /**
     * Update or create user location
     */
    async updateUserLocation(userId, locationData) {
        const { latitude, longitude, address, city, country, isShared } = locationData;

        const [location, created] = await models_1.UserLocationModel.findOrCreate({
            where: { userId },
            defaults: {
                userId,
                latitude,
                longitude,
                address: address || null,
                city: city || null,
                country: country || null,
                isShared: isShared !== undefined ? isShared : false,
                isActive: true,
                lastUpdated: new Date(),
            },
        });

        if (!created) {
            await location.update({
                latitude,
                longitude,
                address: address || location.address,
                city: city || location.city,
                country: country || location.country,
                isShared: isShared !== undefined ? isShared : location.isShared,
                isActive: true,
                lastUpdated: new Date(),
            });
        }

        return location;
    }

    /**
     * Get user location
     */
    async getUserLocation(userId) {
        const location = await models_1.UserLocationModel.findOne({
            where: { userId },
            include: [
                {
                    model: models_1.UserModel,
                    as: "user",
                    attributes: ["id", "name", "email", "avatar"],
                },
            ],
        });

        if (!location) {
            // Return null instead of throwing error - frontend will handle gracefully
            return null;
        }

        return location;
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
            Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return distance;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Find nearby users within a radius
     */
    async findNearbyUsers(userId, radiusKm = 50, limit = 20) {
        // Get the user's location first
        const userLocation = await models_1.UserLocationModel.findOne({
            where: { userId },
        });

        if (!userLocation) {
            throw new app_error_1.AppError("Please share your location first", 400);
        }

        // Get all users with shared and active locations
        const allLocations = await models_1.UserLocationModel.findAll({
            where: {
                userId: { [sequelize_1.Op.ne]: userId },
                isShared: true,
                isActive: true,
            },
            include: [
                {
                    model: models_1.UserModel,
                    as: "user",
                    attributes: ["id", "name", "email", "avatar"],
                },
            ],
        });

        // Calculate distances and filter by radius
        const nearbyUsers = allLocations
            .map((location) => {
                const distance = this.calculateDistance(
                    parseFloat(userLocation.latitude),
                    parseFloat(userLocation.longitude),
                    parseFloat(location.latitude),
                    parseFloat(location.longitude)
                );

                return {
                    ...location.toJSON(),
                    distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
                };
            })
            .filter((location) => location.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit);

        return nearbyUsers;
    }

    /**
     * Get active users with shared locations
     */
    async getActiveUsers(excludeUserId = null) {
        const where = { isShared: true, isActive: true };
        
        if (excludeUserId) {
            where.userId = { [sequelize_1.Op.ne]: excludeUserId };
        }

        const locations = await models_1.UserLocationModel.findAll({
            where,
            include: [
                {
                    model: models_1.UserModel,
                    as: "user",
                    attributes: ["id", "name", "email", "avatar"],
                },
            ],
            order: [["lastUpdated", "DESC"]],
        });

        return locations;
    }

    /**
     * Delete user location
     */
    async deleteUserLocation(userId) {
        const deleted = await models_1.UserLocationModel.destroy({
            where: { userId },
        });

        if (!deleted) {
            throw new app_error_1.AppError("Location not found", 404);
        }

        return { message: "Location deleted successfully" };
    }

    /**
     * Toggle location sharing
     */
    async toggleLocationSharing(userId, isShared) {
        const location = await models_1.UserLocationModel.findOne({
            where: { userId },
        });

        if (!location) {
            throw new app_error_1.AppError("Please set your location first", 400);
        }

        await location.update({ isShared });

        return location;
    }

    /**
     * Mark user as inactive
     */
    async setUserInactive(userId) {
        await models_1.UserLocationModel.update(
            { isActive: false },
            { where: { userId } }
        );
    }

    /**
     * Mark user as active
     */
    async setUserActive(userId) {
        const location = await models_1.UserLocationModel.findOne({
            where: { userId },
        });

        if (location) {
            await location.update({ 
                isActive: true,
                lastUpdated: new Date(),
            });
        }
    }
}

exports.LocationService = LocationService;
exports.default = new LocationService();
