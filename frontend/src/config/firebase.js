/**
 * Firebase is optional. Set VITE_USE_FIREBASE=true and valid VITE_FIREBASE_* keys
 * in .env to enable phone auth via Firebase. Otherwise the app uses backend JWT + mock OTP.
 */
export const isFirebaseEnabled = () => {
  const useFirebase = import.meta.env.VITE_USE_FIREBASE === 'true';
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return useFirebase && Boolean(apiKey) && apiKey !== 'YOUR_API_KEY';
};

export const auth = null;
