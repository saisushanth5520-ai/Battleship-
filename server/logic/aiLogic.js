function createAIState() {
  return {
    mode:     'hunt',
    hitStack: [],
    firedAt:  new Set(),
  };
}

function cloneState(state) {
  return {
    mode:     state.mode,
    hitStack: state.hitStack.map(h => ({ row: h.row, col: h.col })),
    firedAt:  new Set(state.firedAt),
  };
}

function inBounds(row, col) {
  return row >= 0 && row < 10 && col >= 0 && col < 10;
}

function adjacentCells(row, col) {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row,          col: col - 1 },
    { row,          col: col + 1 },
  ].filter(c => inBounds(c.row, c.col));
}

function huntMove(state) {
  const parity = [];
  const fallback = [];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (!state.firedAt.has(`${r},${c}`)) {
        if ((r + c) % 2 === 0) {
          parity.push({ row: r, col: c });
        } else {
          fallback.push({ row: r, col: c });
        }
      }
    }
  }

  const pool = parity.length > 0 ? parity : fallback;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getAIMove(state, board) {
  const next = cloneState(state);

  if (next.mode === 'target') {
    for (let i = 0; i < next.hitStack.length; i++) {
      const hit = next.hitStack[i];
      const neighbors = adjacentCells(hit.row, hit.col).filter(
        c => !next.firedAt.has(`${c.row},${c.col}`)
      );
      if (neighbors.length > 0) {
        const { row, col } = neighbors[0];
        return { row, col, state: next };
      }
    }
    next.mode = 'hunt';
  }

  const { row, col } = huntMove(next);
  return { row, col, state: next };
}

function updateAIStateAfterFire(state, row, col, result) {
  const next = cloneState(state);
  next.firedAt.add(`${row},${col}`);

  if (result === 'hit') {
    next.hitStack.push({ row, col });
    next.mode = 'target';
  } else if (result === 'sunk') {
    next.hitStack = [];
    next.mode = 'hunt';
  }

  return next;
}

module.exports = { createAIState, getAIMove, updateAIStateAfterFire };
