"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passportAuthenticateJwt = void 0;
const passport_1 = require("passport");
const passport_1_default = passport_1.default || passport_1;
const passport_jwt_1 = require("passport-jwt");
const app_error_1 = require("../utils/app-error");
const env_config_1 = require("./env.config");
const user_service_1 = require("../services/user.service");
passport_1_default.use(new passport_jwt_1.Strategy({
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
        (req) => {
            const token = req.cookies.accessToken;
            return token || null;
        },
    ]),
    secretOrKey: env_config_1.Env.JWT_SECRET,
    audience: ["user"],
    algorithms: ["HS256"],
}, async ({ userId }, done) => {
    try {
        const user = userId && (await (0, user_service_1.findByIdUserService)(userId));
        return done(null, user || false);
    }
    catch (error) {
        return done(null, false);
    }
}));
exports.passportAuthenticateJwt = passport_1_default.authenticate("jwt", {
    session: false,
});
