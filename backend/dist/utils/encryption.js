// utils/encryption.js
import crypto from "crypto";

// Encryption algorithm
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Get encryption key from environment
const getKey = () => {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY is not set in environment variables");
  }
  // Derive a key from the secret
  return crypto.pbkdf2Sync(secret, "salt", 100000, KEY_LENGTH, "sha512");
};

// Encrypt connection string
export const encryptConnectionString = (text) => {
  try {
    const key = getKey();

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get auth tag
    const tag = cipher.getAuthTag();

    // Combine iv + encrypted + tag
    return iv.toString("hex") + ":" + encrypted + ":" + tag.toString("hex");
  } catch (error) {
    console.error("Encryption Error:", error);
    throw new Error("Failed to encrypt connection string");
  }
};

// Decrypt connection string
export const decryptConnectionString = (encryptedText) => {
  try {
    const key = getKey();

    // Split the encrypted text
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], "hex");

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption Error:", error);
    throw new Error("Failed to decrypt connection string");
  }
};

// Hash sensitive data (one-way)
export const hashData = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};
