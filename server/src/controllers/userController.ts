import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Task from '../models/Task';
import { MockDB } from '../utils/mockDb';
import { AuthRequest } from '../types';
import { getJwtSecret, isDevelopmentRuntime } from '../utils/security';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, getJwtSecret(), {
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

const getRandomAvatarColor = (): string => {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
};

// @desc    Register a new user
// @route   POST /users
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<any> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const avatarColor = getRandomAvatarColor();

  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const userExists = MockDB.findUser({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      // Hash password for mock database
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = MockDB.createUser({
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
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
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
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /users/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const user = MockDB.findUser({ email });
      if (user && (await bcrypt.compare(password, user.password))) {
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
      } else {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const user = await User.findOne({ email });

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
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Get user profile
// @route   GET /users/:id
// @access  Private/Public (depending on setup, we'll support query by ID)
export const getUserById = async (req: Request, res: Response): Promise<any> => {
  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const user = MockDB.findUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const { password, ...safeUser } = user;
      return res.json({ success: true, data: safeUser });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Get all users
// @route   GET /users
// @access  Public (for demonstration)
export const getUsers = async (req: Request, res: Response): Promise<any> => {
  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const users = MockDB.getUsers().map(({ password, ...user }) => user);
      return res.json({ success: true, data: users });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const users = await User.find({}).select('-password');
    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Request Password Reset (Generates OTP)
// @route   POST /users/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const user = MockDB.findUser({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found with this email' });
      }

      MockDB.updateUser(user._id, {
        otp,
        otpExpires,
        otpVerified: false,
      });

      if (isDevelopmentRuntime()) {
        console.log(`[DEV OTP RECOVERY] OTP for ${email}: ${otp}`);
      }

      const payload: any = {
        success: true,
        message: 'If an account exists for this email, a recovery code has been sent.',
      };

      if (isDevelopmentRuntime()) {
        payload.devOtp = otp;
      }

      return res.json(payload);
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    user.otpVerified = false;
    await user.save();

    if (isDevelopmentRuntime()) {
      console.log(`[DEV OTP RECOVERY] OTP for ${email}: ${otp}`);
    }

    const payload: any = {
      success: true,
      message: 'If an account exists for this email, a recovery code has been sent.',
    };

    if (isDevelopmentRuntime()) {
      payload.devOtp = otp;
    }

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Verify OTP and generate Reset Password JWT
// @route   POST /users/verify-otp
// @access  Public
export const verifyOtp = async (req: Request, res: Response): Promise<any> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const user = MockDB.findUser({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.otp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP code' });
      }

      if (new Date(user.otpExpires) < new Date()) {
        return res.status(400).json({ success: false, message: 'OTP has expired' });
      }

      MockDB.updateUser(user._id, {
        otpVerified: true,
      });

      // Generate verification token (short-lived 15 mins reset token)
      const resetToken = jwt.sign(
        { id: user._id, isResetToken: true },
        getJwtSecret(),
        { expiresIn: '15m' }
      );

      return res.json({
        success: true,
        message: 'OTP verified successfully',
        resetToken,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const user = await User.findOne({ email });
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

    const resetToken = jwt.sign(
      { id: user._id, isResetToken: true },
      getJwtSecret(),
      { expiresIn: '15m' }
    );

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Reset password using reset token
// @route   POST /users/reset-password
// @access  Public (Validated with Reset Token)
export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  const { resetToken, password } = req.body;

  if (!resetToken || !password) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  try {
    // Decode reset token
    const decoded = jwt.verify(resetToken, getJwtSecret()) as any;
    
    if (!decoded.id || !decoded.isResetToken) {
      return res.status(400).json({ success: false, message: 'Invalid reset token' });
    }

    const userId = decoded.id;

    if (process.env.USE_MOCK_DB === 'true') {
      const user = MockDB.findUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (!user.otpVerified) {
        return res.status(400).json({ success: false, message: 'OTP verification is required first' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      MockDB.updateUser(userId, {
        password: hashedPassword,
        otp: undefined,
        otpExpires: undefined,
        otpVerified: false,
      });

      return res.json({ success: true, message: 'Password reset successfully' });
    }

    const user = await User.findById(userId);
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
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Reset token has expired or is invalid' });
  }
};

// @desc    Update user profile details (Name, Email, Password, Profile Image)
// @route   PUT /users/profile
// @access  Private (Authenticated)
export const updateProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  const { name, email, currentPassword, newPassword, profileImage } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized profile update' });
  }

  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const user = MockDB.findUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Check if updating email and email is already taken
      if (email && email !== user.email) {
        const taken = MockDB.findUser({ email });
        if (taken) {
          return res.status(400).json({ success: false, message: 'Email is already in use' });
        }
      }

      const updates: any = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (profileImage !== undefined) updates.profileImage = profileImage;
      if (req.body.avatarColor !== undefined) updates.avatarColor = req.body.avatarColor;

      // Handle password update if requested
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: 'Current password is required to change password' });
        }
        const matches = await bcrypt.compare(currentPassword, user.password);
        if (!matches) {
          return res.status(400).json({ success: false, message: 'Invalid current password' });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(newPassword, salt);
      }

      const updatedUser = MockDB.updateUser(userId, updates);
      const { password, ...safeUser } = updatedUser;

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          ...safeUser,
          token: generateToken(userId), // issue updated token
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) {
        return res.status(400).json({ success: false, message: 'Email is already in use' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (req.body.avatarColor !== undefined) user.avatarColor = req.body.avatarColor;

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
        profileImage: saved.profileImage,
        settings: saved.settings,
        createdAt: saved.createdAt,
        token: generateToken(saved._id.toString()),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Update user custom configurations (Theme, notifications etc.)
// @route   PUT /users/settings
// @access  Private (Authenticated)
export const updateSettings = async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;
  const { theme, emailNotifications, taskSorting } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized settings update' });
  }

  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const user = MockDB.findUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const settings = {
        ...user.settings,
        theme: theme || user.settings?.theme || 'light',
        emailNotifications: emailNotifications !== undefined ? emailNotifications : (user.settings?.emailNotifications ?? true),
        taskSorting: taskSorting || user.settings?.taskSorting || 'newest',
      };
      const updated = MockDB.updateUser(userId, { settings });
      const { password, ...safeUser } = updated;

      return res.json({
        success: true,
        message: 'Settings updated successfully',
        data: safeUser,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.settings = {
      theme: theme || user.settings?.theme || 'light',
      emailNotifications: emailNotifications !== undefined ? emailNotifications : (user.settings?.emailNotifications ?? true),
      taskSorting: taskSorting || user.settings?.taskSorting || 'newest',
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
        profileImage: saved.profileImage,
        settings: saved.settings,
        createdAt: saved.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// @desc    Delete user account and all tasks
// @route   DELETE /users/profile
// @access  Private (Authenticated)
export const deleteUser = async (req: AuthRequest, res: Response): Promise<any> => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (process.env.USE_MOCK_DB === 'true') {
    try {
      const deleted = MockDB.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete associated tasks
    await Task.deleteMany({ userId });
    // Delete user
    await user.deleteOne();

    return res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
};
