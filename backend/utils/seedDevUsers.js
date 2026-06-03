import User from '../models/User.js';

const DEMO_CREDENTIALS = [
  { email: 'priya@demo.com', password: 'Demo@123', label: 'Priya Sharma' },
  { email: 'aarav@demo.com', password: 'Demo@123', label: 'Aarav Kumar' },
  { email: 'rahul@demo.com', password: 'Demo@123', label: 'Rahul Mehta' },
  { email: 'anjali@demo.com', password: 'Demo@123', label: 'Anjali Nair' },
  { email: 'dev@demo.com', password: 'Demo@123', label: 'Dev Patel' },
  { email: 'sneha@demo.com', password: 'Demo@123', label: 'Sneha Reddy' },
  { email: 'arjun@demo.com', password: 'Demo@123', label: 'Arjun Singh' },
  { email: 'maya@demo.com', password: 'Demo@123', label: 'Maya Kapoor' },
  { email: 'vikram@demo.com', password: 'Demo@123', label: 'Vikram Joshi' },
  { email: 'neha@demo.com', password: 'Demo@123', label: 'Neha Gupta' },
  { email: 'rohan@demo.com', password: 'Demo@123', label: 'Rohan Desai' },
  { email: 'kavya@demo.com', password: 'Demo@123', label: 'Kavya Iyer' },
  { email: 'nisha@demo.com', password: 'Demo@123', label: 'Nisha Patel' },
  { email: 'aditya@demo.com', password: 'Demo@123', label: 'Aditya Verma' },
  { email: 'meera@demo.com', password: 'Demo@123', label: 'Meera Joshi' },
  { email: 'karan@demo.com', password: 'Demo@123', label: 'Karan Singhania' },
  { email: 'ishita@demo.com', password: 'Demo@123', label: 'Ishita Sharma' },
  { email: 'zara@demo.com', password: 'Demo@123', label: 'Zara Khan' },
  { email: 'ria@demo.com', password: 'Demo@123', label: 'Ria Kapoor' },
  { email: 'sam@demo.com', password: 'Demo@123', label: 'Sam Williams' },
];

