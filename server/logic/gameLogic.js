const SHIPS = [
  { name: 'Carrier',    length: 5 },
  { name: 'Battleship', length: 4 },
  { name: 'Cruiser',    length: 3 },
  { name: 'Submarine',  length: 3 },
  { name: 'Destroyer',  length: 2 },
];

function createEmptyBoard() {
  return Array.from({ length: 10 }, () => Array(10).fill(null));
}

function placeShipsRandomly(board) {
  const result = board.map(row => [...row]);

  for (const ship of SHIPS) {
    let placed = false;

    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * (horizontal ? 10 : 10 - ship.length + 1));
      const col = Math.floor(Math.random() * (horizontal ? 10 - ship.length + 1 : 10));

      const cells = [];
      for (let i = 0; i < ship.length; i++) {
        cells.push([horizontal ? row : row + i, horizontal ? col + i : col]);
      }

      if (cells.every(([r, c]) => result[r][c] === null)) {
        for (const [r, c] of cells) {
          result[r][c] = ship.name;
        }
        placed = true;
      }
    }
  }

  return result;
}

function fireAt(board, row, col) {
  const cell = board[row][col];

  if (cell === 'HIT' || cell === 'MISS') {
    return { result: 'already_fired', board };
  }

  const updated = board.map(r => [...r]);

  if (cell === null) {
    updated[row][col] = 'MISS';
    return { result: 'miss', board: updated };
  }

  updated[row][col] = 'HIT';
  return { result: 'hit', board: updated };
}

function checkWin(board) {
  return board.every(row =>
    row.every(cell => cell === null || cell === 'HIT' || cell === 'MISS')
  );
}

function serializeBoard(board) {
  return JSON.stringify(board);
}

function deserializeBoard(data) {
  return JSON.parse(data);
}

module.exports = { createEmptyBoard, placeShipsRandomly, fireAt, checkWin, serializeBoard, deserializeBoard };
