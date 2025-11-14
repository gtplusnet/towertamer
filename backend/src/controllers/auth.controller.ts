import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { PlayerState } from '../models/PlayerState';
import { Map } from '../models/Map';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? 'Email already registered'
            : 'Username already taken',
      });
      return;
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    // Get default spawn map from database
    const defaultMap = await Map.findOne({ isDefaultSpawn: true });

    if (!defaultMap) {
      // Rollback user creation if no default map exists
      await User.findByIdAndDelete(user._id);
      res.status(500).json({
        success: false,
        message: 'No default spawn map configured. Please contact administrator.',
      });
      return;
    }

    // Create initial player state
    const playerState = await PlayerState.create({
      userId: user._id,
      username: user.username,
      currentMap: defaultMap._id,
      position: {
        row: parseInt(process.env.DEFAULT_SPAWN_ROW || '10'),
        col: parseInt(process.env.DEFAULT_SPAWN_COL || '15'),
      },
      direction: 'idle',
      isOnline: false,
    });

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isDeveloper: user.isDeveloper,
        },
        playerState: {
          currentMap: playerState.currentMap,
          position: playerState.position,
          direction: playerState.direction,
        },
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message,
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { login, password } = req.body; // login can be username or email

    // Validation
    if (!login || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide username/email and password',
      });
      return;
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: login }, { username: login }],
    }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get player state
    const playerState = await PlayerState.findOne({ userId: user._id });

    if (!playerState) {
      res.status(500).json({
        success: false,
        message: 'Player state not found',
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isDeveloper: user.isDeveloper,
        },
        playerState: {
          currentMap: playerState.currentMap,
          position: playerState.position,
          direction: playerState.direction,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message,
    });
  }
};

// Get current user (protected route)
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // User ID is attached by auth middleware
    const userId = (req as any).userId;

    const user = await User.findById(userId);
    const playerState = await PlayerState.findOne({ userId });

    if (!user || !playerState) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isDeveloper: user.isDeveloper,
        },
        playerState: {
          currentMap: playerState.currentMap,
          position: playerState.position,
          direction: playerState.direction,
          isOnline: playerState.isOnline,
        },
      },
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message,
    });
  }
};
