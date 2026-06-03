import User from '../models/User.js';
import Swipe from '../models/Swipe.js';
import Match from '../models/Match.js';
import { scoreCompatibility, generateRecommendations } from '../services/recommendationEngine.js';

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
    res.status(200).json({ success: true, user });
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
export const uploadPhoto = async (req, res, next) => {
  try {
    const { url, isPrimary } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'Photo URL is required' });
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

    const profiles = await User.find({
      _id: { $nin: [...excludeIds, ...passedIds] },
      isRestricted: false,
      isProfileComplete: true,
      age: { $gte: 18 },
      ...genderFilter
    })
      .select('-swipedRight -swipedLeft -superLiked')
      .limit(20)
      .sort({ lastActive: -1 });

    res.status(200).json({ success: true, count: profiles.length, users: profiles });
  } catch (error) {
    next(error);
  }
};

// ─── @route PUT /api/users/public-key ─────────────────────────────────────────
export const uploadPublicKey = async (req, res, next) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey) return res.status(400).json({ success: false, message: 'publicKey is required' });
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

// ─── @route GET /api/users/:id ────────────────────────────────────────────────
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otp -swipedRight -swipedLeft -superLiked');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
