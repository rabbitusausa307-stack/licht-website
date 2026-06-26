import { access, cp, mkdir, readFile, rm } from 'node:fs/promises';

const requiredFiles = [
  'index.html',
  'thanks.html',
  'article/index.html',
  'article/detail.html',
  'assets/site.css',
  'assets/article.js',
  'netlify/functions/articles.cjs',
  'netlify/functions/article.cjs',
  'netlify.toml',
];

await Promise.all(requiredFiles.map((file) => access(file)));

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await mkdir('dist/article', { recursive: true });

await cp('index.html', 'dist/index.html');
await cp('thanks.html', 'dist/thanks.html');
await cp('article/index.html', 'dist/article/index.html');
await cp('article/detail.html', 'dist/article/detail.html');
await cp('assets', 'dist/assets', { recursive: true });
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

console.log('Build check passed.');
