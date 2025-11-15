import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_this';

interface JwtPayload {
  userId: string;
}

/**
 * Optional authentication middleware
 * Sets req.userId if a valid token is present, but doesn't fail if token is missing or invalid
 * This allows routes to work for both authenticated and unauthenticated users
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Attach user ID to request
        req.userId = decoded.userId;
      } catch (error) {
        // Token is invalid or expired, but we don't fail - just don't set userId
        // This allows the route to still work for unauthenticated users
      }
    }

    // Always proceed to next middleware/controller
    next();
  } catch (error: any) {
    // Unexpected error, but still proceed
    console.error('Optional auth middleware error:', error);
    next();
  }
};
