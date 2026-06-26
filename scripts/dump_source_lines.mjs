import { readFile } from 'node:fs/promises';
const html = await readFile('Workspace/Source/licht-website/index.html', 'utf8');
const text = html.replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,'\n').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\n\s*\n/g,'\n').trim();
const lines = text.split(/\n/).map(line => line.trim()).filter(Boolean);
for (let i=1; i<=230; i++) console.log(`${i}: ${lines[i-1] || ''}`);
