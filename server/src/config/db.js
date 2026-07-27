const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectDB(uri) {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected successfully');
      return;
    } catch (err) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed: ${err.message}`);

      if (retries >= MAX_RETRIES) {
        console.error('All MongoDB connection retries exhausted');
        throw err;
      }

      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

module.exports = connectDB;
