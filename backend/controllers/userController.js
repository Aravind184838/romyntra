import User from '../models/User.js';
import Swipe from '../models/Swipe.js';
import Match from '../models/Match.js';
import { scoreCompatibility, generateRecommendations } from '../services/recommendationEngine.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const GENDER_MAP = {
  Man: 'male',
  Woman: 'female',
  'Non-binary': 'non-binary',
  Other: 'other',
  male: 'male',
  female: 'female',
  'non-binary': 'non-binary',
  other: 'other',
  'not-specified': 'not-specified'
};

const LOOKING_MAP = {
  Men: 'male',
  Women: 'female',
  Everyone: 'everyone',
  male: 'male',
  female: 'female',
  everyone: 'everyone'
};

const parseJsonField = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const fileToDataUrl = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

// ─── @route GET /api/users/profile ───────────────────────────────────────────
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const matchCount = await Match.countDocuments({ users: req.user._id, status: 'active' });
    const likesGiven = user.swipedRight?.length || 0;
    const profileViews = user.profileViews?.length || 0;
    const userObj = user.toObject();
    userObj.matchCount = matchCount;
    userObj.likesGiven = likesGiven;
    userObj.profileViews = profileViews;
    res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    next(error);
  }
};

// ─── @route PUT /api/users/profile ───────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const body = req.body || {};

    const updates = {};

    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.gender !== undefined) {
      const gender = GENDER_MAP[body.gender] || body.gender;
      updates.gender = gender;
    }
    if (body.lookingFor !== undefined) {
      const lookingFor = LOOKING_MAP[body.lookingFor] || body.lookingFor;
      updates.lookingFor = lookingFor;
    }

    const interests = parseJsonField(body.interests);
    if (interests) updates.interests = interests;

    const cuisinePreferences = parseJsonField(body.cuisinePreferences);
    if (cuisinePreferences) updates.cuisinePreferences = cuisinePreferences;

    const movieGenres = parseJsonField(body.movieGenres);
    if (movieGenres) updates.movieGenres = movieGenres;

    const ambiencePreferences = parseJsonField(body.ambiencePreferences);
    if (ambiencePreferences) updates.ambiencePreferences = ambiencePreferences;

    const budgetRange = parseJsonField(body.budgetRange);
    if (budgetRange) updates.budgetRange = budgetRange;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    Object.assign(user, updates);

    if (req.files?.length) {
      const newPhotos = req.files.map((file, index) => ({
        url: fileToDataUrl(file),
        publicId: '',
        isPrimary: user.photos.length === 0 && index === 0
      }));
      user.photos = [...user.photos, ...newPhotos].slice(0, 6);
      if (user.photos.length && !user.photos.some((p) => p.isPrimary)) {
        user.photos[0].isPrimary = true;
      }
    }

    const isComplete =
      Boolean(user.bio?.trim()) &&
      user.photos.length > 0 &&
      user.interests.length > 0 &&
      user.gender &&
      user.gender !== 'not-specified';

    user.isProfileComplete = isComplete;

    await user.save({ validateBeforeSave: true });

    res.status(200).json({
      success: true,
      message: 'Profile updated!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        lookingFor: user.lookingFor,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete,
        photos: user.photos,
        bio: user.bio,
        interests: user.interests,
        cuisinePreferences: user.cuisinePreferences,
        movieGenres: user.movieGenres,
        ambiencePreferences: user.ambiencePreferences,
        budgetRange: user.budgetRange
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route POST /api/users/photos ───────────────────────────────────────────
const isValidPhotoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(parsed.pathname);
  } catch {
    return false;
  }
};

export const uploadPhoto = async (req, res, next) => {
  try {
    const { url, isPrimary } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'Photo URL is required' });
    }

    if (!isValidPhotoUrl(url)) {
      return res.status(400).json({ success: false, message: 'Invalid photo URL. Must be an HTTPS image URL.' });
    }

    const user = await User.findById(req.user._id);

    if (user.photos.length >= 6) {
      return res.status(400).json({ success: false, message: 'Maximum 6 photos allowed' });
    }

    const photo = {
      url,
      publicId: '',
      isPrimary: isPrimary || user.photos.length === 0
    };

    if (isPrimary) {
      user.photos.forEach(p => (p.isPrimary = false));
    }

    user.photos.push(photo);
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Photo added!', photos: user.photos });
  } catch (error) {
    next(error);
  }
};

// ─── @route DELETE /api/users/photos/:photoId ────────────────────────────────
export const deletePhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.photos = user.photos.filter(p => p._id.toString() !== req.params.photoId);
    if (user.photos.length > 0 && !user.photos.some(p => p.isPrimary)) {
      user.photos[0].isPrimary = true;
    }
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: 'Photo removed!', photos: user.photos });
  } catch (error) {
    next(error);
  }
};

