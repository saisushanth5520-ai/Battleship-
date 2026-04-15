const CELL_SIZE  = 40;
const GRID_SIZE  = 10;
const LABEL_SIZE = 20;

const GRID_LINE  = '#00d4ff';
const LABEL_COL  = '#00d4ff';
const EMPTY_COL  = '#0d1a30';

const SHIP_COLORS = {
  Carrier:    '#4a90d9',
  Battleship: '#5a8a3a',
  Cruiser:    '#2a8a7a',
  Submarine:  '#7a4a9a',
  Destroyer:  '#c4622a',
};

const flickerIntervals = new Map();

// ── Helpers ────────────────────────────────────────────────────────────────

function cellX(col) { return LABEL_SIZE + col * CELL_SIZE; }
function cellY(row) { return LABEL_SIZE + row * CELL_SIZE; }
function cellCX(col) { return cellX(col) + CELL_SIZE / 2; }
function cellCY(row) { return cellY(row) + CELL_SIZE / 2; }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Ship silhouette detection ──────────────────────────────────────────────

function detectShips(board) {
  const visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
  const ships   = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = board[r][c];
      if (!cell || cell === 'HIT' || cell === 'MISS' || visited[r][c]) continue;

      const name  = cell;
      const cells = [];

      let cr = r, cc = c;
      while (cr < GRID_SIZE && board[cr][cc] === name) {
        cells.push([cr, cc]);
        visited[cr][cc] = true;
        cr++;
      }

      if (cells.length === 1) {
        cr = r; cc = c + 1;
        while (cc < GRID_SIZE && board[cr][cc] === name) {
          cells.push([cr, cc]);
          visited[cr][cc] = true;
          cc++;
        }
      }

      ships.push({ name, cells });
    }
  }

  return ships;
}

function isShipSunk(cells, board) {
  return cells.every(([r, c]) => board[r][c] === 'HIT');
}

// ── Ship silhouette drawing ────────────────────────────────────────────────

function drawShip(ctx, cells, board) {
  const rows  = cells.map(([r]) => r);
  const cols  = cells.map(([, c]) => c);
  const minR  = Math.min(...rows), maxR = Math.max(...rows);
  const minC  = Math.min(...cols), maxC = Math.max(...cols);
  const name  = board[cells[0][0]][cells[0][1]] === 'HIT' ? null : board[cells[0][0]][cells[0][1]];
  const sunk  = isShipSunk(cells, board);

  const PAD   = 3;
  const x     = cellX(minC) + PAD;
  const y     = cellY(minR) + PAD;
  const w     = (maxC - minC + 1) * CELL_SIZE - PAD * 2;
  const h     = (maxR - minR + 1) * CELL_SIZE - PAD * 2;
  const rad   = 5;

  const baseColor = sunk
    ? '#333344'
    : (SHIP_COLORS[name] || '#4a80a0');

  ctx.save();

  ctx.shadowColor  = sunk ? 'rgba(255,34,34,0.4)' : 'rgba(0,0,0,0.6)';
  ctx.shadowBlur   = sunk ? 8 : 10;
  ctx.shadowOffsetY = 3;

  roundRect(ctx, x, y, w, h, rad);
  ctx.fillStyle = baseColor;
  ctx.fill();

  if (sunk) {
    roundRect(ctx, x, y, w, h, rad);
    ctx.strokeStyle = '#ff2222';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;
  ctx.shadowOffsetY = 0;

  if (!sunk) {
    const highlight = ctx.createLinearGradient(x, y, x, y + h * 0.35);
    highlight.addColorStop(0, 'rgba(255,255,255,0.22)');
    highlight.addColorStop(1, 'rgba(255,255,255,0)');
    roundRect(ctx, x, y, w, h * 0.35, rad);
    ctx.fillStyle = highlight;
    ctx.fill();
  }

  ctx.restore();

  for (const [r, c] of cells) {
    if (board[r][c] === 'HIT') {
      drawHitOnShip(ctx, r, c);
    }
  }
}

function drawHitOnShip(ctx, row, col) {
  const cx = cellCX(col);
  const cy = cellCY(row);
  const r  = CELL_SIZE * 0.28;

  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, 'rgba(255,180,0,0.95)');
  grad.addColorStop(0.5, 'rgba(255,60,0,0.8)');
  grad.addColorStop(1, 'rgba(255,0,0,0)');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,80,0,0.6)';
  ctx.lineWidth   = 1;
  ctx.stroke();
  ctx.restore();
}

