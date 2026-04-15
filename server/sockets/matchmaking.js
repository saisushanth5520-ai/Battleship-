const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const User     = require('../models/User');
const { setupPvpRoom } = require('./pvpGame');

const queue = [];

function removeFromQueue(socketId) {
  const idx = queue.findIndex(entry => entry.socket.id === socketId);
  if (idx !== -1) queue.splice(idx, 1);
}

function registerMatchmaking(io, socket) {
  socket.on('joinQueue', async ({ token } = {}) => {
    let userId;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return socket.emit('queueError', { message: 'Invalid or expired token.' });
    }

    const alreadyQueued = queue.some(entry => entry.userId === userId);
    if (alreadyQueued) return;

    if (queue.length > 0) {
      const opponent = queue.shift();

      const [currentUser, opponentUser] = await Promise.all([
        User.findById(userId).lean(),
        User.findById(opponent.userId).lean(),
      ]);

      const roomId = crypto.randomUUID();

      setupPvpRoom(io, {
        socket1Id: opponent.socket.id,
        socket2Id: socket.id,
        userId1:   opponent.userId,
        userId2:   userId,
        roomId,
      });

      opponent.socket.emit('matchFound', {
        roomId,
        assignment:       'player1',
        opponentUsername: currentUser?.username ?? 'Opponent',
      });

      socket.emit('matchFound', {
        roomId,
        assignment:       'player2',
        opponentUsername: opponentUser?.username ?? 'Opponent',
      });
    } else {
      queue.push({ socket, userId });
      socket.emit('waitingForOpponent');
    }
  });

  socket.on('disconnect', () => {
    removeFromQueue(socket.id);
  });
}

module.exports = { registerMatchmaking };
