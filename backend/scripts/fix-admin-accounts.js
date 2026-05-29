// Script to fix existing admin accounts by setting their status to 'approved'
const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/research-repository';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('MongoDB connected');
    
    // Update all admin accounts to have 'approved' status
    const result = await User.updateMany(
      { role: 'admin' },
      { $set: { status: 'approved' } }
    );
    
    console.log(`Updated ${result.modifiedCount} admin accounts to approved status`);
    
    // Also update any users without status field to 'approved' for admins, 'pending' for students
    const result2 = await User.updateMany(
      { status: { $exists: false }, role: 'admin' },
      { $set: { status: 'approved' } }
    );
    
    const result3 = await User.updateMany(
      { status: { $exists: false }, role: 'student' },
      { $set: { status: 'pending' } }
    );
    
    console.log(`Updated ${result2.modifiedCount} admin accounts without status field`);
    console.log(`Updated ${result3.modifiedCount} student accounts without status field`);
    
    process.exit(0);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

