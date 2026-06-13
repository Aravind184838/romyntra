import fs from 'fs';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import admin from '../config/firebase.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const hasSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

// ─── Supabase OTP helpers ──────────────────────────────────────────────────

const normalizePhoneE164 = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
};

const sendSupabaseOtp = async (phone) => {
  const e164 = normalizePhoneE164(phone);
  if (!e164) throw new Error('Invalid phone number');
  const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
    body: JSON.stringify({ phone: e164 })
  });
  const body = await res.json();
  if (!res.ok) {
    const msg = body.msg || body.error_description || body.error || 'Supabase OTP send failed';
    fs.appendFileSync('server_err.txt', `[Supabase OTP] ${msg}\n`);
    throw new Error(msg);
  }
  return e164;
};

const verifySupabaseOtp = async (phone, otp) => {
  const e164 = normalizePhoneE164(phone);
  if (!e164) throw new Error('Invalid phone number');
  const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
    body: JSON.stringify({ phone: e164, token: otp, type: 'sms' })
  });
  const body = await res.json();
  if (!res.ok) {
    const msg = body.msg || body.error_description || body.error || 'Supabase OTP verify failed';
    fs.appendFileSync('server_err.txt', `[Supabase Verify] ${msg}\n`);
    throw new Error(msg);
  }
  return body;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const isDev = process.env.NODE_ENV !== 'production';

const isValidOtp = (user, otp) => {
  const code = otp?.toString().trim();
  return user.otp?.code === code;
};

const userPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  age: user.age,
  gender: user.gender,
  role: user.role,
  isVerified: user.isVerified,
  isProfileComplete: user.isProfileComplete,
  photos: user.photos,
  bio: user.bio
});

