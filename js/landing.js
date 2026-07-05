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
  var brandImage = 'https://media.prts.wiki/5/5d/Skin_brand_%E7%94%9F%E5%91%BD%E4%B9%8B%E5%9C%B0.png';

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
      '<div class="landing-subtitle">GAMEDESIGN</div>' +
      '<div class="landing-enter-btn">进入</div>';

    // 点击按钮进入（卡片本体只展示 3D 效果）
    container.appendChild(card);
    var enterBtn = card.querySelector('.landing-enter-btn');
    if (enterBtn) enterBtn.addEventListener('click', function (e) { e.stopPropagation(); enterSite(overlay); });
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

    // 容器 zoom（改用 mouseover/mouseout 确保触发）
    container.addEventListener('mouseover', function () { container.classList.add('zoomed'); });
    container.addEventListener('mouseout', function (e) {
      if (!container.contains(e.relatedTarget)) container.classList.remove('zoomed');
    });

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
    document.body.style.background = "url('images/bg/cerydra.jpg') center / cover fixed";
    document.body.style.backgroundColor = '#060b14';

    // 加载动画（二次元游戏公司风格）
    var loader = document.createElement('div');
    loader.id = 'landing-loader';
    loader.innerHTML =
      '<svg width="120" height="120" viewBox="0 0 120 120">' +
      '<defs>' +
      '<linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#5b9cf5"/><stop offset="100%" stop-color="#40c8e0"/>' +
      '</linearGradient>' +
      '<linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%">' +
      '<stop offset="0%" stop-color="#8ec5ff"/><stop offset="100%" stop-color="#5b9cf5"/>' +
      '</linearGradient>' +
      '</defs>' +
      '<circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>' +
      '<circle cx="60" cy="60" r="52" fill="none" stroke="url(#lg1)" stroke-width="1.5" stroke-dasharray="80 250" stroke-linecap="round">' +
      '<animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="3s" repeatCount="indefinite"/>' +
      '</circle>' +
      '<polygon points="60,22 93,41 93,79 60,98 27,79 27,41" fill="none" stroke="rgba(91,156,245,0.15)" stroke-width="1">' +
      '<animateTransform attributeName="transform" type="rotate" from="0 60 60" to="-360 60 60" dur="8s" repeatCount="indefinite"/>' +
      '</polygon>' +
      '<circle cx="60" cy="60" r="36" fill="none" stroke="url(#lg2)" stroke-width="2" stroke-dasharray="60 170" stroke-linecap="round">' +
      '<animateTransform attributeName="transform" type="rotate" from="360 60 60" to="0 60 60" dur="2s" repeatCount="indefinite"/>' +
      '</circle>' +
      '<polygon points="60,30 78,48 60,66 42,48" fill="none" stroke="rgba(64,200,224,0.25)" stroke-width="1">' +
      '<animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="4s" repeatCount="indefinite"/>' +
      '</polygon>' +
      '<circle cx="60" cy="60" r="3" fill="#8ec5ff">' +
      '<animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite"/>' +
      '<animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/>' +
      '</circle>' +
      '<circle cx="60" cy="14" r="1.5" fill="#5b9cf5">' +
      '<animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="4s" repeatCount="indefinite"/>' +
      '</circle>' +
      '<circle cx="60" cy="14" r="1" fill="#40c8e0">' +
      '<animateTransform attributeName="transform" type="rotate" from="120 60 60" to="480 60 60" dur="3s" repeatCount="indefinite"/>' +
      '</circle>' +
      '<circle cx="60" cy="14" r="1.5" fill="#8ec5ff">' +
      '<animateTransform attributeName="transform" type="rotate" from="240 60 60" to="600 60 60" dur="5s" repeatCount="indefinite"/>' +
      '</circle>' +
      '</svg>' +
      '<p style="color:rgba(140,197,255,0.6);font-size:0.75rem;letter-spacing:4px;margin-top:20px;">JINGYU</p>';
    loader.style.cssText =
      'position:fixed;inset:0;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(6,11,20,0.94);opacity:0;transition:opacity 0.3s;';
    document.body.appendChild(loader);
    requestAnimationFrame(function () { loader.style.opacity = '1'; });

    setTimeout(function () {
      document.documentElement.classList.remove('landing-locked');
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      // loading 淡出
      loader.style.opacity = '0';
      setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 400);
    }, 500);
  }

  // ── 启动 ──────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createOverlay);
  } else {
    createOverlay();
  }
})();
