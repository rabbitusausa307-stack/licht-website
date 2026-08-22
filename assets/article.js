const detailRoot = document.querySelector('#article-detail');
const formatter = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });

if (document.body.dataset.page === 'article-detail' && detailRoot) renderDetail();

async function renderDetail() {
  const slug = decodeURIComponent(location.pathname.replace(/^\/article\/?/, '').replace(/\/$/, ''));
  if (!slug || slug === 'detail.html') {
    showError('記事のURLが正しくありません。');
    return;
  }

  try {
    const article = await fetchJson(`/.netlify/functions/article?slug=${encodeURIComponent(slug)}`);
    document.title = `${article.title || '記事'} | LICHT`;
    const description = document.querySelector('meta[name="description"]');
    if (description && article.description) description.setAttribute('content', article.description);
    detailRoot.innerHTML = `
      <header class="article-detail-head">
        <div class="article-meta">
          ${article.category ? `<span class="article-category">${escapeHtml(article.category)}</span>` : ''}
          ${article.publishedAt ? `<time class="article-date" datetime="${escapeAttr(article.publishedAt)}">${formatDate(article.publishedAt)}</time>` : ''}
        </div>
        <h1>${escapeHtml(article.title || '無題の記事')}</h1>
        ${article.description ? `<p class="section-lead">${escapeHtml(article.description)}</p>` : ''}
      </header>
      ${getThumbnailUrl(article) ? `<img class="article-thumbnail" src="${escapeAttr(getThumbnailUrl(article))}" alt="" loading="eager">` : ''}
      <div class="article-body">${article.body || '<p>本文は準備中です。</p>'}</div>
      <a class="back-link" href="/article/">記事一覧へ戻る</a>`;
  } catch (error) {
    showError(error.message || '記事の取得に失敗しました。');
  }
}

async function fetchJson(url) {
  const requestUrl = new URL(url, location.origin);
  requestUrl.searchParams.set('_', Date.now().toString());

  const response = await fetch(requestUrl.toString(), {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || (response.status === 404 ? '記事が見つかりません。' : '記事の取得に失敗しました。'));
  return data;
}

function showError(message) {
  detailRoot.innerHTML = `<div class="error" role="alert"><p>${escapeHtml(message)}</p><a class="text-link" href="/article/">記事一覧へ戻る →</a></div>`;
}

function getThumbnailUrl(article) {
  return article.thumbnail?.url || '';
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : formatter.format(date);
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
