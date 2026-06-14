"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', userController_1.registerUser);
router.post('/login', userController_1.loginUser);
router.get('/', userController_1.getUsers);
// Password recovery routes (Public)
router.post('/forgot-password', userController_1.forgotPassword);
router.post('/verify-otp', userController_1.verifyOtp);
router.post('/reset-password', userController_1.resetPassword);
// Profile and settings updates (Protected)
router.put('/profile', auth_1.protect, userController_1.updateProfile);
router.put('/settings', auth_1.protect, userController_1.updateSettings);
router.get('/:id', userController_1.getUserById);
exports.default = router;
