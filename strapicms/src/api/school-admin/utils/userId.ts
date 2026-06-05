import crypto from 'crypto';

/**
 * Generates a 12-character alphanumeric unique ID
 * Matches the Spring Boot userId field behavior
 */
export function generateUserId(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}
