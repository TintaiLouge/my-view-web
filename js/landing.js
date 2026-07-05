/**
 * ============================================
 * JINGYU · Landing Overlay
 * 悬浮卡片开屏逻辑 / 3D 鼠标追踪 / sessionStorage
 * ============================================
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'jingyu_entered';

  // ── 已进入过 → 跳过 ───────────────────────
  if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
    document.documentElement.classList.remove('landing-locked');
    return;
  }

  // 仅首页显示开屏
  var isHome = (function () {
    try {
      if (typeof GLOBAL_CONFIG_SITE !== 'undefined' &&
          GLOBAL_CONFIG_SITE.pageType === 'home') return true;
    } catch(e) {}
    return document.body.classList.contains('home') ||
           document.querySelector('.recent-posts') ||
           (window.location.pathname === '/' ||
            window.location.pathname.replace(/\/$/, '') === '');
  })();

  if (!isHome) {
    document.documentElement.classList.remove('landing-locked');
    return;
  }

  // ── 卡片数据 ──────────────────────────────
  var cardData = [
    { title: 'Level Design', subtitle: '关卡设计', img: '/images/illustrations/card-1.jpg' },
    { title: 'System Design', subtitle: '系统架构', img: '/images/illustrations/card-2.jpg' },
    { title: 'Narrative', subtitle: '叙事体验', img: '/images/illustrations/card-3.jpg' },
    { title: 'Tools & Craft', subtitle: '设计工具', img: '/images/illustrations/card-4.jpg' },
    { title: 'Portfolio', subtitle: '作品集', img: '/images/illustrations/card-5.jpg' },
  ];

  // ── 工具 ──────────────────────────────────
  var clamp = function (v, max) {
    return Math.max(-max, Math.min(max, v));
  };

  // ── 构建浮层 ──────────────────────────────
  function createOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'landing-overlay';

    // 粒子画布
    var canvas = document.createElement('canvas');
    canvas.id = 'landing-particles';
    overlay.appendChild(canvas);

    // 3D 舞台
    var stage = document.createElement('div');
    stage.className = 'landing-stage';

    for (var i = 0; i < cardData.length; i++) {
      var card = document.createElement('div');
      card.className = 'landing-card';
      card.style.setProperty('--float-delay', (i * 0.85) + 's');

      var img = document.createElement('img');
      img.className = 'landing-card-img';
      img.src = cardData[i].img;
      img.alt = cardData[i].title;
      img.loading = 'eager';
      card.appendChild(img);

      var info = document.createElement('div');
      info.className = 'landing-card-info';
      info.innerHTML =
        '<div class="landing-card-title">' + cardData[i].title + '</div>' +
        '<div class="landing-card-subtitle">' + cardData[i].subtitle + '</div>';
      card.appendChild(info);

      card.addEventListener('click', function () {
        enterSite(overlay);
      });

      stage.appendChild(card);
    }
    overlay.appendChild(stage);

    // CTA 提示
    var cta = document.createElement('div');
    cta.className = 'landing-cta';
    cta.innerHTML =
      '<span class="landing-cta-text">点击卡片进入</span>' +
      '<span class="landing-cta-arrow">⌄</span>';
    cta.addEventListener('click', function () {
      enterSite(overlay);
    });
    overlay.appendChild(cta);

    document.body.appendChild(overlay);

    // 启动粒子
    initParticles(canvas);

    // 启动 3D 鼠标追踪
    initStage3D(stage);

    // 键盘也可进入
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.removeEventListener('keydown', onKey);
        enterSite(overlay);
      }
    });
  }

  // ── 粒子画布 ──────────────────────────────
  function initParticles(canvas) {
    var ctx = canvas.getContext('2d');
    var w, h;
    var pts = [];
    var count = 40;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.4 + 0.15),
        a: Math.random() * 0.2 + 0.05,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(140,180,255,' + p.a + ')';
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── 3D 鼠标追踪 ────────────────────────────
  function initStage3D(stage) {
    document.addEventListener('mousemove', function (e) {
      var cx = window.innerWidth / 2;
      var cy = window.innerHeight / 2;
      var dx = clamp((e.clientX - cx) / cx, 1) * 5;
      var dy = clamp((e.clientY - cy) / cy, 1) * 4;
      stage.style.transform =
        'rotateY(' + dx + 'deg) rotateX(' + (-dy) + 'deg)';
    });
  }

  // ── 进入站点 ──────────────────────────────
  function enterSite(overlay) {
    if (overlay.classList.contains('landing-exit')) return;
    overlay.classList.add('landing-exit');

    // 动画完成后清理
    setTimeout(function () {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      document.documentElement.classList.remove('landing-locked');
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 800);
  }

  // ── 启动 ──────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createOverlay);
  } else {
    createOverlay();
  }

})();
