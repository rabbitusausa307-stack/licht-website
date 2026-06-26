import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

const port = Number(process.env.PORT || 8888);
const root = process.cwd();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith('/.netlify/functions/')) {
      await handleFunction(url, res);
      return;
    }

    const filePath = resolveStaticPath(url.pathname);
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
    });
    res.end(body);
  } catch (error) {
    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end(error instanceof Error ? error.message : 'Not found');
  }
});

server.listen(port, () => {
  console.log(`Local dev server: http://localhost:${port}`);
});

function resolveStaticPath(pathname) {
  if (pathname === '/' || pathname === '') {
    return join(root, 'index.html');
  }

  if (pathname === '/article' || pathname === '/article/') {
    return join(root, 'article', 'index.html');
  }

  if (pathname.startsWith('/article/')) {
    return join(root, 'article', 'detail.html');
  }

  const normalized = normalize(pathname.replace(/^\/+/, ''));
  if (normalized.startsWith('..')) {
    throw new Error('Invalid path');
  }

  return join(root, normalized);
}

async function handleFunction(url, res) {
  const name = url.pathname.split('/').pop();
  const moduleUrl = pathToFileURL(join(root, 'netlify', 'functions', `${name}.cjs`)).href;
  const mod = await import(`${moduleUrl}?t=${Date.now()}`);
  const result = await mod.handler({
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
  });

  res.writeHead(result.statusCode, result.headers);
  res.end(result.body);
}
