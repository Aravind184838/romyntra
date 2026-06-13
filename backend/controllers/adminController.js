import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import Swipe from '../models/Swipe.js';
import { generateRecommendations, scoreCompatibility } from '../services/recommendationEngine.js';
import { exportUsersToExcel, exportMatchesToExcel, exportMessagesToExcel, exportReportsToExcel, exportSwipesToExcel, exportAllToExcel } from '../services/excelExport.js';

// ─── @route GET /api/admin/analytics ─────────────────────────────────────────
export const getAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, totalMatches, totalMessages, totalReports, recentUsers, restrictedUsers] =
      await Promise.all([
        User.countDocuments({ role: 'user' }),
        Match.countDocuments(),
        Message.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
        User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('name email createdAt photos'),
        User.countDocuments({ isRestricted: true })
      ]);

    const activeUsers = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        totalMatches,
        totalMessages,
        pendingReports: totalReports,
        activeUsers,
        restrictedUsers,
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── @route GET /api/admin/users ─────────────────────────────────────────────
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search ? escapeRegex(req.query.search).substring(0, 100) : '';
    const filter = req.query.filter || 'all';

    let query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (filter === 'restricted') query.isRestricted = true;
    if (filter === 'unverified') query.isVerified = false;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -swipedRight -swipedLeft -superLiked')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      users,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route PUT /api/admin/users/:id/restrict ────────────────────────────────
export const restrictUser = async (req, res, next) => {
  try {
    const { restrict, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot restrict admin' });

    user.isRestricted = !!restrict;
    user.restrictedReason = restrict ? (reason || 'Violation of terms') : '';
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: restrict ? 'User restricted.' : 'User unrestricted.',
      user
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route DELETE /api/admin/users/:id ──────────────────────────────────────
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin' });

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── @route GET /api/admin/reports ───────────────────────────────────────────
export const getReports = async (req, res, next) => {
  try {
    const status = req.query.status || '';
    const query = status ? { status } : {};

    const reports = await Report.find(query)
      .populate('reporter', 'name email photos')
      .populate('reported', 'name email photos')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reports.length, reports });
  } catch (error) {
    next(error);
  }
};

// ─── @route PUT /api/admin/reports/:id ───────────────────────────────────────
export const resolveReport = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    report.status = status || 'resolved';
    report.adminNote = adminNote || '';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();

    res.status(200).json({ success: true, message: 'Report resolved.', report });
  } catch (error) {
    next(error);
  }
};

