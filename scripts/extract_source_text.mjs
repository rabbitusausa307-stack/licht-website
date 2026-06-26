import { readFile } from 'node:fs/promises';

const html = await readFile('Workspace/Source/licht-website/index.html', 'utf8');
const text = html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\n\s*\n/g, '\n')
  .trim();

const keywords = [
  'LICHT',
  '地方',
  '逆授業',
  'スケジュール',
  '料金',
  '月額',
  '円',
  '塾長',
  '代表',
  'プロフィール',
  '無料',
  '相談',
  'LINE',
  '入会',
  '偏差値',
  '基礎',
  '標準',
  '広島',
  '難関',
  '合格',
  '年間',
  '税込',
];

const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
for (const [index, line] of lines.entries()) {
  if (keywords.some((keyword) => line.includes(keyword))) {
    console.log(`${index + 1}: ${line}`);
  }
}
