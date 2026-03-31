const batch_push_service_1 = require("../services/batch-push.service");
const app_error_1 = require("../utils/app-error");

/**
 * Background-Aware Controller
 * Returns the response instantly to the manager while the 
 * massive broadcast continues to run in the background.
 */
const sendBatchPushController = async (req, res, next) => {
    try {
        const { language, title, body } = req.body;

        if (!language || !title || !body) {
            throw new app_error_1.BadRequestException("language, title, and body are required fields.");
        }

        // We switch back to 'await' because the parallel optimization 
        // makes the wait short enough (10s) to show full results.
        const stats = await (0, batch_push_service_1.sendBatchPushByLanguageService)(language, title, body);

        return res.status(200).json({
            success: true,
            message: `Optimized batch push completed for language: ${language}`,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
exports.sendBatchPushController = sendBatchPushController;

const getBroadcastHistoryController = async (req, res, next) => {
    try {
        const history = await (0, batch_push_service_1.getBroadcastHistoryService)();
        return res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        next(error);
    }
};
exports.getBroadcastHistoryController = getBroadcastHistoryController;
