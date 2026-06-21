"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
const forgotPasswordLimiter = (0, rateLimiter_1.rateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: 'Too many password recovery requests. Please try again in 15 minutes.',
});
const verifyOtpLimiter = (0, rateLimiter_1.rateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many verification attempts. Please try again in 15 minutes.',
});
router.post('/', userController_1.registerUser);
router.post('/login', userController_1.loginUser);
router.get('/', userController_1.getUsers);
// Password recovery routes (Public & Rate Limited)
router.post('/forgot-password', forgotPasswordLimiter, userController_1.forgotPassword);
router.post('/verify-otp', verifyOtpLimiter, userController_1.verifyOtp);
router.post('/reset-password', userController_1.resetPassword);
// Profile and settings updates (Protected)
router.put('/profile', auth_1.protect, userController_1.updateProfile);
router.put('/settings', auth_1.protect, userController_1.updateSettings);
router.delete('/profile', auth_1.protect, userController_1.deleteUser);
router.get('/:id', userController_1.getUserById);
exports.default = router;
