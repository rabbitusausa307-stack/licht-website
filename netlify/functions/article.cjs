const ENDPOINT = 'article';

exports.handler = async (event) => {
  const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;
  const slug = event.queryStringParameters && event.queryStringParameters.slug;

  if (!serviceDomain) {
    return json(500, {
      message: 'MICROCMS_SERVICE_DOMAIN is not configured.',
    });
  }

  if (!apiKey) {
    return json(500, {
      message: 'MICROCMS_API_KEY is not configured.',
    });
  }

  if (!slug) {
    return json(400, {
      message: 'slug is required.',
    });
  }

  const url = new URL(`https://${serviceDomain}.microcms.io/api/v1/${ENDPOINT}`);
  url.searchParams.set('limit', '1');
  url.searchParams.set('filters', `slug[equals]${slug}`);

  try {
    const response = await fetch(url, {
      headers: {
        'X-MICROCMS-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      return json(response.status, {
        message: 'Failed to fetch the article from microCMS.',
        detail: await response.text(),
      });
    }

    const data = await response.json();
    const article = Array.isArray(data.contents) ? data.contents[0] : null;

    if (!article) {
      return json(404, {
        message: '記事が見つかりません。',
      });
    }

    return json(200, article);
  } catch (error) {
    return json(500, {
      message: 'Unexpected error while fetching the article.',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': statusCode === 200 ? 'public, max-age=60, s-maxage=300' : 'no-store',
    },
    body: JSON.stringify(body),
  };
}
