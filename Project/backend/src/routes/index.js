const express_1 = require("express");
const auth_route_1 = require("./auth.route");
const auth_route_1_default = auth_route_1.default || auth_route_1;
const chat_route_1 = require("./chat.route");
const chat_route_1_default = chat_route_1.default || chat_route_1;
const user_route_1 = require("./user.route");
const user_route_1_default = user_route_1.default || user_route_1;
const location_route_1 = require("./location.route");
const location_route_1_default = location_route_1.default || location_route_1;
const batch_push_route_1 = require("./batch-push.route");
const batch_push_route_1_default = batch_push_route_1.default || batch_push_route_1;

const router = (0, express_1.Router)();
router.use("/auth", auth_route_1_default);
router.use("/chat", chat_route_1_default);
router.use("/user", user_route_1_default);
router.use("/location", location_route_1_default);
router.use("/batch-push", batch_push_route_1_default);

exports.default = router;
