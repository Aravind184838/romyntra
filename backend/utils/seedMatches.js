import mongoose from 'mongoose';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import connectDB from '../config/db.js';

async function seedMatches() {
  await connectDB();

  // Get female users
  const females = await User.find({ gender: 'female', role: 'user' });
  // Get male users
  const males = await User.find({ gender: 'male', role: 'user' });

  if (females.length === 0 || males.length === 0) {
    console.log('Need both male and female users');
    process.exit(0);
  }

  // Create matches: each female with one male
  const pairs = [];
  for (let i = 0; i < Math.min(females.length, males.length); i++) {
    pairs.push([females[i], males[i]]);
  }

  for (const [f, m] of pairs) {
    const existing = await Match.findOne({ users: { $all: [f._id, m._id] } });
    if (existing) {
      console.log(`Match exists: ${f.name} <-> ${m.name}`);
      continue;
    }

    const match = await Match.create({
      users: [f._id, m._id],
      matchScore: Math.floor(60 + Math.random() * 35),
      matchedAt: new Date(),
      aiEnabled: true,
    });

    // Create a couple of sample messages
    const greetings = ['Hey! How are you?', 'Hi there! Love your profile 😊', 'Hey, you seem really interesting!', 'Hello! How was your day?'];
    const replies = ['I\'m doing great, thanks!', 'Hi! Thanks so much 😊', 'Hey! I was just thinking about you', 'Pretty good! How about you?'];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const reply = replies[Math.floor(Math.random() * replies.length)];

    await Message.create({
      match: match._id,
      sender: m._id,
      content: greeting,
      encrypted: false,
      messageType: 'text',
      createdAt: new Date(Date.now() - 3600000),
    });

    await Message.create({
      match: match._id,
      sender: f._id,
      content: reply,
      encrypted: false,
      messageType: 'text',
      createdAt: new Date(Date.now() - 1800000),
    });

    match.lastMessage = {
      content: reply.substring(0, 50),
      sentAt: new Date(Date.now() - 1800000),
      sentBy: f._id,
    };
    await match.save();

    console.log(`Created match + msgs: ${f.name} <-> ${m.name}`);
  }

  console.log('Done seeding matches!');
  process.exit(0);
}

seedMatches().catch(e => { console.error(e); process.exit(1); });
