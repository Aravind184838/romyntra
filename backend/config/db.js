import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  const connect = async (mongoUri) => {
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  };

  if (uri) {
    try {
      return await connect(uri);
    } catch (error) {
      console.warn(`⚠️ MongoDB connection failed: ${error.message}`);
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Production MongoDB connection failed. Exiting.');
        process.exit(1);
      }
      console.warn('⚠️ Falling back to in-memory MongoDB for development.');
    }
  }

  mongoServer = await MongoMemoryServer.create();
  const memoryUri = mongoServer.getUri();
  const conn = await connect(memoryUri);
  console.log('🧠 Using in-memory MongoDB for development.');
  return conn;
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

export default connectDB;
