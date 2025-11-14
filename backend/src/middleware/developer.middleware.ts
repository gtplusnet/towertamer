import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

/**
 * Developer middleware - must be used after authenticate middleware
 * Checks if the authenticated user has developer privileges
 */
export const requireDeveloper = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Ensure user is authenticated (userId should be set by authenticate middleware)
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Fetch user from database
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if user is a developer
    if (!user.isDeveloper) {
      res.status(403).json({
        success: false,
        message: 'Developer access required',
      });
      return;
    }

    // User is a developer, proceed
    next();
  } catch (error: any) {
    console.error('Developer middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking developer status',
      error: error.message,
    });
  }
};
