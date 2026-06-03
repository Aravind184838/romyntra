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
    minlength: [6, 'Password must be at least 6 characters'],
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
  swipedRight: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  swipedLeft: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  superLiked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
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