// ─── @route GET /api/admin/export/:type ───────────────────────────────────────
export const exportData = async (req, res, next) => {
  try {
    const { type } = req.params;
    let buffer, filename;

    switch (type) {
      case 'users':
        buffer = await exportUsersToExcel(User);
        filename = `users_${Date.now()}.xlsx`;
        break;
      case 'matches':
        buffer = await exportMatchesToExcel(Match);
        filename = `matches_${Date.now()}.xlsx`;
        break;
      case 'messages':
        buffer = await exportMessagesToExcel(Message);
        filename = `messages_${Date.now()}.xlsx`;
        break;
      case 'reports':
        buffer = await exportReportsToExcel(Report);
        filename = `reports_${Date.now()}.xlsx`;
        break;
      case 'swipes':
        buffer = await exportSwipesToExcel(Swipe);
        filename = `swipes_${Date.now()}.xlsx`;
        break;
      case 'all':
        buffer = await exportAllToExcel({ User, Match, Message, Report, Swipe });
        filename = `romyntra_full_export_${Date.now()}.xlsx`;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid export type' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// ─── @route GET /api/admin/export-csv/:type ──────────────────────────────────
export const exportCsv = async (req, res, next) => {
  try {
    const { type } = req.params;
    let rows, filename;

    const toCsv = (data, fields) => {
      const header = fields.join(',');
      const body = data.map(row =>
        fields.map(f => {
          let val = f.split('.').reduce((o, k) => o?.[k] ?? '', row);
          if (typeof val === 'object') val = '';
          val = String(val ?? '').replace(/"/g, '""');
          return `"${val}"`;
        }).join(',')
      ).join('\n');
      return header + '\n' + body;
    };

    switch (type) {
      case 'users': {
        const users = await User.find({ role: 'user' }).lean();
        rows = toCsv(users, ['name','email','phone','age','gender','lookingFor','interests','cuisinePreferences','movieGenres','ambiencePreferences','location.city','isVerified','lastActive','createdAt']);
        filename = 'users.csv';
        break;
      }
      case 'messages': {
        const msgs = await Message.find().populate('sender','name email').lean();
        rows = toCsv(msgs, ['match','sender.name','sender.email','messageType','encrypted','createdAt']);
        filename = 'messages.csv';
        break;
      }
      case 'matches': {
        const matches = await Match.find({ status: 'active' }).populate('users','name email').lean();
        rows = toCsv(matches, ['_id','matchScore','aiEnabled','lastMessage.content','lastMessage.sentAt','createdAt']);
        filename = 'matches.csv';
        break;
      }
      case 'swipes': {
        const swipes = await Swipe.find().lean();
        rows = toCsv(swipes, ['swiper','target','direction','createdAt']);
        filename = 'swipes.csv';
        break;
      }
      default:
        return res.status(400).json({ success: false, message: 'Invalid type. Use: users, messages, matches, swipes' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(rows);
  } catch (error) {
    next(error);
  }
};

// ─── @route POST /api/admin/seed-matches ─────────────────────────────────────
export const seedMatches = async (req, res, next) => {
  try {
    const females = await User.find({ gender: 'female', role: 'user' });
    const males = await User.find({ gender: 'male', role: 'user' });
    if (!females.length || !males.length) {
      return res.status(400).json({ success: false, message: 'Need both male and female users. Seed dev users first.' });
    }

    let count = 0;
    for (let i = 0; i < Math.min(females.length, males.length); i++) {
      const f = females[i];
      const m = males[i];
      const existing = await Match.findOne({ users: { $all: [f._id, m._id] } });
      if (existing) continue;

      const matchRecs = generateRecommendations(f, m);
      const matchScore = scoreCompatibility(f, m);
      const match = await Match.create({
        users: [f._id, m._id],
        matchScore,
        recommendations: matchRecs,
        matchedAt: new Date(),
        aiEnabled: true,
      });

      const greetings = ['Hey! How are you?', 'Hi there! Love your profile 😊', 'Hey, you seem really interesting!', 'Hello! How was your day?'];
      const replies = ['I\'m doing great, thanks!', 'Hi! Thanks so much 😊', 'Hey! I was just thinking about you', 'Pretty good! How about you?'];

      await Message.create({ match: match._id, sender: m._id, content: greetings[i % greetings.length], encrypted: false, messageType: 'text', createdAt: new Date(Date.now() - 3600000) });
      const reply = replies[i % replies.length];
      await Message.create({ match: match._id, sender: f._id, content: reply, encrypted: false, messageType: 'text', createdAt: new Date(Date.now() - 1800000) });
      match.lastMessage = { content: reply.substring(0, 50), sentAt: new Date(Date.now() - 1800000), sentBy: f._id };
      await match.save();
      count++;
    }

    res.status(200).json({ success: true, matchesCreated: count });
  } catch (error) {
    next(error);
  }
};

// ─── @route POST /api/admin/regenerate-all-recs ──────────────────────────────
export const regenerateAllRecs = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'active' }).populate('users');
    let count = 0;
    for (const match of matches) {
      const [u1, u2] = match.users;
      if (!u1 || !u2) continue;
      match.recommendations = generateRecommendations(u1, u2);
      match.matchScore = scoreCompatibility(u1, u2);
      await match.save();
      count++;
    }
    res.status(200).json({ success: true, recsGenerated: count });
  } catch (error) {
    next(error);
  }
};
