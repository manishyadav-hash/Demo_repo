const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const passport_config_1 = require("../config/passport.config");
const authRoutes = (0, express_1.Router)()
    .post("/register", auth_controller_1.registerController)
    .post("/login", auth_controller_1.loginController)
    .post("/send-phone-otp", auth_controller_1.sendPhoneOtpController)
    .post("/verify-phone-otp", auth_controller_1.verifyPhoneOtpController)
    .post("/logout", auth_controller_1.logoutController)
    .get("/status", passport_config_1.passportAuthenticateJwt, auth_controller_1.authStatusController);
exports.default = authRoutes;

