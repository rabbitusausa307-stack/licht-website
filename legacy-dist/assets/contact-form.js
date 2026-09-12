const contactForm = document.querySelector('#contact-form');

if (contactForm) {
  const autoresponse = contactForm.elements._autoresponse;

  contactForm.addEventListener('submit', () => {
    const applicantName = contactForm.elements.name.value.trim() || 'お客様';

    autoresponse.value = `${applicantName} 様

この度は、LICHTの無料相談にお申し込みいただき、誠にありがとうございます。

担当の佐藤です。

無料相談では、現在の学習状況やお悩み、志望校などについてお聞きしながら、今後の勉強方法を一緒に考えていければと思っております。

相談はオンラインでの実施を予定しております。お申し込み日から3日間のうち、19:00〜20:00の時間帯でご相談できればと考えております。

ご都合が合わない場合は、お手数ですがこのメールにご返信ください。ご不明な点などございましたら、お気軽にご連絡ください。

それでは、ご返信をお待ちしております。

LICHT代表 佐藤`;
  });
}
