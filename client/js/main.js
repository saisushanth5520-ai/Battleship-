const TOTAL_SHIP_CELLS = 17;

const state = {
  mode:          null,
  gameId:        null,
  playerBoard:   null,
  aiBoard:       null,
  myTurn:        true,
  pvpRoomId:     null,
  pvpAssignment: null,
  pvpOpponent:   null,
  userId:        null,
};

function decodeUserId(token) {
  try { return JSON.parse(atob(token.split('.')[1])).userId; } catch { return null; }
}

// ════════════════════════════════════════
// SCREEN TRANSITIONS
// ════════════════════════════════════════

function showScreen(id) {
  const current = document.querySelector('.screen:not(.hidden)');
  const next    = document.getElementById(id);
  if (current === next) return;

  if (current) {
    current.classList.add('exiting');
    setTimeout(() => {
      current.classList.add('hidden');
      current.classList.remove('exiting');
      revealScreen(next);
    }, 270);
  } else {
    revealScreen(next);
  }
}

function revealScreen(el) {
  el.classList.remove('hidden');
  el.classList.add('entering');
  setTimeout(() => el.classList.remove('entering'), 340);
}

// ════════════════════════════════════════
// SPLASH SCREEN
// ════════════════════════════════════════

function initSplash() {
  const splash = document.getElementById('splash-screen');
  setTimeout(() => {
    splash.classList.add('splash-exit');
    setTimeout(() => {
      splash.classList.add('hidden');
      splash.style.display = 'none';
      bootApp();
    }, 420);
  }, 2600);
}

function bootApp() {
  if (API.isLoggedIn()) {
    const token = localStorage.getItem('bsToken');
    if (token) state.userId = decodeUserId(token);
    document.getElementById('navbar').classList.remove('hidden');
    revealScreen(document.getElementById('screen-mode'));
  } else {
    revealScreen(document.getElementById('screen-auth'));
  }
}

// ════════════════════════════════════════
// DEPLOY FLEET OVERLAY
// ════════════════════════════════════════

function showDeployOverlay() {
  return new Promise(resolve => {
    const overlay = document.getElementById('deploy-overlay');
    const dots    = document.getElementById('deploy-dots');
    overlay.classList.remove('hidden');
    let count = 0;
    const iv = setInterval(() => { dots.textContent = '.'.repeat((count++ % 3) + 1); }, 240);
    setTimeout(() => {
      clearInterval(iv);
      overlay.classList.add('hidden');
      resolve();
    }, 820);
  });
}

// ════════════════════════════════════════
// PVP WAITING STATE
// ════════════════════════════════════════

function showPvpWaiting(visible) {
  document.getElementById('pvp-waiting').classList.toggle('hidden', !visible);
}

// ════════════════════════════════════════
// HUD HELPERS
// ════════════════════════════════════════

function coordLabel(row, col) { return 'ABCDEFGHIJ'[col] + (row + 1); }

function updateHealthBar() {
  if (!state.playerBoard) return;
  let remaining = 0;
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 10; c++) {
      const v = state.playerBoard[r][c];
      if (v && v !== 'HIT' && v !== 'MISS') remaining++;
    }
  const pct  = Math.round((remaining / TOTAL_SHIP_CELLS) * 100);
  const fill = document.getElementById('health-bar-fill');
  document.getElementById('health-bar-fill').style.width = pct + '%';
  document.getElementById('health-pct').textContent      = pct + '%';
  fill.className = pct > 60 ? 'health-green' : pct > 30 ? 'health-orange' : 'health-red';
}

function updateShotCounters() {
  let p = 0, e = 0;
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 10; c++) {
      if (state.aiBoard?.[r][c]     === 'HIT' || state.aiBoard?.[r][c]     === 'MISS') p++;
      if (state.playerBoard?.[r][c] === 'HIT' || state.playerBoard?.[r][c] === 'MISS') e++;
    }
  document.getElementById('player-shots').textContent = p;
  document.getElementById('enemy-shots').textContent  = e;
}

function updateHUD() { updateHealthBar(); updateShotCounters(); }

function resetHUD() {
  document.getElementById('health-bar-fill').style.width = '100%';
  document.getElementById('health-bar-fill').className   = 'health-green';
  document.getElementById('health-pct').textContent      = '100%';
  document.getElementById('player-shots').textContent    = '0';
  document.getElementById('enemy-shots').textContent     = '0';
  document.getElementById('event-entries').innerHTML     = '';
}

