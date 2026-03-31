const db_1 = require("../lib/db");
const app_error_1 = require("../utils/app-error");

const mapUser = (userRow) => {
    if (!userRow)
        return null;
    return {
        id: userRow.id,
        _id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        avatar: userRow.avatar,
    };
};

const mapLocation = (locationRow, userRow = null) => {
    if (!locationRow)
        return null;
    return {
        ...locationRow,
        _id: locationRow.id,
        user: mapUser(userRow),
    };
};

class LocationService {
    /**
     * Update or create user location
     */
    async updateUserLocation(userId, locationData) {
        const { latitude, longitude, address, city, country, isShared } = locationData;
        const upsertResult = await (0, db_1.query)(`
            INSERT INTO user_locations (
                "userId", latitude, longitude, address, city, country, "isShared", "isActive", "lastUpdated", "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, false), true, NOW(), NOW(), NOW())
            ON CONFLICT ("userId")
            DO UPDATE
            SET latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                address = COALESCE(EXCLUDED.address, user_locations.address),
                city = COALESCE(EXCLUDED.city, user_locations.city),
                country = COALESCE(EXCLUDED.country, user_locations.country),
                "isShared" = COALESCE($7, user_locations."isShared"),
                "isActive" = true,
                "lastUpdated" = NOW(),
                "updatedAt" = NOW()
            RETURNING id, "userId", latitude, longitude, address, city, country, "isShared", "isActive", "lastUpdated", "createdAt", "updatedAt"
        `, [
            userId,
            latitude,
            longitude,
            address || null,
            city || null,
            country || null,
            typeof isShared === "boolean" ? isShared : null,
        ]);

        return mapLocation(upsertResult.rows[0]);
    }

    /**
     * Get user location
     */
    async getUserLocation(userId) {
        const locationResult = await (0, db_1.query)(`
            SELECT l.id,
                   l."userId",
                   l.latitude,
                   l.longitude,
                   l.address,
                   l.city,
                   l.country,
                   l."isShared",
                   l."isActive",
                   l."lastUpdated",
                   l."createdAt",
                   l."updatedAt",
                   u.id AS user_id,
                   u.name AS user_name,
                   u.email AS user_email,
                   u.avatar AS user_avatar
            FROM user_locations l
            JOIN users u ON u.id = l."userId"
            WHERE l."userId" = $1
            LIMIT 1
        `, [userId]);
        const location = locationResult.rows[0];

        if (!location) {
            // Return null instead of throwing error - frontend will handle gracefully
            return null;
        }

        return mapLocation(location, {
            id: location.user_id,
            name: location.user_name,
            email: location.user_email,
            avatar: location.user_avatar,
        });
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
        const userLocationResult = await (0, db_1.query)(`
            SELECT latitude, longitude
            FROM user_locations
            WHERE "userId" = $1
            LIMIT 1
        `, [userId]);
        const userLocation = userLocationResult.rows[0];

        if (!userLocation) {
            throw new app_error_1.AppError("Please share your location first", 400);
        }

        // Get all users with shared and active locations
        const allLocationsResult = await (0, db_1.query)(`
            SELECT l.id,
                   l."userId",
                   l.latitude,
                   l.longitude,
                   l.address,
                   l.city,
                   l.country,
                   l."isShared",
                   l."isActive",
                   l."lastUpdated",
                   l."createdAt",
                   l."updatedAt",
                   u.id AS user_id,
                   u.name AS user_name,
                   u.email AS user_email,
                   u.avatar AS user_avatar
            FROM user_locations l
            JOIN users u ON u.id = l."userId"
            WHERE l."userId" <> $1
              AND l."isShared" = true
              AND l."isActive" = true
        `, [userId]);
        const allLocations = allLocationsResult.rows;

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
                    ...mapLocation(location, {
                        id: location.user_id,
                        name: location.user_name,
                        email: location.user_email,
                        avatar: location.user_avatar,
                    }),
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
        const params = [];
        let whereSql = 'WHERE l."isShared" = true AND l."isActive" = true';
        if (excludeUserId) {
            params.push(excludeUserId);
            whereSql += ` AND l."userId" <> $${params.length}`;
        }

        const locationsResult = await (0, db_1.query)(`
            SELECT l.id,
                   l."userId",
                   l.latitude,
                   l.longitude,
                   l.address,
                   l.city,
                   l.country,
                   l."isShared",
                   l."isActive",
                   l."lastUpdated",
                   l."createdAt",
                   l."updatedAt",
                   u.id AS user_id,
                   u.name AS user_name,
                   u.email AS user_email,
                   u.avatar AS user_avatar
            FROM user_locations l
            JOIN users u ON u.id = l."userId"
            ${whereSql}
            ORDER BY l."lastUpdated" DESC
        `, params);

        return locationsResult.rows.map((location) => mapLocation(location, {
            id: location.user_id,
            name: location.user_name,
            email: location.user_email,
            avatar: location.user_avatar,
        }));
    }

    /**
     * Delete user location
     */
    async deleteUserLocation(userId) {
        const deletedResult = await (0, db_1.query)(`
            DELETE FROM user_locations
            WHERE "userId" = $1
            RETURNING id
        `, [userId]);
        const deleted = deletedResult.rowCount;

        if (!deleted) {
            throw new app_error_1.AppError("Location not found", 404);
        }

        return { message: "Location deleted successfully" };
    }

    /**
     * Toggle location sharing
     */
    async toggleLocationSharing(userId, isShared) {
        const locationResult = await (0, db_1.query)(`
            UPDATE user_locations
            SET "isShared" = $1,
                "updatedAt" = NOW()
            WHERE "userId" = $2
            RETURNING id, "userId", latitude, longitude, address, city, country, "isShared", "isActive", "lastUpdated", "createdAt", "updatedAt"
        `, [isShared, userId]);
        const location = locationResult.rows[0];

        if (!location) {
            throw new app_error_1.AppError("Please set your location first", 400);
        }

        return mapLocation(location);
    }

    /**
     * Mark user as inactive
     */
    async setUserInactive(userId) {
        await (0, db_1.query)(`
            UPDATE user_locations
            SET "isActive" = false,
                "updatedAt" = NOW()
            WHERE "userId" = $1
        `, [userId]);
    }

    /**
     * Mark user as active
     */
    async setUserActive(userId) {
        await (0, db_1.query)(`
            UPDATE user_locations
            SET "isActive" = true,
                "lastUpdated" = NOW(),
                "updatedAt" = NOW()
            WHERE "userId" = $1
        `, [userId]);
    }
}

exports.LocationService = LocationService;
exports.default = new LocationService();
