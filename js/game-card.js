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
    setTimeout(initContactCopy, 300);
  });

  // ── 联系方式：悬停浮窗 + 点击复制 ──────────
  var contactData = {};

  function parseContactFromEl(el) {
    // title 格式: "📧 2240656737@qq.com" 或 "💬 WeChat: LJY67100000"
    var raw = el.getAttribute('title') || '';
    // emoji 前缀提取类型
    var type = raw.indexOf('📧') !== -1 ? '邮箱' :
               raw.indexOf('💬') !== -1 ? '微信' : '联系方式';
    // 提取实际内容（去掉 emoji 和前缀）
    var value = raw.replace(/^[📧💬]\s*/, '');
    if (value.indexOf('WeChat:') === 0) value = value.replace('WeChat:', '').trim();
    return { type: type, value: value, raw: raw };
  }

  function showTooltip(el, data) {
    hideTooltip();
    var tip = document.createElement('div');
    tip.className = 'contact-tooltip';
    tip.id = 'contact-tooltip';
    tip.innerHTML = data.value + '<span class="tooltip-hint">点击复制' + data.type + '</span>';
    el.appendChild(tip);
  }

  function hideTooltip() {
    var tip = document.getElementById('contact-tooltip');
    if (tip) tip.remove();
  }

  function showCopyToast(data) {
    var existing = document.querySelector('.copy-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.innerHTML = '✅ ' + data.type + '已复制：<b>' + data.value + '</b>';
    document.body.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 2200);
  }

  function handleContactClick(e) {
    var el = e.currentTarget;
    var data = parseContactFromEl(el);
    hideTooltip();

    // 提取纯文本值用于复制
    var copyVal = data.value;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyVal).then(function () {
        showCopyToast(data);
      }).catch(function () {
        fallbackCopy(copyVal, data);
      });
    } else {
      fallbackCopy(copyVal, data);
    }
  }

  function fallbackCopy(text, data) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showCopyToast(data); } catch(e) {}
    document.body.removeChild(ta);
  }

  function initContactCopy() {
    // 社交图标
    var icons = document.querySelectorAll('.card-info-social-icons .social-icon');
    for (var i = 0; i < icons.length; i++) {
      var icon = icons[i];
      // 移除旧事件（避免 Pjax 重复绑定）
      var clone = icon.cloneNode(true);
      icon.parentNode.replaceChild(clone, icon);

      var data = parseContactFromEl(clone);
      contactData[clone.className] = data;

      clone.addEventListener('mouseenter', function () {
        var d = parseContactFromEl(this);
        showTooltip(this, d);
      });
      clone.addEventListener('mouseleave', function () {
        hideTooltip();
      });
      clone.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var d = parseContactFromEl(this);
        handleContactClick({ currentTarget: this });
      });
      // 移除 target="_blank" 防止新标签页
      clone.removeAttribute('target');
    }

    // 「联系我」按钮
    var btn = document.getElementById('card-info-btn');
    if (btn) {
      var btnClone = btn.cloneNode(true);
      btn.parentNode.replaceChild(btnClone, btn);
      btnClone.removeAttribute('target');

      btnClone.addEventListener('mouseenter', function () {
        showTooltip(this, { type: '联系方式', value: '📧 2240656737@qq.com / 💬 LJY67100000' });
      });
      btnClone.addEventListener('mouseleave', function () {
        hideTooltip();
      });
      btnClone.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        // 「联系我」点击弹出选择
        hideTooltip();
        showContactChooser(btnClone);
      });
    }
  }

  function showContactChooser(anchor) {
    hideTooltip();
    // 移除旧的选择器
    var old = document.getElementById('contact-chooser');
    if (old) old.remove();

    var chooser = document.createElement('div');
    chooser.id = 'contact-chooser';
    chooser.style.cssText =
      'position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);' +
      'background:rgba(14,24,46,0.95);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);' +
      'border:1px solid rgba(140,180,255,0.2);border-radius:6px;padding:4px;' +
      'z-index:9999;display:flex;gap:4px;box-shadow:0 8px 24px rgba(0,0,0,0.5);' +
      'animation:tooltipIn 0.2s ease-out;white-space:nowrap;';

    chooser.innerHTML =
      '<button class="chooser-opt" data-val="2240656737@qq.com" style="' +
      'background:rgba(91,156,245,0.1);border:1px solid rgba(91,156,245,0.2);color:#e4ecf7;' +
      'padding:6px 14px;border-radius:4px;cursor:pointer;font-size:0.8rem;font-family:inherit;' +
      'transition:all 0.2s;">📧 复制邮箱</button>' +
      '<button class="chooser-opt" data-val="LJY67100000" style="' +
      'background:rgba(64,200,224,0.1);border:1px solid rgba(64,200,224,0.2);color:#e4ecf7;' +
      'padding:6px 14px;border-radius:4px;cursor:pointer;font-size:0.8rem;font-family:inherit;' +
      'transition:all 0.2s;">💬 复制微信</button>';

    anchor.style.position = 'relative';
    anchor.appendChild(chooser);

    // 绑定事件
    var opts = chooser.querySelectorAll('.chooser-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].addEventListener('mouseenter', function () {
        this.style.background = 'rgba(255,255,255,0.08)';
      });
      opts[i].addEventListener('mouseleave', function () {
        this.style.background = '';
      });
      opts[i].addEventListener('click', function (e) {
        e.stopPropagation();
        var val = this.getAttribute('data-val');
        var type = val.indexOf('@') !== -1 ? '邮箱' : '微信';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(val).then(function () {
            showCopyToast({ type: type, value: val });
          });
        } else {
          fallbackCopy(val, { type: type, value: val });
        }
        var c = document.getElementById('contact-chooser');
        if (c) c.remove();
      });
    }

    // 点击外部关闭
    setTimeout(function () {
      document.addEventListener('click', function closeChooser(e) {
        var c = document.getElementById('contact-chooser');
        if (c && !c.contains(e.target)) {
          c.remove();
          document.removeEventListener('click', closeChooser);
        }
      });
    }, 50);
  }

  // ── 初始化联系方式 ────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initContactCopy, 400);
    });
  } else {
    setTimeout(initContactCopy, 400);
  }

})();