function setTurnIndicator(isMyTurn) {
  const txt     = document.getElementById('turn-text');
  const reticle = document.getElementById('reticle');
  txt.textContent = isMyTurn ? 'YOUR\nTURN' : 'ENEMY\nTURN';
  txt.classList.toggle('enemy-turn', !isMyTurn);
  reticle.classList.toggle('targeting', isMyTurn);
  reticle.classList.toggle('dimmed',    !isMyTurn);
}

function setEnemyCanvasEnabled(enabled) {
  const canvas = document.getElementById('ai-canvas');
  canvas.style.pointerEvents = enabled ? 'auto' : 'none';
  canvas.style.opacity       = enabled ? '1'    : '0.5';
}

function setStatus(msg) {
  const el = document.getElementById('game-status');
  el.textContent = msg;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

function addEventLog(msg, type) {
  const container = document.getElementById('event-entries');
  const el = document.createElement('span');
  el.className   = 'event-entry ' + type;
  el.textContent = msg;
  container.insertBefore(el, container.firstChild);
  const all = container.querySelectorAll('.event-entry');
  if (all.length > 5) all[all.length - 1].remove();
}

// ════════════════════════════════════════
// AUTH
// ════════════════════════════════════════

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearAuthError() {
  const el = document.getElementById('auth-error');
  el.textContent = '';
  el.classList.add('hidden');
}

function initAuthTabs() {
  document.getElementById('tab-login').addEventListener('click', () => {
    document.getElementById('tab-login').classList.add('active');
    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('form-login').classList.remove('hidden');
    document.getElementById('form-register').classList.add('hidden');
    clearAuthError();
  });
  document.getElementById('tab-register').addEventListener('click', () => {
    document.getElementById('tab-register').classList.add('active');
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('form-register').classList.remove('hidden');
    document.getElementById('form-login').classList.add('hidden');
    clearAuthError();
  });
}

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAuthError();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const data = await API.login(username, password);
    state.userId = decodeUserId(data.token);
    onLoginSuccess(username);
  }
  catch (err) { showAuthError(err.message); }
});

document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAuthError();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  try {
    await API.register(username, password);
    const data = await API.login(username, password);
    state.userId = decodeUserId(data.token);
    onLoginSuccess(username);
  } catch (err) { showAuthError(err.message); }
});

function onLoginSuccess(username) {
  document.getElementById('nav-username').textContent = username;
  document.getElementById('navbar').classList.remove('hidden');
  showScreen('screen-mode');
}

document.getElementById('btn-logout').addEventListener('click', () => { API.logout(); location.reload(); });

// ════════════════════════════════════════
// GAME START
// ════════════════════════════════════════

async function startGameUI(opponentLabel) {
  document.getElementById('opponent-name').textContent = opponentLabel;
  CanvasRenderer.clearAllAnimations();
  resetHUD();
  showPvpWaiting(false);
  renderBoards();
  updateHUD();
  setTurnIndicator(true);
  setEnemyCanvasEnabled(true);
  setStatus('Fire at the enemy grid.');
  showScreen('screen-game');
}

// ── Mode selection ──────────────────────────────────────────────────────────

document.getElementById('btn-play-ai').addEventListener('click', async () => {
  try {
    await showDeployOverlay();
    const data = await API.newGame();
    state.mode        = 'ai';
    state.gameId      = data.gameId;
    state.playerBoard = data.playerBoard;
    state.aiBoard     = data.aiBoard;
    state.myTurn      = true;
    await startGameUI('AI');
  } catch (err) { alert('Failed to start game: ' + err.message); }
});

document.getElementById('btn-play-pvp').addEventListener('click', () => {
  state.mode = 'pvp';

  SocketClient.registerCallbacks({
    onWaiting:              handleWaiting,
    onMatchFound:           handleMatchFound,
    onGameStart:            handlePvpGameStart,
    onFireResult:           handlePvpFireResult,
    onGameOver:             handlePvpGameOver,
    onOpponentDisconnected: handleOpponentDisconnected,
    onNotYourTurn:          handleNotYourTurn,
  });

  SocketClient.connect();
  SocketClient.joinQueue();
  document.getElementById('opponent-name').textContent = '...';
  showScreen('screen-game');
  showPvpWaiting(true);
  setEnemyCanvasEnabled(false);
});

// ── PvP callbacks ───────────────────────────────────────────────────────────

