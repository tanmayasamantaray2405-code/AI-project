"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recommendationController_1 = require("../controllers/recommendationController");
const router = (0, express_1.Router)();
router.get('/:userId', recommendationController_1.getRecommendations);
router.get('/:userId/insights', recommendationController_1.getInsights);
exports.default = router;
