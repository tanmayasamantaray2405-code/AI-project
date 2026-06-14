"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInsights = exports.getRecommendations = void 0;
const recommendationService_1 = require("../services/recommendationService");
// @desc    Get smart task recommendations for a user
// @route   GET /recommendations/:userId
// @access  Private
const getRecommendations = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    try {
        const recommendations = await (0, recommendationService_1.getSmartRecommendations)(userId);
        return res.json({
            success: true,
            data: recommendations,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getRecommendations = getRecommendations;
// @desc    Get smart productivity insights and scores
// @route   GET /recommendations/:userId/insights
// @access  Private
const getInsights = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    try {
        const insights = await (0, recommendationService_1.getSmartInsights)(userId);
        return res.json({
            success: true,
            data: insights,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getInsights = getInsights;