function handleWaiting() { }

function handleMatchFound(roomId, opponentUsername, assignment) {
  state.pvpRoomId     = roomId;
  state.pvpAssignment = assignment;
  state.pvpOpponent   = opponentUsername;
  document.getElementById('opponent-name').textContent = opponentUsername;
}

async function handlePvpGameStart(data) {
  if (data.assignment) state.pvpAssignment = data.assignment;
  state.playerBoard = data.playerBoard;
  state.aiBoard     = data.opponentBoard;
  state.myTurn      = state.pvpAssignment === 'player1';
  await showDeployOverlay();
  showPvpWaiting(false);
  CanvasRenderer.clearAllAnimations();
  resetHUD();
  renderBoards();
  updateHUD();
  setTurnIndicator(state.myTurn);
  setEnemyCanvasEnabled(state.myTurn);
  setStatus(state.myTurn ? 'Fire first!' : 'Waiting for opponent…');
}

function handlePvpFireResult(firingPlayer, row, col, result) {
  const mine  = (firingPlayer === state.pvpAssignment);
  const coord = coordLabel(row, col);

  if (mine) {
    state.aiBoard[row][col] = result === 'hit' ? 'HIT' : 'MISS';
    state.myTurn = false;
    CanvasRenderer.animateCell(document.getElementById('ai-canvas').getContext('2d'), row, col, result, () => { renderBoards(); updateHUD(); });
    addEventLog(`You ${result} at ${coord}`, result === 'hit' ? 'hit' : 'miss');
  } else {
    state.playerBoard[row][col] = result === 'hit' ? 'HIT' : 'MISS';
    state.myTurn = true;
    CanvasRenderer.animateCell(document.getElementById('player-canvas').getContext('2d'), row, col, result, () => { renderBoards(); updateHUD(); });
    addEventLog(`Enemy ${result} at ${coord}`, result === 'hit' ? 'enemy-hit' : 'enemy-miss');
  }

  setTurnIndicator(state.myTurn);
  setEnemyCanvasEnabled(state.myTurn);
  setStatus(state.myTurn ? 'Your turn — fire!' : 'Waiting for opponent…');
}

function handlePvpGameOver(winnerUserId) {
  setEnemyCanvasEnabled(false);
  const won = String(winnerUserId) === String(state.userId);
  showGameOverOverlay(won);
  loadHistory();
}

function handleOpponentDisconnected() {
  setEnemyCanvasEnabled(false);
  document.getElementById('overlay-gameover').classList.add('hidden');
  alert('Your opponent disconnected.');
  showScreen('screen-mode');
}

function handleNotYourTurn() { setStatus('Wait for your turn!'); }

// ── AI fire ─────────────────────────────────────────────────────────────────

document.getElementById('ai-canvas').addEventListener('click', async (e) => {
  if (!state.myTurn) return;
  const cell = CanvasRenderer.getCellFromClick(document.getElementById('ai-canvas'), e);
  if (!cell) return;
  const { row, col } = cell;

  if (state.mode === 'pvp') {
    SocketClient.sendFire(state.pvpRoomId, row, col);
    setEnemyCanvasEnabled(false);
    return;
  }

  if (state.mode === 'ai') {
    setEnemyCanvasEnabled(false);
    try {
      const data  = await API.fire(state.gameId, row, col);
      const coord = coordLabel(row, col);

      state.aiBoard[row][col] = data.playerFireResult === 'hit' ? 'HIT' : 'MISS';
      addEventLog(`You ${data.playerFireResult} at ${coord}`, data.playerFireResult === 'hit' ? 'hit' : 'miss');
      CanvasRenderer.animateCell(document.getElementById('ai-canvas').getContext('2d'), row, col, data.playerFireResult, () => { renderBoards(); updateHUD(); });

      if (data.aiMove) {
        const aiCoord = coordLabel(data.aiMove.row, data.aiMove.col);
        state.playerBoard[data.aiMove.row][data.aiMove.col] = data.aiFireResult === 'hit' ? 'HIT' : 'MISS';
        addEventLog(`AI ${data.aiFireResult} at ${aiCoord}`, data.aiFireResult === 'hit' ? 'enemy-hit' : 'enemy-miss');
        CanvasRenderer.animateCell(document.getElementById('player-canvas').getContext('2d'), data.aiMove.row, data.aiMove.col, data.aiFireResult, () => { renderBoards(); updateHUD(); });
      }

      if (data.gameOver) {
        setEnemyCanvasEnabled(false);
        setTimeout(() => { showGameOverOverlay(data.winner === 'player'); loadHistory(); }, 700);
        return;
      }

      state.myTurn = true;
      setTurnIndicator(true);
      setEnemyCanvasEnabled(true);
      setStatus('Your turn — fire again!');
    } catch (err) { setEnemyCanvasEnabled(true); setStatus('Error: ' + err.message); }
  }
});

