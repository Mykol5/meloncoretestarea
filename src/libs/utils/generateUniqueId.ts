import { randomBytes } from 'crypto';

export function generateUniqueId(): string {
  const random = randomBytes(12).toString('hex');
  return `${random}`;
}
