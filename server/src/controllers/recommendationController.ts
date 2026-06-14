import { Request, Response } from 'express';
import { getSmartRecommendations, getSmartInsights } from '../services/recommendationService';

// @desc    Get smart task recommendations for a user
// @route   GET /recommendations/:userId
// @access  Private
export const getRecommendations = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    const recommendations = await getSmartRecommendations(userId);
    return res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Get smart productivity insights and scores
// @route   GET /recommendations/:userId/insights
// @access  Private
export const getInsights = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    const insights = await getSmartInsights(userId);
    return res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};
