const contactForm = document.querySelector('[data-contact-form]');

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const button = contactForm.querySelector('button[type="submit"]');
    const status = contactForm.querySelector('[data-contact-status]');
    const formData = new FormData(contactForm);

    button.disabled = true;
    status.textContent = '送信しています。';
    status.className = 'form-status';

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new URLSearchParams(formData),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || '送信に失敗しました。');
      }

      contactForm.reset();
      status.textContent = data.message || '送信しました。2営業日以内にご連絡いたします。';
      status.className = 'form-status success';
    } catch (error) {
      status.textContent = error.message;
      status.className = 'form-status error-text';
    } finally {
      button.disabled = false;
    }
  });
}
