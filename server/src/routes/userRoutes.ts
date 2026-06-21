import { Router } from 'express';
import { 
  registerUser, loginUser, getUserById, getUsers, 
  forgotPassword, verifyOtp, resetPassword, updateProfile, updateSettings, deleteUser 
} from '../controllers/userController';
import { protect } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

const forgotPasswordLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many password recovery requests. Please try again in 15 minutes.',
});

const verifyOtpLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many verification attempts. Please try again in 15 minutes.',
});

router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/', getUsers);

// Password recovery routes (Public & Rate Limited)
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/verify-otp', verifyOtpLimiter, verifyOtp);
router.post('/reset-password', resetPassword);

// Profile and settings updates (Protected)
router.put('/profile', protect, updateProfile);
router.put('/settings', protect, updateSettings);
router.delete('/profile', protect, deleteUser);

router.get('/:id', getUserById);

export default router;
