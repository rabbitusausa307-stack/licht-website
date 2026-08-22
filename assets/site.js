const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

if (toggle && nav) {
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  };

  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (nav.classList.contains('open') && !nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
  });
}

const consentedAt = document.querySelector('#consented-at');
const consultationForm = document.querySelector('#consultation-form');
const consultationResult = document.querySelector('#consultation-result');
if (consentedAt && consultationForm && consultationResult) {
  let submitting = false;
  let submissionTimeout;

  consultationForm.addEventListener('submit', () => {
    consentedAt.value = new Date().toISOString();
    submitting = true;
    const submitButton = consultationForm.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = submitButton.dataset.submittingLabel || '送信しています…';
      submitButton.setAttribute('aria-busy', 'true');
    }
    submissionTimeout = window.setTimeout(() => {
      submitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = '無料の学習相談に申し込む';
        submitButton.removeAttribute('aria-busy');
      }
      const status = document.querySelector('#form-status');
      if (status) status.textContent = '送信を確認できませんでした。通信環境を確認して、もう一度お試しください。';
    }, 20000);
  });

  consultationResult.addEventListener('load', () => {
    if (!submitting) return;
    submitting = false;
    window.clearTimeout(submissionTimeout);
    window.location.assign('/thanks.html');
  });
}
