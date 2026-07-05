/**
 * ============================================
 * JINGYU · Game Design Portfolio
 * 增强粒子系统 / 3D 卡片追踪 / 滚动联动 / 入场动画
 * ============================================
 */

(function () {
  'use strict';

  // ── 工具函数 ──────────────────────────────
  var clamp = function (delta, threshold) {
    return delta >= 0 ? Math.min(delta, threshold) : Math.max(delta, -threshold);
  };

  var lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  // ── 增强粒子系统 ──────────────────────────
  var particles = [];

  function createParticles() {
    if (document.querySelector('.bg-particles')) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'bg-particles';
    canvas.style.cssText =
      'position:fixed;inset:0;z-index:-1;pointer-events:none;';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // 两层粒子：底层大而慢，顶层小而亮
    var count = 55;
    particles = [];
    for (var i = 0; i < count; i++) {
      var isDeep = i < 20;
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: isDeep ? Math.random() * 2 + 1 : Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.15,
        vy: isDeep ? -(Math.random() * 0.2 + 0.08) : -(Math.random() * 0.35 + 0.15),
        alpha: isDeep ? Math.random() * 0.08 + 0.03 : Math.random() * 0.2 + 0.08,
        color: isDeep ? '140,180,255' : (i % 3 === 0 ? '64,200,224' : '140,180,255')
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // 边界回绕
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.color + ',' + p.alpha + ')';
        ctx.fill();
      }
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ── 文章卡片 3D 效果 ─────────────────────
  var cardCenters = new WeakMap();

  function initPostCard3D() {
    var cards = document.querySelectorAll('.recent-post-item');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (cardCenters.has(card)) continue;
      var rect = card.getBoundingClientRect();
      cardCenters.set(card, {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      });
    }
  }

  document.addEventListener('mousemove', function (e) {
    var hoveredCards = document.querySelectorAll('.recent-post-item:hover');
    for (var i = 0; i < hoveredCards.length; i++) {
      var card = hoveredCards[i];
      var data = cardCenters.get(card);
      if (!data) {
        var rect = card.getBoundingClientRect();
        data = { centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2 };
        cardCenters.set(card, data);
      }

      var dx = clamp(e.clientX - data.centerX, 22);
      var dy = clamp(e.clientY - data.centerY, 16);

      card.style.transform =
        'perspective(600px) rotateY(' + (dx * 0.28) + 'deg) rotateX(' + (-dy * 0.2) + 'deg) translateY(-6px)';
      card.style.boxShadow =
        (-dx * 0.35) + 'px ' + (-dy * 0.35) + 'px 36px 0 rgba(0, 0, 20, 0.5), 0 0 44px rgba(91, 156, 245, 0.12)';

      var cover = card.querySelector('.post_cover img');
      if (cover) {
        cover.style.transform =
          'translate(' + (dx * 0.06) + 'px, ' + (dy * 0.05) + 'px) scale(1.08)';
      }
    }
  });

  document.addEventListener('mouseout', function (e) {
    var card = e.target.closest('.recent-post-item');
    if (!card || card.contains(e.relatedTarget)) return;

    card.style.transform = '';
    card.style.boxShadow = '';

    var cover = card.querySelector('.post_cover img');
    if (cover) {
      cover.style.transform = '';
      cover.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.5s ease';
    }
  });

  // ── 滚动联动：导航栏加深 ──────────────────
  var lastScrollY = 0;

  function onScroll() {
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    var nav = document.getElementById('nav');

    if (nav) {
      if (scrollY > 60) {
        if (!nav.classList.contains('scrolled')) {
          nav.classList.add('scrolled');
        }
      } else {
        if (nav.classList.contains('scrolled')) {
          nav.classList.remove('scrolled');
        }
      }
    }
    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ── IntersectionObserver：卡片入场动画 ─────
  function initCardEntry() {
    if (!('IntersectionObserver' in window)) return;

    var cards = document.querySelectorAll('.recent-post-item');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('card-visible');
          entry.target.classList.remove('card-entering');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      card.classList.add('card-entering');
      card.style.transitionDelay = (i * 0.06) + 's';
      observer.observe(card);
    }
  }

  // ── 初始化 ──────────────────────────────
  function init() {
    // 硬设背景图（绕过 CSS 冲突）
    var webBg = document.getElementById('web_bg');
    if (webBg) {
      webBg.style.setProperty('background-image', 'url(images/bg/cerydra.jpg)', 'important');
      webBg.style.setProperty('background-size', 'cover', 'important');
      webBg.style.setProperty('background-position', 'center', 'important');
      webBg.style.setProperty('background-attachment', 'fixed', 'important');
    }
    initPostCard3D();
    createParticles();
    initCardEntry();

    // resize 时更新卡片中心
    window.addEventListener('resize', function () {
      initPostCard3D();
    });

    // 初始触发滚动状态
    onScroll();
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 200);
    });
  } else {
    setTimeout(init, 200);
  }

  // Pjax 支持
  document.addEventListener('pjax:complete', function () {
    // 清理旧观察者
    particles = [];
    setTimeout(init, 300);
  });

})();