// ── Main grid draw ─────────────────────────────────────────────────────────

function drawGrid(ctx, board, isEnemy) {
  const totalW = LABEL_SIZE + GRID_SIZE * CELL_SIZE;
  const totalH = LABEL_SIZE + GRID_SIZE * CELL_SIZE;
  ctx.clearRect(0, 0, totalW, totalH);

  ctx.font         = '11px "Orbitron", "Segoe UI", sans-serif';
  ctx.fillStyle    = LABEL_COL;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  const colLabels = 'ABCDEFGHIJ';
  for (let c = 0; c < GRID_SIZE; c++) {
    ctx.fillText(colLabels[c], cellX(c) + CELL_SIZE / 2, LABEL_SIZE / 2);
  }

  ctx.textAlign = 'right';
  for (let r = 0; r < GRID_SIZE; r++) {
    ctx.fillText(String(r + 1), LABEL_SIZE - 4, cellY(r) + CELL_SIZE / 2);
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      ctx.fillStyle = EMPTY_COL;
      ctx.fillRect(cellX(c), cellY(r), CELL_SIZE, CELL_SIZE);
    }
  }

  if (!isEnemy) {
    const ships = detectShips(board);
    for (const ship of ships) {
      drawShip(ctx, ship.cells, board);
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = board[r][c];
      if (cell === 'HIT') {
        if (isEnemy) drawEnemyHit(ctx, r, c);
      } else if (cell === 'MISS') {
        drawMissCell(ctx, r, c);
      }
    }
  }

  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth   = 0.6;
  ctx.globalAlpha = 0.5;
  for (let c = 0; c <= GRID_SIZE; c++) {
    ctx.beginPath();
    ctx.moveTo(LABEL_SIZE + c * CELL_SIZE, LABEL_SIZE);
    ctx.lineTo(LABEL_SIZE + c * CELL_SIZE, LABEL_SIZE + GRID_SIZE * CELL_SIZE);
    ctx.stroke();
  }
  for (let r = 0; r <= GRID_SIZE; r++) {
    ctx.beginPath();
    ctx.moveTo(LABEL_SIZE, LABEL_SIZE + r * CELL_SIZE);
    ctx.lineTo(LABEL_SIZE + GRID_SIZE * CELL_SIZE, LABEL_SIZE + r * CELL_SIZE);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawEnemyHit(ctx, row, col) {
  const cx = cellCX(col), cy = cellCY(row);
  ctx.save();
  ctx.fillStyle = '#ff2222';
  ctx.fillRect(cellX(col), cellY(row), CELL_SIZE, CELL_SIZE);
  ctx.shadowColor = '#ff2222';
  ctx.shadowBlur  = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, CELL_SIZE * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = '#ff8800';
  ctx.fill();
  ctx.restore();
}

function drawMissCell(ctx, row, col) {
  const cx = cellCX(col), cy = cellCY(row);
  ctx.save();
  ctx.fillStyle = '#445566';
  ctx.fillRect(cellX(col), cellY(row), CELL_SIZE, CELL_SIZE);
  ctx.strokeStyle = 'rgba(100,160,200,0.4)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ── Hit animation ──────────────────────────────────────────────────────────

function animateCell(ctx, row, col, result, done) {
  const cx  = cellCX(col);
  const cy  = cellCY(row);
  const key = `${row},${col}`;

  if (result === 'hit') {
    const start  = performance.now();
    const dur    = 600;

    function frame(now) {
      const t = Math.min((now - start) / dur, 1);

      ctx.save();
      ctx.clearRect(cellX(col), cellY(row), CELL_SIZE, CELL_SIZE);
      ctx.fillStyle = '#2d0000';   // dark red — immediately signals a HIT
      ctx.fillRect(cellX(col), cellY(row), CELL_SIZE, CELL_SIZE);

      const rings = 3;
      for (let i = 0; i < rings; i++) {
        const phase = (t + i / rings) % 1;
        const r     = phase * CELL_SIZE * 0.7;
        const alpha = (1 - phase) * 0.8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${255}, ${Math.floor(120 * (1 - phase))}, 0, ${alpha})`;
        ctx.lineWidth   = 2.5 * (1 - phase);
        ctx.stroke();
      }

      ctx.restore();

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        startFlicker(ctx, row, col, key);
        if (done) done();
      }
    }

    requestAnimationFrame(frame);

  } else {
    const start = performance.now();
    const dur   = 400;
    const lines = 4 + Math.floor(Math.random() * 3);
    const angles = Array.from({ length: lines }, (_, i) => (i / lines) * Math.PI * 2 + Math.random() * 0.3);

    function frame(now) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 2);

      ctx.save();
      ctx.clearRect(cellX(col), cellY(row), CELL_SIZE, CELL_SIZE);
      ctx.fillStyle = EMPTY_COL;
      ctx.fillRect(cellX(col), cellY(row), CELL_SIZE, CELL_SIZE);

      const maxLen = CELL_SIZE * 0.38;
      const alpha  = (1 - t) * 0.85;
      ctx.strokeStyle = `rgba(100, 180, 220, ${alpha})`;
      ctx.lineWidth   = 1.5;

      for (const angle of angles) {
        const startR = CELL_SIZE * 0.1;
        const endR   = startR + ease * maxLen;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * startR, cy + Math.sin(angle) * startR);
        ctx.lineTo(cx + Math.cos(angle) * endR,   cy + Math.sin(angle) * endR);
        ctx.stroke();
      }

      ctx.restore();

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        if (done) done();
      }
    }

    requestAnimationFrame(frame);
  }
}

// ── Flame flicker ──────────────────────────────────────────────────────────

function startFlicker(ctx, row, col, key) {
  if (flickerIntervals.has(key)) clearInterval(flickerIntervals.get(key));

  const id = setInterval(() => {
    const brightness = 180 + Math.floor(Math.random() * 75);
    const glow       = 6 + Math.random() * 10;

    ctx.save();
    ctx.fillStyle = `rgb(${brightness + 40}, ${Math.floor(brightness * 0.15)}, ${Math.floor(brightness * 0.1)})`;
    ctx.fillRect(cellX(col), cellY(row), CELL_SIZE, CELL_SIZE);

    ctx.shadowColor = `rgba(255, 80, 0, 0.9)`;
    ctx.shadowBlur  = glow;
    ctx.beginPath();
    ctx.arc(cellCX(col), cellCY(row), CELL_SIZE * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, ${Math.floor(brightness * 0.55)}, 0, 0.9)`;
    ctx.fill();
    ctx.restore();
  }, 80);

  flickerIntervals.set(key, id);
}

// ── Cleanup ────────────────────────────────────────────────────────────────

function clearAllAnimations() {
  for (const id of flickerIntervals.values()) clearInterval(id);
  flickerIntervals.clear();
}

// ── Click helper ───────────────────────────────────────────────────────────

function getCellFromClick(canvas, event) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const clickX = (event.clientX - rect.left) * scaleX;
  const clickY = (event.clientY - rect.top)  * scaleY;

  const gridX = clickX - LABEL_SIZE;
  const gridY = clickY - LABEL_SIZE;

  if (gridX < 0 || gridY < 0) return null;

  const col = Math.floor(gridX / CELL_SIZE);
  const row = Math.floor(gridY / CELL_SIZE);

  if (col >= GRID_SIZE || row >= GRID_SIZE) return null;

  return { row, col };
}

window.CanvasRenderer = { drawGrid, getCellFromClick, animateCell, clearAllAnimations };
