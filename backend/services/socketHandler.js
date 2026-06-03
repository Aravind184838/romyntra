import Message from '../models/Message.js';
import Match from '../models/Match.js';

const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User joins with their userId
    socket.on('join', ({ userId, matchIds }) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;

      // Join all match rooms
      if (matchIds && Array.isArray(matchIds)) {
        matchIds.forEach(matchId => socket.join(`match_${matchId}`));
      }

      // Broadcast online status
      socket.broadcast.emit('user_online', { userId });
      console.log(`👤 User ${userId} online`);
    });

    // Join a specific chat room
    socket.on('join_chat', ({ matchId }) => {
      socket.join(`match_${matchId}`);
    });

    // Send message via socket (content is already E2E-encrypted by client)
    socket.on('send_message', async ({ matchId, content, messageType, senderId }) => {
      try {
        const message = await Message.create({
          match: matchId,
          sender: senderId,
          content,
          encrypted: true,
          messageType: messageType || 'text',
          deliveredAt: new Date()
        });

        await message.populate('sender', 'name photos');

        // Update last message in match
        await Match.findByIdAndUpdate(matchId, {
          lastMessage: {
            content: content.substring(0, 50),
            sentAt: new Date(),
            sentBy: senderId
          }
        });

        // Emit encrypted content to all in the room
        io.to(`match_${matchId}`).emit('new_message', message.toObject());
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ matchId, userId, name }) => {
      socket.to(`match_${matchId}`).emit('typing_start', { userId, name });
    });

    socket.on('typing_stop', ({ matchId, userId }) => {
      socket.to(`match_${matchId}`).emit('typing_stop', { userId });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ matchId, userId }) => {
      try {
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
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        socket.broadcast.emit('user_offline', { userId: socket.userId });
        console.log(`👤 User ${socket.userId} offline`);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return { onlineUsers };
};

export const isUserOnline = (userId) => onlineUsers.has(userId.toString());
