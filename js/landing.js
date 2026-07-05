/**
 * JINGYU · Landing — 照抄风格指导 + 换图
 */
(function () {
  'use strict';

  // 仅首页
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
  if (!isHome) { document.documentElement.classList.remove('landing-locked'); return; }

  // ── 配置（图片换为自己的）──────────────
  var cardImage = 'images/illustrations/card-1.jpg';
  var brandImage = 'images/covers/iuno.jpg';

  // ── 工具（和原版一样）───────────────────
  var rotate = function (cursorPosition, centerPosition, threshold) {
    threshold = threshold || 20;
    var delta = cursorPosition - centerPosition;
    return delta >= 0 ?
      (delta >= threshold ? threshold : delta) :
      (delta <= -threshold ? -threshold : delta);
  };
  var brightness = function (cursorPositionY, centerPositionY, strength) {
    strength = strength || 20;
    return 1 - rotate(cursorPositionY, centerPositionY) / strength * 0.05;
  };
  var cardCenter = null;

  // ── 构建 ──────────────────────────────
  function createOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'landing-overlay';

    // 卡片容器（缩放层）
    var container = document.createElement('div');
    container.className = 'landing-card-container';

    // 卡片主体
    var card = document.createElement('div');
    card.className = 'landing-card';
    card.style.cssText = 'transform:perspective(500px) scale(1);box-shadow:rgba(0,0,0,0.2) 0 0 0 0;';

    // 抄原版 HTML 结构，只换图片路径
    card.innerHTML =
      '<div class="landing-card-bg"></div>' +
      '<div class="landing-image-area"><div class="landing-dot-pattern"></div></div>' +
      '<div class="landing-image-area" style="overflow:inherit;">' +
      '  <div class="landing-image-main" style="left:0;top:0;filter:none;">' +
      '    <img src="' + cardImage + '" width="120" loading="eager">' +
      '  </div>' +
      '</div>' +
      '<div class="landing-overlay-area" style="transform:translateZ(0) scale(1);">' +
      '  <div class="landing-overlay-img">' +
      '    <div class="landing-brand-mark"><img src="' + brandImage + '" width="100%"></div>' +
      '  </div>' +
      '</div>' +
      '<div class="landing-badge">作品集</div>' +
      '<div class="landing-badge-shadow"></div>' +
      '<div class="landing-title">JINGYU</div>' +
      '<div class="landing-subtitle">GAMEDESIGN</div>';

    card.addEventListener('click', function () { enterSite(overlay); });
    container.appendChild(card);
    overlay.appendChild(container);

    // CTA
    var cta = document.createElement('div');
    cta.className = 'landing-cta';
    cta.innerHTML = '<span class="landing-cta-text">点击卡片进入</span><span class="landing-cta-arrow">⌄</span>';
    cta.addEventListener('click', function () { enterSite(overlay); });
    overlay.appendChild(cta);

    document.body.appendChild(overlay);
    initTracking(container, card);

    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.removeEventListener('keydown', onKey);
        enterSite(overlay);
      }
    });
  }

  // ── 3D 追踪（完全照抄原版 JS）────────────
  function updateCenter(card) {
    var rect = card.getBoundingClientRect();
    cardCenter = { centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2 };
  }

  function initTracking(container, card) {
    updateCenter(card);
    window.addEventListener('resize', function () { updateCenter(card); });

    // 容器 zoom（原版 .card-container.hover → zoomed）
    container.addEventListener('mouseenter', function () { container.classList.add('zoomed'); });
    container.addEventListener('mouseleave', function () { container.classList.remove('zoomed'); });

    // 卡片内部 3D
    card.addEventListener('mouseenter', function () {
      updateCenter(card);
      var oa = card.querySelector('.landing-overlay-area');
      if (oa) {
        oa.style.overflow = 'inherit';
        oa.style.left = '-20px';
        oa.style.top = '-30px';
        oa.style.transform = 'scale(0.7)';
      }
    });

    card.addEventListener('mouseleave', function () {
      card.style.cssText = 'transform:perspective(500px) scale(1);filter:brightness(1) drop-shadow(0 5px 5px rgba(0,0,0,.5));box-shadow:0 0 0 0 rgba(0,0,0,0.2);';
      var im = card.querySelector('.landing-image-main');
      if (im) im.style.cssText = 'left:0;top:0;filter:none;';
      var oa = card.querySelector('.landing-overlay-area');
      if (oa) oa.style.cssText = 'left:0;top:0;filter:none;transform:translateZ(0) scale(1);overflow:hidden;';
      var oi = card.querySelector('.landing-overlay-img');
      if (oi) oi.style.cssText = 'left:0;top:0;';
    });

    card.addEventListener('mousemove', function (event) {
      if (!cardCenter) return;
      var calcX = rotate(event.clientX, cardCenter.centerX);
      var calcY = rotate(event.clientY, cardCenter.centerY);
      var dx = event.clientX - cardCenter.centerX;
      var dy = event.clientY - cardCenter.centerY;

      // 3D 旋转（原版值）
      card.style.transform = 'translateZ(0) perspective(1000px) rotateY(' + calcX + 'deg) rotateX(' + (-calcY / 1.5) + 'deg)';
      card.style.filter = 'brightness(' + brightness(event.clientY, cardCenter.centerY) + ')';
      card.style.boxShadow = (-calcX) + 'px ' + (-calcY) + 'px 10px 0 rgba(0,0,20,0.25)';

      // 视差（原版值）
      var oi = card.querySelector('.landing-overlay-img');
      if (oi) { oi.style.left = (dx / 10) + 'px'; oi.style.top = (dy / 15) + 'px'; }

      var oa = card.querySelector('.landing-overlay-area');
      if (oa) oa.style.filter = 'drop-shadow(' + (-calcX / 7) + 'px ' + (-calcY / 7) + 'px 0 white)';

      var im = card.querySelector('.landing-image-main');
      if (im) {
        im.style.left = (dx / 8) + 'px';
        im.style.top = (dy / 13) + 'px';
        im.style.filter = 'drop-shadow(' + (-calcX / 2) + 'px ' + (-calcY / 2) + 'px 5px rgba(0,0,20,0.2))';
      }
    });
  }

  // ── 进入 ──────────────────────────────
  function enterSite(overlay) {
    if (overlay.classList.contains('landing-exit')) return;
    overlay.classList.add('landing-exit');
    setTimeout(function () {
      document.documentElement.classList.remove('landing-locked');
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 500);
  }

  // ── 启动 ──────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createOverlay);
  } else {
    createOverlay();
  }
})();
