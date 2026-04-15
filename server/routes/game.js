const express = require('express');
const Game    = require('../models/Game');
const User    = require('../models/User');
const auth    = require('../middleware/auth');
const {
  createEmptyBoard,
  placeShipsRandomly,
  fireAt,
  checkWin,
  serializeBoard,
  deserializeBoard,
} = require('../logic/gameLogic');
const { createAIState, getAIMove, updateAIStateAfterFire } = require('../logic/aiLogic');

const router = express.Router();

router.use(auth);

function hideShips(board) {
  return board.map(row =>
    row.map(cell => (cell === 'HIT' || cell === 'MISS' ? cell : null))
  );
}

router.post('/new', async (req, res) => {
  try {
    const playerBoard = placeShipsRandomly(createEmptyBoard());
    const aiBoard     = placeShipsRandomly(createEmptyBoard());
    const aiState     = createAIState();

    const game = await Game.create({
      userId:      req.userId,
      mode:        'ai',
      status:      'active',
      currentTurn: 'player',
      playerBoard: serializeBoard(playerBoard),
      aiBoard:     serializeBoard(aiBoard),
      aiState:     JSON.stringify({ ...aiState, firedAt: [...aiState.firedAt] }),
    });

    return res.status(201).json({
      gameId:      game._id,
      playerBoard,
      aiBoard:     hideShips(aiBoard),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });

    return res.json(user.gameHistory);
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/active', async (req, res) => {
  try {
    const game = await Game.findOne({ userId: req.userId, status: 'active' }).lean();
    if (!game) return res.status(404).json({ message: 'No active game found.' });

    const playerBoard = deserializeBoard(game.playerBoard);
    const aiBoard     = deserializeBoard(game.aiBoard);

    return res.json({
      gameId:      game._id,
      playerBoard,
      aiBoard:     hideShips(aiBoard),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/:id/fire', async (req, res) => {
  try {
    const { row, col } = req.body;

    if (row === undefined || col === undefined) {
      return res.status(400).json({ message: 'row and col are required.' });
    }

    const game = await Game.findOne({ _id: req.params.id, userId: req.userId });
    if (!game)                    return res.status(404).json({ message: 'Game not found.' });
    if (game.status !== 'active') return res.status(409).json({ message: 'Game is already finished.' });
    if (game.currentTurn !== 'player') return res.status(409).json({ message: 'Not your turn.' });

    let playerBoard = deserializeBoard(game.playerBoard);
    let aiBoard     = deserializeBoard(game.aiBoard);
    let aiState     = JSON.parse(game.aiState);
    aiState.firedAt = new Set(aiState.firedAt);

    const playerFire = fireAt(aiBoard, row, col);
    if (playerFire.result === 'already_fired') {
      return res.status(409).json({ message: 'Cell already fired at.' });
    }
    aiBoard = playerFire.board;

    if (checkWin(aiBoard)) {
      game.status      = 'finished';
      game.result      = 'win';
      game.playerBoard = serializeBoard(playerBoard);
      game.aiBoard     = serializeBoard(aiBoard);
      await game.save();

      await User.findByIdAndUpdate(req.userId, {
        $push: { gameHistory: { result: 'win', mode: 'ai', date: new Date() } },
      });

      return res.json({
        playerFireResult: playerFire.result,
        aiMove:           null,
        aiFireResult:     null,
        gameOver:         true,
        winner:           'player',
      });
    }

    const aiMoveResult = getAIMove(aiState, playerBoard);
    const { row: aiRow, col: aiCol } = aiMoveResult;
    aiState = aiMoveResult.state;

    const aiFire = fireAt(playerBoard, aiRow, aiCol);
    playerBoard  = aiFire.board;
    aiState      = updateAIStateAfterFire(aiState, aiRow, aiCol, aiFire.result);

    let gameOver = false;
    let winner   = null;

    if (checkWin(playerBoard)) {
      game.status = 'finished';
      game.result = 'loss';
      gameOver    = true;
      winner      = 'ai';

      await User.findByIdAndUpdate(req.userId, {
        $push: { gameHistory: { result: 'loss', mode: 'ai', date: new Date() } },
      });
    }

    game.playerBoard = serializeBoard(playerBoard);
    game.aiBoard     = serializeBoard(aiBoard);
    game.aiState     = JSON.stringify({ ...aiState, firedAt: [...aiState.firedAt] });
    game.currentTurn = 'player';
    await game.save();

    return res.json({
      playerFireResult: playerFire.result,
      aiMove:           { row: aiRow, col: aiCol },
      aiFireResult:     aiFire.result,
      gameOver,
      winner,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
