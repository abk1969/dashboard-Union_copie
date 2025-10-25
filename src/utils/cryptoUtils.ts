import CryptoJS from 'crypto-js';

const secretKey = process.env.REACT_APP_ENCRYPTION_KEY;

if (!secretKey) {
  throw new Error('REACT_APP_ENCRYPTION_KEY is not set in the environment');
}

export const encrypt = (text: string): string => {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text, secretKey).toString();
};

export const decrypt = (ciphertext: string): string => {
  if (!ciphertext) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Failed to decrypt:', error);
    return ciphertext; // Return original text if decryption fails
  }
};
