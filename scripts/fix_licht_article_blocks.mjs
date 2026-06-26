const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;
const endpoint = 'article';

if (!serviceDomain || !apiKey) {
  throw new Error('MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY are required.');
}

const baseUrl = `https://${serviceDomain}.microcms.io/api/v1/${endpoint}`;
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-MICROCMS-API-KEY': apiKey,
};

const lichtBlock = '<h2>LICHTについて</h2><p>LICHTは、地方国公立大学を目指す高校生のための受験専門塾です。志望校合格から逆算して、今やるべき勉強を明確にし、一人ひとりに合わせた学習計画と面談で合格まで伴走します。</p><p>LICHTの大きな特徴は、ただ先生の説明を聞くだけの授業ではなく、生徒自身が「なぜそうなるのか」を説明する逆授業を取り入れていることです。問題の解き方を聞いて終わるのではなく、自分の言葉で説明することで、理解の浅い部分や曖昧な知識がはっきりします。</p><p>受験勉強では、「わかったつもり」が一番危険です。LICHTでは、逆授業を通して本当に理解できているかを確認しながら、共通テスト・二次試験・推薦入試に必要な力を着実に伸ばしていきます。</p><p>勉強のやり方がわからない人、頑張っているのに成績が伸びない人、地方国公立大学に本気で合格したい人に向けて、LICHTは戦略と対話で受験をサポートします。</p><p><a href="https://licht-juku.com/">LICHT公式サイト</a></p>';

const listResponse = await fetch(`${baseUrl}?limit=100&fields=id,title,slug,body`, { headers });
if (!listResponse.ok) {
  throw new Error(`Failed to list articles: ${listResponse.status} ${await listResponse.text()}`);
}

const list = await listResponse.json();
const results = [];

for (const article of list.contents || []) {
  const body = article.body || '';
  const footerStart = findLichtFooterStart(body);
  const cleanedBody = footerStart >= 0 ? body.slice(0, footerStart).trimEnd() : body.trimEnd();
  const nextBody = `${cleanedBody}${lichtBlock}`;

  const response = await fetch(`${baseUrl}/${article.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ body: nextBody }),
  });

  if (!response.ok) {
    results.push({
      slug: article.slug,
      status: 'failed',
      detail: await response.text(),
    });
    continue;
  }

  results.push({
    slug: article.slug,
    status: 'updated',
    removedFooter: footerStart >= 0,
  });
}

console.log(JSON.stringify(results, null, 2));

function findLichtFooterStart(body) {
  const markers = [
    '>LICHTについて</h2>',
    '>LICHT????</h2>',
    '>LICHT?????</h2>',
  ];

  const positions = markers
    .map((marker) => body.indexOf(marker))
    .filter((position) => position >= 0);

  if (positions.length === 0) {
    return -1;
  }

  const markerPosition = Math.min(...positions);
  return body.lastIndexOf('<h2', markerPosition);
}
