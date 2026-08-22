import netlifyModule from '../netlify/functions/article.cjs';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const result = await netlifyModule.handler({
      queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    });

    return new Response(result.body, {
      status: result.statusCode,
      headers: result.headers,
    });
  },
};
