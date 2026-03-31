const express_1 = require("express");
const passport_config_1 = require("../config/passport.config");
const location_controller_1 = require("../controllers/location.controller");
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");

const locationRoutes = (0, express_1.Router)();

// Test endpoint - no auth required
locationRoutes.get("/health", (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    res.status(200).json({ success: true, message: "Location service is healthy" });
}));

// Apply authentication middleware to all routes below this point
locationRoutes.use(passport_config_1.passportAuthenticateJwt);

// Update or create user location
locationRoutes.put("/update", (0, asyncHandler_middleware_1.asyncHandler)(location_controller_1.default.updateLocation.bind(location_controller_1.default)));

// Get current user's location
locationRoutes.get("/me", (0, asyncHandler_middleware_1.asyncHandler)(location_controller_1.default.getMyLocation.bind(location_controller_1.default)));

// Get another user's location by ID
locationRoutes.get("/user/:userId", (0, asyncHandler_middleware_1.asyncHandler)(location_controller_1.default.getUserLocationById.bind(location_controller_1.default)));

// Get nearby users
locationRoutes.get("/nearby", (0, asyncHandler_middleware_1.asyncHandler)(location_controller_1.default.findNearbyUsers.bind(location_controller_1.default)));

// Get all active users
locationRoutes.get("/active-users", (0, asyncHandler_middleware_1.asyncHandler)(location_controller_1.default.getActiveUsers.bind(location_controller_1.default)));

// Toggle location sharing
locationRoutes.patch("/toggle-sharing", (0, asyncHandler_middleware_1.asyncHandler)(location_controller_1.default.toggleSharing.bind(location_controller_1.default)));

// Set user inactive
locationRoutes.patch("/set-inactive", (0, asyncHandler_middleware_1.asyncHandler)(location_controller_1.default.setInactive.bind(location_controller_1.default)));

// Delete user location
locationRoutes.delete("/delete", (0, asyncHandler_middleware_1.asyncHandler)(location_controller_1.default.deleteLocation.bind(location_controller_1.default)));

exports.default = locationRoutes;
