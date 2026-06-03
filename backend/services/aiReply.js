import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import { rsaEncrypt } from '../utils/encryption.js';

const greetings = ['Hey!', 'Hi there!', 'Hello!', 'Heyy 😊', 'Hi! How are you?'];
const affirmations = ['That sounds great!', 'I love that!', 'Nice!', 'Awesome!', 'Cool!', 'Amazing!'];
const followUps = ['Tell me more about yourself.', 'What do you like to do for fun?', 'How was your day?', 'What are you up to this weekend?'];

const interestReplies = {
  'travel': "I love traveling too! Where's your favorite place you've visited?",
  'cooking': "Oh I love cooking! What's your specialty dish?",
  'music': "Music is life! What genre do you listen to most?",
  'reading': "I'm a bookworm too! Any recommendations?",
  'photography': "Photography is such a great hobby! What do you like to shoot?",
  'fitness': "Staying active is important! What's your workout routine?",
  'yoga': "Yoga is amazing for the mind and body! Do you have a favorite pose?",
  'hiking': "I love hiking! Got any trail recommendations?",
  'movies': "Movie nights are the best! What's your favorite film?",
  'coffee': "Coffee lover too! What's your go-to order?",
  'food': "Foodie alert! What cuisine can you not live without?",
  'art': "Art speaks to the soul! Do you paint or just appreciate?",
  'dance': "Dancing is such a great stress buster! What style do you enjoy?",
  'tech': "Tech is fascinating! What field are you in?",
};

