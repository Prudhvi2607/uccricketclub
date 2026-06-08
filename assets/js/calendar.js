(function () {
  // ── Config ─────────────────────────────────────────────────────────────────
  const SEASON_START_MONTH = 3;  // April (0-indexed)
  const SEASON_END_MONTH   = 9;  // October

  // Event type metadata — used for dot colors and badges
  const EVENT_TYPES = {
    practice: { label: 'Practice', dotClass: 'cal-dot-practice' },
    game:     { label: 'Game',     dotClass: 'cal-dot-game'     },
    social:   { label: 'Social',   dotClass: 'cal-dot-social'   },
  };

  const DEFAULT_PRACTICE = {
    weekday:   4,                   // Thursday (0 = Sunday)
    startTime: '5:30 PM',
    endTime:   '8:00 PM',
    title:     'Batting & Bowling Practice',
    location:  'Miami Meadows Park',
    address:   '1546B OH-131, Milford, OH 45150',
    mapUrl:    'https://maps.google.com/?q=Miami+Meadows+Park+1546B+OH-131+Milford+OH+45150',
    type:      'practice',
  };

  // Set this to your Club-OS API endpoint to enable live updates.
  // Expected GET response:
  //   { cancellations: ["YYYY-MM-DD", ...], extraEvents: [{ id, date, title,
  //     startTime, endTime, location, address, mapUrl, type, note? }] }
  const CALENDAR_API_URL = null;

  // ── State ──────────────────────────────────────────────────────────────────
  const today        = new Date();
  let   viewDate     = new Date(today.getFullYear(), today.getMonth(), 1);
  let   cancellations = new Set();
  let   extraEvents   = [];
  let   selectedDate  = null;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function pad(n) { return String(n).padStart(2, '0'); }

  function toKey(year, month, day) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }

  function isInSeason(month) {
    return month >= SEASON_START_MONTH && month <= SEASON_END_MONTH;
  }

  function defaultEventsForMonth(year, month) {
    if (!isInSeason(month)) return [];
    const events = [];
    const days = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      if (new Date(year, month, d).getDay() === DEFAULT_PRACTICE.weekday) {
        const key = toKey(year, month, d);
        events.push({ ...DEFAULT_PRACTICE, id: key, date: key, cancelled: cancellations.has(key) });
      }
    }
    return events;
  }

  function eventsForMonth(year, month) {
    const defaults = defaultEventsForMonth(year, month);
    const extras   = extraEvents.filter(e => {
      const [ey, em] = e.date.split('-').map(Number);
      return ey === year && em - 1 === month;
    });
    return [...defaults, ...extras].sort((a, b) => a.date.localeCompare(b.date));
  }

  function upcomingEvents() {
    const todayKey    = toKey(today.getFullYear(), today.getMonth(), today.getDate());
    const cutoff      = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);
    const cutoffKey   = toKey(cutoff.getFullYear(), cutoff.getMonth(), cutoff.getDate());
    const result      = [];
    for (let offset = 0; offset < 3; offset++) {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      for (const e of eventsForMonth(d.getFullYear(), d.getMonth())) {
        if (e.date >= todayKey && e.date <= cutoffKey) result.push(e);
      }
    }
    return result;
  }

  // ── Render calendar grid ───────────────────────────────────────────────────
  function renderCalendar() {
    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const byDate = {};
    eventsForMonth(year, month).forEach(e => { byDate[e.date] = e; });
    const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

    document.getElementById('cal-month-label').textContent =
      viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Season badge
    const badge = document.getElementById('cal-season-badge');
    if (isInSeason(month)) {
      badge.textContent = 'Season Active';
      badge.className = 'cal-season-badge cal-season-active';
    } else {
      badge.textContent = 'Off Season';
      badge.className = 'cal-season-badge cal-season-off';
    }

    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    const firstDay  = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement('div');
      blank.className = 'cal-cell cal-blank';
      grid.appendChild(blank);
    }

    for (let d = 1; d <= daysCount; d++) {
      const key   = toKey(year, month, d);
      const event = byDate[key];
      const cell  = document.createElement('div');

      let cls = 'cal-cell';
      if (key === todayKey)    cls += ' cal-today-cell';
      if (event)               cls += event.cancelled ? ' cal-has-event cal-cancelled-event' : ' cal-has-event';
      if (selectedDate === key) cls += ' cal-selected';

      cell.className = cls;
      const dotClass = event
        ? (event.cancelled ? 'cal-dot cal-dot-cancelled' : `cal-dot ${(EVENT_TYPES[event.type] || EVENT_TYPES.practice).dotClass}`)
        : '';
      cell.innerHTML =
        `<span class="cal-day-num">${d}</span>` +
        (event ? `<span class="${dotClass}"></span>` : '');

      if (event) {
        cell.addEventListener('click', () => showDetail(event, key));
      } else {
        cell.addEventListener('click', hideDetail);
      }
      grid.appendChild(cell);
    }

    renderUpcoming();
  }

  // ── Render upcoming sidebar ────────────────────────────────────────────────
  function renderUpcoming() {
    const container = document.getElementById('cal-upcoming');
    const events    = upcomingEvents(6);

    if (!events.length) {
      container.innerHTML = '<p class="cal-empty">No events in the next 2 weeks.</p>';
      return;
    }

    container.innerHTML = events.map(e => {
      const d        = new Date(e.date + 'T00:00:00');
      const dStr     = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const typeInfo = EVENT_TYPES[e.type] || EVENT_TYPES.practice;
      return `
        <div class="cal-upcoming-item${e.cancelled ? ' cal-upcoming-cancelled' : ''}" data-date="${e.date}">
          <div class="cal-upcoming-date">
            ${dStr}
            <span class="cal-type-pill cal-type-${e.type || 'practice'}">${typeInfo.label}</span>
          </div>
          <div class="cal-upcoming-title">${e.title}${e.cancelled ? ' <span class="cal-badge-cancelled">Cancelled</span>' : ''}</div>
          <div class="cal-upcoming-time">${e.startTime} – ${e.endTime}</div>
          <div class="cal-upcoming-loc"><a href="${e.mapUrl}" target="_blank" rel="noopener">${e.location}</a></div>
        </div>`;
    }).join('');

    container.querySelectorAll('.cal-upcoming-item').forEach(item => {
      const date  = item.dataset.date;
      const [y, m] = date.split('-').map(Number);
      const event  = eventsForMonth(y, m - 1).find(e => e.date === date);
      if (!event) return;
      item.addEventListener('click', () => {
        viewDate     = new Date(y, m - 1, 1);
        selectedDate = date;
        renderCalendar();
        showDetail(event, date, false);
      });
    });
  }

  // ── Event detail panel ─────────────────────────────────────────────────────
  function showDetail(event, key, rerender = true) {
    selectedDate = key;
    if (rerender) renderCalendar();

    const d    = new Date(event.date + 'T00:00:00');
    const dStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.practice;
    const panel = document.getElementById('cal-detail');
    panel.style.display = 'block';
    panel.innerHTML = `
      <div class="cal-detail-inner">
        <div class="cal-detail-head">
          <div>
            <div class="cal-detail-date">
              ${dStr}
              <span class="cal-type-pill cal-type-${event.type || 'practice'}">${typeInfo.label}</span>
            </div>
            <div class="cal-detail-title">
              ${event.title}
              ${event.cancelled ? '<span class="cal-badge-cancelled">Cancelled</span>' : ''}
            </div>
          </div>
          <button class="cal-detail-close" id="cal-detail-close" aria-label="Close">&#215;</button>
        </div>
        ${event.cancelled ? `
          <div class="cal-detail-alert">
            This event has been cancelled. Check our Instagram or email for updates.
          </div>` : ''}
        ${event.note ? `<div class="cal-detail-note">${event.note}</div>` : ''}
        <div class="cal-detail-meta">
          <div class="cal-meta-row">
            <span class="cal-meta-label">Time</span>
            <span>${event.startTime} – ${event.endTime}</span>
          </div>
          <div class="cal-meta-row">
            <span class="cal-meta-label">Location</span>
            <span>
              <a href="${event.mapUrl}" target="_blank" rel="noopener">${event.location}</a>
              <br><small>${event.address}</small>
            </span>
          </div>
        </div>
        <a href="${event.mapUrl}" target="_blank" rel="noopener" class="cal-map-link">
          View on Google Maps →
        </a>
      </div>`;

    document.getElementById('cal-detail-close').addEventListener('click', hideDetail);

    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideDetail() {
    selectedDate = null;
    const panel = document.getElementById('cal-detail');
    panel.style.display = 'none';
    renderCalendar();
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  async function init() {
    if (CALENDAR_API_URL) {
      try {
        const res  = await fetch(CALENDAR_API_URL, { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        if (Array.isArray(data.cancellations)) cancellations = new Set(data.cancellations);
        if (Array.isArray(data.extraEvents))   extraEvents   = data.extraEvents;
      } catch (err) {
        console.warn('[UCCC Calendar] API unavailable, using defaults:', err.message);
      }
    }

    document.getElementById('cal-prev').addEventListener('click', () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      hideDetail();
    });
    document.getElementById('cal-next').addEventListener('click', () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      hideDetail();
    });
    document.getElementById('cal-today-btn').addEventListener('click', () => {
      viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
      hideDetail();
    });

    renderCalendar();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
