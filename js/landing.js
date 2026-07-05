/**
 * ============================================
 * JINGYU · Landing Page （单卡片主页）
 * 3D 透视 / 视差分层 / 每次进入
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

  // ── 卡片数据（默认值，可被 landing-config.json 覆盖）──────
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

  // ── 背景图片池（用仓库已有图） ────────────
  var bgImages = [
    'images/bg/honkai_all.jpg',
    'images/bg/sekai_03.jpg',
    'images/bg/fate01.jpg',
    'images/bg/cerydra.jpg',
  ];

  // ── 构建浮层 ──────────────────────────────
  function createOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'landing-overlay';

    // 背景氛围层
    var bgLayer = document.createElement('div');
    bgLayer.className = 'landing-bg';
    // 随机选3张做背景装饰
    var picked = bgImages.sort(function () { return Math.random() - 0.5; }).slice(0, 3);
    for (var b = 0; b < 3; b++) {
      var img = document.createElement('img');
      img.className = 'landing-bg-img';
      img.src = picked[b];
      bgLayer.appendChild(img);
    }
    overlay.appendChild(bgLayer);

    // 背景点阵
    var dots = document.createElement('div');
    dots.className = 'landing-bg-dots';
    overlay.appendChild(dots);

    // 卡片容器
    var container = document.createElement('div');
    container.className = 'landing-card-container';

    var card = document.createElement('div');
    card.className = 'landing-card';

    card.innerHTML =
      '<div class="landing-card-bg"></div>' +
      '<div class="landing-image-area"><div class="landing-dot-pattern"></div></div>' +
      '<div class="landing-image-area" style="overflow:inherit;">' +
      '  <div class="landing-image-main" style="left:0;top:0;filter:none;">' +
      '    <img src="' + cardConfig.cardImage + '" alt="' + cardConfig.cardTitle + '" loading="eager">' +
      '  </div>' +
      '</div>' +
      '<div class="landing-overlay-area" style="transform:translateZ(0) scale(1);">' +
      '  <div class="landing-overlay-img">' +
      '    <div class="landing-brand-mark">' + cardConfig.cardTitle + '</div>' +
      '  </div>' +
      '</div>' +
      '<div class="landing-badge">' + cardConfig.cardBadge + '</div>' +
      '<div class="landing-badge-shadow"></div>' +
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
    cta.addEventListener('click', function () {
      enterSite(overlay);
    });
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

  // ── 3D 追踪 ──────────────────────────────
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

    card.addEventListener('mouseenter', function () {
      updateCenter(card);
      var oa = card.querySelector('.landing-overlay-area');
      if (oa) {
        oa.style.overflow = 'inherit';
        oa.style.left = '-24px';
        oa.style.top = '-36px';
        oa.style.transform = 'scale(0.7)';
      }
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = 'perspective(500px) scale(1)';
      card.style.filter = 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))';
      card.style.boxShadow = '0 0 0 0 rgba(0,0,0,0.2)';
      var imgMain = card.querySelector('.landing-image-main');
      if (imgMain) imgMain.style.cssText = 'left:0;top:0;filter:none;';
      var oa = card.querySelector('.landing-overlay-area');
      if (oa) oa.style.cssText = 'left:0;top:0;filter:none;transform:translateZ(0) scale(1);overflow:hidden;';
      var oi = card.querySelector('.landing-overlay-img');
      if (oi) oi.style.cssText = 'left:0;top:0;';
    });

    card.addEventListener('mousemove', function (e) {
      if (!cardCenter) return;
      var calcX = rotate(e.clientX, cardCenter.centerX);
      var calcY = rotate(e.clientY, cardCenter.centerY);
      var dx = e.clientX - cardCenter.centerX;
      var dy = e.clientY - cardCenter.centerY;

      card.style.transform =
        'translateZ(0) perspective(1000px) rotateY(' + calcX + 'deg) rotateX(' + (-calcY / 1.5) + 'deg)';
      card.style.filter = 'brightness(' + brightness(e.clientY, cardCenter.centerY) + ')';
      card.style.boxShadow = (-calcX) + 'px ' + (-calcY) + 'px 12px 0 rgba(0,0,20,0.25)';

      var oi = card.querySelector('.landing-overlay-img');
      if (oi) { oi.style.left = (dx / 10) + 'px'; oi.style.top = (dy / 15) + 'px'; }

      var oa = card.querySelector('.landing-overlay-area');
      if (oa) oa.style.filter = 'drop-shadow(' + (-calcX/7) + 'px ' + (-calcY/7) + 'px 0 white)';

      var im = card.querySelector('.landing-image-main');
      if (im) {
        im.style.left = (dx / 8) + 'px';
        im.style.top = (dy / 13) + 'px';
        im.style.filter = 'drop-shadow(' + (-calcX/2) + 'px ' + (-calcY/2) + 'px 5px rgba(0,0,20,0.2))';
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
    // 尝试加载配置文件
    fetch('landing-config.json')
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        if (cfg.cardImage) cardConfig.cardImage = cfg.cardImage;
        if (cfg.cardTitle) cardConfig.cardTitle = cfg.cardTitle;
        if (cfg.cardSubtitle) cardConfig.cardSubtitle = cfg.cardSubtitle;
        if (cfg.cardBadge) cardConfig.cardBadge = cfg.cardBadge;
      })
      .catch(function () {
        // 使用默认值
      })
      .finally(function () {
        createOverlay();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
