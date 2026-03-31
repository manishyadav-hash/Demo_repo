const express_1 = require("express");
const batch_push_controller_1 = require("../controllers/batch-push.controller");

const router = (0, express_1.Router)();

router.post("/send", batch_push_controller_1.sendBatchPushController);
router.get("/history", batch_push_controller_1.getBroadcastHistoryController);

exports.default = router;