// ─── @route GET /api/users/discover ──────────────────────────────────────────
export const discoverProfiles = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);

    const excludeIds = [
      req.user._id,
      ...currentUser.swipedRight,
      ...currentUser.swipedLeft,
      ...currentUser.superLiked
    ];

    const alreadySwiped = await Swipe.find({ swiped: req.user._id, action: 'pass' }).select('swiper');
    const passedIds = alreadySwiped.map(s => s.swiper);

    let genderFilter = {};
    if (currentUser.lookingFor !== 'everyone') {
      genderFilter.gender = currentUser.lookingFor;
    }

    // Optional filters from query params
    const { minAge, maxAge, interests, location } = req.query;
    let ageFilter = { $gte: 18 };
    if (minAge) ageFilter.$gte = parseInt(minAge);
    if (maxAge) ageFilter.$lte = parseInt(maxAge);

    let interestsFilter = {};
    if (interests) {
      const interestList = interests.split(',').map(s => s.trim()).filter(Boolean);
      if (interestList.length > 0) {
        interestsFilter.interests = { $in: interestList };
      }
    }

    let locationFilter = {};
    if (location) {
      locationFilter['location.city'] = { $regex: new RegExp(escapeRegex(location), 'i') };
    }

    const profiles = await User.find({
      _id: { $nin: [...excludeIds, ...passedIds] },
      isRestricted: false,
      isProfileComplete: true,
      age: ageFilter,
      ...genderFilter,
      ...interestsFilter,
      ...locationFilter
    })
      .select('-swipedRight -swipedLeft -superLiked')
      .limit(50)
      .sort({ lastActive: -1 });

    res.status(200).json({ success: true, count: profiles.length, users: profiles });
  } catch (error) {
    next(error);
  }
};

// ─── @route PUT /api/users/public-key ─────────────────────────────────────────
const isValidRsaJwk = (jwk) => {
  try {
    const parsed = typeof jwk === 'string' ? JSON.parse(jwk) : jwk;
    return parsed &&
      parsed.kty === 'RSA' &&
      typeof parsed.n === 'string' &&
      parsed.n.length >= 256 &&
      typeof parsed.e === 'string';
  } catch {
    return false;
  }
};

export const uploadPublicKey = async (req, res, next) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey) return res.status(400).json({ success: false, message: 'publicKey is required' });
    if (!isValidRsaJwk(publicKey)) {
      return res.status(400).json({ success: false, message: 'Invalid RSA public key format. Must be a valid JWK.' });
    }
    await User.findByIdAndUpdate(req.user._id, { publicKey });
    res.status(200).json({ success: true, message: 'Public key saved' });
  } catch (error) {
    next(error);
  }
};

// ─── @route GET /api/users/public-key/:userId ─────────────────────────────────
export const getPublicKey = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('publicKey name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.publicKey) return res.status(404).json({ success: false, message: 'No public key' });
    res.status(200).json({ success: true, publicKey: user.publicKey, name: user.name });
  } catch (error) {
    next(error);
  }
};

// ─── @route GET /api/users/notification-preferences ──────────────────────────
export const getNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences');
    res.status(200).json({ success: true, preferences: user.notificationPreferences });
  } catch (error) { next(error); }
};

// ─── @route PUT /api/users/notification-preferences ──────────────────────────
export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    await User.updateOne({ _id: req.user._id }, { $set: { notificationPreferences: preferences } });
    const updated = await User.findById(req.user._id).select('-password -swipedRight -swipedLeft -superLiked');
    res.status(200).json({ success: true, message: 'Preferences saved!', user: updated });
  } catch (error) { next(error); }
};

// ─── @route GET /api/users/privacy-settings ──────────────────────────────────
export const getPrivacySettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('privacySettings');
    res.status(200).json({ success: true, settings: user.privacySettings });
  } catch (error) { next(error); }
};

// ─── @route PUT /api/users/privacy-settings ──────────────────────────────────
export const updatePrivacySettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    await User.updateOne({ _id: req.user._id }, { $set: { privacySettings: settings } });
    const updated = await User.findById(req.user._id).select('-password -swipedRight -swipedLeft -superLiked');
    res.status(200).json({ success: true, message: 'Privacy settings saved!', user: updated });
  } catch (error) { next(error); }
};

// ─── @route POST /api/users/support-ticket ───────────────────────────────────
export const createSupportTicket = async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }
    const user = await User.findById(req.user._id).select('name email');
    fs.appendFileSync(path.join(__dirname, '..', 'support_tickets.log'),
      `[${new Date().toISOString()}] ${user.name} (${user.email}): ${subject.trim()} - ${message.trim()}\n`);
    res.status(200).json({ success: true, message: 'Support ticket submitted! We\'ll get back to you soon.' });
  } catch (error) { next(error); }
};

// ─── @route GET /api/users/:id ────────────────────────────────────────────────
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -swipedRight -swipedLeft -superLiked -publicKey');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isSelf = req.user._id.toString() === user._id.toString();

    // Record profile view (not for self)
    if (!isSelf) {
      const alreadyViewed = user.profileViews?.some(v => v.viewedBy?.toString() === req.user._id.toString());
      if (!alreadyViewed) {
        await User.updateOne(
          { _id: user._id },
          { $push: { profileViews: { viewedBy: req.user._id, viewedAt: new Date() } } }
        );
      }
    }

    const hasMatch = await Match.findOne({ users: { $all: [req.user._id, user._id] }, status: 'active' });

    if (isSelf || hasMatch) {
      return res.status(200).json({ success: true, user });
    }

    // Limited public profile for non-matched users
    const publicProfile = {
      _id: user._id,
      name: user.name,
      age: user.age,
      gender: user.gender,
      photos: user.photos,
      bio: user.bio,
      interests: user.interests,
      location: user.location
    };
    res.status(200).json({ success: true, user: publicProfile });
  } catch (error) {
    next(error);
  }
};
