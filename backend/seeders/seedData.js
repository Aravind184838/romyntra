import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/romyntra';

const sampleUsers = [
  {
    name: 'Aarav Kumar',
    email: 'aarav@demo.com',
    phone: '+919876543210',
    password: 'Demo@123',
    dob: new Date('1997-03-15'),
    age: 27,
    gender: 'male',
    lookingFor: 'female',
    bio: 'Software engineer by day, foodie by night 🍕. Love exploring new restaurants and watching movies on weekends.',
    photos: [{ url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', isPrimary: true }],
    interests: ['Hiking', 'Photography', 'Cooking', 'Music'],
    cuisinePreferences: ['Italian', 'South Indian', 'Continental'],
    movieGenres: ['Romance', 'Thriller', 'Sci-Fi'],
    ambiencePreferences: ['Rooftop', 'Romantic', 'Candlelight'],
    budgetRange: { min: 1500, max: 3000 },
    location: { city: 'Chennai', state: 'Tamil Nadu' },
    isVerified: true,
    isProfileComplete: true
  },
  {
    name: 'Priya Sharma',
    email: 'priya@demo.com',
    phone: '+919876543211',
    password: 'Demo@123',
    dob: new Date('1999-07-22'),
    age: 25,
    gender: 'female',
    lookingFor: 'male',
    bio: 'Doctor in training ❤️. Love sunsets, café hopping, and rom-coms. Looking for someone genuine.',
    photos: [{ url: 'https://images.unsplash.com/photo-1494790108755-2616b612b977?w=400', isPrimary: true }],
    interests: ['Reading', 'Yoga', 'Travel', 'Cooking'],
    cuisinePreferences: ['Italian', 'Chinese', 'South Indian'],
    movieGenres: ['Romance', 'Comedy', 'Drama'],
    ambiencePreferences: ['Romantic', 'Cozy', 'Candlelight'],
    budgetRange: { min: 1000, max: 2500 },
    location: { city: 'Chennai', state: 'Tamil Nadu' },
    isVerified: true,
    isProfileComplete: true
  },
  {
    name: 'Rahul Mehta',
    email: 'rahul@demo.com',
    phone: '+919876543212',
    password: 'Demo@123',
    dob: new Date('1996-11-10'),
    age: 28,
    gender: 'male',
    lookingFor: 'female',
    bio: 'Startup founder & coffee addict ☕. I believe in good conversations over great coffee.',
    photos: [{ url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', isPrimary: true }],
    interests: ['Entrepreneurship', 'Coffee', 'Cycling', 'Jazz'],
    cuisinePreferences: ['Continental', 'Cafe', 'Italian'],
    movieGenres: ['Comedy', 'Drama', 'Documentary'],
    ambiencePreferences: ['Cozy', 'Outdoor', 'Nature'],
    budgetRange: { min: 1200, max: 2800 },
    location: { city: 'Bangalore', state: 'Karnataka' },
    isVerified: true,
    isProfileComplete: true
  },
  {
    name: 'Anjali Nair',
    email: 'anjali@demo.com',
    phone: '+919876543213',
    password: 'Demo@123',
    dob: new Date('1998-04-05'),
    age: 26,
    gender: 'female',
    lookingFor: 'male',
    bio: 'Interior designer with a love for art & architecture 🎨. Exploring life one city at a time.',
    photos: [{ url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', isPrimary: true }],
    interests: ['Art', 'Travel', 'Photography', 'Dance'],
    cuisinePreferences: ['South Indian', 'Mediterranean', 'Japanese'],
    movieGenres: ['Drama', 'Romance', 'Musical'],
    ambiencePreferences: ['Outdoor', 'Nature', 'Artistic'],
    budgetRange: { min: 1500, max: 3500 },
    location: { city: 'Bangalore', state: 'Karnataka' },
    isVerified: true,
    isProfileComplete: true
  },
  {
    name: 'Dev Patel',
    email: 'dev@demo.com',
    phone: '+919876543214',
    password: 'Demo@123',
    dob: new Date('1995-09-18'),
    age: 29,
    gender: 'male',
    lookingFor: 'female',
    bio: 'Music producer 🎵 & travel junkie. I can cook pasta and speak 3 languages. Life is short, let\'s explore it together.',
    photos: [{ url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', isPrimary: true }],
    interests: ['Music', 'Travel', 'Cooking', 'Languages'],
    cuisinePreferences: ['Italian', 'Mexican', 'Japanese'],
    movieGenres: ['Musical', 'Adventure', 'Romance'],
    ambiencePreferences: ['Rooftop', 'Luxury', 'Romantic'],
    budgetRange: { min: 2000, max: 5000 },
    location: { city: 'Hyderabad', state: 'Telangana' },
    isVerified: true,
    isProfileComplete: true
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha@demo.com',
    phone: '+919876543215',
    password: 'Demo@123',
    dob: new Date('2000-01-30'),
    age: 24,
    gender: 'female',
    lookingFor: 'male',
    bio: 'MBA student & amateur photographer 📸. Looking for someone to share Sunday brunch and evening walks.',
    photos: [{ url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400', isPrimary: true }],
    interests: ['Photography', 'Finance', 'Fitness', 'Baking'],
    cuisinePreferences: ['South Indian', 'Continental', 'Chinese'],
    movieGenres: ['Thriller', 'Comedy', 'Romance'],
    ambiencePreferences: ['Cozy', 'Outdoor', 'Candlelight'],
    budgetRange: { min: 800, max: 2000 },
    location: { city: 'Hyderabad', state: 'Telangana' },
    isVerified: true,
    isProfileComplete: true
  },
  {
    name: 'Admin User',
    email: process.env.ADMIN_EMAIL || 'admin@romyntra.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    dob: new Date('1990-01-01'),
    age: 35,
    gender: 'male',
    role: 'admin',
    isVerified: true,
    isProfileComplete: true,
    location: { city: 'Chennai' }
  }
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Create users
    const createdUsers = await User.create(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} users`);
    console.log('\n📋 Demo credentials:');
    sampleUsers.filter(u => u.role !== 'admin').forEach(u => {
      console.log(`   ${u.name}: ${u.email} / Demo@123`);
    });
    console.log(`\n👑 Admin: ${sampleUsers.find(u => u.role === 'admin').email} / Admin@123\n`);

    await mongoose.disconnect();
    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
