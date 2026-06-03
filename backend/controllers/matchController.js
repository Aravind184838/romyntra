import Match from '../models/Match.js';
import { generateRecommendations, scoreCompatibility } from '../services/recommendationEngine.js';

// ─── @route GET /api/matches ──────────────────────────────────────────────────
export const getMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({
      users: req.user._id,
      status: 'active'
    })
      .populate('users', 'name photos age bio location lastActive')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: matches.length, matches });
  } catch (error) {
    next(error);
  }
};

// ─── @route GET /api/matches/:id ─────────────────────────────────────────────
export const getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('users', 'name photos age bio interests cuisinePreferences movieGenres ambiencePreferences budgetRange location');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const isParticipant = match.users.some(u => u._id.toString() === req.user._id.toString());
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, match });
  } catch (error) {
    next(error);
  }
};

// ─── @route GET /api/matches/:id/recommendations ─────────────────────────────
export const getMatchRecommendations = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('users', 'name photos age cuisinePreferences movieGenres ambiencePreferences budgetRange location');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const isParticipant = match.users.some(u => u._id.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, recommendations: match.recommendations });
  } catch (error) {
    next(error);
  }
};

// ─── @route PUT /api/matches/:id/regenerate-recs ────────────────────────────
export const regenerateRecommendations = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('users', 'name cuisinePreferences movieGenres ambiencePreferences budgetRange location interests');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const isParticipant = match.users.some(u => u._id.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Access denied' });

    const [user1, user2] = match.users;
    const recommendations = generateRecommendations(user1, user2);
    match.recommendations = recommendations;
    match.matchScore = scoreCompatibility(user1, user2);
    await match.save();

    res.status(200).json({ success: true, recommendations });
  } catch (error) {
    next(error);
  }
};

// ─── @route DELETE /api/matches/:id ──────────────────────────────────────────
export const unmatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const isParticipant = match.users.some(u => u.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Access denied' });

    match.status = 'unmatched';
    await match.save();

    res.status(200).json({ success: true, message: 'Unmatched successfully' });
  } catch (error) {
    next(error);
  }
};