const demoUsers = [
  {
    name: 'Priya Sharma', email: 'priya@demo.com', phone: '+919876543211',
    password: 'Demo@123', dob: new Date('1999-07-22'), age: 25,
    gender: 'female', lookingFor: 'male',
    bio: 'Doctor in training ❤️ Love sunsets, café hopping, and rom-coms. Looking for someone genuine.',
    photos: [{ url: 'https://images.unsplash.com/photo-1494790108755-2616b612b977?w=400', isPrimary: true }],
    interests: ['Reading', 'Yoga', 'Travel', 'Cooking'],
    cuisinePreferences: ['Italian', 'Chinese', 'South Indian'],
    movieGenres: ['Romance', 'Comedy', 'Drama'],
    ambiencePreferences: ['Romantic', 'Cozy', 'Candlelight'],
    budgetRange: { min: 1000, max: 2500 },
    location: { city: 'Chennai', state: 'Tamil Nadu' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Aarav Kumar', email: 'aarav@demo.com', phone: '+919876543210',
    password: 'Demo@123', dob: new Date('1997-03-15'), age: 27,
    gender: 'male', lookingFor: 'female',
    bio: 'Software engineer by day, foodie by night 🍕 Love exploring new restaurants and watching movies on weekends.',
    photos: [{ url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', isPrimary: true }],
    interests: ['Hiking', 'Photography', 'Cooking', 'Music'],
    cuisinePreferences: ['Italian', 'South Indian', 'Continental'],
    movieGenres: ['Romance', 'Thriller', 'Sci-Fi'],
    ambiencePreferences: ['Rooftop', 'Romantic', 'Candlelight'],
    budgetRange: { min: 1500, max: 3000 },
    location: { city: 'Chennai', state: 'Tamil Nadu' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Rahul Mehta', email: 'rahul@demo.com', phone: '+919876543212',
    password: 'Demo@123', dob: new Date('1996-11-10'), age: 28,
    gender: 'male', lookingFor: 'female',
    bio: 'Startup founder & coffee addict ☕ I believe in good conversations over great coffee. Love cycling and jazz.',
    photos: [{ url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', isPrimary: true }],
    interests: ['Entrepreneurship', 'Coffee', 'Cycling', 'Jazz'],
    cuisinePreferences: ['Continental', 'Cafe', 'Italian'],
    movieGenres: ['Comedy', 'Drama', 'Documentary'],
    ambiencePreferences: ['Cozy', 'Outdoor', 'Nature'],
    budgetRange: { min: 1200, max: 2800 },
    location: { city: 'Bangalore', state: 'Karnataka' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Anjali Nair', email: 'anjali@demo.com', phone: '+919876543213',
    password: 'Demo@123', dob: new Date('1998-04-05'), age: 26,
    gender: 'female', lookingFor: 'male',
    bio: 'Interior designer with a love for art & architecture 🎨 Exploring life one city at a time.',
    photos: [{ url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', isPrimary: true }],
    interests: ['Art', 'Travel', 'Photography', 'Dance'],
    cuisinePreferences: ['South Indian', 'Mediterranean', 'Japanese'],
    movieGenres: ['Drama', 'Romance', 'Musical'],
    ambiencePreferences: ['Outdoor', 'Nature', 'Artistic'],
    budgetRange: { min: 1500, max: 3500 },
    location: { city: 'Bangalore', state: 'Karnataka' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Dev Patel', email: 'dev@demo.com', phone: '+919876543214',
    password: 'Demo@123', dob: new Date('1995-09-18'), age: 29,
    gender: 'male', lookingFor: 'female',
    bio: 'Music producer 🎵 & travel junkie. I can cook pasta and speak 3 languages. Life is short, let\'s explore it together.',
    photos: [{ url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', isPrimary: true }],
    interests: ['Music', 'Travel', 'Cooking', 'Languages'],
    cuisinePreferences: ['Italian', 'Mexican', 'Japanese'],
    movieGenres: ['Musical', 'Adventure', 'Romance'],
    ambiencePreferences: ['Rooftop', 'Luxury', 'Romantic'],
    budgetRange: { min: 2000, max: 5000 },
    location: { city: 'Hyderabad', state: 'Telangana' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Sneha Reddy', email: 'sneha@demo.com', phone: '+919876543215',
    password: 'Demo@123', dob: new Date('2000-01-30'), age: 24,
    gender: 'female', lookingFor: 'male',
    bio: 'MBA student & amateur photographer 📸 Looking for someone to share Sunday brunch and evening walks.',
    photos: [{ url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400', isPrimary: true }],
    interests: ['Photography', 'Finance', 'Fitness', 'Baking'],
    cuisinePreferences: ['South Indian', 'Continental', 'Chinese'],
    movieGenres: ['Thriller', 'Comedy', 'Romance'],
    ambiencePreferences: ['Cozy', 'Outdoor', 'Candlelight'],
    budgetRange: { min: 800, max: 2000 },
    location: { city: 'Hyderabad', state: 'Telangana' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Arjun Singh', email: 'arjun@demo.com', phone: '+919876543216',
    password: 'Demo@123', dob: new Date('1994-08-12'), age: 30,
    gender: 'male', lookingFor: 'female',
    bio: 'Pilot ✈️ exploring the world one destination at a time. I speak 4 languages and make a mean tiramisu.',
    photos: [{ url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', isPrimary: true }],
    interests: ['Travel', 'Flying', 'Languages', 'Cooking'],
    cuisinePreferences: ['Italian', 'French', 'Japanese'],
    movieGenres: ['Action', 'Adventure', 'Romance'],
    ambiencePreferences: ['Luxury', 'Rooftop', 'Waterfront'],
    budgetRange: { min: 2500, max: 6000 },
    location: { city: 'Mumbai', state: 'Maharashtra' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Maya Kapoor', email: 'maya@demo.com', phone: '+919876543217',
    password: 'Demo@123', dob: new Date('2001-02-14'), age: 23,
    gender: 'female', lookingFor: 'male',
    bio: 'Fashion student & part-time poet ✍️ I believe in fairy tales, good coffee, and even better conversations.',
    photos: [{ url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', isPrimary: true }],
    interests: ['Fashion', 'Writing', 'Art', 'Coffee'],
    cuisinePreferences: ['Cafe', 'Italian', 'Mexican'],
    movieGenres: ['Romance', 'Fantasy', 'Drama'],
    ambiencePreferences: ['Cozy', 'Candlelight', 'Artistic'],
    budgetRange: { min: 800, max: 2000 },
    location: { city: 'Mumbai', state: 'Maharashtra' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Vikram Joshi', email: 'vikram@demo.com', phone: '+919876543218',
    password: 'Demo@123', dob: new Date('1993-12-25'), age: 31,
    gender: 'male', lookingFor: 'female',
    bio: 'Chef by profession, romantic by heart 👨‍🍳 If you love food as much as I do, we will get along just fine.',
    photos: [{ url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', isPrimary: true }],
    interests: ['Cooking', 'Wine', 'Travel', 'Photography'],
    cuisinePreferences: ['Indian', 'French', 'Italian', 'Thai'],
    movieGenres: ['Drama', 'Comedy', 'Romance'],
    ambiencePreferences: ['Fine Dining', 'Romantic', 'Candlelight'],
    budgetRange: { min: 2000, max: 5000 },
    location: { city: 'Delhi', state: 'Delhi' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Neha Gupta', email: 'neha@demo.com', phone: '+919876543219',
    password: 'Demo@123', dob: new Date('1998-06-20'), age: 26,
    gender: 'female', lookingFor: 'male',
    bio: 'Yoga instructor 🧘‍♀️ & mindfulness coach. Finding joy in little things. Let\'s grow together.',
    photos: [{ url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400', isPrimary: true }],
    interests: ['Yoga', 'Meditation', 'Reading', 'Nature'],
    cuisinePreferences: ['South Indian', 'Mediterranean', 'Continental'],
    movieGenres: ['Drama', 'Documentary', 'Romance'],
    ambiencePreferences: ['Nature', 'Serene', 'Outdoor'],
    budgetRange: { min: 500, max: 1500 },
    location: { city: 'Pune', state: 'Maharashtra' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Rohan Desai', email: 'rohan@demo.com', phone: '+919876543220',
    password: 'Demo@123', dob: new Date('1997-11-05'), age: 27,
    gender: 'male', lookingFor: 'female',
    bio: 'Cricket enthusiast & weekend chef 🏏 Love biryani, beaches, and binge-watching thrillers.',
    photos: [{ url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400', isPrimary: true }],
    interests: ['Sports', 'Cooking', 'Travel', 'Movies'],
    cuisinePreferences: ['Indian', 'Chinese', 'Italian'],
    movieGenres: ['Thriller', 'Action', 'Comedy'],
    ambiencePreferences: ['Casual', 'Outdoor', 'Beachside'],
    budgetRange: { min: 1000, max: 3000 },
    location: { city: 'Mumbai', state: 'Maharashtra' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Kavya Iyer', email: 'kavya@demo.com', phone: '+919876543221',
    password: 'Demo@123', dob: new Date('2000-05-18'), age: 24,
    gender: 'female', lookingFor: 'male',
    bio: 'Classical dancer 💃 & software developer. Balancing tradition with technology. Love dogs and long drives.',
    photos: [{ url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400', isPrimary: true }],
    interests: ['Dance', 'Technology', 'Music', 'Animals'],
    cuisinePreferences: ['South Indian', 'Japanese', 'Continental'],
    movieGenres: ['Drama', 'Musical', 'Romance'],
    ambiencePreferences: ['Artistic', 'Cultural', 'Serene'],
    budgetRange: { min: 800, max: 2200 },
    location: { city: 'Chennai', state: 'Tamil Nadu' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Nisha Patel', email: 'nisha@demo.com', phone: '+919876543222',
    password: 'Demo@123', dob: new Date('1998-09-12'), age: 26,
    gender: 'female', lookingFor: 'male',
    bio: 'Graphic designer & plant mom 🌱 I turn coffee into designs and blank walls into art.',
    photos: [{ url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400', isPrimary: true }],
    interests: ['Art', 'Design', 'Gardening', 'Photography'],
    cuisinePreferences: ['Italian', 'Cafe', 'Mexican'],
    movieGenres: ['Animation', 'Comedy', 'Sci-Fi'],
    ambiencePreferences: ['Cozy', 'Artistic', 'Outdoor'],
    budgetRange: { min: 1000, max: 2500 },
    location: { city: 'Bangalore', state: 'Karnataka' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Aditya Verma', email: 'aditya@demo.com', phone: '+919876543223',
    password: 'Demo@123', dob: new Date('1996-03-28'), age: 28,
    gender: 'male', lookingFor: 'female',
    bio: 'Stock market analyst 📈 & amateur guitarist. Looking for someone who can match my wit and love for road trips.',
    photos: [{ url: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400', isPrimary: true }],
    interests: ['Finance', 'Music', 'Travel', 'Reading'],
    cuisinePreferences: ['Continental', 'North Indian', 'Thai'],
    movieGenres: ['Thriller', 'Drama', 'Documentary'],
    ambiencePreferences: ['Rooftop', 'Luxury', 'Romantic'],
    budgetRange: { min: 1500, max: 4000 },
    location: { city: 'Delhi', state: 'Delhi' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Meera Joshi', email: 'meera@demo.com', phone: '+919876543224',
    password: 'Demo@123', dob: new Date('1999-12-01'), age: 25,
    gender: 'female', lookingFor: 'male',
    bio: 'Wildlife photographer 🦁 & conservationist. I spend more time with animals than humans (and I prefer it that way).',
    photos: [{ url: 'https://images.unsplash.com/photo-1485875437342-77b2672c3e6e?w=400', isPrimary: true }],
    interests: ['Photography', 'Nature', 'Travel', 'Animals'],
    cuisinePreferences: ['South Indian', 'Continental', 'Mediterranean'],
    movieGenres: ['Documentary', 'Adventure', 'Drama'],
    ambiencePreferences: ['Nature', 'Serene', 'Outdoor'],
    budgetRange: { min: 500, max: 1500 },
    location: { city: 'Pune', state: 'Maharashtra' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Karan Singhania', email: 'karan@demo.com', phone: '+919876543225',
    password: 'Demo@123', dob: new Date('1994-07-14'), age: 30,
    gender: 'male', lookingFor: 'female',
    bio: 'Architect by day, DJ by night 🎧 I design buildings and play tracks. Looking for someone who can keep up.',
    photos: [{ url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', isPrimary: true }],
    interests: ['Music', 'Architecture', 'Dancing', 'Travel'],
    cuisinePreferences: ['Italian', 'Japanese', 'Fusion'],
    movieGenres: ['Musical', 'Action', 'Romance'],
    ambiencePreferences: ['Rooftop', 'Luxury', 'Nightlife'],
    budgetRange: { min: 2000, max: 6000 },
    location: { city: 'Mumbai', state: 'Maharashtra' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Ishita Sharma', email: 'ishita@demo.com', phone: '+919876543226',
    password: 'Demo@123', dob: new Date('2001-03-08'), age: 23,
    gender: 'female', lookingFor: 'male',
    bio: 'Psychology student & poetry lover 📝 Overthinking is my cardio. Looking for deep conversations and genuine connections.',
    photos: [{ url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400', isPrimary: true }],
    interests: ['Writing', 'Psychology', 'Reading', 'Music'],
    cuisinePreferences: ['Cafe', 'Italian', 'Continental'],
    movieGenres: ['Romance', 'Drama', 'Fantasy'],
    ambiencePreferences: ['Cozy', 'Candlelight', 'Serene'],
    budgetRange: { min: 500, max: 1500 },
    location: { city: 'Delhi', state: 'Delhi' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Zara Khan', email: 'zara@demo.com', phone: '+919876543227',
    password: 'Demo@123', dob: new Date('1999-06-25'), age: 25,
    gender: 'female', lookingFor: 'male',
    bio: 'Fashion blogger & makeup artist 💄 Living life in technicolor. If you can make me laugh, you are already winning.',
    photos: [{ url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400', isPrimary: true }],
    interests: ['Fashion', 'Beauty', 'Travel', 'Photography'],
    cuisinePreferences: ['Mediterranean', 'Italian', 'Cafe'],
    movieGenres: ['Comedy', 'Romance', 'Musical'],
    ambiencePreferences: ['Artistic', 'Luxury', 'Rooftop'],
    budgetRange: { min: 1500, max: 4000 },
    location: { city: 'Hyderabad', state: 'Telangana' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Ria Kapoor', email: 'ria@demo.com', phone: '+919876543228',
    password: 'Demo@123', dob: new Date('2000-11-30'), age: 24,
    gender: 'female', lookingFor: 'male',
    bio: 'Entrepreneur & fitness freak 💪 Founded a sustainable fashion startup. Looking for a power couple partner.',
    photos: [{ url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400', isPrimary: true }],
    interests: ['Entrepreneurship', 'Fitness', 'Fashion', 'Travel'],
    cuisinePreferences: ['Continental', 'Mexican', 'Japanese'],
    movieGenres: ['Thriller', 'Drama', 'Comedy'],
    ambiencePreferences: ['Fine Dining', 'Rooftop', 'Luxury'],
    budgetRange: { min: 2000, max: 5000 },
    location: { city: 'Bangalore', state: 'Karnataka' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Sam Williams', email: 'sam@demo.com', phone: '+919876543229',
    password: 'Demo@123', dob: new Date('1995-04-20'), age: 29,
    gender: 'male', lookingFor: 'female',
    bio: 'Foreign language teacher 📚 & travel blogger. I speak 5 languages and have been to 30 countries. Let me teach you a word or two.',
    photos: [{ url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', isPrimary: true }],
    interests: ['Languages', 'Travel', 'Reading', 'Photography'],
    cuisinePreferences: ['Thai', 'Italian', 'Mediterranean', 'Japanese'],
    movieGenres: ['Documentary', 'Adventure', 'Drama'],
    ambiencePreferences: ['Outdoor', 'Nature', 'Cultural'],
    budgetRange: { min: 1000, max: 3500 },
    location: { city: 'Pune', state: 'Maharashtra' },
    isVerified: true, isProfileComplete: true
  },
  {
    name: 'Admin User',
    email: process.env.ADMIN_EMAIL || 'admin@romyntra.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    dob: new Date('1990-01-01'), age: 35,
    gender: 'male', role: 'admin',
    isVerified: true, isProfileComplete: true,
    location: { city: 'Chennai' }
  }
];

/**
 * Seed demo users into the database.
 * Uses upsert so it's safe to run on every startup.
 */
export const seedDevUsersIfEmpty = async () => {
  if (process.env.NODE_ENV === 'production') return;

  // Upsert each demo user by email (creates missing ones, updates existing)
  for (const userData of demoUsers) {
    const { email, password, ...rest } = userData;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      await User.create(userData);
    }
  }

  console.log('🌱 Demo users seeded/verified. Logins:');
  DEMO_CREDENTIALS.forEach(({ email, password, label }) => {
    console.log(`   ${label}: ${email} / ${password}`);
  });
  console.log(`   👑 Admin: ${process.env.ADMIN_EMAIL || 'admin@romyntra.com'} / Admin@123`);
};

export default seedDevUsersIfEmpty;
