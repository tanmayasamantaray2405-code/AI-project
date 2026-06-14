import { Router } from 'express';
import { 
  registerUser, loginUser, getUserById, getUsers, 
  forgotPassword, verifyOtp, resetPassword, updateProfile, updateSettings 
} from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/', getUsers);

// Password recovery routes (Public)
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Profile and settings updates (Protected)
router.put('/profile', protect, updateProfile);
router.put('/settings', protect, updateSettings);

router.get('/:id', getUserById);

export default router;
