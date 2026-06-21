import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore: Record<string, RateLimitRecord> = {};

// Clean up memory store every 5 minutes to prevent leaks
setInterval(() => {
  const now = Date.now();
  for (const key in memoryStore) {
    if (memoryStore[key].resetTime < now) {
      delete memoryStore[key];
    }
  }
}, 5 * 60 * 1000);

export const rateLimiter = (options: { windowMs: number; max: number; message: string }) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const email = req.body?.email || '';
    
    // Create unique key based on IP + email (or just IP if email is empty)
    const key = email ? `${ip}_${email}` : ip;
    const now = Date.now();
    
    if (!memoryStore[key]) {
      memoryStore[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }
    
    const record = memoryStore[key];
    
    if (record.resetTime < now) {
      // Window expired, reset
      record.count = 1;
      record.resetTime = now + options.windowMs;
      return next();
    }
    
    record.count++;
    
    if (record.count > options.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        success: false,
        message: options.message,
        retryAfter,
      });
    }
    
    next();
  };
};
