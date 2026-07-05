/**
 * ============================================
 * JINGYU · Game Design Portfolio
 * 3D 透视卡片 / 鼠标追踪 / 粒子背景
 * ============================================
 */

(function () {
  'use strict';

  // ── 工具函数 ──────────────────────────────
  const clamp = (delta, threshold) =>
    delta >= 0 ? Math.min(delta, threshold) : Math.max(delta, -threshold);

  const lerp = (a, b, t) => a + (b - a) * t;

  // ── Hero 3D 卡片 ──────────────────────────
  function createHeroCard() {
    // 只在首页创建
    if (document.querySelector('.hero-card-stage')) return;

    var pageHeader = document.querySelector('#page-header');
    var contentInner = document.querySelector('#content-inner');
    if (!pageHeader || !contentInner) return;

    var stage = document.createElement('div');
    stage.className = 'hero-card-stage';
    stage.innerHTML =
      '<div class="hero-card-wrapper">' +
      '  <div class="hero-card-inner">' +
      '    <div class="hero-card-image">' +
      '      <img src="data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="760" viewBox="0 0 400 760">' +
        '<defs>' +
        '<linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">' +
        '<stop offset="0%" stop-color="#1a2a4a"/>' +
        '<stop offset="100%" stop-color="#0a1628"/>' +
        '</linearGradient>' +
        '<linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">' +
        '<stop offset="0%" stop-color="#6ea8fe"/>' +
        '<stop offset="100%" stop-color="#8ec5ff"/>' +
        '</linearGradient>' +
        '</defs>' +
        '<rect width="400" height="760" fill="url(#g)"/>' +
        '<!-- 装饰圆 -->' +
        '<circle cx="200" cy="340" r="100" fill="none" stroke="rgba(110,168,254,0.08)" stroke-width="1"/>' +
        '<circle cx="200" cy="340" r="140" fill="none" stroke="rgba(110,168,254,0.04)" stroke-width="1"/>' +
        '<circle cx="200" cy="340" r="60" fill="none" stroke="rgba(110,168,254,0.12)" stroke-width="2"/>' +
        '<!-- 六边形 -->' +
        '<polygon points="200,290 235,310 235,350 200,370 165,350 165,310" fill="none" stroke="rgba(110,168,254,0.2)" stroke-width="1.5"/>' +
        '<!-- 中心图标: 菱形 -->' +
        '<polygon points="200,310 225,340 200,370 175,340" fill="rgba(110,168,254,0.1)" stroke="rgba(110,168,254,0.3)" stroke-width="1.5"/>' +
        '<!-- 网格线 -->' +
        '<line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>' +
        '<line x1="0" y1="340" x2="400" y2="340" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>' +
        '<line x1="0" y1="480" x2="400" y2="480" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>' +
        '<line x1="100" y1="0" x2="100" y2="760" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>' +
        '<line x1="200" y1="0" x2="200" y2="760" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>' +
        '<line x1="300" y1="0" x2="300" y2="760" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>' +
        '<!-- 底部 V 形 -->' +
        '<polyline points="150,620 200,600 250,620" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>' +
        '<!-- 点阵 -->' +
        '<circle cx="140" cy="420" r="1.5" fill="rgba(255,255,255,0.15)"/>' +
        '<circle cx="260" cy="420" r="1.5" fill="rgba(255,255,255,0.15)"/>' +
        '<circle cx="170" cy="440" r="1" fill="rgba(255,255,255,0.1)"/>' +
        '<circle cx="230" cy="440" r="1" fill="rgba(255,255,255,0.1)"/>' +
        '<circle cx="200" cy="460" r="1.5" fill="rgba(255,255,255,0.12)"/>' +
        '</svg>'
      ) + '" alt="" width="400" height="760">' +
      '    </div>' +
      '    <div class="hero-card-dots"></div>' +
      '    <div class="hero-card-meta">' +
      '      <div class="hero-card-title">JINGYU</div>' +
      '      <div class="hero-card-subtitle">GAME DESIGN PORTFOLIO</div>' +
      '    </div>' +
      '    <div class="hero-card-badge">PORTFOLIO</div>' +
      '  </div>' +
      '</div>';

    // 插入到 header 和 content 之间
    pageHeader.parentNode.insertBefore(stage, contentInner);
    return stage;
  }

  // ── 3D 透视效果 ────────────────────────────
  var heroCardData = null;

  function initHeroCard3D() {
    var wrapper = document.querySelector('.hero-card-wrapper');
    var inner = document.querySelector('.hero-card-inner');
    if (!wrapper || !inner) return;

    function updateCenter() {
      var rect = wrapper.getBoundingClientRect();
      heroCardData = {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      };
    }

    updateCenter();
    window.addEventListener('resize', updateCenter);

    // 鼠标移动
    wrapper.addEventListener('mousemove', function (e) {
      if (!heroCardData) return;
      var dx = clamp(e.clientX - heroCardData.centerX, 25);
      var dy = clamp(e.clientY - heroCardData.centerY, 20);
      var brightness = 1 - clamp(e.clientY - heroCardData.centerY, 0) / 20 * 0.06;

      inner.style.transform =
        'perspective(800px) rotateY(' + (dx * 0.4) + 'deg) rotateX(' + (-dy * 0.25) + 'deg)';
      inner.style.boxShadow =
        (-dx * 0.4) + 'px ' + (-dy * 0.4) + 'px 30px 0 rgba(0, 0, 30, 0.4)';
      inner.style.filter = 'brightness(' + brightness + ')';

      // 图片视差
      var img = inner.querySelector('.hero-card-image img');
      if (img) {
        img.style.transform =
          'translate(' + (dx * 0.08) + 'px, ' + (dy * 0.05) + 'px) scale(1.05)';
        img.style.transition = 'transform 0.1s ease-out';
      }
    });

    // 鼠标离开
    wrapper.addEventListener('mouseleave', function () {
      inner.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
      inner.style.boxShadow = '';
      inner.style.filter = '';
      var img = inner.querySelector('.hero-card-image img');
      if (img) {
        img.style.transform = '';
        img.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }
    });

    // 放大效果
    wrapper.addEventListener('mouseenter', function () {
      wrapper.classList.add('zoomed');
    });
    wrapper.addEventListener('mouseleave', function () {
      wrapper.classList.remove('zoomed');
    });
  }

  // ── 文章卡片 3D 效果 ─────────────────────
  var cardCenters = new WeakMap();

  function initPostCard3D() {
    var cards = document.querySelectorAll('.recent-post-item');
    cards.forEach(function (card) {
      var rect = card.getBoundingClientRect();
      cardCenters.set(card, {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      });
    });
  }

  document.addEventListener('mousemove', function (e) {
    document.querySelectorAll('.recent-post-item:hover').forEach(function (card) {
      var data = cardCenters.get(card);
      if (!data) {
        var rect = card.getBoundingClientRect();
        data = { centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2 };
        cardCenters.set(card, data);
      }

      var dx = clamp(e.clientX - data.centerX, 20);
      var dy = clamp(e.clientY - data.centerY, 15);

      card.style.transform =
        'perspective(600px) rotateY(' + (dx * 0.25) + 'deg) rotateX(' + (-dy * 0.18) + 'deg) translateY(-4px)';
      card.style.boxShadow =
        (-dx * 0.3) + 'px ' + (-dy * 0.3) + 'px 32px 0 rgba(0, 0, 20, 0.5), 0 0 40px rgba(100, 160, 255, 0.15)';

      // 封面视差
      var cover = card.querySelector('.post_cover img');
      if (cover) {
        cover.style.transform =
          'translate(' + (dx * 0.05) + 'px, ' + (dy * 0.04) + 'px) scale(1.06)';
      }
    });
  });

  document.addEventListener('mouseout', function (e) {
    var card = e.target.closest('.recent-post-item');
    if (!card || card.contains(e.relatedTarget)) return;

    card.style.transform = '';
    card.style.boxShadow = '';

    var cover = card.querySelector('.post_cover img');
    if (cover) {
      cover.style.transform = '';
      cover.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
  });

  // ── 背景粒子 ─────────────────────────────
  function createParticles() {
    var container = document.createElement('div');
    container.className = 'bg-particles';
    container.style.cssText =
      'position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;';

    var frag = document.createDocumentFragment();
    for (var i = 0; i < 30; i++) {
      var dot = document.createElement('div');
      var size = Math.random() * 3 + 1;
      dot.style.cssText =
        'position:absolute;' +
        'width:' + size + 'px;height:' + size + 'px;' +
        'background:rgba(140,180,255,' + (Math.random() * 0.25 + 0.05) + ');' +
        'border-radius:50%;' +
        'left:' + (Math.random() * 100) + '%;' +
        'top:' + (Math.random() * 100) + '%;' +
        'animation:particleFloat ' + (Math.random() * 12 + 8) + 's linear infinite;' +
        'animation-delay:' + (Math.random() * 10) + 's;';
      frag.appendChild(dot);
    }

    container.appendChild(frag);
    document.body.appendChild(container);

    // 动画 keyframes
    var style = document.createElement('style');
    style.textContent =
      '@keyframes particleFloat {' +
      '  0% { transform: translateY(0) translateX(0); opacity: 0; }' +
      '  10% { opacity: 1; }' +
      '  90% { opacity: 1; }' +
      '  100% { transform: translateY(-60px) translateX(20px); opacity: 0; }' +
      '}';
    document.head.appendChild(style);
  }

  // ── 初始化 ──────────────────────────────
  function init() {
    // 只在首页创建 hero card
    var isHome = document.querySelector('.recent-posts') ||
                 document.body.classList.contains('home');

    if (isHome || GLOBAL_CONFIG_SITE.pageType === 'home') {
      createHeroCard();
      setTimeout(initHeroCard3D, 300);
    }

    initPostCard3D();
    createParticles();

    // resize 更新
    window.addEventListener('resize', function () {
      initPostCard3D();
    });
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
    setTimeout(init, 300);
  });

})();
