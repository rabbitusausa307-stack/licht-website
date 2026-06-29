const listRoot = document.querySelector('#article-list');
const detailRoot = document.querySelector('#article-detail');
const homeArticlesRoot = document.querySelector('#home-articles');

const formatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

if (document.body.dataset.page === 'article-list') {
  renderList();
}

if (document.body.dataset.page === 'article-detail') {
  renderDetail();
}

if (homeArticlesRoot) {
  renderHomeArticles();
}

async function renderHomeArticles() {
  try {
    const data = await fetchJson('/.netlify/functions/articles');
    const articles = Array.isArray(data.contents) ? data.contents : [];
    const limit = Number(homeArticlesRoot.dataset.limit || 3);

    if (articles.length === 0) {
      homeArticlesRoot.innerHTML = '<p class="empty">公開中の記事はまだありません。</p>';
      return;
    }

    homeArticlesRoot.innerHTML = articles.slice(0, limit).map(renderArticleCard).join('');
  } catch (error) {
    homeArticlesRoot.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
}

async function renderList() {
  try {
    const data = await fetchJson('/.netlify/functions/articles');
    const articles = Array.isArray(data.contents) ? data.contents : [];

    if (articles.length === 0) {
      listRoot.innerHTML = '<p class="empty">公開中の記事はまだありません。</p>';
      return;
    }

    listRoot.innerHTML = renderCategorySections(articles);
  } catch (error) {
    listRoot.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
}

async function renderDetail() {
  const slug = decodeURIComponent(location.pathname.replace(/^\/article\/?/, '').replace(/\/$/, ''));

  if (!slug || slug === 'detail.html') {
    detailRoot.innerHTML = '<p class="error">記事のURLが正しくありません。</p>';
    return;
  }

  try {
    const article = await fetchJson(`/.netlify/functions/article?slug=${encodeURIComponent(slug)}`);
    const articleBody = article.body || '';
    document.title = `${article.title || '記事'}｜LICHT`;

    const description = document.querySelector('meta[name="description"]');
    if (description && article.description) {
      description.setAttribute('content', article.description);
    }

    detailRoot.innerHTML = `
      <header class="article-detail-head">
        <div class="article-meta">
          ${article.category ? `<span class="article-category">${escapeHtml(article.category)}</span>` : ''}
          <time class="article-date" datetime="${escapeAttr(article.publishedAt || '')}">${formatDate(article.publishedAt)}</time>
        </div>
        <h1>${escapeHtml(article.title || '無題の記事')}</h1>
        ${article.description ? `<p class="section-lead">${escapeHtml(article.description)}</p>` : ''}
      </header>
      ${getThumbnailUrl(article) ? `<img class="article-thumbnail" src="${escapeAttr(getThumbnailUrl(article))}" alt="">` : ''}
      <div class="article-body">${articleBody}</div>
      <a class="back-link" href="/article/">記事一覧へ戻る</a>
    `;
  } catch (error) {
    detailRoot.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
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

  if (!response.ok) {
    throw new Error(data.message || '記事の取得に失敗しました。');
  }

  return data;
}

function renderCategorySections(articles) {
  const groups = articles.reduce((acc, article) => {
    const category = article.category || 'その他';
    if (!acc.has(category)) {
      acc.set(category, []);
    }
    acc.get(category).push(article);
    return acc;
  }, new Map());

  return Array.from(groups.entries()).map(([category, categoryArticles]) => `
    <section class="article-category-section">
      <div class="article-category-head">
        <p class="section-kicker">CATEGORY</p>
        <h2>${escapeHtml(category)}</h2>
      </div>
      <div class="article-grid">
        ${categoryArticles.map(renderArticleCard).join('')}
      </div>
    </section>
  `).join('');
}

function renderArticleCard(article) {
  return `
    <a class="article-card" href="/article/${escapeAttr(article.slug || article.id)}">
      ${getThumbnailUrl(article) ? `<img class="article-card-image" src="${escapeAttr(getThumbnailUrl(article))}" alt="">` : ''}
      <div class="article-meta">
        ${article.category ? `<span class="article-category">${escapeHtml(article.category)}</span>` : ''}
        <time class="article-date" datetime="${escapeAttr(article.publishedAt || '')}">${formatDate(article.publishedAt)}</time>
      </div>
      <h2>${escapeHtml(article.title || '無題の記事')}</h2>
      ${article.description ? `<p>${escapeHtml(article.description)}</p>` : ''}
    </a>
  `;
}

function getThumbnailUrl(article) {
  return article.thumbnail && article.thumbnail.url ? article.thumbnail.url : '';
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return formatter.format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
