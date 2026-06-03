import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { generateKeyPair, getPublicKeyJwk } from '../utils/e2ee';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('romyntra_token'));
  const [loading, setLoading] = useState(true);

  const ensureKeyPair = useCallback(async () => {
    const existing = localStorage.getItem('romyntra_e2e_key');
    if (!existing) {
      await generateKeyPair();
    }
    const pub = await getPublicKeyJwk();
    if (pub) {
      await api.put('/users/public-key', { publicKey: pub });
    }
  }, []);

  // Bootstrap — validate token on mount
  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem('romyntra_token');
      if (!saved) { setLoading(false); return; }
      try {
        const { data } = await api.get('/users/profile');
        setUser(data.user);
        await ensureKeyPair();
      } catch {
        localStorage.removeItem('romyntra_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [ensureKeyPair]);

  const saveToken = (t) => {
    localStorage.setItem('romyntra_token', t);
    setToken(t);
  };

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    saveToken(data.token);
    setUser(data.user);
    await ensureKeyPair();
    return data;
  }, [ensureKeyPair]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    if (!data?.token || !data?.user) {
      throw new Error(data?.message || 'Login failed. Please try again.');
    }
    saveToken(data.token);
    setUser(data.user);
    await ensureKeyPair();
    return data;
  }, [ensureKeyPair]);

  const sendOtp = useCallback(async ({ email, phone }) => {
    const { data } = await api.post('/auth/send-otp', { email, phone });
    return data;
  }, []);

  const verifyOtp = useCallback(async ({ email, phone, otp }) => {
    const { data } = await api.post('/auth/verify-otp', { email, phone, otp });
    if (data.token) saveToken(data.token);
    if (data.user) setUser(data.user);
    await ensureKeyPair();
    return data;
  }, [ensureKeyPair]);

  const logout = useCallback(() => {
    localStorage.removeItem('romyntra_token');
    localStorage.removeItem('romyntra_e2e_key');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, sendOtp, verifyOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
