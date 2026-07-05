/**
 * 每次生成后自动创建 .nojekyll，防止 GitHub Pages 用 Jekyll 处理 Hexo 页面
 */
hexo.extend.generator.register('nojekyll', function (locals) {
  return {
    path: '.nojekyll',
    data: ''
  };
});
