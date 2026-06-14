import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  let token;

  // Check for Bearer token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'prod_ready_secret_key_987654321') as { id: string };
    
    // Attach the user ID to the request object
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error('JWT Verification error:', error);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};
