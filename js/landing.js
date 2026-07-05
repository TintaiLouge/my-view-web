/**
 * ============================================
 * JINGYU · Landing Page （单卡片主页）
 * 3D 透视 / 视差分层 / 毛玻璃背景
 * ============================================
 */

(function () {
  'use strict';

  // 仅首页显示
  var isHome = (function () {
    try {
      if (typeof GLOBAL_CONFIG_SITE !== 'undefined' &&
          GLOBAL_CONFIG_SITE.pageType === 'home') return true;
    } catch(e) {}
    var path = window.location.pathname.replace(/\/+$/, '');
    var base = path.split('/').pop();
    return document.body.classList.contains('home') ||
           document.querySelector('#recent-posts') ||
           path === '' || base === 'my-view-web' || base === '';
  })();

  if (!isHome) {
    document.documentElement.classList.remove('landing-locked');
    return;
  }

  // ── 卡片数据 ──────────────────────────────
  var cardConfig = {
    cardImage: 'images/illustrations/card-1.jpg',
    cardTitle: 'JINGYU',
    cardSubtitle: 'GAMEDESIGN PORTFOLIO',
    cardBadge: '作品集'
  };

  // ── 工具 ──────────────────────────────────
  var rotate = function (cursorPos, centerPos, threshold) {
    threshold = threshold || 25;
    var delta = cursorPos - centerPos;
    return delta >= 0 ?
      (delta >= threshold ? threshold : delta) :
      (delta <= -threshold ? -threshold : delta);
  };

  var brightness = function (cursorY, centerY, strength) {
    strength = strength || 22;
    return 1 - rotate(cursorY, centerY) / strength * 0.05;
  };

  var cardCenter = null;

  // ── 构建浮层 ──────────────────────────────
  function createOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'landing-overlay';

    // 满屏毛玻璃背景（随机选一张仓库图）
    var bgPics = [
      'images/bg/honkai_all.jpg',
      'images/bg/fate01.jpg',
      'images/bg/cerydra.jpg',
      'images/bg/sekai_03.jpg',
    ];
    var bgSrc = bgPics[Math.floor(Math.random() * bgPics.length)];

    var bgFull = document.createElement('div');
    bgFull.className = 'landing-bg-full';
    bgFull.style.backgroundImage = 'url(' + bgSrc + ')';
    overlay.appendChild(bgFull);

    // 毛玻璃罩
    var bgGlass = document.createElement('div');
    bgGlass.className = 'landing-bg-glass';
    overlay.appendChild(bgGlass);

    // 点阵
    var dots = document.createElement('div');
    dots.className = 'landing-bg-dots';
    overlay.appendChild(dots);

    // 卡片容器
    var container = document.createElement('div');
    container.className = 'landing-card-container';

    var card = document.createElement('div');
    card.className = 'landing-card';
    // 初始 transform（有过渡缓冲）
    card.style.transform = 'perspective(500px) scale(1)';
    card.style.boxShadow = '0 0 0 0 rgba(0,0,0,0.2)';

    // 用仓库里的小图做品牌叠层
    var brandImg = 'images/covers/iuno.jpg'; // 小图当品牌叠层用

    card.innerHTML =
      '<div class="landing-card-bg"></div>' +
      // 点阵
      '<div class="landing-image-area"><div class="landing-dot-pattern"></div></div>' +
      // 主图
      '<div class="landing-image-area" style="overflow:inherit;">' +
      '  <div class="landing-image-main" style="left:0;top:0;filter:none;">' +
      '    <img src="' + cardConfig.cardImage + '" alt="' + cardConfig.cardTitle + '" loading="eager">' +
      '  </div>' +
      '</div>' +
      // 叠加层（品牌图，反相显示）
      '<div class="landing-overlay-area" style="transform:translateZ(0) scale(1);">' +
      '  <div class="landing-overlay-img">' +
      '    <div class="landing-brand-mark"><img src="' + brandImg + '" alt="brand"></div>' +
      '  </div>' +
      '</div>' +
      // Badge
      '<div class="landing-badge">' + cardConfig.cardBadge + '</div>' +
      '<div class="landing-badge-shadow"></div>' +
      // 标题
      '<div class="landing-title">' + cardConfig.cardTitle + '</div>' +
      '<div class="landing-subtitle">' + cardConfig.cardSubtitle + '</div>';

    card.addEventListener('click', function () {
      enterSite(overlay);
    });
    container.appendChild(card);
    overlay.appendChild(container);

    // CTA
    var cta = document.createElement('div');
    cta.className = 'landing-cta';
    cta.innerHTML =
      '<span class="landing-cta-text">点击卡片进入</span>' +
      '<span class="landing-cta-arrow">⌄</span>';
    cta.addEventListener('click', function () { enterSite(overlay); });
    overlay.appendChild(cta);

    document.body.appendChild(overlay);
    initTracking(card);

    // 键盘
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.removeEventListener('keydown', onKey);
        enterSite(overlay);
      }
    });
  }

  // ── 3D 追踪（带缓冲）─────────────────────
  function updateCenter(card) {
    var rect = card.getBoundingClientRect();
    cardCenter = {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
    };
  }

  function initTracking(card) {
    updateCenter(card);
    window.addEventListener('resize', function () { updateCenter(card); });

    var overlayArea = card.querySelector('.landing-overlay-area');
    var overlayImg = card.querySelector('.landing-overlay-img');
    var imageMain = card.querySelector('.landing-image-main');

    card.addEventListener('mouseenter', function () {
      updateCenter(card);
      // 展开叠加层，露出品牌图
      if (overlayArea) {
        overlayArea.style.overflow = 'inherit';
        overlayArea.style.left = '-20px';
        overlayArea.style.top = '-30px';
        overlayArea.style.transform = 'scale(0.7)';
      }
    });

    card.addEventListener('mouseleave', function () {
      // 平滑复位
      card.style.transform = 'perspective(500px) scale(1)';
      card.style.filter = 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))';
      card.style.boxShadow = '0 0 0 0 rgba(0,0,0,0.2)';
      if (imageMain) imageMain.style.cssText = 'left:0;top:0;filter:none;';
      if (overlayArea) {
        overlayArea.style.cssText = 'left:0;top:0;filter:none;transform:translateZ(0) scale(1);overflow:hidden;';
      }
      if (overlayImg) overlayImg.style.cssText = 'left:0;top:0;';
    });

    card.addEventListener('mousemove', function (e) {
      if (!cardCenter) return;
      var calcX = rotate(e.clientX, cardCenter.centerX);
      var calcY = rotate(e.clientY, cardCenter.centerY);
      var dx = e.clientX - cardCenter.centerX;
      var dy = e.clientY - cardCenter.centerY;

      // 通过 style 更新（CSS transition 提供缓冲）
      card.style.transform =
        'translateZ(0) perspective(1000px) rotateY(' + calcX + 'deg) rotateX(' + (-calcY / 1.5) + 'deg)';
      card.style.filter = 'brightness(' + brightness(e.clientY, cardCenter.centerY) + ')';
      card.style.boxShadow = (-calcX) + 'px ' + (-calcY) + 'px 12px 0 rgba(0,0,20,0.25)';

      // 叠加层视差
      if (overlayImg) {
        overlayImg.style.left = (dx / 10) + 'px';
        overlayImg.style.top = (dy / 15) + 'px';
      }
      if (overlayArea) {
        overlayArea.style.filter = 'drop-shadow(' + (-calcX/7) + 'px ' + (-calcY/7) + 'px 0 white)';
      }

      // 主图视差
      if (imageMain) {
        imageMain.style.left = (dx / 8) + 'px';
        imageMain.style.top = (dy / 13) + 'px';
        imageMain.style.filter = 'drop-shadow(' + (-calcX/2) + 'px ' + (-calcY/2) + 'px 5px rgba(0,0,20,0.2))';
      }
    });
  }

  // ── 进入站点 ──────────────────────────────
  function enterSite(overlay) {
    if (overlay.classList.contains('landing-exit')) return;
    overlay.classList.add('landing-exit');
    setTimeout(function () {
      document.documentElement.classList.remove('landing-locked');
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 600);
  }

  // ── 加载配置并启动 ────────────────────────
  function boot() {
    fetch('landing-config.json')
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        if (cfg.cardImage) cardConfig.cardImage = cfg.cardImage;
        if (cfg.cardTitle) cardConfig.cardTitle = cfg.cardTitle;
        if (cfg.cardSubtitle) cardConfig.cardSubtitle = cfg.cardSubtitle;
        if (cfg.cardBadge) cardConfig.cardBadge = cfg.cardBadge;
      })
      .catch(function () {})
      .finally(function () { createOverlay(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
