(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');

  const CELL      = 48;
  const LINE_BASE = 'rgba(0, 212, 255, 0.08)';
  const PARTICLE_COUNT = 30;

  let W, H, cols, rows, particles, t = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cols = Math.ceil(W / CELL) + 1;
    rows = Math.ceil(H / CELL) + 1;
  }

  function makeParticle() {
    return {
      x:       Math.random() * W,
      y:       Math.random() * H,
      r:       1.2 + Math.random() * 2.4,
      speed:   0.18 + Math.random() * 0.42,
      opacity: 0.06 + Math.random() * 0.14,
    };
  }

  function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, makeParticle);
  }

  function drawGrid() {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const phase    = (c * 0.7 + r * 0.5 + t * 0.0008);
        const brightness = 0.5 + 0.5 * Math.sin(phase);
        const alpha    = 0.04 + brightness * 0.06;

        ctx.strokeStyle = `rgba(0, 212, 255, ${alpha.toFixed(3)})`;
        ctx.lineWidth   = 0.5;

        ctx.beginPath();
        ctx.moveTo(c * CELL, r * CELL);
        ctx.lineTo((c + 1) * CELL, r * CELL);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(c * CELL, r * CELL);
        ctx.lineTo(c * CELL, (r + 1) * CELL);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = LINE_BASE;
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    ctx.moveTo(cols * CELL, 0);
    ctx.lineTo(cols * CELL, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, rows * CELL);
    ctx.lineTo(W, rows * CELL);
    ctx.stroke();
  }

  function drawParticles() {
    for (const p of particles) {
      const pulse = 0.7 + 0.3 * Math.sin(t * 0.002 + p.x);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 212, 255, ${(p.opacity * pulse).toFixed(3)})`;
      ctx.fill();

      p.y -= p.speed;
      if (p.y + p.r < 0) {
        p.x       = Math.random() * W;
        p.y       = H + p.r;
        p.speed   = 0.18 + Math.random() * 0.42;
        p.opacity = 0.06 + Math.random() * 0.14;
      }
    }
  }

  function frame(timestamp) {
    t = timestamp;
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawParticles();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });

  resize();
  initParticles();
  requestAnimationFrame(frame);
})();
