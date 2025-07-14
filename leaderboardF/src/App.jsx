const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');

dotenv.config();

// Middleware
app.use(cors({
  origin: "https://leaderboard-vbfm.vercel.app",
  credentials: true
}));
app.use(express.json());

// Database connection function
const connectDb = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("MongoDB connected successfully");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  totalPoints: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Points History Schema
const pointsHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  pointsAwarded: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const PointsHistory = mongoose.model('PointsHistory', pointsHistorySchema);

// Initialize default users
// Initialize default users
const initializeUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const defaultUsers = [
        'Rahul', 'Kamal', 'Sanak', 'Priya', 'Amit', 
        'Sneha', 'Rohan', 'Kavya', 'Arjun', 'Meera'
      ];
      
      for (const name of defaultUsers) {
        const user = new User({ name });
        await user.save();
      }
      console.log('Default users created');
    }
  } catch (error) {
    console.error('Error initializing users:', error);
  }
};

// Calculate and update rankings
// Calculate and update rankings
const updateRankings = async () => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    
    for (let i = 0; i < users.length; i++) {
      users[i].rank = i + 1;
      await users[i].save();
    }
  } catch (error) {
    console.error('Error updating rankings:', error);
  }
};

// Routes

// Get all users with rankings
// Get all users with rankings
app.get('/api/users', async (req, res) => {
  try {
    await connectDb();
    await initializeUsers();
    
    const users = await User.find().sort({ totalPoints: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new user
// Add new user
app.post('/api/users', async (req, res) => {
  try {
    await connectDb();
    
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const existingUser = await User.findOne({ name: name.trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = new User({ name: name.trim() });
    await user.save();
    await updateRankings();
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Claim points for a user
// Claim points for a user
app.post('/api/claim-points', async (req, res) => {
  try {
    await connectDb();
    
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate random points between 1 to 10
    const randomPoints = Math.floor(Math.random() * 10) + 1;
    
    // Update user's total points
    user.totalPoints += randomPoints;
    await user.save();
    
    // Create history entry
    const history = new PointsHistory({
      userId: user._id,
      userName: user.name,
      pointsAwarded: randomPoints
    });
    await history.save();
    
    // Update rankings
    await updateRankings();
    
    res.json({
      user,
      pointsAwarded: randomPoints,
      message: `${user.name} earned ${randomPoints} points!`
    });
  } catch (error) {
    console.error('Error claiming points:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get points history
app.get('/api/history', async (req, res) => {
  try {
    await connectDb();
    
    const history = await PointsHistory.find()
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user-specific history
app.get('/api/history/:userId', async (req, res) => {
  try {
    await connectDb();
    
    const { userId } = req.params;
    const history = await PointsHistory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(history);
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Root endpoint
app.get('/', async (req, res) => {
  res.json({ message: "Points Ranking System API is running!" });
});

// For serverless deployment (Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
