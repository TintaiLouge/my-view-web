/**
 * ============================================
 * JINGYU · Landing Overlay
 * 3D 透视卡片 / 视差分层 / 投影美学
 * ============================================
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'jingyu_entered';

  // 已进入过 → 跳过
  if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
    document.documentElement.classList.remove('landing-locked');
    return;
  }

  // 仅首页显示
  var isHome = (function () {
    try {
      if (typeof GLOBAL_CONFIG_SITE !== 'undefined' &&
          GLOBAL_CONFIG_SITE.pageType === 'home') return true;
    } catch(e) {}
    // GitHub Pages 子目录兼容
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
  var cardData = [
    { title: '关卡设计', subtitle: 'LEVELDESIGN', badge: '核心能力', img: '/images/illustrations/card-1.jpg' },
    { title: '系统架构', subtitle: 'SYSTEMDESIGN', badge: '核心能力', img: '/images/illustrations/card-2.jpg' },
    { title: '叙事体验', subtitle: 'NARRATIVE', badge: '设计方向', img: '/images/illustrations/card-3.jpg' },
    { title: '设计工具', subtitle: 'TOOLS&CRAFT', badge: '工具箱', img: '/images/illustrations/card-4.jpg' },
    { title: '作品集', subtitle: 'PORTFOLIO', badge: '成果展示', img: '/images/illustrations/card-5.jpg' },
  ];

  // ── 工具 ──────────────────────────────────
  var rotate = function (cursorPos, centerPos, threshold) {
    threshold = threshold || 22;
    var delta = cursorPos - centerPos;
    return delta >= 0 ?
      (delta >= threshold ? threshold : delta) :
      (delta <= -threshold ? -threshold : delta);
  };

  var brightness = function (cursorY, centerY, strength) {
    strength = strength || 20;
    return 1 - rotate(cursorY, centerY) / strength * 0.05;
  };

  var cardCenters = new Map();

  // ── 构建浮层 ──────────────────────────────
  function createOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'landing-overlay';

    // 3D 舞台
    var stage = document.createElement('div');
    stage.className = 'landing-stage';

    for (var i = 0; i < cardData.length; i++) {
      var d = cardData[i];

      var container = document.createElement('div');
      container.className = 'landing-card-container';

      var card = document.createElement('div');
      card.className = 'landing-card';
      card.style.setProperty('--float-delay', (i * 0.7) + 's');

      card.innerHTML =
        '<div class="landing-card-bg"></div>' +
        // 点阵装饰
        '<div class="landing-image-area"><div class="landing-dot-pattern"></div></div>' +
        // 主图
        '<div class="landing-image-area" style="overflow:inherit;">' +
        '  <div class="landing-image-main" style="left:0;top:0;filter:none;">' +
        '    <img src="' + d.img + '" alt="' + d.title + '" loading="eager">' +
        '  </div>' +
        '</div>' +
        // 叠加层（反相）
        '<div class="landing-overlay-area" style="transform:translateZ(0) scale(1);">' +
        '  <div class="landing-overlay-img">' +
        '    <div class="landing-brand-mark">JINGYU</div>' +
        '  </div>' +
        '</div>' +
        // Badge + 阴影
        '<div class="landing-badge">' + d.badge + '</div>' +
        '<div class="landing-badge-shadow"></div>' +
        // 标题
        '<div class="landing-title">' + d.title + '</div>' +
        '<div class="landing-subtitle">' + d.subtitle + '</div>';

      // 点击进入
      card.addEventListener('click', function () {
        enterSite(overlay);
      });

      container.appendChild(card);
      stage.appendChild(container);
    }
    overlay.appendChild(stage);

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

    // 初始化追踪
    initTracking();

    // 键盘进入
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.removeEventListener('keydown', onKey);
        enterSite(overlay);
      }
    });
  }

  // ── 3D 追踪 ──────────────────────────────
  function updateCenters() {
    var cards = document.querySelectorAll('.landing-card');
    for (var i = 0; i < cards.length; i++) {
      var rect = cards[i].getBoundingClientRect();
      cardCenters.set(cards[i], {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      });
    }
  }

  function initTracking() {
    updateCenters();
    window.addEventListener('resize', updateCenters);

    // 容器缩放（hover）
    var containers = document.querySelectorAll('.landing-card-container');
    for (var c = 0; c < containers.length; c++) {
      (function (ct) {
        ct.addEventListener('mouseenter', function () {
          ct.classList.add('zoomed');
        });
        ct.addEventListener('mouseleave', function () {
          ct.classList.remove('zoomed');
        });
      })(containers[c]);
    }

    // 卡片 3D mousemove
    var cards = document.querySelectorAll('.landing-card');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('mouseenter', function () {
          var rect = card.getBoundingClientRect();
          cardCenters.set(card, {
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2,
          });

          // 展开 overlay
          var overlayArea = card.querySelector('.landing-overlay-area');
          if (overlayArea) {
            overlayArea.style.overflow = 'inherit';
            overlayArea.style.left = '-16px';
            overlayArea.style.top = '-24px';
            overlayArea.style.transform = 'scale(0.7)';
          }
        });

        card.addEventListener('mouseleave', function () {
          card.style.transform = 'perspective(500px) scale(1)';
          card.style.filter = 'drop-shadow(0 6px 8px rgba(0,0,0,0.45))';
          card.style.boxShadow = '0 0 0 0 rgba(0,0,0,0.2)';

          var imgMain = card.querySelector('.landing-image-main');
          if (imgMain) { imgMain.style.cssText = 'left:0;top:0;filter:none;'; }

          var overlayArea = card.querySelector('.landing-overlay-area');
          if (overlayArea) {
            overlayArea.style.cssText = 'left:0;top:0;filter:none;transform:translateZ(0) scale(1);overflow:hidden;';
          }

          var overlayImg = card.querySelector('.landing-overlay-img');
          if (overlayImg) { overlayImg.style.cssText = 'left:0;top:0;'; }
        });

        card.addEventListener('mousemove', function (e) {
          var data = cardCenters.get(card);
          if (!data) return;

          var calcX = rotate(e.clientX, data.centerX);
          var calcY = rotate(e.clientY, data.centerY);
          var dx = e.clientX - data.centerX;
          var dy = e.clientY - data.centerY;

          // 3D 旋转
          card.style.transform =
            'translateZ(0) perspective(1000px) rotateY(' + calcX + 'deg) rotateX(' + (-calcY / 1.5) + 'deg)';
          card.style.filter = 'brightness(' + brightness(e.clientY, data.centerY) + ')';
          card.style.boxShadow = (-calcX) + 'px ' + (-calcY) + 'px 10px 0 rgba(0,0,20,0.25)';

          // 叠加层视差
          var overlayImg = card.querySelector('.landing-overlay-img');
          if (overlayImg) {
            overlayImg.style.left = (dx / 10) + 'px';
            overlayImg.style.top = (dy / 15) + 'px';
          }

          var overlayArea = card.querySelector('.landing-overlay-area');
          if (overlayArea) {
            overlayArea.style.filter = 'drop-shadow(' + (-calcX / 7) + 'px ' + (-calcY / 7) + 'px 0 white)';
          }

          // 主图视差
          var imgMain = card.querySelector('.landing-image-main');
          if (imgMain) {
            imgMain.style.left = (dx / 8) + 'px';
            imgMain.style.top = (dy / 13) + 'px';
            imgMain.style.filter = 'drop-shadow(' + (-calcX / 2) + 'px ' + (-calcY / 2) + 'px 5px rgba(0,0,20,0.2))';
          }
        });
      })(cards[i]);
    }
  }

  // ── 进入站点 ──────────────────────────────
  function enterSite(overlay) {
    if (overlay.classList.contains('landing-exit')) return;
    overlay.classList.add('landing-exit');

    setTimeout(function () {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      document.documentElement.classList.remove('landing-locked');
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 700);
  }

  // ── 启动 ──────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createOverlay);
  } else {
    createOverlay();
  }

})();
