require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const athleteRoutes = require('./routes/athlete');
const coachRoutes = require('./routes/coach');
const nutritionistRoutes = require('./routes/nutritionist');

const app = express();

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:4000'], credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'AfyaNexus API is running.' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/athlete', athleteRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/nutritionist', nutritionistRoutes);

// 404 handler
app.use((_, res) => res.status(404).json({ error: 'Route not found.' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`AfyaNexus server running on port ${PORT}`));
