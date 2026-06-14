"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.updateProfile = exports.resetPassword = exports.verifyOtp = exports.forgotPassword = exports.getUsers = exports.getUserById = exports.loginUser = exports.registerUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const mockDb_1 = require("../utils/mockDb");
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'prod_ready_secret_key_987654321', {
        expiresIn: '30d',
    });
};
const AVATAR_COLORS = [
    'from-violet-600 to-indigo-600',
    'from-pink-500 to-rose-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-cyan-500 to-blue-500',
    'from-purple-600 to-pink-500',
    'from-fuchsia-600 to-violet-600',
    'from-emerald-400 to-cyan-500',
];
const getRandomAvatarColor = () => {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
};
// @desc    Register a new user
// @route   POST /users
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const avatarColor = getRandomAvatarColor();
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const userExists = mockDb_1.MockDB.findUser({ email });
            if (userExists) {
                return res.status(400).json({ success: false, message: 'User already exists' });
            }
            // Hash password for mock database
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(password, salt);
            const user = mockDb_1.MockDB.createUser({
                name,
                email,
                password: hashedPassword,
                avatarColor,
                settings: { theme: 'light' },
            });
            return res.status(201).json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    avatarColor: user.avatarColor,
                    settings: user.settings,
                    createdAt: user.createdAt,
                    token: generateToken(user._id.toString()),
                },
            });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    try {
        const userExists = await User_1.default.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const user = await User_1.default.create({
            name,
            email,
            password,
            avatarColor,
            settings: { theme: 'light' },
        });
        if (user) {
            return res.status(201).json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    avatarColor: user.avatarColor,
                    settings: user.settings,
                    createdAt: user.createdAt,
                    token: generateToken(user._id.toString()),
                },
            });
        }
        else {
            return res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.registerUser = registerUser;
// @desc    Auth user & get token (Login)
// @route   POST /users/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const user = mockDb_1.MockDB.findUser({ email });
            if (user && (await bcryptjs_1.default.compare(password, user.password))) {
                return res.json({
                    success: true,
                    data: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        avatarColor: user.avatarColor || getRandomAvatarColor(),
                        settings: user.settings || { theme: 'light' },
                        createdAt: user.createdAt,
                        token: generateToken(user._id.toString()),
                    },
                });
            }
            else {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    try {
        const user = await User_1.default.findOne({ email });
        if (user && (await user.comparePassword(password))) {
            // Ensure user has avatarColor, assign if missing
            if (!user.avatarColor) {
                user.avatarColor = getRandomAvatarColor();
                await user.save();
            }
            return res.json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    avatarColor: user.avatarColor,
                    settings: user.settings || { theme: 'light' },
                    createdAt: user.createdAt,
                    token: generateToken(user._id.toString()),
                },
            });
        }
        else {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.loginUser = loginUser;
// @desc    Get user profile
// @route   GET /users/:id
// @access  Private/Public (depending on setup, we'll support query by ID)
const getUserById = async (req, res) => {
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const user = mockDb_1.MockDB.findUserById(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const { password, ...safeUser } = user;
            return res.json({ success: true, data: safeUser });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    try {
        const user = await User_1.default.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.json({ success: true, data: user });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserById = getUserById;
// @desc    Get all users
// @route   GET /users
// @access  Public (for demonstration)
const getUsers = async (req, res) => {
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const users = mockDb_1.MockDB.getUsers().map(({ password, ...user }) => user);
            return res.json({ success: true, data: users });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    try {
        const users = await User_1.default.find({}).select('-password');
        return res.json({ success: true, data: users });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUsers = getUsers;
// @desc    Request Password Reset (Generates OTP)
// @route   POST /users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const user = mockDb_1.MockDB.findUser({ email });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found with this email' });
            }
            mockDb_1.MockDB.updateUser(user._id, {
                otp,
                otpExpires,
                otpVerified: false,
            });
            console.log(`[DEV OTP RECOVERY] OTP for ${email}: ${otp}`);
            return res.json({
                success: true,
                message: 'OTP sent to email. Check server console or use payload OTP.',
                devOtp: otp, // Returned for dev testing convenience
            });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    try {
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with this email' });
        }
        user.otp = otp;
        user.otpExpires = otpExpires;
        user.otpVerified = false;
        await user.save();
        console.log(`[DEV OTP RECOVERY] OTP for ${email}: ${otp}`);
        return res.json({
            success: true,
            message: 'OTP verification code sent. Check server console or use payload OTP.',
            devOtp: otp,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.forgotPassword = forgotPassword;
// @desc    Verify OTP and generate Reset Password JWT
// @route   POST /users/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const user = mockDb_1.MockDB.findUser({ email });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            if (user.otp !== otp) {
                return res.status(400).json({ success: false, message: 'Invalid OTP code' });
            }
            if (new Date(user.otpExpires) < new Date()) {
                return res.status(400).json({ success: false, message: 'OTP has expired' });
            }
            mockDb_1.MockDB.updateUser(user._id, {
                otpVerified: true,
            });
            // Generate verification token (short-lived 15 mins reset token)
            const resetToken = jsonwebtoken_1.default.sign({ id: user._id, isResetToken: true }, process.env.JWT_SECRET || 'prod_ready_secret_key_987654321', { expiresIn: '15m' });
            return res.json({
                success: true,
                message: 'OTP verified successfully',
                resetToken,
            });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    try {
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP code' });
        }
        if (user.otpExpires && user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }
        user.otpVerified = true;
        await user.save();
        const resetToken = jsonwebtoken_1.default.sign({ id: user._id, isResetToken: true }, process.env.JWT_SECRET || 'prod_ready_secret_key_987654321', { expiresIn: '15m' });
        return res.json({
            success: true,
            message: 'OTP verified successfully',
            resetToken,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.verifyOtp = verifyOtp;
// @desc    Reset password using reset token
// @route   POST /users/reset-password
// @access  Public (Validated with Reset Token)
const resetPassword = async (req, res) => {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
        return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    try {
        // Decode reset token
        const decoded = jsonwebtoken_1.default.verify(resetToken, process.env.JWT_SECRET || 'prod_ready_secret_key_987654321');
        if (!decoded.id || !decoded.isResetToken) {
            return res.status(400).json({ success: false, message: 'Invalid reset token' });
        }
        const userId = decoded.id;
        if (process.env.USE_MOCK_DB === 'true') {
            const user = mockDb_1.MockDB.findUserById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            if (!user.otpVerified) {
                return res.status(400).json({ success: false, message: 'OTP verification is required first' });
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(password, salt);
            mockDb_1.MockDB.updateUser(userId, {
                password: hashedPassword,
                otp: undefined,
                otpExpires: undefined,
                otpVerified: false,
            });
            return res.json({ success: true, message: 'Password reset successfully' });
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!user.otpVerified) {
            return res.status(400).json({ success: false, message: 'OTP verification is required first' });
        }
        user.password = password; // pre-save hook handles hashing
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpVerified = false;
        await user.save();
        return res.json({ success: true, message: 'Password reset successfully' });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: 'Reset token has expired or is invalid' });
    }
};
exports.resetPassword = resetPassword;
// @desc    Update user profile details (Name, Email, Password)
// @route   PUT /users/profile
// @access  Private (Authenticated)
const updateProfile = async (req, res) => {
    const userId = req.user?.id;
    const { name, email, currentPassword, newPassword } = req.body;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized profile update' });
    }
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const user = mockDb_1.MockDB.findUserById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            // Check if updating email and email is already taken
            if (email && email !== user.email) {
                const taken = mockDb_1.MockDB.findUser({ email });
                if (taken) {
                    return res.status(400).json({ success: false, message: 'Email is already in use' });
                }
            }
            const updates = {};
            if (name)
                updates.name = name;
            if (email)
                updates.email = email;
            // Handle password update if requested
            if (newPassword) {
                if (!currentPassword) {
                    return res.status(400).json({ success: false, message: 'Current password is required to change password' });
                }
                const matches = await bcryptjs_1.default.compare(currentPassword, user.password);
                if (!matches) {
                    return res.status(400).json({ success: false, message: 'Invalid current password' });
                }
                if (newPassword.length < 6) {
                    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
                }
                const salt = await bcryptjs_1.default.genSalt(10);
                updates.password = await bcryptjs_1.default.hash(newPassword, salt);
            }
            const updatedUser = mockDb_1.MockDB.updateUser(userId, updates);
            const { password, ...safeUser } = updatedUser;
            return res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    ...safeUser,
                    token: generateToken(userId), // issue updated token
                },
            });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    try {
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (email && email !== user.email) {
            const taken = await User_1.default.findOne({ email });
            if (taken) {
                return res.status(400).json({ success: false, message: 'Email is already in use' });
            }
            user.email = email;
        }
        if (name)
            user.name = name;
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password is required to change password' });
            }
            const matches = await user.comparePassword(currentPassword);
            if (!matches) {
                return res.status(400).json({ success: false, message: 'Invalid current password' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
            }
            user.password = newPassword; // hashed pre-save
        }
        const saved = await user.save();
        return res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                _id: saved._id,
                name: saved.name,
                email: saved.email,
                avatarColor: saved.avatarColor,
                settings: saved.settings,
                createdAt: saved.createdAt,
                token: generateToken(saved._id.toString()),
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateProfile = updateProfile;
// @desc    Update user custom configurations (Theme, notifications etc.)
// @route   PUT /users/settings
// @access  Private (Authenticated)
const updateSettings = async (req, res) => {
    const userId = req.user?.id;
    const { theme } = req.body;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized settings update' });
    }
    if (process.env.USE_MOCK_DB === 'true') {
        try {
            const user = mockDb_1.MockDB.findUserById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const settings = { ...user.settings, theme: theme || 'light' };
            const updated = mockDb_1.MockDB.updateUser(userId, { settings });
            const { password, ...safeUser } = updated;
            return res.json({
                success: true,
                message: 'Settings updated successfully',
                data: safeUser,
            });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    try {
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.settings = {
            theme: theme || user.settings?.theme || 'light',
        };
        const saved = await user.save();
        return res.json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                _id: saved._id,
                name: saved.name,
                email: saved.email,
                avatarColor: saved.avatarColor,
                settings: saved.settings,
                createdAt: saved.createdAt,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateSettings = updateSettings;
