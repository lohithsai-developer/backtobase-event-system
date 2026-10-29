import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a cryptographically secure random token for QR tickets
 */
export const generateSecureToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a ticket token using SHA-256 for secure storage in the database
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Hash password with bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with bcrypt hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
