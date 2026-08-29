/**
 * NAZMUL.DEV System Maintenance Application
 * Fully self-contained Vanilla JavaScript
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. CONFIGURATION & STATE
  // =========================================================================
  const CONFIG = {
    // Default countdown duration: 36 hours from visit
    countdownHours: 36,
    storageKeys: {
      theme: 'nazmul_dev_theme_preference',
      targetDate: 'nazmul_dev_maintenance_target',
      subscribers: 'nazmul_dev_subscribed_emails',
      highScore: 'nazmul_dev_game_high_score'
    },
    incidentId: 'NAZMUL-MAINT-2026'
  };

  // State
  let state = {
    theme: 'dark',
    targetDate: null,
    game: {
      active: false,
      score: 0,
      highScore: 0,
      playerX: 240,
      playerSpeed: 7,
      obstacles: [],
      keys: { left: false, right: false },
      animationFrame: null,
      lastSpawn: 0
    }
  };

  // =========================================================================
  // 2. THEME CONTROLLER
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
  // 3. COUNTDOWN ENGINE
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
  // 4. INTERACTIVE BACKGROUND CANVAS (PARTICLE NETWORK)
  // =========================================================================
  function initBackgroundCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const particleCount = Math.min(Math.floor((width * height) / 14000), 75);
    const mouse = { x: null, y: null, radius: 140 };

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
            this.x -= (dx / dist) * force * 3;
            this.y -= (dy / dist) * force * 3;
          }
        }
      }

      draw() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(6, 182, 212, 0.6)' : 'rgba(99, 102, 241, 0.4)';
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

          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `${lineColor} ${0.2 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.75;
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
  // 5. TOAST NOTIFICATIONS
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
  // 6. CONFETTI BURST ANIMATION
  // =========================================================================
  function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#9333ea', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#38bdf8'];

    for (let i = 0; i < 90; i++) {
      pieces.push({
        x: canvas.width / 2,
        y: canvas.height * 0.65,
        w: Math.random() * 8 + 4,
        h: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 1) * 12 - 4,
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
  // 7. SUBSCRIPTION FORM HANDLER
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
        showToast('Subscribed successfully! Notification alert set.', 'success');
      }, 700);
    });
  }

  // =========================================================================
  // 8. TABS CONTROLLER
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
      });
    });
  }

  // =========================================================================
  // 9. INTERACTIVE MINI GAME (SPACE DODGER)
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

    state.game.highScore = parseInt(localStorage.getItem(CONFIG.storageKeys.highScore) || '0', 10);
    if (highScoreDisplay) highScoreDisplay.textContent = state.game.highScore;

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.game.keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.game.keys.right = true;
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

    if (touchLeft && touchRight) {
      touchLeft.addEventListener('touchstart', (e) => { e.preventDefault(); state.game.keys.left = true; });
      touchLeft.addEventListener('touchend', (e) => { e.preventDefault(); state.game.keys.left = false; });
      touchRight.addEventListener('touchstart', (e) => { e.preventDefault(); state.game.keys.right = true; });
      touchRight.addEventListener('touchend', (e) => { e.preventDefault(); state.game.keys.right = false; });

      touchLeft.addEventListener('mousedown', () => { state.game.keys.left = true; });
      touchLeft.addEventListener('mouseup', () => { state.game.keys.left = false; });
      touchRight.addEventListener('mousedown', () => { state.game.keys.right = true; });
      touchRight.addEventListener('mouseup', () => { state.game.keys.right = false; });
    }

    startBtn.addEventListener('click', startGame);

    function startGame() {
      state.game.active = true;
      state.game.score = 0;
      state.game.playerX = canvas.width / 2;
      state.game.obstacles = [];
      state.game.lastSpawn = Date.now();
      overlay.style.display = 'none';

      if (scoreDisplay) scoreDisplay.textContent = '0';
      gameLoop();
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
        overlayTitle.textContent = 'Collision Detected!';
      }

      overlayMsg.textContent = `You survived with a final score of ${state.game.score} points.`;
      startBtn.textContent = 'Play Again';
      overlay.style.display = 'flex';
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
      const spawnRate = Math.max(350, 900 - state.game.score * 8);
      if (now - state.game.lastSpawn > spawnRate) {
        state.game.obstacles.push({
          x: Math.random() * (canvas.width - 30) + 15,
          y: -15,
          radius: Math.random() * 8 + 8,
          speed: Math.random() * 2 + 2.5 + state.game.score * 0.05,
          color: Math.random() > 0.5 ? '#06b6d4' : '#9333ea'
        });
        state.game.lastSpawn = now;
      }

      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      const px = state.game.playerX;
      const py = canvas.height - 30;

      ctx.save();
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(px, py - 14);
      ctx.lineTo(px - 14, py + 12);
      ctx.lineTo(px + 14, py + 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.moveTo(px - 6, py + 13);
      ctx.lineTo(px, py + 22 + (Math.random() * 6));
      ctx.lineTo(px + 6, py + 13);
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

        const dx = obs.x - px;
        const dy = obs.y - py;
        const dist = Math.hypot(dx, dy);

        if (dist < obs.radius + 12) {
          endGame();
          return;
        }

        if (obs.y > canvas.height + 20) {
          state.game.obstacles.splice(i, 1);
          state.game.score += 1;
          if (scoreDisplay) scoreDisplay.textContent = state.game.score;
        }
      }

      state.game.animationFrame = requestAnimationFrame(gameLoop);
    }
  }

  // =========================================================================
  // 10. INCIDENT REFERENCE & COPY TO CLIPBOARD
  // =========================================================================
  function initIncidentCopy() {
    const copyBtn = document.getElementById('copy-ref-btn');
    const incidentCode = document.getElementById('incident-id');

    if (copyBtn && incidentCode) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(incidentCode.textContent.trim());
          showToast('Incident Reference ID copied to clipboard.', 'success');
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
  // 11. FOOTER & MISC
  // =========================================================================
  function initFooter() {
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear().toString();
    }
  }

  // =========================================================================
  // 12. INITIALIZATION ON DOM READY
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initCountdown();
    initBackgroundCanvas();
    initSubscriptionForm();
    initTabs();
    initMiniGame();
    initIncidentCopy();
    initFooter();
  });
})();