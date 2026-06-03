import crypto from 'crypto';

// Encrypt plaintext with a recipient's RSA public key (JWK format).
// Used by the AI reply service to produce E2E-encrypted messages.
export const rsaEncrypt = (plaintext, publicKeyJwk) => {
  try {
    const pubKey = crypto.createPublicKey({ key: publicKeyJwk, format: 'jwk' });
    const encrypted = crypto.publicEncrypt(pubKey, Buffer.from(plaintext, 'utf8'));
    return encrypted.toString('base64');
  } catch {
    return null;
  }
};
