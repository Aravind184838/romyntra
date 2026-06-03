const KEY_NAME = 'romyntra_e2e_key';

async function getKeyPair() {
  const stored = localStorage.getItem(KEY_NAME);
  if (stored) {
    const { privateKey: priv, publicKey: pub } = JSON.parse(stored);
    return {
      privateKey: await crypto.subtle.importKey('jwk', priv, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']),
      publicKey: await crypto.subtle.importKey('jwk', pub, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt'])
    };
  }
  return null;
}

function arrayBufferToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToArrayBuffer(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
}

export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' },
    true, ['encrypt', 'decrypt']
  );
  const [pubJwk, privJwk] = await Promise.all([
    crypto.subtle.exportKey('jwk', keyPair.publicKey),
    crypto.subtle.exportKey('jwk', keyPair.privateKey)
  ]);
  localStorage.setItem(KEY_NAME, JSON.stringify({ publicKey: pubJwk, privateKey: privJwk }));
  return { publicKey: pubJwk, privateKey: privJwk };
}

export async function getPublicKeyJwk() {
  const pair = await getKeyPair();
  return pair ? JSON.stringify(pair.publicKey) : null;
}

export async function encryptMessage(plaintext, recipientPublicKeyJwk) {
  const recipientPublicKey = await crypto.subtle.importKey(
    'jwk', recipientPublicKeyJwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']
  );
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' }, recipientPublicKey, encoded
  );
  return arrayBufferToBase64(encrypted);
}

export async function decryptMessage(cipherBase64) {
  const pair = await getKeyPair();
  if (!pair) return '[decryption key missing]';
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' }, pair.privateKey, base64ToArrayBuffer(cipherBase64)
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return '[cannot decrypt]';
  }
}
