import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }

  return secret || 'taskgenius_dev_secret_change_me';
};

export const signAppToken = (payload: object, expiresIn: string): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, getJwtSecret() as Secret, options);
};

export const isDevelopmentRuntime = (): boolean => {
  return process.env.NODE_ENV !== 'production';
};