const cuisineReplies = {
  'italian': "Italian food is amazing! Pasta or pizza?",
  'indian': "Indian cuisine is so rich and flavorful! What's your favorite dish?",
  'chinese': "Chinese food is always a good choice! Love some good dim sum?",
  'mexican': "Mexican food is life! Tacos or burritos?",
  'japanese': "Japanese cuisine is an art form! Sushi or ramen?",
  'continental': "Continental food is so versatile! What's your go-to?",
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function keywordMatch(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function generateContextReply(incomingMsg, otherUser, matchScore) {
  const lower = incomingMsg.toLowerCase();

  // Question detection
  if (lower.includes('?')) {
    if (keywordMatch(lower, ['how are you', "how's it", "how's your", "how r u"])) {
      const moods = ["I'm doing great, thanks for asking! 😊", "Pretty good! Just enjoying the day.", "Doing wonderful! How about you?", "Feeling great! Thanks for checking in."];
      return getRandom(moods);
    }
    if (keywordMatch(lower, ['weekend', 'plans', 'doing'])) {
      const plans = ["Not much planned yet, open to suggestions! 😄", "Just relaxing and enjoying the weekend. You?", "Thinking of trying a new restaurant. Want to come?", "Going for a hike if the weather's nice!"];
      return getRandom(plans);
    }
    if (keywordMatch(lower, ['where', 'from', 'live', 'location', 'city'])) {
      return `I'm from ${otherUser.location?.city || 'my city'}! Have you been here?`;
    }
    if (keywordMatch(lower, ['work', 'job', 'do you do', 'profession', 'career'])) {
      return `I work as ${otherUser.bio ? otherUser.bio.split('.')[0].split('!')[0].toLowerCase() : 'a professional'}. What about you?`;
    }
    return getRandom(followUps);
  }

  // Greeting detection
  if (keywordMatch(lower, ['hey', 'hi', 'hello', 'hey there', 'heyy', 'wasup', 'sup'])) {
    return `${getRandom(greetings)} ${otherUser.name?.split(' ')[0] ? 'I\'m ' + otherUser.name.split(' ')[0] + '! ' + getRandom(affirmations) : getRandom(affirmations)}`;
  }

  // Interest-based responses
  for (const [interest, reply] of Object.entries(interestReplies)) {
    if (keywordMatch(lower, [interest])) {
      return reply;
    }
  }

  // Cuisine-based responses
  for (const [cuisine, reply] of Object.entries(cuisineReplies)) {
    if (keywordMatch(lower, [cuisine])) {
      return reply;
    }
  }

  // Bio-based contextual reply
  if (otherUser.bio) {
    const bio = otherUser.bio.toLowerCase();
    const bioKeywords = bio.split(' ').filter(w => w.length > 4).slice(0, 5);
    for (const word of bioKeywords) {
      if (keywordMatch(lower, [word])) {
        return `That's awesome! ${otherUser.name?.split(' ')[0] || 'I'} feel the same way. What else are you passionate about?`;
      }
    }
  }

  // Sentiment detection
  if (keywordMatch(lower, ['good', 'great', 'awesome', 'amazing', 'wonderful', 'fantastic', 'nice', 'happy', 'love', 'beautiful'])) {
    return getRandom(['That makes me smile! 😊', 'Love to hear that!', 'You seem like such a positive person!', "That's wonderful!"]);
  }
  if (keywordMatch(lower, ['bad', 'sad', 'tired', 'bored', 'stressed', 'rough', 'hard', 'difficult', 'long day'])) {
    return "Aww, I'm sorry to hear that. Hope things get better soon! 💕 Want to talk about it?";
  }

  // Food mentions
  if (keywordMatch(lower, ['food', 'eat', 'hungry', 'dinner', 'lunch', 'breakfast', 'restaurant'])) {
    return `Yesss I love food! ${getRandom(['Have you tried any good restaurants lately?', 'What kind of cuisine are you craving?', 'We should grab a bite together sometime!'])}`;
  }

  // Default responses based on compatibility
  if (matchScore > 70) {
    return getRandom(["I have a feeling we'd get along really well! 😊", "This conversation is making my day!", "I'm really enjoying talking to you!", "You seem like such a genuine person!"]);
  } else if (matchScore > 50) {
    return getRandom(["That's interesting! Tell me more.", "I like where this conversation is going!", "You're fun to talk to!", "I feel like we have a lot in common!"]);
  } else {
    return getRandom(["That's nice!", "Interesting!", "I see!", "Cool!", "Got it! 😊", "That sounds fun!"]);
  }
}

export async function generateAndSendAiReply(io, matchId, senderId) {
  try {
    const match = await Match.findById(matchId).populate('users', 'name bio interests age location city cuisinePreferences publicKey');
    if (!match || match.users.length < 2) return;

    const otherUser = match.users.find(u => u._id.toString() !== senderId.toString());
    if (!otherUser) return;

    // Get last few messages for context
    const recentMessages = await Message.find({ match: matchId })
      .sort({ createdAt: -1 }).limit(3).lean();

    // Don't reply if the conversation has more than 6 messages total (avoid infinite loop)
    const totalCount = await Message.countDocuments({ match: matchId });
    if (totalCount >= 8) return;

    // Don't reply if last message was also an AI reply from this user
    if (recentMessages.length > 0 && recentMessages[0].sender?.toString() === otherUser._id.toString()) return;

    // Try to extract context from last message (E2EE — likely gibberish, fall back to profile)
    const lastContent = recentMessages.length > 0 ? recentMessages[0].content : '';
    const incomingMsg = (lastContent && lastContent.includes(':') && !lastContent.includes('=='))
      ? lastContent : ''; // Only use server-decryptable content; otherwise rely on profile

    const aiReply = generateContextReply(incomingMsg || 'hello', otherUser, match.matchScore || 50);

    // Encrypt AI reply with the real user's public key (recipient is the one who last received AI's partner's message)
    const realUser = match.users.find(u => u._id.toString() !== otherUser._id.toString());
    let encryptedContent = aiReply;
    let encrypted = false;
    if (realUser && realUser.publicKey) {
      const jwk = typeof realUser.publicKey === 'string' ? JSON.parse(realUser.publicKey) : realUser.publicKey;
      const enc = rsaEncrypt(aiReply, jwk);
      if (enc) {
        encryptedContent = enc;
        encrypted = true;
      }
    }

    // Typing delay: 1.5-3 seconds
    const typingDelay = 1500 + Math.random() * 1500;

    // Emit typing indicator
    io.to(`match_${matchId}`).emit('typing_start', {
      userId: otherUser._id,
      name: otherUser.name
    });

    await new Promise(r => setTimeout(r, typingDelay));

    // Stop typing
    io.to(`match_${matchId}`).emit('typing_stop', {
      userId: otherUser._id
    });

    // Save and send AI reply
    const message = await Message.create({
      match: matchId,
      sender: otherUser._id,
      content: encryptedContent,
      encrypted,
      messageType: 'text',
      deliveredAt: new Date()
    });

    await message.populate('sender', 'name photos');

    await Match.findByIdAndUpdate(matchId, {
      lastMessage: {
        content: aiReply.substring(0, 50),
        sentAt: new Date(),
        sentBy: otherUser._id
      }
    });

    io.to(`match_${matchId}`).emit('new_message', {
      ...message.toObject(),
      content: aiReply,
      isAiReply: true
    });
  } catch (error) {
    console.error('AI reply error:', error.message);
  }
}
