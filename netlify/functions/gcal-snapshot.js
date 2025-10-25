// netlify/functions/gcal-snapshot.js
exports.handler = async function () {
  const key = (process.env.GCAL_API_KEY || '').trim();
  console.log('[gcal] key prefix:', key.slice(0,6));
  const cal = process.env.GCAL_ID;

  if (!key || !cal) {
    console.error('Missing env', { hasKey: !!key, hasCal: !!cal });
    return { statusCode: 500, body: 'Missing GCAL_API_KEY or GCAL_ID' };
  }

  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal)}/events`;
  const nowISO = new Date().toISOString();

  const qs = (params) => new URLSearchParams(params).toString();

  const call = async (params) => {
    const url = `${base}?${qs({ key, singleEvents: 'true', orderBy: 'startTime', ...params })}`;
    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      console.error('Calendar fetch failed', r.status, text);
      throw new Error(`Calendar fetch failed: ${r.status}`);
    }
    return r.json();
  };

  const simplify = (ev) => ({
    id: ev.id,
    summary: ev.summary || '',
    location: ev.location || '',
    description: ev.description || '',
    start: ev.start?.dateTime || ev.start?.date || null,
    end: ev.end?.dateTime || ev.end?.date || null,
    htmlLink: ev.htmlLink || null,
  });

  try {
    const upcoming = await call({ timeMin: nowISO, maxResults: 1 });
    const next = (upcoming.items && upcoming.items[0]) ? simplify(upcoming.items[0]) : null;

    const pastBatch = await call({ timeMax: nowISO, maxResults: 50 });
    const past = (pastBatch.items || [])
      .map(simplify)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .filter(e => (e.end ? new Date(e.end) <= new Date(nowISO) : new Date(e.start) <= new Date(nowISO)))
      .slice(-2)
      .reverse();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({ next, past }),
    };
  } catch (e) {
    console.error('Function error', e);
    return { statusCode: 502, body: 'Bad gateway' };
  }
};