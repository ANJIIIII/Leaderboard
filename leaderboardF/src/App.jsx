import React, { useState, useEffect } from 'react';
import { Crown, Trophy, Medal, Award, Plus, Zap, Clock, User } from 'lucide-react';

const App = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [lastClaimResult, setLastClaimResult] = useState(null);

  const API_BASE = 'https://leaderboard-9yz5.vercel.app/api';

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/history`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Claim points
  const claimPoints = async () => {
    if (!selectedUser) {
      setMessage('Please select a user first!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/claim-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUser }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        setLastClaimResult(data);
        await fetchUsers();
        await fetchHistory();
      } else {
        setMessage(data.error || 'Error claiming points');
      }
    } catch (error) {
      setMessage('Error claiming points');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new user
  const addUser = async () => {
    if (!newUserName.trim()) {
      setMessage('Please enter a valid name!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newUserName.trim() }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`User "${newUserName}" added successfully!`);
        setNewUserName('');
        setShowAddUser(false);
        await fetchUsers();
      } else {
        setMessage(data.error || 'Error adding user');
      }
    } catch (error) {
      setMessage('Error adding user');
      console.error('Error:', error);
    }
  };

  // Get rank icon
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <Award className="w-6 h-6 text-gray-300" />;
    }
  };

  // Get rank color
  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-600';
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  useEffect(() => {
    fetchUsers();
    fetchHistory();
    
    // Clear message after 3 seconds
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎯 Points Ranking System
          </h1>
          <p className="text-purple-100">Select a user and claim random points!</p>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6 text-center">
            <p className="text-white font-medium">{message}</p>
          </div>
        )}

        {/* Last Claim Result */}
        {lastClaimResult && (
          <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-4 mb-6 text-center border border-green-300/30">
            <div className="flex items-center justify-center gap-2 text-white">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="font-bold">{lastClaimResult.pointsAwarded} points</span>
              <span>awarded to</span>
              <span className="font-bold">{lastClaimResult.user.name}</span>
            </div>
          </div>
        )}

        {/* User Selection and Claim */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <label className="block text-white text-sm font-medium mb-2">
                Select User:
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">Choose a user...</option>
                {users.map(user => (
                  <option key={user._id} value={user._id} className="text-gray-800">
                    {user.name} ({user.totalPoints} points)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={claimPoints}
                disabled={loading || !selectedUser}
                className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Claiming...' : '🎲 Claim Points'}
              </button>
              
              <button
                onClick={() => setShowAddUser(!showAddUser)}
                className="px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Add User Form */}
          {showAddUser && (
            <div className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter user name..."
                  className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder-white/60"
                />
                <button
                  onClick={addUser}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all"
                >
                  Add User
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Leaderboard */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Leaderboard
            </h2>
            
            <div className="space-y-3">
              {users.map((user, index) => (
                <div
                  key={user._id}
                  className={`${getRankColor(user.rank)} p-4 rounded-lg text-white shadow-lg`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getRankIcon(user.rank)}
                      <div>
                        <p className="font-bold text-lg">{user.name}</p>
                        <p className="text-sm opacity-90">Rank #{user.rank}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{user.totalPoints}</p>
                      <p className="text-sm opacity-90">points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

       
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Recent Activity
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.slice(0, 10).map((entry, index) => (
                <div
                  key={entry._id}
                  className="bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-white" />
                      <span className="text-white font-medium">{entry.userName}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold">+{entry.pointsAwarded} pts</p>
                      <p className="text-white/60 text-xs">{formatTime(entry.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
