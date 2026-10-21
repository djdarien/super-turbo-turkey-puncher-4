(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const hud = document.getElementById('hud');
  const scoreEl = document.getElementById('score-display');
  const comboEl = document.getElementById('combo-display');

  // Assets
  const turkeyImg = new Image(); turkeyImg.src = 'turkey.png';
  const fistImg = new Image(); fistImg.src = 'fist.png';
  const bgImg = new Image(); bgImg.src = 'background.png';

  // Audio — music starts only after user gesture, then loops
  const bgMusic = new Audio('background_music.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.45;
  const gobbleSound = new Audio('gobble.mp3');
  const punchSound = new Audio('punch.mp3');
  const welcomeSound = new Audio('welcome_message.mp3');

  function playSound(audio) {
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (_) {}
  }

  // State — one turkey at a time, like original Doom mini-game
  let turkey = null;
  let score = 0;
  let combo = 0;
  let lastPunchTime = 0;
  let shake = 0;
  let running = false;
  let paused = false;
  let fist = { x: 0, y: 0, w: 56, h: 56 };
  let highScores = JSON.parse(localStorage.getItem('sttp4_scores') || '[]');
  let animId = 0;
  let turkeyHp = 5;
  const BASE_HITS = 4;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function updateFist(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    fist.x = clientX - r.left - fist.w / 2;
    fist.y = clientY - r.top - fist.h / 2;
  }

  canvas.addEventListener('mousemove', e => updateFist(e.clientX, e.clientY));
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches[0]) updateFist(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  canvas.addEventListener('click', punch);
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches[0]) {
      updateFist(e.touches[0].clientX, e.touches[0].clientY);
      punch();
    }
  }, { passive: false });

  function spawnTurkey() {
    const size = Math.min(canvas.width, canvas.height) * 0.28;
    turkey = {
      x: (canvas.width - size) / 2,
      y: (canvas.height - size) / 2 + 20,
      w: size,
      h: size,
      hp: BASE_HITS + Math.floor(score / 800),
      maxHp: BASE_HITS + Math.floor(score / 800),
      hitFlash: 0,
      fallOffset: -80,
      fallSpeed: 4
    };
    playSound(gobbleSound);
  }

  function punch() {
    if (!running || paused || !turkey) return;
    const t = turkey;
    if (fist.x < t.x + t.w && fist.x + fist.w > t.x &&
        fist.y < t.y + t.h && fist.y + fist.h > t.y) {
      const now = Date.now();
      const delta = now - lastPunchTime;
      lastPunchTime = now;

      // Timing-based score (faster consecutive punches = more points), like original
      let points = 50;
      if (delta < 180) points = 120;
      else if (delta < 280) points = 90;
      else if (delta < 450) points = 70;
      if (combo > 1) points += combo * 8;

      score += points;
      combo = (delta < 600) ? combo + 1 : 1;
      if (combo > 1) comboEl.textContent = `COMBO x${combo}`;
      else comboEl.textContent = '';

      t.hp--;
      t.hitFlash = 10;
      shake = 12;
      playSound(punchSound);

      if (t.hp <= 0) {
        // Kill — spawn new turkey after short delay
        turkey = null;
        setTimeout(() => {
          if (running && !paused) spawnTurkey();
        }, 400);
      }
    }
  }

  function update() {
    if (!running || paused) return;
    if (turkey) {
      if (turkey.fallOffset < 0) {
        turkey.fallOffset += turkey.fallSpeed;
        turkey.y = (canvas.height - turkey.h) / 2 + 20 + turkey.fallOffset;
      }
      if (turkey.hitFlash > 0) turkey.hitFlash--;
    }
    if (shake > 0) shake *= 0.88;
    scoreEl.textContent = 'Score: ' + score;
  }

  function draw() {
    ctx.save();
    if (shake > 1) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    if (bgImg.complete) {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#1a0a00';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (turkey && turkeyImg.complete) {
      ctx.save();
      if (turkey.hitFlash > 0) ctx.globalAlpha = 0.45 + Math.random() * 0.4;
      ctx.drawImage(turkeyImg, turkey.x, turkey.y, turkey.w, turkey.h);
      // Simple HP bar
      if (turkey.maxHp > 1) {
        const pct = turkey.hp / turkey.maxHp;
        ctx.fillStyle = '#000';
        ctx.fillRect(turkey.x, turkey.y - 10, turkey.w, 6);
        ctx.fillStyle = pct > 0.4 ? '#0f0' : '#f40';
        ctx.fillRect(turkey.x, turkey.y - 10, turkey.w * pct, 6);
      }
      ctx.restore();
    }

    if (fistImg.complete) {
      ctx.drawImage(fistImg, fist.x, fist.y, fist.w, fist.h);
    } else {
      ctx.fillStyle = '#f80';
      ctx.fillRect(fist.x, fist.y, fist.w, fist.h);
    }

    ctx.restore();
  }

  function loop() {
    update();
    draw();
    if (running) animId = requestAnimationFrame(loop);
  }

  function startGame() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('high-score').style.display = 'none';
    canvas.style.display = 'block';
    hud.style.display = 'block';
    score = 0;
    combo = 0;
    lastPunchTime = 0;
    turkey = null;
    running = true;
    paused = false;
    spawnTurkey();
    // Music: only after user gesture (start button click)
    bgMusic.play().catch(() => {});
    animId = requestAnimationFrame(loop);
  }

  function pauseGame() {
    if (!running) return;
    paused = true;
    document.getElementById('pause-menu').style.display = 'flex';
    bgMusic.pause();
  }

  function resumeGame() {
    paused = false;
    document.getElementById('pause-menu').style.display = 'none';
    bgMusic.play().catch(() => {});
  }

  function returnToMenu() {
    running = false;
    paused = false;
    cancelAnimationFrame(animId);
    bgMusic.pause();
    canvas.style.display = 'none';
    hud.style.display = 'none';
    document.getElementById('pause-menu').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    if (score > 0) {
      highScores.push(score);
      highScores.sort((a, b) => b - a);
      highScores = highScores.slice(0, 8);
      localStorage.setItem('sttp4_scores', JSON.stringify(highScores));
    }
  }

  function showScores() {
    const list = document.getElementById('high-score-list');
    list.innerHTML = highScores.length
      ? highScores.map(s => `<li>${s}</li>`).join('')
      : '<li>No scores yet</li>';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('high-score').style.display = 'flex';
  }

  document.getElementById('start-btn').onclick = startGame;
  document.getElementById('scores-btn').onclick = showScores;
  document.getElementById('resume-btn').onclick = resumeGame;
  document.getElementById('menu-btn').onclick = returnToMenu;
  document.getElementById('back-btn').onclick = () => {
    document.getElementById('high-score').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === 'p') {
      if (running && !paused) pauseGame();
      else if (paused) resumeGame();
    }
  });

  // Welcome sound on first click anywhere
  document.body.addEventListener('click', () => playSound(welcomeSound), { once: true });
})();
