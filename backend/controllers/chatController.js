import Message from '../models/Message.js';
import Match from '../models/Match.js';
import { generateAndSendAiReply } from '../services/aiReply.js';

let _io;
export const setIo = (ioInstance) => { _io = ioInstance; };

// ─── @route GET /api/chat/:matchId ───────────────────────────────────────────
export const getMessages = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const isParticipant = match.users.some(u => u.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Access denied' });

    const messages = await Message.find({ match: matchId })
      .populate('sender', 'name photos')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      pagination: { page, limit }
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route POST /api/chat/:matchId ──────────────────────────────────────────
export const sendMessage = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { content, messageType } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const isParticipant = match.users.some(u => u.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Access denied' });

    // Content is already client-side E2E encrypted — store as-is
    const message = await Message.create({
      match: matchId,
      sender: req.user._id,
      content: content.trim(),
      encrypted: !!req.body.encrypted,
      messageType: messageType || 'text',
      deliveredAt: new Date()
    });

    // Update last message in match (store preview of encrypted content)
    match.lastMessage = {
      content: content.trim().substring(0, 50),
      sentAt: new Date(),
      sentBy: req.user._id,
      encrypted: !!req.body.encrypted
    };
    await match.save();

    const populated = await message.populate('sender', 'name photos');

    // Trigger AI reply asynchronously (only if enabled for this match)
    if (_io && match.aiEnabled !== false) {
      generateAndSendAiReply(_io, matchId, req.user._id);
    }

    res.status(201).json({
      success: true,
      message: populated.toObject()
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route PUT /api/chat/:matchId/ai-toggle ─────────────────────────────────
export const toggleAiReply = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { enabled } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const isParticipant = match.users.some(u => u.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Access denied' });

    match.aiEnabled = enabled;
    await match.save();

    res.status(200).json({ success: true, aiEnabled: match.aiEnabled });
  } catch (error) {
    next(error);
  }
};

// ─── @route PUT /api/chat/:matchId/read ──────────────────────────────────────
export const markAsRead = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    await Message.updateMany(
      { match: matchId, sender: { $ne: req.user._id }, readAt: null },
      { readAt: new Date() }
    );
    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

// ─── @route GET /api/chat ─────────────────────────────────────────────────────
export const getConversations = async (req, res, next) => {
  try {
    const matches = await Match.find({ users: req.user._id, status: 'active' })
      .populate('users', 'name photos')
      .sort({ 'lastMessage.sentAt': -1 });

    const conversations = matches.map(m => {
      const otherUser = m.users.find(u => u._id.toString() !== req.user._id.toString());
      return {
        matchId: m._id,
        user: otherUser ? { _id: otherUser._id, name: otherUser.name, photos: otherUser.photos } : null,
        lastMessage: m.lastMessage || null,
        aiEnabled: m.aiEnabled,
        matchScore: m.matchScore,
        unreadCount: 0
      };
    });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};
