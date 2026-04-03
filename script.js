// Scroll reveal
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.pillar-card, .tl-item, .project-card, .contact-card, .section-head, .stats-strip, .hero, .principle-section')
  .forEach(el => { el.classList.add('reveal'); observer.observe(el); });

// Mobile nav toggle
const toggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
toggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  toggle?.setAttribute('aria-expanded', false);
}));

// Contact form
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Sending...';
  btn.disabled = true;
  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      status.textContent = 'Message sent. I\'ll be in touch.';
      form.reset();
    } else {
      status.textContent = 'Something went wrong. Try emailing directly.';
    }
  } catch {
    status.textContent = 'Network error. Try emailing directly.';
  } finally {
    btn.textContent = 'Send message';
    btn.disabled = false;
  }
});