// ── Render ──────────────────────────────────────────────────────────────────

function renderBoards() {
  if (!state.playerBoard || !state.aiBoard) return;
  CanvasRenderer.drawGrid(document.getElementById('player-canvas').getContext('2d'), state.playerBoard, false);
  CanvasRenderer.drawGrid(document.getElementById('ai-canvas').getContext('2d'),     state.aiBoard,     true);
}

// ════════════════════════════════════════
// GAME OVER OVERLAY
// ════════════════════════════════════════

function calcStats() {
  let shots = 0, hits = 0;
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 10; c++) {
      const v = state.aiBoard?.[r][c];
      if (v === 'HIT')  { hits++; shots++; }
      if (v === 'MISS') shots++;
    }
  return { shots, hits, accuracy: shots > 0 ? Math.round((hits / shots) * 100) : 0 };
}

function showGameOverOverlay(won) {
  const { shots, hits, accuracy } = calcStats();
  const overlay = document.getElementById('overlay-gameover');
  const title   = document.getElementById('gameover-title');
  const panel   = document.getElementById('gameover-panel');

  title.textContent = won ? 'VICTORY' : 'DEFEATED';
  title.className   = won ? 'victory' : 'defeat';
  document.getElementById('stat-shots').textContent    = shots;
  document.getElementById('stat-hits').textContent     = hits;
  document.getElementById('stat-accuracy').textContent = accuracy + '%';

  overlay.classList.remove('hidden');

  if (won) {
    launchConfetti();
  } else {
    panel.classList.remove('shake');
    void panel.offsetWidth;
    panel.classList.add('shake');
  }
}

document.getElementById('btn-play-again').addEventListener('click', () => {
  stopConfetti();
  document.getElementById('overlay-gameover').classList.add('hidden');
  showScreen('screen-mode');
});

document.getElementById('btn-view-history').addEventListener('click', async () => {
  stopConfetti();
  document.getElementById('overlay-gameover').classList.add('hidden');
  await loadHistory();
  showScreen('screen-history');
});

// ── Confetti ─────────────────────────────────────────────────────────────────

let confettiRaf = null;

function launchConfetti() {
  const canvas  = document.getElementById('confetti-canvas');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx     = canvas.getContext('2d');
  const colors  = ['#ffd700','#00d4ff','#ffffff','#ffe866','#80eaff'];
  const pieces  = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width, y: -10 - Math.random() * 200,
    w: 5 + Math.random() * 6,        h: 10 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: 1.5 + Math.random() * 3,  drift: (Math.random() - 0.5) * 1.2,
    rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.15,
  }));
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.88;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
      p.y += p.speed; p.x += p.drift; p.rot += p.rotV;
      if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
    }
    confettiRaf = requestAnimationFrame(frame);
  }
  confettiRaf = requestAnimationFrame(frame);
}

