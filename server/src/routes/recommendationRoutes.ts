import { Router } from 'express';
import { getRecommendations, getInsights } from '../controllers/recommendationController';
import { protect } from '../middleware/auth';

const router = Router();

// Token-protected endpoints
router.get('/', protect, getRecommendations);
router.get('/me', protect, getRecommendations);
router.get('/me/insights', protect, getInsights);

// Legacy endpoints
router.get('/:userId', getRecommendations);
router.get('/:userId/insights', getInsights);

export default router;
