import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\+?[\d\s-]{10,15}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function (v) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    },
    select: false
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [18, 'You must be at least 18 years old'],
    max: [100, 'Invalid age']
  },
  dob: { type: Date },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'other', 'not-specified'],
    default: 'not-specified',
    required: [true, 'Gender is required']
  },
  lookingFor: {
    type: String,
    enum: ['male', 'female', 'everyone'],
    default: 'everyone'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  photos: [
    {
      url: { type: String, required: true },
      publicId: { type: String, default: '' },
      isPrimary: { type: Boolean, default: false }
    }
  ],
  interests: [{ type: String }],
  cuisinePreferences: [{ type: String }],
  movieGenres: [{ type: String }],
  ambiencePreferences: [{ type: String }],
  budgetRange: {
    min: { type: Number, default: 500 },
    max: { type: Number, default: 3000 }
  },
  location: {
    city: { type: String, default: 'Chennai' },
    state: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isProfileComplete: { type: Boolean, default: false },
  isRestricted: { type: Boolean, default: false },
  restrictedReason: { type: String, default: '' },
  otp: {
    code: { type: String, select: false },
    expiresAt: { type: Date, select: false }
  },
  lastActive: { type: Date, default: Date.now },
  publicKey: { type: String, default: '' },
  notificationPreferences: {
    push: {
      matches: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      superlikes: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: false },
      promotions: { type: Boolean, default: false },
    },
    email: {
      matches: { type: Boolean, default: true },
      messages: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
    },
    sms: {
      matches: { type: Boolean, default: false },
      messages: { type: Boolean, default: false },
      security: { type: Boolean, default: true },
    },
  },
  privacySettings: {
    showOnlineStatus: { type: Boolean, default: true },
    showLocation: { type: Boolean, default: true },
    showAge: { type: Boolean, default: true },
    allowPhotosDownload: { type: Boolean, default: false },
    blockScreenshots: { type: Boolean, default: false },
    allowMessagesFrom: { type: String, default: 'everyone' },
    hideProfileFrom: { type: String, default: 'none' },
  },
  loginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, default: null, select: false },
  swipedRight: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  swipedLeft: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  superLiked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  profileViews: [{
    viewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get primary photo
userSchema.methods.getPrimaryPhoto = function () {
  const primary = this.photos.find(p => p.isPrimary);
  return primary?.url || this.photos[0]?.url || null;
};

const User = mongoose.model('User', userSchema);
export default User;
