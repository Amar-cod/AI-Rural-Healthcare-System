/**
 * Vercel Serverless Entry Point
 * 
 * This file is the catch-all serverless function for the server service.
 * Vercel routes all /api/* requests here, and Express handles internal routing.
 */
const mongoose = require('mongoose');

// Connect to MongoDB once (persisted across warm invocations)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set — database features will not work');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('MongoDB connected (serverless)');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

const app = require('../src/app');

// Wrap the Express app to ensure DB is connected before handling requests
const handler = async (req, res) => {
  await connectDB();
  return app(req, res);
};

module.exports = handler;
