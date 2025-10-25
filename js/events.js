(function () {
  if (window.__eventsInit) return;
  window.__eventsInit = true;

  // Utils
  const fmt = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit'
  });
  const formatSpan = (s, e) => {
    try {
      const start = new Date(s);
      const end = e ? new Date(e) : start;
      return (Intl.DateTimeFormat.prototype.formatRange)
        ? fmt.formatRange(start, end)
        : fmt.format(start);
    } catch { return s; }
  };
  const esc = (s) => (s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const simplifyLocation = (loc) => {
    if (!loc) return '';
    const parts = loc.split(',').map(s => s.trim());
    return parts.slice(0, 2).join(', '); // "Place, Street"
  };

  // NOTICE: single line, date/time in orange
  const updateNotice = (nextEv) => {
    const el = document.getElementById('hero-notice');
    if (!el) return false;

    if (!nextEv) {
      el.innerHTML = '📣 <strong>No upcoming events</strong> — check back soon.';
      return true;
    }

    const when  = formatSpan(nextEv.start, nextEv.end);
    const where = simplifyLocation(nextEv.location);
    const desc  = (nextEv.description || '').trim();

    // single line: Title • When • Where • Desc
    el.innerHTML =
      `📣 <strong>${esc(nextEv.summary)}</strong>` +
      ` • <span class="event-when accent">${esc(when)}</span>` +
      (where ? ` • <span class="event-where">${esc(where)}</span>` : '') +
      (desc  ? ` • <span class="event-desc">${esc(desc)}</span>` : '');

    return true;
  };

  // CARDS: each item on its own line, date/time in orange (no separators)
  const fillCard = (el, ev, label) => {
    if (!el) return;
    if (!ev) {
      el.innerHTML = `<h3>${esc(label)}</h3><p class="small">No event found.</p>`;
      return;
    }

    const when  = formatSpan(ev.start, ev.end);
    const where = simplifyLocation(ev.location);
    const desc  = (ev.description || '').trim();

    el.innerHTML = `
      <h3>${esc(label)}</h3>
      <div class="event-lines">
        <div class="event-title"><strong>${esc(ev.summary)}</strong></div>
        <div class="event-when accent">${esc(when)}</div>
        ${where ? `<div class="event-where">${esc(where)}</div>` : ''}
        ${desc  ? `<div class="event-desc">${esc(desc)}</div>` : ''}
      </div>
    `;
  };

  let dataCache = null;

  const renderEverywhere = () => {
    if (!dataCache) return;
    updateNotice(dataCache.next);
    fillCard(document.getElementById('next-event'), dataCache.next, 'Next Event');
    fillCard(document.getElementById('past-event-1'), dataCache.past?.[0] || null, 'Most Recent');
    fillCard(document.getElementById('past-event-2'), dataCache.past?.[1] || null, 'Previous');
  };

  const fetchData = () => {
    return fetch('/.netlify/functions/gcal-snapshot')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(j => { dataCache = j; renderEverywhere(); })
      .catch(() => {});
  };

  const waitForNotice = (tries = 20) => new Promise((resolve) => {
    const tick = () => {
      const ok = !!document.getElementById('hero-notice');
      if (ok) return resolve(true);
      if (tries <= 0) return resolve(false);
      setTimeout(() => { tries--; tick(); }, 150);
    };
    tick();
  });

  const start = async () => {
    fetchData();
    await waitForNotice();
    renderEverywhere();
  };

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });

  window.addEventListener('partials:loaded', renderEverywhere);
})();
