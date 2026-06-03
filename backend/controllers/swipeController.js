import Swipe from '../models/Swipe.js';
import Match from '../models/Match.js';
import User from '../models/User.js';
import { scoreCompatibility, generateRecommendations } from '../services/recommendationEngine.js';

// ─── @route POST /api/swipe/like ─────────────────────────────────────────────
export const likeUser = async (req, res, next) => {
  try {
    const { targetId } = req.body;
    const swiperId = req.user._id;

    if (targetId === swiperId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot swipe on yourself' });
    }

    // Record swipe
    await Swipe.findOneAndUpdate(
      { swiper: swiperId, swiped: targetId },
      { action: 'like' },
      { upsert: true, new: true }
    );

    // Track in user document
    await User.findByIdAndUpdate(swiperId, { $addToSet: { swipedRight: targetId } });

    // Check for mutual like
    const mutualSwipe = await Swipe.findOne({ swiper: targetId, swiped: swiperId, action: { $in: ['like', 'superlike'] } });

    let match = null;
    if (mutualSwipe) {
      const existingMatch = await Match.findOne({ users: { $all: [swiperId, targetId] } });

      if (!existingMatch) {
        const [user1, user2] = await Promise.all([
          User.findById(swiperId),
          User.findById(targetId)
        ]);

        const matchScore = scoreCompatibility(user1, user2);
        const recommendations = generateRecommendations(user1, user2);

        match = await Match.create({
          users: [swiperId, targetId],
          matchScore,
          initiatedBy: swiperId,
          recommendations
        });

        match = await match.populate('users', 'name photos age bio');
      }
    }

    res.status(200).json({
      success: true,
      isMatch: !!match,
      match: match || null,
      message: match ? "It's a Match! 💘" : 'Like sent!'
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route POST /api/swipe/pass ──────────────────────────────────────────────
export const passUser = async (req, res, next) => {
  try {
    const { targetId } = req.body;
    const swiperId = req.user._id;

    await Swipe.findOneAndUpdate(
      { swiper: swiperId, swiped: targetId },
      { action: 'pass' },
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(swiperId, { $addToSet: { swipedLeft: targetId } });

    res.status(200).json({ success: true, message: 'Passed.' });
  } catch (error) {
    next(error);
  }
};

// ─── @route POST /api/swipe/superlike ────────────────────────────────────────
export const superLikeUser = async (req, res, next) => {
  try {
    const { targetId } = req.body;
    const swiperId = req.user._id;

    await Swipe.findOneAndUpdate(
      { swiper: swiperId, swiped: targetId },
      { action: 'superlike' },
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(swiperId, { $addToSet: { superLiked: targetId } });

    // Check for mutual match
    const mutualSwipe = await Swipe.findOne({ swiper: targetId, swiped: swiperId, action: { $in: ['like', 'superlike'] } });

    let match = null;
    if (mutualSwipe) {
      const existingMatch = await Match.findOne({ users: { $all: [swiperId, targetId] } });

      if (!existingMatch) {
        const [user1, user2] = await Promise.all([
          User.findById(swiperId),
          User.findById(targetId)
        ]);

        const matchScore = scoreCompatibility(user1, user2);
        const recommendations = generateRecommendations(user1, user2);

        match = await Match.create({
          users: [swiperId, targetId],
          matchScore,
          initiatedBy: swiperId,
          isSuperLike: true,
          recommendations
        });

        match = await match.populate('users', 'name photos age bio');
      }
    }

    res.status(200).json({
      success: true,
      isMatch: !!match,
      match: match || null,
      message: match ? "Super Match! ⭐💘" : 'Super Like sent! ⭐'
    });
  } catch (error) {
    next(error);
  }
};
