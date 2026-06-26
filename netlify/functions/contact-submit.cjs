const OWNER_EMAIL = process.env.CONTACT_TO_EMAIL || 'rabbitusausa307@gmail.com';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { message: 'Method not allowed.' });
  }

  const payload = parseBody(event);

  if (payload['bot-field']) {
    return json(200, { message: '送信しました。' });
  }

  const name = clean(payload.name);
  const grade = clean(payload.grade);
  const email = clean(payload.email || payload.contact);
  const lineId = clean(payload.lineId);
  const subject = clean(payload.subject);
  const message = clean(payload.message);

  if (!name || !grade || !email || !isEmail(email)) {
    return json(400, { message: 'お名前・学年・メールアドレスを正しく入力してください。' });
  }

  const from = process.env.CONTACT_FROM_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;

  if (!from || !apiKey) {
    return json(500, {
      message: 'メール送信設定が未完了です。NetlifyにRESEND_API_KEYとCONTACT_FROM_EMAILを設定してください。',
    });
  }

  const submittedAt = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const ownerText = [
    'LICHT公式サイトから無料相談の申し込みがありました。',
    '',
    `送信日時: ${submittedAt}`,
    `お名前: ${name}`,
    `学年: ${grade}`,
    `メール: ${email}`,
    `LINE ID: ${lineId || '未入力'}`,
    '',
    '苦手な教科・相談内容:',
    subject || '未入力',
    '',
    'ご質問・ご要望:',
    message || '未入力',
  ].join('\n');

  const replyText = [
    `${name} 様`,
    '',
    'LICHTの無料相談にお申し込みいただき、ありがとうございます。',
    '内容を確認のうえ、2営業日以内にご連絡いたします。',
    '',
    '送信内容',
    `お名前: ${name}`,
    `学年: ${grade}`,
    `メール: ${email}`,
    `LINE ID: ${lineId || '未入力'}`,
    '',
    '苦手な教科・相談内容:',
    subject || '未入力',
    '',
    'ご質問・ご要望:',
    message || '未入力',
    '',
    'LICHT',
    'https://licht-juku.com/',
  ].join('\n');

  await sendEmail({
    apiKey,
    from,
    to: OWNER_EMAIL,
    replyTo: email,
    subject: `【LICHT無料相談】${name}様から申し込みがありました`,
    text: ownerText,
  });

  await sendEmail({
    apiKey,
    from,
    to: email,
    replyTo: OWNER_EMAIL,
    subject: '【LICHT】無料相談のお申し込みを受け付けました',
    text: replyText,
  });

  return json(200, { message: '送信しました。2営業日以内にご連絡いたします。' });
};

function parseBody(event) {
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  const body = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || '';

  if (contentType.includes('application/json')) {
    return JSON.parse(body || '{}');
  }

  return Object.fromEntries(new URLSearchParams(body));
}

function clean(value) {
  return String(value || '').trim();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sendEmail({ apiKey, from, to, replyTo, subject, text }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: replyTo,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'メール送信に失敗しました。');
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  };
}
