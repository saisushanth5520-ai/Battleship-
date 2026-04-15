const Game = require('../models/Game');
const {
  createEmptyBoard,
  placeShipsRandomly,
  fireAt,
  checkWin,
  serializeBoard,
} = require('../logic/gameLogic');

const rooms = new Map();

function hideShips(board) {
  return board.map(row =>
    row.map(cell => (cell === 'HIT' || cell === 'MISS' ? cell : null))
  );
}

async function persistOutcome(userId, opponentId, result) {
  await Game.create({
    userId,
    opponentId,
    mode:        'pvp',
    status:      'finished',
    result,
    playerBoard: {},
    aiBoard:     {},
  });
}

function setupPvpRoom(io, { socket1Id, socket2Id, userId1, userId2, roomId }) {
  const s1 = io.sockets.sockets.get(socket1Id);
  const s2 = io.sockets.sockets.get(socket2Id);

  if (!s1 || !s2) return;

  s1.join(roomId);
  s2.join(roomId);

  const board1 = placeShipsRandomly(createEmptyBoard());
  const board2 = placeShipsRandomly(createEmptyBoard());

  rooms.set(roomId, {
    board1,
    board2,
    userId1,
    userId2,
    socket1Id,
    socket2Id,
    currentTurn: 'player1',
  });

  s1.emit('pvpGameStart', {
    roomId,
    playerBoard:   board1,
    opponentBoard: hideShips(board2),
    assignment:    'player1',
  });

  s2.emit('pvpGameStart', {
    roomId,
    playerBoard:   board2,
    opponentBoard: hideShips(board1),
    assignment:    'player2',
  });

  s1.on('pvpFire', ({ roomId: rid, row, col }) =>
    handleFire(io, s1, 'player1', rid, row, col)
  );

  s2.on('pvpFire', ({ roomId: rid, row, col }) =>
    handleFire(io, s2, 'player2', rid, row, col)
  );

  s1.on('disconnect', () => handleDisconnect(io, roomId, socket1Id));
  s2.on('disconnect', () => handleDisconnect(io, roomId, socket2Id));
}

function handleFire(io, socket, playerKey, roomId, row, col) {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.currentTurn !== playerKey) {
    return socket.emit('notYourTurn');
  }

  const isPlayer1   = playerKey === 'player1';
  const targetBoard = isPlayer1 ? room.board2 : room.board1;

  const { result, board: updatedBoard } = fireAt(targetBoard, row, col);

  if (isPlayer1) {
    room.board2 = updatedBoard;
  } else {
    room.board1 = updatedBoard;
  }

  room.currentTurn = isPlayer1 ? 'player2' : 'player1';

  io.to(roomId).emit('pvpFireResult', {
    firingPlayer: playerKey,
    row,
    col,
    result,
  });

  if (checkWin(updatedBoard)) {
    const winnerUserId  = isPlayer1 ? room.userId1 : room.userId2;
    const loserUserId   = isPlayer1 ? room.userId2 : room.userId1;

    io.to(roomId).emit('pvpGameOver', { winnerUserId });

    Promise.all([
      persistOutcome(winnerUserId, loserUserId, 'win'),
      persistOutcome(loserUserId, winnerUserId, 'loss'),
    ]).catch(err => console.error('[pvpGame] failed to persist outcome:', err));

    rooms.delete(roomId);
  }
}

function handleDisconnect(io, roomId, disconnectedSocketId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const remainingSocketId =
    room.socket1Id === disconnectedSocketId ? room.socket2Id : room.socket1Id;

  const remaining = io.sockets.sockets.get(remainingSocketId);
  if (remaining) remaining.emit('opponentDisconnected');

  rooms.delete(roomId);
}

function registerPvpGame(_io, _socket) {}

module.exports = { registerPvpGame, setupPvpRoom };
