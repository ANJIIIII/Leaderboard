const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const dotenv=require('dotenv');

dotenv.config();

app.use(cors({
  origin: "https://leaderboard-vbfm.vercel.app", 
 credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));



const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  totalPoints: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});


const pointsHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  pointsAwarded: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const PointsHistory = mongoose.model('PointsHistory', pointsHistorySchema);


const initializeUsers = async () => {
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
};


const updateRankings = async () => {
  const users = await User.find().sort({ totalPoints: -1 });
  
  for (let i = 0; i < users.length; i++) {
    users[i].rank = i + 1;
    await users[i].save();
  }
};


app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/users', async (req, res) => {
  try {
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
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/claim-points', async (req, res) => {
  try {
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
    res.status(500).json({ error: error.message });
  }
});

// Get points history
app.get('/api/history', async (req, res) => {
  try {
    const history = await PointsHistory.find()
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user-specific history
app.get('/api/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await PointsHistory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORTT = process.env.PORT || 5000;

app.get('/', async(req,res)=>{
   res.send("heloo hiii")
});

app.listen(PORTT, async () => {
  console.log(`Server running on port ${PORTT}`);
  await initializeUsers();
  await updateRankings();
});

module.exports = app;
