"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recommendationController_1 = require("../controllers/recommendationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Token-protected endpoints
router.get('/', auth_1.protect, recommendationController_1.getRecommendations);
router.get('/me', auth_1.protect, recommendationController_1.getRecommendations);
router.get('/me/insights', auth_1.protect, recommendationController_1.getInsights);
// Legacy endpoints
router.get('/:userId', recommendationController_1.getRecommendations);
router.get('/:userId/insights', recommendationController_1.getInsights);
exports.default = router;
