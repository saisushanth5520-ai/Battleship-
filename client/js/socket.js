let _socket = null;
let _callbacks = {};

function connect() {
  if (_socket && _socket.connected) return;

  const token = localStorage.getItem('bsToken');

  _socket = io({ auth: { token } });

  _socket.on('waitingForOpponent',   ()     => _callbacks.onWaiting?.());
  _socket.on('matchFound',           (data) => _callbacks.onMatchFound?.(data.roomId, data.opponentUsername, data.assignment));
  _socket.on('pvpGameStart',         (data) => _callbacks.onGameStart?.(data));
  _socket.on('pvpFireResult',        (data) => _callbacks.onFireResult?.(data.firingPlayer, data.row, data.col, data.result));
  _socket.on('pvpGameOver',          (data) => _callbacks.onGameOver?.(data.winnerUserId));
  _socket.on('opponentDisconnected', ()     => _callbacks.onOpponentDisconnected?.());
  _socket.on('notYourTurn',          ()     => _callbacks.onNotYourTurn?.());
}

function joinQueue() {
  const token = localStorage.getItem('bsToken');
  _socket.emit('joinQueue', { token });
}

function sendFire(roomId, row, col) {
  _socket.emit('pvpFire', { roomId, row, col });
}

function registerCallbacks(callbacks) {
  _callbacks = { ..._callbacks, ...callbacks };
}

window.SocketClient = { connect, joinQueue, sendFire, registerCallbacks };
