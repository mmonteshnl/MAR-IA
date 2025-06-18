import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment variable
function getEncryptionKey(): Buffer {
  const key = process.env.CONNECTIONS_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('CONNECTIONS_ENCRYPTION_KEY environment variable is not set');
  }
  return Buffer.from(key, 'hex');
}

export function encrypt(text: string): string {
  try {
    const KEY = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('hex');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function decrypt(encryptedHex: string): string {
  try {
    const KEY = getEncryptionKey();
    const data = Buffer.from(encryptedHex, 'hex');
    
    if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = data.slice(0, IV_LENGTH);
    const authTag = data.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.slice(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Utility function to generate a secure encryption key (for setup purposes)
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}