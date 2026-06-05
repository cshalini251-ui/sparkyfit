const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb+srv://cshalini251_db_user:1234@cluster0.3logotu.mongodb.net/sparkyfitness_db?retryWrites=true&w=majority';

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected successfully!');
    const tables = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', tables.map(c => c.name));
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Connection failed:', err);
  }
}
run();
