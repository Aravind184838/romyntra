import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  encrypted: { type: Boolean, default: true },
  messageType: {
    type: String,
    enum: ['text', 'image', 'emoji'],
    default: 'text'
  },
  readAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  isAiReply: { type: Boolean, default: false }
}, { timestamps: true });

messageSchema.index({ match: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
