/**
 * game.js
 * Core client-side game state machine.
 * Coordinates between Api, SocketManager, and CanvasRenderer.
 */

const Game = (() => {
  // ── State ──────────────────────────────────────────────────────────────────

  const state = {
    gameId:          null,
    mode:            null,   // 'ai' | 'pvp'
    phase:           null,   // 'placement' | 'battle' | 'over'
    playerBoard:     null,   // 10×10 matrix
    enemyBoard:      null,
    myTurn:          false,
    placedShips:     [],
    pendingShip:     null,   // { length, orientation }
    orientation:     'H',
  };

  const SHIPS = [
    { name: 'Carrier',    length: 5 },
    { name: 'Battleship', length: 4 },
    { name: 'Cruiser',    length: 3 },
    { name: 'Submarine',  length: 3 },
    { name: 'Destroyer',  length: 2 },
  ];

  // ── Board factory ──────────────────────────────────────────────────────────

  function emptyBoard() {
    return Array.from({ length: 10 }, () => Array(10).fill(null));
  }

  // ── Placement ──────────────────────────────────────────────────────────────

  function canPlace(board, row, col, length, orientation) {
    for (let i = 0; i < length; i++) {
      const r = orientation === 'V' ? row + i : row;
      const c = orientation === 'H' ? col + i : col;
      if (r >= 10 || c >= 10 || board[r][c]) return false;
    }
    return true;
  }

  function placeShipOnBoard(board, row, col, length, orientation) {
    for (let i = 0; i < length; i++) {
      const r = orientation === 'V' ? row + i : row;
      const c = orientation === 'H' ? col + i : col;
      board[r][c] = 'S';
    }
  }

  function autoPlace() {
    state.playerBoard = emptyBoard();
    state.placedShips = [];
    const orient = ['H', 'V'];

    for (const ship of SHIPS) {
      let placed = false;
      while (!placed) {
        const o   = orient[Math.floor(Math.random() * 2)];
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);
        if (canPlace(state.playerBoard, row, col, ship.length, o)) {
          placeShipOnBoard(state.playerBoard, row, col, ship.length, o);
          state.placedShips.push({ row, col, length: ship.length, orientation: o });
          placed = true;
        }
      }
    }
  }

  function toggleOrientation() {
    state.orientation = state.orientation === 'H' ? 'V' : 'H';
    return state.orientation;
  }

  // ── Socket event handlers ──────────────────────────────────────────────────

  function bindSocketEvents() {
    SocketManager.on('game:start', ({ gameId, starterTurn }) => {
      state.gameId  = gameId;
      state.phase   = 'battle';
      state.myTurn  = starterTurn;
      // TODO: trigger screen transition in main.js
    });

    SocketManager.on('game:shotResult', ({ row, col, result, nextTurn }) => {
      if (result === 'hit' || result === 'sunk') {
        state.enemyBoard[row][col] = 'H';
      } else {
        state.enemyBoard[row][col] = 'M';
      }
      state.myTurn = nextTurn;
      // TODO: re-render boards
    });

    SocketManager.on('game:incomingShot', ({ row, col, result }) => {
      if (result === 'hit' || result === 'sunk') {
        state.playerBoard[row][col] = 'H';
      } else {
        state.playerBoard[row][col] = 'M';
      }
      // TODO: re-render boards
    });

    SocketManager.on('game:over', ({ winner }) => {
      state.phase = 'over';
      // TODO: show result screen in main.js
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function startGame(mode) {
    state.mode        = mode;
    state.playerBoard = emptyBoard();
    state.enemyBoard  = emptyBoard();
    state.placedShips = [];
    state.phase       = 'placement';

    const { gameId } = await Api.createGame(mode);
    state.gameId = gameId;
    return gameId;
  }

  async function submitPlacement() {
    await Api.placeShips(state.gameId, state.placedShips);
    if (state.mode === 'pvp') {
      SocketManager.joinMatchmaking();
    }
  }

  function fireAt(row, col) {
    if (!state.myTurn || state.phase !== 'battle') return;
    if (state.enemyBoard[row][col]) return;  // already shot here
    SocketManager.fireShot(state.gameId, row, col);
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    bindSocketEvents();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    init,
    state,
    SHIPS,
    emptyBoard,
    startGame,
    autoPlace,
    toggleOrientation,
    canPlace,
    placeShipOnBoard,
    submitPlacement,
    fireAt,
  };
})();
