require('dotenv').config();

const express   = require('express');
const http      = require('http');
const path      = require('path');
const cors      = require('cors');
const mongoose  = require('mongoose');
const { Server } = require('socket.io');

const authRoutes         = require('./routes/auth');
const gameRoutes         = require('./routes/game');
const { registerMatchmaking } = require('./sockets/matchmaking');
const { registerPvpGame }     = require('./sockets/pvpGame');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', credentials: true },
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

io.on('connection', (socket) => {
  registerMatchmaking(io, socket);
  registerPvpGame(io, socket);
});

const PORT        = process.env.PORT        || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/battleship';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
