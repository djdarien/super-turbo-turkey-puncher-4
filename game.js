(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const hud = document.getElementById('hud');
  const scoreEl = document.getElementById('score-display');
  const comboEl = document.getElementById('combo-display');
  const levelEl = document.getElementById('level-display');

  // Assets
  const turkeyImg = new Image(); turkeyImg.src = 'turkey.png';
  const fistImg = new Image(); fistImg.src = 'fist.png';
  const bgImg = new Image(); bgImg.src = 'background.png';
  const powerImgs = {
    extraPoints: Object.assign(new Image(), {src: 'extrapoints.png'}),
    slowTime: Object.assign(new Image(), {src: 'slowtime.png'}),
    fastTime: Object.assign(new Image(), {src: 'fasttime.png'})
  };

  // Audio (graceful fail)
  const sounds = {
    gobble: new Audio('gobble.mp3'),
    punch: new Audio('punch.mp3'),
    welcome: new Audio('welcome_message.mp3'),
    bg: Object.assign(new Audio('background_music.mp3'), {loop: true, volume: 0.4}),
    spawn: new Audio('powerup_spawn.mp3'),
    pickup: new Audio('powerup_pickup.mp3')
  };
  Object.values(sounds).forEach(a => { a.preload = 'auto'; a.volume = a.volume || 0.6; });

  // State
  let turkeys = [];
  let powerUps = [];
  let particles = [];
  let score = 0;
  let combo = 0;
  let comboTimer = 0;
  let level = 1;
  let gameSpeed = 1;
  let speedTimer = 0;
  let shake = 0;
  let running = false;
  let paused = false;
  let fist = {x: 0, y: 0, w: 48, h: 48};
  let highScores = JSON.parse(localStorage.getItem('sttp4_scores') || '[]');
  let lastSpawn = 0;
  let powerSpawnTimer = 0;
  let animId = 0;

  const COMBO_MS = 2500;
  const POWER_TYPES = ['extraPoints', 'slowTime', 'fastTime'];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Input
  function updateFist(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    fist.x = clientX - r.left - fist.w / 2;
    fist.y = clientY - r.top - fist.h / 2;
  }
  canvas.addEventListener('mousemove', e => updateFist(e.clientX, e.clientY));
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches[0]) updateFist(e.touches[0].clientX, e.touches[0].clientY);
  }, {passive: false});
  canvas.addEventListener('click', punch);
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches[0]) {
      updateFist(e.touches[0].clientX, e.touches[0].clientY);
      punch();
    }
  }, {passive: false});

  function play(s) {
    try {
      const a = sounds[s];
      if (a) { a.currentTime = 0; a.play().catch(() => {}); }
    } catch (_) {}
  }

  function spawnTurkey(force = false) {
    const maxTurkeys = Math.min(1 + Math.floor(level / 2), 6);
    if (!force && turkeys.length >= maxTurkeys) return;
    const size = 56 + Math.random() * 16;
    const speed = (1.2 + level * 0.15) * (0.8 + Math.random() * 0.4);
    turkeys.push({
      x: Math.random() * (canvas.width - size),
      y: Math.random() * (canvas.height - size),
      w: size, h: size,
      dx: (Math.random() < 0.5 ? -1 : 1) * speed,
      dy: (Math.random() < 0.5 ? -1 : 1) * speed,
      hp: 1 + Math.floor((level - 1) / 3),
      maxHp: 1 + Math.floor((level - 1) / 3),
      hitFlash: 0
    });
    play('gobble');
  }

  function spawnPower() {
    const t = POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)];
    powerUps.push({
      type: t,
      x: 40 + Math.random() * (canvas.width - 80),
      y: 40 + Math.random() * (canvas.height - 80),
      w: 36, h: 36,
      life: 8 + Math.random() * 4
    });
    play('spawn');
  }

  function spawnParticles(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        life: 0.6 + Math.random() * 0.4,
        color: `hsl(${30 + Math.random() * 20}, 80%, ${50 + Math.random() * 30}%)`
      });
    }
  }

  function punch() {
    if (!running || paused) return;
    let hit = false;
    for (let i = turkeys.length - 1; i >= 0; i--) {
      const t = turkeys[i];
      if (fist.x < t.x + t.w && fist.x + fist.w > t.x &&
          fist.y < t.y + t.h && fist.y + fist.h > t.y) {
        t.hp--;
        t.hitFlash = 8;
        hit = true;
        play('punch');
        shake = 8;
        spawnParticles(t.x + t.w / 2, t.y + t.h / 2, 8);
        if (t.hp <= 0) {
          score += 100 + combo * 15;
          combo++;
          comboTimer = COMBO_MS;
          turkeys.splice(i, 1);
          spawnParticles(t.x + t.w / 2, t.y + t.h / 2, 18);
          if (turkeys.length < Math.min(1 + Math.floor(level / 2), 6)) {
            setTimeout(() => spawnTurkey(true), 200 + Math.random() * 300);
          }
        }
        break;
      }
    }
    // Powerups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      if (fist.x < p.x + p.w && fist.x + fist.w > p.x &&
          fist.y < p.y + p.h && fist.y + fist.h > p.y) {
        powerUps.splice(i, 1);
        play('pickup');
        applyPower(p.type);
      }
    }
  }

  function applyPower(type) {
    if (type === 'extraPoints') {
      score += 400 + level * 50;
      spawnParticles(fist.x, fist.y, 20);
    } else if (type === 'slowTime') {
      gameSpeed = 0.45;
      speedTimer = 5000;
    } else if (type === 'fastTime') {
      gameSpeed = 1.6;
      speedTimer = 4000;
    }
  }

  function update(dt) {
    if (!running || paused) return;

    // Level up
    const nextLevel = 1 + Math.floor(score / 1500);
    if (nextLevel > level) {
      level = nextLevel;
      levelEl.textContent = 'Level ' + level;
      for (let i = 0; i < 2; i++) spawnTurkey(true);
    }

    // Combo decay
    if (combo > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) combo = 0;
    }

    // Speed effect
    if (speedTimer > 0) {
      speedTimer -= dt;
      if (speedTimer <= 0) gameSpeed = 1;
    }

    // Turkeys
    turkeys.forEach(t => {
      t.x += t.dx * gameSpeed * (dt / 16);
      t.y += t.dy * gameSpeed * (dt / 16);
      if (t.x <= 0 || t.x + t.w >= canvas.width) t.dx *= -1;
      if (t.y <= 0 || t.y + t.h >= canvas.height) t.dy *= -1;
      t.x = Math.max(0, Math.min(canvas.width - t.w, t.x));
      t.y = Math.max(0, Math.min(canvas.height - t.h, t.y));
      if (t.hitFlash > 0) t.hitFlash--;
    });

    // Powerups lifetime
    for (let i = powerUps.length - 1; i >= 0; i--) {
      powerUps[i].life -= dt / 1000;
      if (powerUps[i].life <= 0) powerUps.splice(i, 1);
    }
    powerSpawnTimer -= dt;
    if (powerSpawnTimer <= 0) {
      if (powerUps.length < 2) spawnPower();
      powerSpawnTimer = 6000 + Math.random() * 8000;
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= dt / 1000;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (shake > 0) shake *= 0.85;

    // HUD
    scoreEl.textContent = 'Score: ' + score;
    comboEl.textContent = combo > 1 ? `COMBO x${combo}` : '';
  }

  function draw() {
    ctx.save();
    if (shake > 0.5) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    // BG
    if (bgImg.complete) {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#1a0a00';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Turkeys
    turkeys.forEach(t => {
      ctx.save();
      if (t.hitFlash > 0) ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      if (turkeyImg.complete) {
        ctx.drawImage(turkeyImg, t.x, t.y, t.w, t.h);
      } else {
        ctx.fillStyle = '#c60';
        ctx.fillRect(t.x, t.y, t.w, t.h);
      }
      // HP bar if >1
      if (t.maxHp > 1) {
        const pct = t.hp / t.maxHp;
        ctx.fillStyle = '#000';
        ctx.fillRect(t.x, t.y - 8, t.w, 5);
        ctx.fillStyle = pct > 0.5 ? '#0f0' : '#f00';
        ctx.fillRect(t.x, t.y - 8, t.w * pct, 5);
      }
      ctx.restore();
    });

    // Powerups
    powerUps.forEach(p => {
      const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.12;
      const s = p.w * pulse;
      const img = powerImgs[p.type];
      if (img && img.complete) {
        ctx.drawImage(img, p.x - (s - p.w) / 2, p.y - (s - p.h) / 2, s, s);
      } else {
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h / 2, s / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Particles
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Fist
    if (fistImg.complete) {
      ctx.drawImage(fistImg, fist.x, fist.y, fist.w, fist.h);
    } else {
      ctx.fillStyle = '#f80';
      ctx.fillRect(fist.x, fist.y, fist.w, fist.h);
    }

    // Speed indicator
    if (gameSpeed !== 1) {
      ctx.fillStyle = gameSpeed > 1 ? '#ff0' : '#0ff';
      ctx.font = '16px "Press Start 2P"';
      ctx.fillText(gameSpeed > 1 ? 'FAST!' : 'SLOW', canvas.width - 100, 30);
    }

    ctx.restore();
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(now - last, 50);
    last = now;
    update(dt);
    draw();
    if (running) animId = requestAnimationFrame(loop);
  }

  function startGame() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('high-score').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    canvas.style.display = 'block';
    hud.style.display = 'block';
    turkeys = [];
    powerUps = [];
    particles = [];
    score = 0;
    combo = 0;
    level = 1;
    gameSpeed = 1;
    speedTimer = 0;
    powerSpawnTimer = 4000;
    running = true;
    paused = false;
    levelEl.textContent = 'Level 1';
    spawnTurkey(true);
    play('bg');
    last = performance.now();
    animId = requestAnimationFrame(loop);
  }

  function pauseGame() {
    if (!running) return;
    paused = true;
    document.getElementById('pause-menu').style.display = 'flex';
    sounds.bg.pause();
  }

  function resumeGame() {
    paused = false;
    document.getElementById('pause-menu').style.display = 'none';
    sounds.bg.play().catch(() => {});
    last = performance.now();
  }

  function returnToMenu() {
    running = false;
    paused = false;
    cancelAnimationFrame(animId);
    sounds.bg.pause();
    canvas.style.display = 'none';
    hud.style.display = 'none';
    document.getElementById('pause-menu').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    if (score > 0) saveScore(score);
  }

  function saveScore(s) {
    highScores.push(s);
    highScores.sort((a, b) => b - a);
    highScores = highScores.slice(0, 8);
    localStorage.setItem('sttp4_scores', JSON.stringify(highScores));
  }

  function showScores() {
    const list = document.getElementById('high-score-list');
    list.innerHTML = highScores.length
      ? highScores.map(s => `<li>${s}</li>`).join('')
      : '<li>No scores yet</li>';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('high-score').style.display = 'flex';
  }

  // Buttons
  document.getElementById('start-btn').onclick = startGame;
  document.getElementById('scores-btn').onclick = showScores;
  document.getElementById('resume-btn').onclick = resumeGame;
  document.getElementById('menu-btn').onclick = returnToMenu;
  document.getElementById('back-btn').onclick = () => {
    document.getElementById('high-score').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
  };
  document.getElementById('restart-btn').onclick = startGame;
  document.getElementById('menu-btn2').onclick = returnToMenu;

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === 'p') {
      if (running && !paused) pauseGame();
      else if (paused) resumeGame();
    }
    if (e.key === 'Enter' && running) returnToMenu();
  });

  // Welcome on first interaction
  document.body.addEventListener('click', () => play('welcome'), {once: true});
})();
