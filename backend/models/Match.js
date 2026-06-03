import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  matchScore: { type: Number, default: 0 },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isSuperLike: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'unmatched', 'blocked'],
    default: 'active'
  },
  recommendations: {
    restaurants: [mongoose.Schema.Types.Mixed],
    movies: [mongoose.Schema.Types.Mixed],
    datePlan: mongoose.Schema.Types.Mixed
  },
  lastMessage: {
    content: String,
    sentAt: Date,
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  aiEnabled: { type: Boolean, default: true }
}, { timestamps: true });

matchSchema.index({ users: 1 });

const Match = mongoose.model('Match', matchSchema);
export default Match;
