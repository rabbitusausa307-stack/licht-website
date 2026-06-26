import { readFile } from 'node:fs/promises';

const [, , payloadPath] = process.argv;

if (!payloadPath) {
  throw new Error('Usage: npm run publish:article -- path/to/payload.json');
}

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;
const endpoint = process.env.MICROCMS_ENDPOINT || 'article';

if (!serviceDomain) {
  throw new Error('MICROCMS_SERVICE_DOMAIN is not configured.');
}

if (!apiKey) {
  throw new Error('MICROCMS_API_KEY is not configured.');
}

const payload = JSON.parse(await readFile(payloadPath, 'utf8'));

for (const field of ['title', 'slug', 'description', 'body', 'category']) {
  if (!payload[field]) {
    throw new Error(`Missing required field: ${field}`);
  }
}

const baseUrl = `https://${serviceDomain}.microcms.io/api/v1/${endpoint}`;
const headers = {
  'Content-Type': 'application/json',
  'X-MICROCMS-API-KEY': apiKey,
};

const existing = await fetch(
  `${baseUrl}?limit=1&filters=${encodeURIComponent(`slug[equals]${payload.slug}`)}`,
  { headers },
);

if (!existing.ok) {
  throw new Error(`Failed to check existing article: ${existing.status} ${await existing.text()}`);
}

const existingJson = await existing.json();
const current = Array.isArray(existingJson.contents) ? existingJson.contents[0] : null;

const url = current ? `${baseUrl}/${current.id}` : baseUrl;
const method = current ? 'PATCH' : 'POST';
const response = await fetch(url, {
  method,
  headers,
  body: JSON.stringify(payload),
});

if (!response.ok) {
  throw new Error(`Failed to publish article: ${response.status} ${await response.text()}`);
}

const result = await response.json();

console.log(JSON.stringify({
  action: current ? 'updated' : 'created',
  id: result.id,
  slug: payload.slug,
  url: `/article/${payload.slug}`,
}, null, 2));