const getAge = (dob) => {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// ─── @route POST /api/auth/register ─────────────────────────────────────────
const normalizeEmail = (email) => email?.toString().trim().toLowerCase() || '';

export const register = async (req, res, next) => {
  try {
    const { name, phone, password, dob, gender } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password || !dob || !gender) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const age = getAge(dob);
    if (age < 18) {
      return res.status(400).json({ success: false, message: 'You must be at least 18 years old to use Romyntra' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES) || 10) * 60 * 1000);

    const user = await User.create({
      name,
      email,
      phone: phone || undefined,
      password,
      dob,
      age,
      gender,
      otp: { code: otp, expiresAt: otpExpiry }
    });

    const token = generateToken(user._id);

    // Always show dev OTP in response (pink banner) for debugging
    const devOtp = otp;

    // Try Supabase SMS if configured
    if (phone && hasSupabase) {
      try {
        await sendSupabaseOtp(phone);
        console.log(`📱 [Supabase OTP] SMS sent to ${phone}`);
      } catch (err) {
        console.error('Supabase OTP send failed:', err.message);
      }
    } else {
      console.log(`📱 [DEV MODE] OTP ${otp} for ${email}${phone ? ` / ${phone}` : ''}`);
    }

    res.status(201).json({
      success: true,
      message: 'Account created! Please verify your OTP.',
      token,
      devOtp,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route POST /api/auth/login ─────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remaining = Math.ceil((user.lockUntil - new Date()) / 1000 / 60);
      return res.status(429).json({ success: false, message: `Account locked. Try again in ${remaining} minute(s).` });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
        await user.save({ validateBeforeSave: false });
        return res.status(429).json({ success: false, message: 'Account locked for 15 minutes due to too many failed attempts.' });
      }
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = null;

    if (user.isRestricted) {
      return res.status(403).json({ success: false, message: 'Your account has been restricted. Contact support.' });
    }

    user.lastActive = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete,
        photos: user.photos,
        bio: user.bio
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route POST /api/auth/send-otp ──────────────────────────────────────────
export const sendOTP = async (req, res, next) => {
  try {
    const email = req.body.email ? normalizeEmail(req.body.email) : undefined;
    const { phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const user = await User.findOne(email ? { email } : { phone });

    if (!user) {
      return res.status(200).json({ success: true, message: 'If the account exists, an OTP has been sent.' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES) || 10) * 60 * 1000);

    user.otp = { code: otp, expiresAt: otpExpiry };
    await user.save({ validateBeforeSave: false });

    // Always return devOtp for debugging
    const devOtp = otp;
    const userPhone = user.phone || phone;
    if (userPhone && hasSupabase) {
      try {
        await sendSupabaseOtp(userPhone);
        console.log(`📱 [Supabase OTP] SMS resent to ${userPhone}`);
      } catch (err) {
        console.error('Supabase OTP resend failed:', err.message);
      }
    } else {
      const target = email || phone;
      console.log(`📱 [DEV MODE] OTP ${otp} for ${target}`);
    }

    res.status(200).json({
      success: true,
      message: 'If the account exists, an OTP has been sent.',
      devOtp
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route POST /api/auth/verify-otp ────────────────────────────────────────
export const verifyOTP = async (req, res, next) => {
  try {
    const email = req.body.email ? normalizeEmail(req.body.email) : undefined;
    const { phone, otp } = req.body;

    if (!otp || (!email && !phone)) {
      return res.status(400).json({ success: false, message: 'Email or phone and OTP are required' });
    }

    const user = await User.findOne(email ? { email } : { phone }).select('+otp.code +otp.expiresAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If Supabase is configured, verify via Supabase (supersedes local OTP check)
    const userPhone = user.phone || phone;
    if (userPhone && hasSupabase) {
      try {
        await verifySupabaseOtp(userPhone, otp.toString().trim());
        // Supabase verified – mark user as verified
        user.isVerified = true;
        user.isPhoneVerified = true;
        user.otp = undefined;
        user.lastActive = Date.now();
        await user.save({ validateBeforeSave: false });
        const token = generateToken(user._id);
        return res.status(200).json({
          success: true,
          message: 'OTP verified successfully! Account is now verified.',
          token,
          user: userPayload(user)
        });
      } catch (err) {
        console.error('Supabase verify failed:', err.message);
        // Fall through to local OTP check in case of Supabase error
      }
    }

    // Local OTP verification (dev mode or Supabase fallback)
    if (isDev && otp.toString().trim() === process.env.DEV_OTP || otp === '000000') {
      // dev bypass
    } else {
      if (!user.otp?.code) {
        return res.status(400).json({ success: false, message: 'No OTP requested. Please request a new OTP.' });
      }

      if (new Date() > user.otp.expiresAt) {
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }

      if (!isValidOtp(user, otp)) {
        return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
      }
    }

    user.isVerified = true;
    user.isPhoneVerified = true;
    user.otp = undefined;
    user.lastActive = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully! Account is now verified.',
      token,
      user: userPayload(user)
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route POST /api/auth/verify-firebase ───────────────────────────────────
export const verifyFirebase = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Firebase ID Token is required' });
    }

    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { phone_number, uid } = decodedToken;

    // Update user in MongoDB
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.phone = phone_number || user.phone;
    user.firebaseUid = uid;
    user.isVerified = true;
    user.isPhoneVerified = true;
    user.otp = undefined; // Clear mock OTP if it exists

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Phone verified via Firebase successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Firebase verification error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired Firebase token' });
  }
};

// ─── @route POST /api/auth/login-firebase ────────────────────────────────────
export const loginFirebase = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Firebase ID Token is required' });
    }

    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { phone_number } = decodedToken;

    if (!phone_number) {
      return res.status(400).json({ success: false, message: 'Phone number not found in token' });
    }

    // Find user by phone
    const user = await User.findOne({ phone: phone_number });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this phone number. Please sign up.' });
    }

    if (user.isRestricted) {
      return res.status(403).json({ success: false, message: 'Your account has been restricted.' });
    }

    user.lastActive = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete,
        photos: user.photos
      }
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired Firebase token' });
  }
};

// ─── @route GET /api/auth/me ──────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── @route PUT /api/auth/change-email ───────────────────────────────────────
export const changeEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body;
    if (!newEmail || !password) {
      return res.status(400).json({ success: false, message: 'New email and password are required' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    user.email = newEmail.trim().toLowerCase();
    user.isEmailVerified = false;
    await user.save();
    res.status(200).json({ success: true, message: 'Email updated! Please verify your new email.' });
  } catch (error) { next(error); }
};

// ─── @route PUT /api/auth/change-phone ───────────────────────────────────────
export const changePhone = async (req, res, next) => {
  try {
    const { newPhone } = req.body;
    if (!newPhone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    const user = await User.findById(req.user._id);
    user.phone = newPhone.trim();
    user.isPhoneVerified = false;
    await user.save();
    res.status(200).json({ success: true, message: 'Phone updated! Please verify your new number.' });
  } catch (error) { next(error); }
};

// ─── @route PUT /api/auth/change-password ────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) { next(error); }
};

// ─── @route DELETE /api/auth/account ──────────────────────────────────────────
export const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await user.deleteOne();
    res.status(200).json({ success: true, message: 'Account deleted permanently' });
  } catch (error) { next(error); }
};
