import { Router } from 'express';
import { getRecommendations, getInsights } from '../controllers/recommendationController';

const router = Router();

router.get('/:userId', getRecommendations);
router.get('/:userId/insights', getInsights);

export default router;
