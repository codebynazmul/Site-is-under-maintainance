/**
 * NAZMUL.DEV Next-Gen Maintenance Page
 * Fully self-contained Vanilla JavaScript
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. CONFIGURATION & STATE
  // =========================================================================
  const CONFIG = {
    countdownHours: 36,
    storageKeys: {
      theme: 'nazmul_dev_theme_preference',
      sound: 'nazmul_dev_sound_enabled',
      targetDate: 'nazmul_dev_maintenance_target',
      subscribers: 'nazmul_dev_subscribed_emails',
      highScore: 'nazmul_dev_game_high_score'
    },
    incidentId: 'NAZMUL-MAINT-2026'
  };

  const state = {
    theme: 'dark',
    soundEnabled: true,
    targetDate: null,
    audioCtx: null,
    game: {
      active: false,
      score: 0,
      highScore: 0,
      playerX: 260,
      playerSpeed: 7,
      lasers: [],
      obstacles: [],
      particles: [],
      keys: { left: false, right: false, shoot: false },
      lastShoot: 0,
      animationFrame: null,
      lastSpawn: 0
    }
  };

  // =========================================================================
  // 2. AUDIO SYNTHESIZER (Web Audio API - No External Files Needed)
  // =========================================================================
  function initAudio() {
    const savedSound = localStorage.getItem(CONFIG.storageKeys.sound);
    state.soundEnabled = savedSound !== null ? savedSound === 'true' : true;
    updateSoundUI();

    const soundBtn = document.getElementById('sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        localStorage.setItem(CONFIG.storageKeys.sound, state.soundEnabled.toString());
        updateSoundUI();
        if (state.soundEnabled) playSynthSound(600, 'sine', 0.08);
      });
    }
  }

  function updateSoundUI() {
    const onIcon = document.getElementById('sound-on-icon');
    const offIcon = document.getElementById('sound-off-icon');
    if (onIcon && offIcon) {
      if (state.soundEnabled) {
        onIcon.classList.remove('hidden');
        offIcon.classList.add('hidden');
      } else {
        onIcon.classList.add('hidden');
        offIcon.classList.remove('hidden');
      }
    }
  }

  function getAudioContext() {
    if (!state.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        state.audioCtx = new AudioContext();
      }
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    return state.audioCtx;
  }

  function playSynthSound(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio fallback
    }
  }

  function playLaserSound() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  function playExplosionSound() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  // =========================================================================
  // 3. THEME CONTROLLER
  // =========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem(CONFIG.storageKeys.theme);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    state.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(state.theme);

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(CONFIG.storageKeys.theme, state.theme);
        applyTheme(state.theme);
        playSynthSound(440, 'sine', 0.08);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      }
    }
  }

  // =========================================================================
  // 4. COUNTDOWN ENGINE
  // =========================================================================
  function initCountdown() {
    let savedTarget = localStorage.getItem(CONFIG.storageKeys.targetDate);
    
    if (savedTarget) {
      state.targetDate = new Date(savedTarget);
      if (state.targetDate.getTime() <= Date.now()) {
        state.targetDate = new Date(Date.now() + CONFIG.countdownHours * 3600 * 1000);
        localStorage.setItem(CONFIG.storageKeys.targetDate, state.targetDate.toISOString());
      }
    } else {
      state.targetDate = new Date(Date.now() + CONFIG.countdownHours * 3600 * 1000);
      localStorage.setItem(CONFIG.storageKeys.targetDate, state.targetDate.toISOString());
    }

    const targetDisplay = document.getElementById('target-date-display');
    if (targetDisplay) {
      targetDisplay.textContent = state.targetDate.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = state.targetDate.getTime() - now;

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (diff <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minutesEl) minutesEl.textContent = '00';
      if (secondsEl) secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  // =========================================================================
  // 5. INTERACTIVE BACKGROUND CANVAS
  // =========================================================================
  function initBackgroundCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const particleCount = Math.min(Math.floor((width * height) / 13000), 80);
    const mouse = { x: null, y: null, radius: 150 };

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 3.5;
            this.y -= (dy / dist) * force * 3.5;
          }
        }
      }

      draw() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(6, 182, 212, 0.65)' : 'rgba(99, 102, 241, 0.45)';
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const lineColor = isDark ? 'rgba(6, 182, 212,' : 'rgba(99, 102, 241,';

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < 135) {
            ctx.beginPath();
            ctx.strokeStyle = `${lineColor} ${0.22 * (1 - dist / 135)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    animate();
  }

  // =========================================================================
  // 6. TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#06b6d4" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  // =========================================================================
  // 7. CONFETTI BURST ANIMATION
  // =========================================================================
  function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#9333ea', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

    for (let i = 0; i < 95; i++) {
      pieces.push({
        x: canvas.width / 2,
        y: canvas.height * 0.65,
        w: Math.random() * 8 + 4,
        h: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 1) * 13 - 4,
        gravity: 0.35,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    const startTime = Date.now();

    function renderConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - startTime;

      let alive = false;
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - elapsed / 2500);

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      });

      if (alive) {
        requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    requestAnimationFrame(renderConfetti);
  }

  // =========================================================================
  // 8. SUBSCRIPTION FORM HANDLER
  // =========================================================================
  function initSubscriptionForm() {
    const form = document.getElementById('subscribe-form');
    const input = document.getElementById('email-input');
    const messageEl = document.getElementById('form-message');
    const submitBtn = document.getElementById('subscribe-btn');

    if (!form || !input) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = input.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        messageEl.className = 'form-feedback error';
        messageEl.textContent = 'Please enter a valid email address.';
        playSynthSound(220, 'square', 0.15);
        return;
      }

      let subscribers = [];
      try {
        subscribers = JSON.parse(localStorage.getItem(CONFIG.storageKeys.subscribers) || '[]');
      } catch (err) {
        subscribers = [];
      }

      if (subscribers.includes(email)) {
        messageEl.className = 'form-feedback error';
        messageEl.textContent = 'You are already registered for launch updates.';
        playSynthSound(300, 'triangle', 0.15);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Registering...';

      setTimeout(() => {
        subscribers.push(email);
        localStorage.setItem(CONFIG.storageKeys.subscribers, JSON.stringify(subscribers));

        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = 'Subscribed!';
        messageEl.className = 'form-feedback success';
        messageEl.textContent = "You're on the list! We'll alert you the moment NAZMUL.DEV is live.";
        input.value = '';

        triggerConfetti();
        playSynthSound(784, 'sine', 0.3);
        showToast('Subscribed successfully! Notification alert set.', 'success');
      }, 650);
    });
  }

  // =========================================================================
  // 9. TABS CONTROLLER
  // =========================================================================
  function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');

        tabBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanels.forEach((p) => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
        playSynthSound(520, 'sine', 0.06);
      });
    });
  }

  // =========================================================================
  // 10. DEVELOPER CLI TERMINAL WIDGET
  // =========================================================================
  function initTerminal() {
    const input = document.getElementById('terminal-input');
    const body = document.getElementById('terminal-body');
    if (!input || !body) return;

    const commands = {
      help: () => [
        'Available Commands:',
        '  status    - View live server & cluster status',
        '  about     - Learn about Md. Nazmul Hasan & NAZMUL.DEV',
        '  skills    - List tech stack & frameworks',
        '  ping      - Check live edge response latency',
        '  repo      - View official GitHub repository link',
        '  site      - Open the live portfolio homepage',
        '  clear     - Clear terminal screen'
      ],
      status: () => [
        'SYSTEM CLUSTER STATUS:',
        '  ● Edge Router:       [ONLINE] - 99.98% uptime',
        '  ● Database Cluster:  [MIGRATING] - v2 schema',
        '  ● Auth Gateway:      [ONLINE] - OAuth2 Vault',
        '  ● Core Architecture: [OPTIMIZING] - Phase 3/4'
      ],
      about: () => [
        'ABOUT NAZMUL.DEV:',
        '  Md. Nazmul Hasan is a Software Engineering Student & Full-Stack Developer.',
        '  Specializing in modern web systems, React, Next.js, and interactive applications.',
        '  Portfolio: https://dev-nazmul-dev.pantheonsite.io/'
      ],
      skills: () => [
        'CORE SKILLS & TECH STACK:',
        '  - Frontend: JavaScript, TypeScript, React, Next.js, Tailwind CSS',
        '  - Backend: Node.js, Python, C#, C++, SQL, MongoDB, Prisma',
        '  - Game Dev: Unity Engine (2D C# Scripts, Physics Colliders)',
        '  - Hosting & Cloud: Vercel, Firebase, Git, GitHub'
      ],
      ping: () => [
        `PING edge.nazmul.dev: 64 bytes - icmp_seq=1 time=${Math.floor(Math.random() * 12 + 18)}ms [Optimal]`
      ],
      repo: () => [
        'GitHub Repository: https://github.com/codebynazmul/Site-is-under-maintainance'
      ],
      site: () => [
        'Opening https://dev-nazmul-dev.pantheonsite.io/ ...'
      ]
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const rawCmd = input.value.trim();
        input.value = '';
        if (!rawCmd) return;

        printTerminalLine(`visitor@nazmul:~$ ${rawCmd}`, 'cmd-highlight');
        playSynthSound(650, 'sine', 0.05);

        const cmd = rawCmd.toLowerCase();

        if (cmd === 'clear') {
          body.innerHTML = '';
          return;
        }

        if (cmd === 'site') {
          window.open('https://dev-nazmul-dev.pantheonsite.io/', '_blank');
        }

        if (commands[cmd]) {
          const lines = commands[cmd]();
          lines.forEach((l) => printTerminalLine(l));
        } else {
          printTerminalLine(`command not found: '${rawCmd}'. Type 'help' for available commands.`, 'output-dim');
        }
      }
    });

    function printTerminalLine(text, customClass = '') {
      const line = document.createElement('div');
      line.className = `term-line ${customClass}`;
      line.textContent = text;
      body.appendChild(line);
      body.scrollTop = body.scrollHeight;
    }
  }

  // =========================================================================
  // 11. ENHANCED MINI GAME (QUANTUM DEFENDER with Lasers & Explosions)
  // =========================================================================
  function initMiniGame() {
    const canvas = document.getElementById('mini-game-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('game-start-btn');
    const overlay = document.getElementById('game-overlay');
    const overlayTitle = document.getElementById('game-overlay-title');
    const overlayMsg = document.getElementById('game-overlay-msg');
    const scoreDisplay = document.getElementById('game-score');
    const highScoreDisplay = document.getElementById('game-high-score');

    const touchLeft = document.getElementById('btn-left');
    const touchRight = document.getElementById('btn-right');
    const touchShoot = document.getElementById('btn-shoot');

    state.game.highScore = parseInt(localStorage.getItem(CONFIG.storageKeys.highScore) || '0', 10);
    if (highScoreDisplay) highScoreDisplay.textContent = state.game.highScore;

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.game.keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.game.keys.right = true;
      }
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        shootLaser();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.game.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.game.keys.right = false;
      }
    });

    if (touchLeft && touchRight && touchShoot) {
      touchLeft.addEventListener('touchstart', (e) => { e.preventDefault(); state.game.keys.left = true; });
      touchLeft.addEventListener('touchend', (e) => { e.preventDefault(); state.game.keys.left = false; });
      touchRight.addEventListener('touchstart', (e) => { e.preventDefault(); state.game.keys.right = true; });
      touchRight.addEventListener('touchend', (e) => { e.preventDefault(); state.game.keys.right = false; });
      touchShoot.addEventListener('touchstart', (e) => { e.preventDefault(); shootLaser(); });

      touchLeft.addEventListener('mousedown', () => { state.game.keys.left = true; });
      touchLeft.addEventListener('mouseup', () => { state.game.keys.left = false; });
      touchRight.addEventListener('mousedown', () => { state.game.keys.right = true; });
      touchRight.addEventListener('mouseup', () => { state.game.keys.right = false; });
      touchShoot.addEventListener('click', () => { shootLaser(); });
    }

    function shootLaser() {
      if (!state.game.active) return;
      const now = Date.now();
      if (now - state.game.lastShoot < 180) return;
      state.game.lastShoot = now;

      state.game.lasers.push({
        x: state.game.playerX,
        y: canvas.height - 40,
        speed: 9
      });
      playLaserSound();
    }

    startBtn.addEventListener('click', startGame);

    function startGame() {
      state.game.active = true;
      state.game.score = 0;
      state.game.playerX = canvas.width / 2;
      state.game.lasers = [];
      state.game.obstacles = [];
      state.game.particles = [];
      state.game.lastSpawn = Date.now();
      overlay.style.display = 'none';

      if (scoreDisplay) scoreDisplay.textContent = '0';
      playSynthSound(587, 'sine', 0.2);
      gameLoop();
    }

    function createExplosion(x, y, color) {
      for (let i = 0; i < 14; i++) {
        state.game.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          radius: Math.random() * 3 + 1,
          color,
          alpha: 1
        });
      }
      playExplosionSound();
    }

    function endGame() {
      state.game.active = false;
      cancelAnimationFrame(state.game.animationFrame);

      if (state.game.score > state.game.highScore) {
        state.game.highScore = state.game.score;
        localStorage.setItem(CONFIG.storageKeys.highScore, state.game.highScore.toString());
        if (highScoreDisplay) highScoreDisplay.textContent = state.game.highScore;
        overlayTitle.textContent = '🎉 New High Score!';
      } else {
        overlayTitle.textContent = 'System Overload!';
      }

      overlayMsg.textContent = `You defended with a final score of ${state.game.score} points.`;
      startBtn.textContent = 'Play Again';
      overlay.style.display = 'flex';
      playSynthSound(150, 'sawtooth', 0.35);
    }

    function gameLoop() {
      if (!state.game.active) return;

      if (state.game.keys.left && state.game.playerX > 20) {
        state.game.playerX -= state.game.playerSpeed;
      }
      if (state.game.keys.right && state.game.playerX < canvas.width - 20) {
        state.game.playerX += state.game.playerSpeed;
      }

      const now = Date.now();
      const spawnRate = Math.max(300, 850 - state.game.score * 8);
      if (now - state.game.lastSpawn > spawnRate) {
        state.game.obstacles.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -15,
          radius: Math.random() * 8 + 10,
          speed: Math.random() * 1.8 + 2.2 + state.game.score * 0.04,
          color: Math.random() > 0.5 ? '#ec4899' : '#06b6d4'
        });
        state.game.lastSpawn = now;
      }

      ctx.fillStyle = '#040711';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let l = state.game.lasers.length - 1; l >= 0; l--) {
        const laser = state.game.lasers[l];
        laser.y -= laser.speed;

        ctx.save();
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.fillRect(laser.x - 2, laser.y, 4, 12);
        ctx.restore();

        if (laser.y < -15) {
          state.game.lasers.splice(l, 1);
        }
      }

      const px = state.game.playerX;
      const py = canvas.height - 30;

      ctx.save();
      ctx.fillStyle = '#9333ea';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(px, py - 14);
      ctx.lineTo(px - 14, py + 12);
      ctx.lineTo(px + 14, py + 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(px - 5, py + 13);
      ctx.lineTo(px, py + 22 + Math.random() * 6);
      ctx.lineTo(px + 5, py + 13);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      for (let i = state.game.obstacles.length - 1; i >= 0; i--) {
        const obs = state.game.obstacles[i];
        obs.y += obs.speed;

        ctx.save();
        ctx.fillStyle = obs.color;
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        for (let l = state.game.lasers.length - 1; l >= 0; l--) {
          const laser = state.game.lasers[l];
          const distLaser = Math.hypot(obs.x - laser.x, obs.y - laser.y);
          if (distLaser < obs.radius + 6) {
            createExplosion(obs.x, obs.y, obs.color);
            state.game.obstacles.splice(i, 1);
            state.game.lasers.splice(l, 1);
            state.game.score += 2;
            if (scoreDisplay) scoreDisplay.textContent = state.game.score;
            break;
          }
        }

        if (state.game.obstacles[i]) {
          const distPlayer = Math.hypot(obs.x - px, obs.y - py);
          if (distPlayer < obs.radius + 12) {
            createExplosion(px, py, '#ec4899');
            endGame();
            return;
          }

          if (obs.y > canvas.height + 25) {
            state.game.obstacles.splice(i, 1);
            state.game.score += 1;
            if (scoreDisplay) scoreDisplay.textContent = state.game.score;
          }
        }
      }

      for (let p = state.game.particles.length - 1; p >= 0; p--) {
        const part = state.game.particles[p];
        part.x += part.vx;
        part.y += part.vy;
        part.alpha -= 0.035;

        if (part.alpha <= 0) {
          state.game.particles.splice(p, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = part.alpha;
          ctx.fillStyle = part.color;
          ctx.beginPath();
          ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      state.game.animationFrame = requestAnimationFrame(gameLoop);
    }
  }

  // =========================================================================
  // 12. INCIDENT REFERENCE & COPY TO CLIPBOARD
  // =========================================================================
  function initIncidentCopy() {
    const copyBtn = document.getElementById('copy-ref-btn');
    const incidentCode = document.getElementById('incident-id');

    if (copyBtn && incidentCode) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(incidentCode.textContent.trim());
          showToast('Incident Reference ID copied to clipboard.', 'success');
          playSynthSound(680, 'sine', 0.08);
        } catch (err) {
          const tempInput = document.createElement('input');
          tempInput.value = incidentCode.textContent.trim();
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          showToast('Incident Reference ID copied.', 'success');
        }
      });
    }
  }

  // =========================================================================
  // 13. FOOTER
  // =========================================================================
  function initFooter() {
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear().toString();
    }
  }

  // =========================================================================
  // 14. INITIALIZE ALL ENGINES
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    initTheme();
    initCountdown();
    initBackgroundCanvas();
    initSubscriptionForm();
    initTabs();
    initTerminal();
    initMiniGame();
    initIncidentCopy();
    initFooter();
  });
})();