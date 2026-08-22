import { access, cp, mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { execFileSync } from 'node:child_process';

const requiredFiles = [
  'index.html',
  'service.html',
  'thanks.html',
  'reverse-lesson.html',
  'schedule-management.html',
  'privacy.html',
  'legal.html',
  'article/index.html',
  'article/detail.html',
  'article/hiroshima-university-entrance-exam/index.html',
  'assets/licht-modern.css',
  'assets/site.js',
  'assets/article.js',
  'netlify/functions/articles.cjs',
  'netlify/functions/article.cjs',
  'api/articles.js',
  'api/article.js',
  'vercel.json',
  'netlify.toml',
];

await Promise.all(requiredFiles.map((file) => access(file)));

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await mkdir('dist/article', { recursive: true });

await cp('index.html', 'dist/index.html');
await cp('service.html', 'dist/service.html');
await cp('thanks.html', 'dist/thanks.html');
await cp('reverse-lesson.html', 'dist/reverse-lesson.html');
await cp('schedule-management.html', 'dist/schedule-management.html');
await cp('privacy.html', 'dist/privacy.html');
await cp('legal.html', 'dist/legal.html');
await cp('article/index.html', 'dist/article/index.html');
await cp('article/detail.html', 'dist/article/detail.html');
await mkdir('dist/article/hiroshima-university-entrance-exam', { recursive: true });
await cp('article/hiroshima-university-entrance-exam/index.html', 'dist/article/hiroshima-university-entrance-exam/index.html');
await mkdir('dist/assets', { recursive: true });
const publishedAssets = new Set();
for (const file of requiredFiles.filter((item) => item.endsWith('.html'))) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/(?:href|src)=["'](?:\/|\.\.\/)*assets\/([^"']+)["']/gi)) {
    publishedAssets.add(match[1].split(/[?#]/)[0]);
  }
}
for (const file of requiredFiles.filter((item) => item.endsWith('.css'))) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi)) {
    const target = match[2].split(/[?#]/)[0];
    if (/^(?:https?:|data:|\/)/i.test(target)) continue;
    const asset = normalize(join(dirname(file), target)).replace(/^assets[\\/]/, '').replaceAll('\\', '/');
    publishedAssets.add(asset);
  }
}
for (const asset of publishedAssets) {
  await mkdir(dirname(join('dist/assets', asset)), { recursive: true });
  await cp(join('assets', asset), join('dist/assets', asset));
}
await cp('_redirects', 'dist/_redirects');

const functionSources = [
  await readFile('netlify/functions/articles.cjs', 'utf8'),
  await readFile('netlify/functions/article.cjs', 'utf8'),
];

for (const functionSource of functionSources) {
  if (!functionSource.includes('process.env.MICROCMS_API_KEY')) {
    throw new Error('MICROCMS_API_KEY must be read from Netlify environment variables.');
  }

  if (!functionSource.includes('process.env.MICROCMS_SERVICE_DOMAIN')) {
    throw new Error('MICROCMS_SERVICE_DOMAIN must be read from Netlify environment variables.');
  }

  if (functionSource.includes('X-MICROCMS-API-KEY:')) {
    throw new Error('Do not hard-code the microCMS API key.');
  }
}

const htmlFiles = requiredFiles.filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const source = await readFile(file, 'utf8');
  if (/href=["']#["']|href=["']["']|javascript:/i.test(source)) {
    throw new Error(`${file} contains a dummy link.`);
  }
  if (source.includes('�')) {
    throw new Error(`${file} contains replacement characters.`);
  }
  const localTargets = [...source.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const target of localTargets) {
    if (/^(?:https?:|mailto:|tel:|#|data:)/i.test(target)) continue;
    const [pathname] = target.split(/[?#]/);
    let resolved = pathname.startsWith('/') ? pathname.slice(1) : join(dirname(file), pathname);
    resolved = normalize(resolved || 'index.html');
    if (resolved.endsWith('/') || !resolved.split('/').at(-1).includes('.')) resolved = join(resolved, 'index.html');
    try {
      await access(resolved);
    } catch {
      throw new Error(`${file} links to missing local file: ${target} (${resolved})`);
    }
  }
}

const indexSource = await readFile('index.html', 'utf8');
for (const requirement of [
  'https://formsubmit.co/lichthirodai2026@gmail.com',
  'name="_autoresponse"',
  'target="consultation-result"',
  'name="privacy-consent"',
  'service.html',
  'article/',
]) {
  if (!indexSource.includes(requirement)) {
    throw new Error(`index.html is missing required integration: ${requirement}`);
  }
}

for (const file of ['assets/article.js', 'assets/site.js', 'api/articles.js', 'api/article.js', 'scripts/dev-server.mjs']) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  const source = await readFile(file, 'utf8');
  if (source.includes('�')) throw new Error(`${file} contains replacement characters.`);
}

console.log('Build check passed.');
