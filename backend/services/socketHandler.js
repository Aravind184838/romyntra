import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Match from '../models/Match.js';

const onlineUsers = new Map();

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
};

const isMatchParticipant = async (matchId, userId) => {
  const match = await Match.findById(matchId).select('users');
  if (!match) return false;
  return match.users.some(u => u.toString() === userId.toString());
};

export const initSocket = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.userId})`);

    // User joins with their userId (from JWT, not client)
    socket.on('join', async ({ matchIds }) => {
      const userId = socket.userId;
      onlineUsers.set(userId, socket.id);

      if (matchIds && Array.isArray(matchIds)) {
        for (const matchId of matchIds) {
          if (await isMatchParticipant(matchId, userId)) {
            socket.join(`match_${matchId}`);
          }
        }
      }

      socket.broadcast.emit('user_online', { userId });
      console.log(`👤 User ${userId} online`);
    });

    // Join a specific chat room (with server-side membership check)
    socket.on('join_chat', async ({ matchId }) => {
      if (await isMatchParticipant(matchId, socket.userId)) {
        socket.join(`match_${matchId}`);
      } else {
        socket.emit('error', { message: 'Access denied to this chat' });
      }
    });

    // Send message — use socket.userId, never trust client-supplied senderId
    socket.on('send_message', async ({ matchId, content, messageType, encrypted }) => {
      try {
        const userId = socket.userId;
        if (!(await isMatchParticipant(matchId, userId))) {
          return socket.emit('error', { message: 'Access denied' });
        }

        const message = await Message.create({
          match: matchId,
          sender: userId,
          content,
          encrypted: !!encrypted,
          messageType: messageType || 'text',
          deliveredAt: new Date()
        });

        await message.populate('sender', 'name photos');

        await Match.findByIdAndUpdate(matchId, {
          lastMessage: {
            content: content.substring(0, 50),
            sentAt: new Date(),
            sentBy: userId,
            encrypted: !!encrypted
          }
        });

        io.to(`match_${matchId}`).emit('new_message', message.toObject());
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ matchId }) => {
      socket.to(`match_${matchId}`).emit('typing_start', { userId: socket.userId });
    });

    socket.on('typing_stop', ({ matchId }) => {
      socket.to(`match_${matchId}`).emit('typing_stop', { userId: socket.userId });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ matchId }) => {
      try {
        const userId = socket.userId;
        await Message.updateMany(
          { match: matchId, sender: { $ne: userId }, readAt: null },
          { readAt: new Date() }
        );
        socket.to(`match_${matchId}`).emit('messages_read', { matchId, userId });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userId = socket.userId;
      if (userId) {
        onlineUsers.delete(userId);
        socket.broadcast.emit('user_offline', { userId });
        console.log(`👤 User ${userId} offline`);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return { onlineUsers };
};

export const isUserOnline = (userId) => onlineUsers.has(userId.toString());