function stopConfetti() {
  if (confettiRaf) { cancelAnimationFrame(confettiRaf); confettiRaf = null; }
  const c = document.getElementById('confetti-canvas');
  c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

// ════════════════════════════════════════
// HISTORY + STATS DASHBOARD
// ════════════════════════════════════════

function renderStatsCards(history) {
  const total  = history.length;
  const wins   = history.filter(h => h.result === 'win').length;
  const aiG    = history.filter(h => h.mode === 'ai');
  const pvpG   = history.filter(h => h.mode === 'pvp');
  const aiWins = aiG.filter(h => h.result === 'win').length;
  const pvpWins= pvpG.filter(h => h.result === 'win').length;
  const pct    = total ? Math.round((wins / total) * 100) : 0;

  document.getElementById('scard-total').textContent   = total;
  document.getElementById('scard-winrate').textContent = pct + '%';
  document.getElementById('scard-ai-rate').textContent  = aiG.length  ? Math.round((aiWins  / aiG.length)  * 100) + '%' : '—';
  document.getElementById('scard-pvp-rate').textContent = pvpG.length ? Math.round((pvpWins / pvpG.length) * 100) + '%' : '—';

  const CIRC = 201.06;
  const arc  = document.getElementById('ring-arc');
  const filled = (pct / 100) * CIRC;
  arc.setAttribute('stroke-dasharray', `${filled.toFixed(1)} ${CIRC}`);
  arc.setAttribute('stroke', pct >= 50 ? '#00ffb3' : '#ffaa00');
}

function renderBarChart(history) {
  const svg    = document.getElementById('history-chart');
  const recent = history.slice(-10);
  svg.innerHTML = '';

  if (!recent.length) return;

  const W = 440, H = 90, BAR_W = 30, GAP = 14;
  const totalW = recent.length * (BAR_W + GAP) - GAP;
  const startX = (W - totalW) / 2;
  const MAX_H  = 60, BASE_Y = 78;

  recent.forEach((entry, i) => {
    const x    = startX + i * (BAR_W + GAP);
    const win  = entry.result === 'win';
    const barH = MAX_H;
    const y    = BASE_Y - barH;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', BAR_W);
    rect.setAttribute('height', barH);
    rect.setAttribute('rx', '3');
    rect.setAttribute('fill', win ? 'rgba(0,212,255,0.35)' : 'rgba(255,58,92,0.35)');
    rect.setAttribute('stroke', win ? '#00d4ff' : '#ff3a5c');
    rect.setAttribute('stroke-width', '1');
    rect.style.transformOrigin = `${x + BAR_W/2}px ${BASE_Y}px`;
    rect.style.animation = `barGrow 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s both`;
    svg.appendChild(rect);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x + BAR_W / 2);
    label.setAttribute('y', y - 4);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-family', 'Orbitron, sans-serif');
    label.setAttribute('font-size', '8');
    label.setAttribute('fill', win ? '#00d4ff' : '#ff3a5c');
    label.textContent = win ? 'W' : 'L';
    svg.appendChild(label);

    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tick.setAttribute('x', x + BAR_W / 2);
    tick.setAttribute('y', BASE_Y + 9);
    tick.setAttribute('text-anchor', 'middle');
    tick.setAttribute('font-family', 'Orbitron, sans-serif');
    tick.setAttribute('font-size', '7');
    tick.setAttribute('fill', 'rgba(0,212,255,0.4)');
    tick.textContent = history.length - recent.length + i + 1;
    svg.appendChild(tick);
  });
}

function renderHistoryTable(history) {
  const tbody = document.getElementById('history-body');
  const empty = document.getElementById('history-empty');
  tbody.innerHTML = '';

  if (!history.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  [...history].reverse().forEach(entry => {
    const tr = document.createElement('tr');
    tr.className = entry.result === 'win' ? 'row-win' : 'row-loss';

    const pillClass = entry.mode === 'ai' ? 'table-pill ai-pill' : 'table-pill pvp-pill';
    const resClass  = entry.result === 'win' ? 'result-win' : 'result-loss';

    tr.innerHTML = `
      <td>${new Date(entry.date).toLocaleDateString()}</td>
      <td><span class="${pillClass}">${entry.mode.toUpperCase()}</span></td>
      <td class="${resClass}">${entry.result.toUpperCase()}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadHistory() {
  try {
    const history = await API.getHistory();
    renderStatsCards(history);
    renderBarChart(history);
    renderHistoryTable(history);
  } catch {
    document.getElementById('history-empty').classList.remove('hidden');
  }
}

document.getElementById('btn-history').addEventListener('click', async () => {
  await loadHistory();
  showScreen('screen-history');
});

document.getElementById('btn-back-mode').addEventListener('click', () => showScreen('screen-mode'));

// ── Setup screen ─────────────────────────────────────────────────────────────

document.getElementById('btn-random-place').addEventListener('click', async () => {
  try {
    await showDeployOverlay();
    const data = await API.newGame();
    state.mode        = 'ai';
    state.gameId      = data.gameId;
    state.playerBoard = data.playerBoard;
    state.aiBoard     = data.aiBoard;
    state.myTurn      = true;
    await startGameUI('AI');
  } catch (err) { alert('Failed to start game: ' + err.message); }
});

document.getElementById('btn-start-game').addEventListener('click', () => {
  if (!state.gameId) return;
  showScreen('screen-game');
});

// ════════════════════════════════════════
// BOOT
// ════════════════════════════════════════

initAuthTabs();
initSplash();
