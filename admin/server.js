/**
 * JINGYU Blog Admin — 本地桌面管理工具
 * 启动: node admin/server.js
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const yaml = require('js-yaml');
const matter = require('gray-matter');

const app = express();
const PORT = 3000;
const ROOT = path.resolve(__dirname, '..');
// 密码从 .env 文件读取，不入 git 仓库
const envPath = path.join(__dirname, '.env');
const PASSWORD = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, 'utf-8').trim()
  : (process.env.ADMIN_PASSWORD || 'admin');

// ── 鉴权中间件 ──────────────────────────
const AUTH_TOKEN = 'jingyu-' + Math.random().toString(36).slice(2);

app.use(express.json());

// 鉴权检查（除登录和静态资源外）
app.use((req, res, next) => {
  if (req.path === '/api/login' || req.path === '/login.html' || req.path === '/login') return next();
  // 静态资源放行
  if (/\.(css|js|svg|png|jpg|gif|ico|woff|ttf)$/.test(req.path)) return next();
  if (req.path === '/favicon.ico') return next();

  const token = req.headers['x-auth-token'] || req.query.token;
  if (token !== AUTH_TOKEN) {
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
    return res.redirect('/login');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
// /login 路由 — 未登录时重定向到这里，直接返回登录页
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use('/preview', express.static(path.join(ROOT, 'public')));

// 登录路由
app.post('/api/login', (req, res) => {
  if (req.body.password === PASSWORD) {
    res.json({ success: true, token: AUTH_TOKEN });
  } else {
    res.status(401).json({ success: false, error: '密码错误' });
  }
});

// 图片上传
const imgStorage = multer.diskStorage({
  destination: path.join(ROOT, 'source', 'images'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage: imgStorage, limits: { fileSize: 20 * 1024 * 1024 } });

// ── API: 文章管理 ────────────────────────
const POSTS_DIR = path.join(ROOT, 'source', '_posts');

function listPosts() {
  return fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8');
      const { data, content } = matter(raw);
      return {
        filename: f,
        title: data.title || f.replace('.md', ''),
        date: data.date || '',
        tags: data.tags || [],
        categories: data.categories || '',
        description: data.description || '',
        cover: data.cover || '',
        content: content.trim(),
        raw
      };
    })
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

app.get('/api/posts', (req, res) => {
  res.json(listPosts());
});

app.get('/api/posts/:filename', (req, res) => {
  const filePath = path.join(POSTS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  res.json({ filename: req.params.filename, ...data, content: content.trim(), raw });
});

app.post('/api/posts', (req, res) => {
  const { title, date, tags, categories, description, cover, content } = req.body;
  const dateStr = date || new Date().toISOString().split('T')[0] + ' ' +
    new Date().toTimeString().slice(0, 8);

  let frontMatter = `---\ntitle: ${title || 'Untitled'}\ndate: ${dateStr}\n`;
  if (tags && tags.length) frontMatter += `tags: [${tags.join(', ')}]\n`;
  if (categories) frontMatter += `categories: ${categories}\n`;
  if (description) frontMatter += `description: ${description}\n`;
  if (cover) frontMatter += `cover: ${cover}\n`;
  frontMatter += `---\n\n${content || ''}`;

  const filename = (title || 'untitled')
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase() + '.md';

  fs.writeFileSync(path.join(POSTS_DIR, filename), frontMatter, 'utf-8');
  res.json({ success: true, filename, message: '文章已创建' });
});

app.put('/api/posts/:filename', (req, res) => {
  const filePath = path.join(POSTS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });

  const { title, date, tags, categories, description, cover, content } = req.body;
  let frontMatter = `---\ntitle: ${title || 'Untitled'}\ndate: ${date || new Date().toISOString()}\n`;
  if (tags && tags.length) frontMatter += `tags: [${tags.join(', ')}]\n`;
  if (categories) frontMatter += `categories: ${categories}\n`;
  if (description) frontMatter += `description: ${description}\n`;
  if (cover) frontMatter += `cover: ${cover}\n`;
  frontMatter += `---\n\n${content || ''}`;

  fs.writeFileSync(filePath, frontMatter, 'utf-8');
  res.json({ success: true, message: '文章已更新' });
});

app.delete('/api/posts/:filename', (req, res) => {
  const filePath = path.join(POSTS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(filePath);
  res.json({ success: true, message: '文章已删除' });
});

// ── API: 图片管理 ────────────────────────
const IMG_DIR = path.join(ROOT, 'source', 'images');

app.get('/api/images', (req, res) => {
  function walk(dir, base = '') {
    let results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.name.startsWith('.')) continue;
      const relPath = base + '/' + item.name;
      if (item.isDirectory()) {
        results = results.concat(walk(path.join(dir, item.name), relPath));
      } else {
        const stat = fs.statSync(path.join(dir, item.name));
        results.push({
          name: item.name,
          path: '/images' + relPath,
          cdn: `https://cdn.jsdelivr.net/gh/TintaiLouge/my-view-web@gh-pages/images${relPath}`,
          size: stat.size,
          mtime: stat.mtime
        });
      }
    }
    return results;
  }
  res.json(walk(IMG_DIR));
});

app.post('/api/images/upload', upload.array('images', 10), (req, res) => {
  const files = (req.files || []).map(f => ({
    name: f.filename,
    path: '/images/' + f.filename,
    cdn: 'https://cdn.jsdelivr.net/gh/TintaiLouge/my-view-web@gh-pages/images/' + f.filename
  }));
  res.json({ success: true, files, message: `${files.length} 张图片已上传` });
});

app.delete('/api/images/:name', (req, res) => {
  const filePath = path.join(IMG_DIR, req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(filePath);
  res.json({ success: true, message: '图片已删除' });
});

// ── API: 配置管理 ────────────────────────
app.get('/api/config', (req, res) => {
  const cfg = yaml.load(fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf-8'));
  const themeCfg = yaml.load(fs.readFileSync(path.join(ROOT, '_config.butterfly.yml'), 'utf-8'));
  res.json({ site: cfg, theme: themeCfg });
});

app.put('/api/config', (req, res) => {
  const { site, theme } = req.body;
  if (site) {
    const cfgPath = path.join(ROOT, '_config.yml');
    const orig = fs.readFileSync(cfgPath, 'utf-8');
    let updated = orig;
    for (const [key, val] of Object.entries(site)) {
      const regex = new RegExp(`^(${key}:\\s*).*`, 'm');
      if (regex.test(updated)) {
        updated = updated.replace(regex, `$1${typeof val === 'string' ? val : JSON.stringify(val)}`);
      }
    }
    fs.writeFileSync(cfgPath, updated, 'utf-8');
  }
  if (theme) {
    const cfgPath = path.join(ROOT, '_config.butterfly.yml');
    const orig = fs.readFileSync(cfgPath, 'utf-8');
    let updated = orig;
    for (const [key, val] of Object.entries(theme)) {
      const regex = new RegExp(`^(${key}:\\s*).*`, 'm');
      if (regex.test(updated)) {
        updated = updated.replace(regex, `$1${typeof val === 'string' ? val : JSON.stringify(val)}`);
      }
    }
    fs.writeFileSync(cfgPath, updated, 'utf-8');
  }
  res.json({ success: true, message: '配置已保存' });
});

// ── API: Hexo 操作 ────────────────────────
function runHexo(cmd) {
  return new Promise((resolve, reject) => {
    const proc = exec(cmd, { cwd: ROOT, maxBuffer: 1024 * 1024 });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => { stdout += d; });
    proc.stderr.on('data', d => { stderr += d; });
    proc.on('close', code => resolve({ code, stdout, stderr }));
    proc.on('error', reject);
  });
}

app.post('/api/hexo/generate', async (req, res) => {
  res.json({ status: 'running' });
  const result = await runHexo('hexo generate');
  console.log('Generate:', result.code === 0 ? 'OK' : 'FAIL');
});

app.post('/api/hexo/deploy', async (req, res) => {
  const gen = await runHexo('hexo clean && hexo generate');
  if (gen.code !== 0) return res.json({ success: false, message: '生成失败', log: gen.stderr });
  const dep = await runHexo('hexo deploy');
  res.json({
    success: dep.code === 0,
    message: dep.code === 0 ? '部署成功！1-2 分钟后生效' : '部署失败',
    log: dep.stdout + dep.stderr
  });
});

app.post('/api/hexo/preview', async (req, res) => {
  await runHexo('hexo generate');
  res.json({ success: true, url: 'http://localhost:4000/preview/' });
});

// ── 启动 ──────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   🎮 JINGYU Blog Admin Tool        ║');
  console.log(`  ║   http://localhost:${PORT}            ║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');

  // 自动打开浏览器
  const platform = process.platform;
  const url = `http://localhost:${PORT}`;
  if (platform === 'win32') exec(`start ${url}`);
  else if (platform === 'darwin') exec(`open ${url}`);
  else exec(`xdg-open ${url}`);
});
