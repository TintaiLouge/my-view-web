/**
 * ============================================
 * 游戏卡片 3D 透视效果 — Hexo 博客
 * 仿明日方舟干员卡片鼠标追踪交互
 * ============================================
 */

(function () {
  'use strict';

  // 限制旋转角度范围
  const clamp = (delta, threshold) => {
    return delta >= 0
      ? Math.min(delta, threshold)
      : Math.max(delta, -threshold);
  };

  // 亮度计算：上方亮，下方暗
  const calcBrightness = (cursorY, centerY, strength = 20) => {
    return 1 - clamp(cursorY - centerY, 0) / strength * 0.08;
  };

  // 卡片数据中心点缓存
  const cardDataMap = new WeakMap();

  // 更新所有卡片中心点
  function updateCardCenters() {
    document.querySelectorAll('.recent-post-item').forEach(function (card) {
      const rect = card.getBoundingClientRect();
      cardDataMap.set(card, {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      });
    });
  }

  // 初始化 & resize 重新计算
  window.addEventListener('resize', updateCardCenters);
  window.addEventListener('load', updateCardCenters);

  // DOM 变化时也更新（SPA 页面切换等）
  setTimeout(updateCardCenters, 500);
  setTimeout(updateCardCenters, 1500);

  // 鼠标移动：3D 透视旋转
  document.addEventListener('mousemove', function (event) {
    document.querySelectorAll('.recent-post-item:hover').forEach(function (card) {
      const data = cardDataMap.get(card);
      if (!data) return;

      const calcX = clamp(event.clientX - data.centerX, 15);
      const calcY = clamp(event.clientY - data.centerY, 12);

      // 3D 旋转 + 动态阴影
      card.style.transform = 'perspective(800px) scale(1.03) rotateY(' + calcX * 0.3 + 'deg) rotateX(' + (-calcY * 0.2) + 'deg)';
      card.style.boxShadow = (-calcX * 0.5) + 'px ' + (-calcY * 0.5) + 'px 24px 0 rgba(0, 0, 20, 0.25)';
      card.style.filter = 'brightness(' + calcBrightness(event.clientY, data.centerY) + ')';

      // 封面图视差
      var coverImg = card.querySelector('.post_cover img');
      if (coverImg) {
        coverImg.style.transform = 'translate(' + (event.clientX - data.centerX) * 0.04 + 'px, ' + (event.clientY - data.centerY) * 0.03 + 'px) scale(1.08)';
        coverImg.style.transition = 'transform 0.15s ease-out, filter 0.3s ease';
      }
    });
  });

  // 鼠标离开卡片：复位
  document.addEventListener('mouseout', function (event) {
    var card = event.target.closest('.recent-post-item');
    if (!card) return;

    // 检查鼠标是否真的离开了卡片
    if (card.contains(event.relatedTarget)) return;

    card.style.transform = '';
    card.style.boxShadow = '';
    card.style.filter = '';

    var coverImg = card.querySelector('.post_cover img');
    if (coverImg) {
      coverImg.style.transform = '';
      coverImg.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease';
    }
  });

  // Pjax 页面切换后重新初始化
  document.addEventListener('pjax:complete', function () {
    setTimeout(updateCardCenters, 300);
  });

})();
