document.addEventListener('DOMContentLoaded', async () => {
  // Load partials (nav, header/footer, etc.)
  const parts = document.querySelectorAll('[data-include]');
  await Promise.all([...parts].map(async el => {
    const url = el.getAttribute('data-include');
    const res = await fetch(url);
    el.innerHTML = await res.text();
  }));

  // NEW: signal that partials (like header/footer) are in the DOM
  window.dispatchEvent(new CustomEvent('partials:loaded'));

  // Mobile toggle (hero menu)
  const toggle = document.querySelector('.hero-nav-toggle');
  const menu = document.getElementById('hero-nav-menu');
  if (toggle && menu) {
    const setState = (open) => {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', () => setState(!menu.classList.contains('open')));
    // Close after clicking a link (mobile)
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setState(false)));
  }

  // Highlight active link (works for hero nav + any other nav)
  const here = location.pathname.replace(/\/+$/, '') || '/';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/+$/, '') || '/';
    if (href === here) a.setAttribute('aria-current', 'page');
  });
});