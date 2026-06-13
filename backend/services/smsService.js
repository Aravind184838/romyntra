import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const hasSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

const normalizePhoneE164 = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
};

const logError = (msg) => {
  try { fs.appendFileSync(path.join(__dirname, '..', 'server_err.txt'), `[SMS Service] ${msg}\n`); } catch {}
};

export const sendOtp = async (phone, otp) => {
  if (!hasSupabase) {
    logError('Supabase not configured, OTP not sent via SMS');
    return { success: false, message: 'Supabase not configured' };
  }
  const e164 = normalizePhoneE164(phone);
  if (!e164) {
    logError(`Invalid phone: ${phone}`);
    return { success: false, message: 'Invalid phone number' };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ phone: e164 })
    });
    const body = await res.json();
    if (!res.ok) {
      const msg = body.msg || body.error_description || body.error || 'Supabase OTP send failed';
      logError(msg);
      return { success: false, message: msg };
    }
    return { success: true };
  } catch (err) {
    logError(err.message);
    return { success: false, message: err.message };
  }
};

export const verifyOtp = async (phone, token) => {
  if (!hasSupabase) {
    return { success: false, message: 'Supabase not configured' };
  }
  const e164 = normalizePhoneE164(phone);
  if (!e164) {
    logError(`Invalid phone: ${phone}`);
    return { success: false, message: 'Invalid phone number' };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ phone: e164, token: String(token), type: 'sms' })
    });
    const body = await res.json();
    if (!res.ok) {
      const msg = body.msg || body.error_description || body.error || 'Supabase OTP verify failed';
      logError(msg);
      return { success: false, message: msg };
    }
    return { success: true, data: body };
  } catch (err) {
    logError(err.message);
    return { success: false, message: err.message };
  }
};
