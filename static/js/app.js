// ============================================================
// STATE
// ============================================================
let currentUser = null;
let loginRole = 'member';
let selectedEventId = null;
let events = [];
let resources = [];
let uploadedFiles = [];

// ============================================================
// INIT
// ============================================================
window.onload = async () => {
  const lp = document.getElementById('landing-page');
  const dl = document.getElementById('dashboard-layout');

  // ── Restore session FIRST (before any async) so there's no flash ──
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUserUI();
    if (lp) lp.style.display = 'none';
    if (dl) dl.style.display = 'flex';
    showPage('home');
  } else {
    if (lp) lp.style.display = 'block';
    if (dl) dl.style.display = 'none';
  }

  // ── Then load data in parallel ──
  await Promise.all([
    loadEventsFromBackend(),
    loadResourcesFromBackend(),
    loadResourceFilters(),
    loadAnnouncements()
  ]);
  updateStats();

  if (currentUser) {
    loadDashboardData();
    await loadRecommendations();
    await loadAnnouncements(); // reload so admin buttons appear
  }
};


// ============================================================
// AUTH
// ============================================================
function openLogin() { document.getElementById('loginModal').classList.add('open'); }
function closeLogin() { document.getElementById('loginModal').classList.remove('open'); }
function setLoginRole(role, el) {
  loginRole = role;
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');

  const emailInput = document.getElementById('loginEmail');
  const subtitle = document.getElementById('authSubtitle');
  if (role === 'core') {
    emailInput.placeholder = 'admin@orca.club';
    if (subtitle) subtitle.innerText = 'Sign in to access your admin dashboard';
  } else {
    emailInput.placeholder = 'you@college.edu';
    if (subtitle) subtitle.innerText = 'Sign in to access your member portal';
  }
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  try {
    const res = await fetch('/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.message; err.style.display = 'block'; return; }

    // ── Enforce tab/role match ──
    if (loginRole === 'core' && data.role !== 'core') {
      err.textContent = 'Invalid Credentials.';
      err.style.display = 'block';
      return;
    }
    if (loginRole === 'member' && data.role === 'core') {
      err.textContent = 'Invalid Credentials';
      err.style.display = 'block';
      return;
    }

    err.style.display = 'none';
    currentUser = { ...data };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    closeLogin();
    updateUserUI();

    // Switch to Dashboard View
    const lp = document.getElementById('landing-page');
    const dl = document.getElementById('dashboard-layout');
    if (lp) lp.style.display = 'none';
    if (dl) dl.style.display = 'flex';
    showPage('home');
    loadDashboardData();

    notify('✅', `Welcome back, ${data.name.split(' ')[0]}!`,
      data.role === 'core' ? 'Admin access enabled' : 'Member portal unlocked');
    await loadRecommendations();
    await loadAnnouncements(); // reload so admin buttons appear
  } catch (e) { console.error(e); }
}

function updateUserUI() {
  if (!currentUser) return;
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userRole').textContent = currentUser.role === 'core' ? '🛡 Administrator' : '👤 Member';
  const av = document.getElementById('userAvatar');
  av.className = 'user-avatar ' + (currentUser.role === 'core' ? 'avatar-admin' : 'avatar-member');
  av.textContent = currentUser.name[0];
  if (currentUser.role === 'core') {
    document.getElementById('adminNavSection').style.display = 'block';
    document.getElementById('addResBtn').style.display = 'flex';
    document.getElementById('addEventBtn').style.display = 'flex';
  }
}

function handleUserClick() {
  if (currentUser) {
    if (confirm(`Sign out as ${currentUser.name}?`)) {
      currentUser = null;
      localStorage.removeItem('currentUser');
      document.getElementById('userAvatar').className = 'user-avatar avatar-guest';
      document.getElementById('userAvatar').textContent = '?';
      document.getElementById('userName').textContent = 'Guest';
      document.getElementById('userRole').textContent = 'Not signed in';
      document.getElementById('adminNavSection').style.display = 'none';
      document.getElementById('addResBtn').style.display = 'none';
      document.getElementById('addEventBtn').style.display = 'none';
      document.getElementById('homeRecommendations').innerHTML = '';

      // Switch back to Landing Page
      const lp = document.getElementById('landing-page');
      const dl = document.getElementById('dashboard-layout');
      if (lp) lp.style.display = 'block';
      if (dl) dl.style.display = 'none';
    }
  } else { openLogin(); }
}

// ============================================================
// NAVIGATION
// ============================================================
function showPage(pageId, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (navEl) navEl.classList.add('active');
  else document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick') && n.getAttribute('onclick').includes(`'${pageId}'`))
      n.classList.add('active');
  });

  if (['admin', 'analytics', 'files'].includes(pageId)) {
    if (!currentUser || currentUser.role !== 'core') {
      showPage('home');
      loadDashboardData(); openLogin(); return;
    }
    if (pageId === 'analytics') renderAnalytics();
    if (pageId === 'admin') renderAdminPanels();
    if (pageId === 'files') renderFileList();
  }

  if (pageId === 'events') renderEvents(events);
  if (pageId === 'resources') renderResources(resources);
  if (pageId === 'myregs') loadMyRegistrations();
  if (pageId === 'profile') loadProfile();
  if (pageId === 'projects') loadProjects();
  if (pageId === 'teams') loadTeamRequests();
  document.getElementById('sidebar').classList.remove('mobile-open');
}

// ============================================================
// EVENTS
// ============================================================
async function loadEventsFromBackend() {
  try {
    const res = await fetch('/events');
    const data = await res.json();
    events = data.map(e => ({
      id: e.event_id,
      name: e.title,
      // FIX: keep original category for display AND filtering; derive type for CSS class
      category: e.category || 'Workshop',
      type: (e.category || 'Workshop'),   // used for CSS tag class
      seats: e.seats_left,
      totalSeats: e.total_seats,
      registered: e.registered,
      date: e.date + 'T' + e.time,
      desc: e.description,
      venue: e.venue,
      status: e.seats_left === 0 ? 'closed' : 'upcoming'
    }));
    renderEvents(events);
    renderCalendar();
    updateStats();
  } catch (e) { console.error(e); }
}

function renderEvents(list) {
  const c = document.getElementById('eventGrid');
  if (!list.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">🗓</div><p>No events found.</p></div>`;
    return;
  }
  c.innerHTML = list.map(e => {
    const pct = Math.round((e.registered / e.totalSeats) * 100) || 0;
    const dot = e.status === 'active' ? 'dot-active' : e.status === 'upcoming' ? 'dot-upcoming' : 'dot-closed';
    const d = new Date(e.date);
    const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `<div class="card">
      <span class="card-tag tag-${e.type}">${e.category}</span>
      <div class="card-title">${e.name}</div>
      <div class="card-meta">
        <span class="status-dot ${dot}"></span>${e.venue}<br>
        🗓 ${dateStr} · ${timeStr}
      </div>
      <div style="margin:14px 0 4px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px">
          <span>${e.registered}/${e.totalSeats} registered</span><span>${pct}%</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--accent2))"></div></div>
      </div>
      <div class="card-footer">
        <button class="btn btn-outline btn-sm" onclick="openDetailById(${e.id})">Details →</button>
        ${e.seats > 0
        ? `<button class="btn btn-sm btn-success" onclick="openRegisterById(${e.id})">Register</button>`
        : `<button class="btn btn-sm" style="background:var(--warning);color:#000" onclick="openRegisterById(${e.id})">Join Waitlist</button>`}
      </div>
    </div>`;
  }).join('');
}

// FIX: compare against e.category (original casing) not lowercased e.type
function filterEvents(type, el) {
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderEvents(type === 'all' ? events : events.filter(e => e.category === type));
}

function openDetailById(id) {
  const e = events.find(x => x.id === id);
  if (!e) return;
  const d = new Date(e.date);
  const dateStr = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const pct = Math.round((e.registered / e.totalSeats) * 100) || 0;
  document.getElementById('detailContent').innerHTML = `
    <div style="margin-top:44px">
      <span class="card-tag tag-${e.type}" style="margin-bottom:18px;display:inline-block">${e.category}</span>
      <h2 style="font-family:'Outfit',sans-serif;font-size:24px;font-weight:800;margin-bottom:10px">${e.name}</h2>
      <p style="color:var(--muted2);font-size:14px;line-height:1.7;margin-bottom:24px">${e.desc}</p>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;font-size:13px">
        <div><span style="color:var(--muted)">📍 Venue</span><br><strong>${e.venue}</strong></div>
        <div><span style="color:var(--muted)">📅 Date</span><br><strong>${dateStr}</strong></div>
        <div><span style="color:var(--muted)">⏰ Time</span><br><strong>${timeStr}</strong></div>
        <div><span style="color:var(--muted)">💺 Seats</span><br>
          <div class="bar-track" style="margin-top:6px"><div class="bar-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--accent2))"></div></div>
          <span style="font-size:11px;color:var(--muted)">${e.registered}/${e.totalSeats} registered</span>
        </div>
      </div>
      ${e.seats > 0
      ? `<button class="btn btn-primary" onclick="openRegisterById(${e.id});closeDetail()">Register Now →</button>`
      : `<div style="text-align:center;padding:16px;background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.2);border-radius:12px;color:var(--danger)">🔴 Registration Closed</div>`}
    </div>`;
  document.getElementById('detailPanel').classList.add('open');
}

function closeDetail() { document.getElementById('detailPanel').classList.remove('open'); }

// ============================================================
// REGISTRATION
// ============================================================
function openRegisterById(id) {
  if (!currentUser) { openLogin(); return; }
  const e = events.find(x => x.id === id);
  if (!e) return;
  selectedEventId = id;
  document.getElementById('regModalTitle').textContent = `Register for: ${e.name}`;
  document.getElementById('regName').value = currentUser.name;
  document.getElementById('regEmail').value = currentUser.email;
  openModal('registerModal');
}

function closeRegisterModal() { closeModal('registerModal'); }

async function confirmRegistration() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  if (!name || !email) { notify('⚠️', 'Fill all fields', ''); return; }
  try {
    const res = await fetch('/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: currentUser.member_id, event_id: selectedEventId })
    });
    const data = await res.json();
    if (!res.ok) { notify('❌', data.message, ''); return; }
    closeRegisterModal();
    await loadEventsFromBackend();
    const evName = events.find(e => e.id === selectedEventId)?.name || '';
    if (data.status === 'waitlisted') {
      notify('⏳', 'Added to Waitlist!', evName + ' — You\'ll be notified if a spot opens.');
    } else {
      notify('✅', 'Registered!', evName);
    }
  } catch (e) { notify('❌', 'Server error', ''); }
}

// ============================================================
// RESOURCES
// ============================================================
async function loadResourcesFromBackend() {
  try {
    const res = await fetch('/resources');
    const data = await res.json();
    resources = data.map(r => ({
      id: r.resource_id,
      name: r.title,
      tag: r.tags ? r.tags.trim() : 'ML',
      desc: r.type || 'Resource',
      link: r.link || '',
      addedBy: r.added_by,
      downloads: r.download_count || 0
    }));
    renderResources(resources);
    updateStats();
  } catch (e) { console.error(e); }
}

function renderResources(list) {
  const c = document.getElementById('resourceGrid');
  if (!list.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">📂</div><p>No resources found.</p></div>`;
    return;
  }
  c.innerHTML = list.map(r => `
    <div class="card">
      <span class="card-tag tag-${r.tag}">${r.tag}</span>
      <div class="card-title">${r.name}</div>
      <div class="card-meta">${r.desc}</div>
      <div style="margin-top:10px;font-size:11px;color:var(--muted)">Added by ${r.addedBy} · ${r.downloads} downloads</div>
      <div class="card-footer">
        <button class="btn btn-outline btn-sm" onclick="downloadResource(${r.id})">⬇ Open Resource</button>
      </div>
    </div>`).join('');
}

// FIX: use the correct chips container id
function filterRes(tag, el) {
  document.querySelectorAll('#resourceFilterChips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderResources(tag === 'all' ? resources : resources.filter(r => r.tag === tag));
}

async function downloadResource(id) {
  const r = resources.find(x => x.id === id);
  if (!r) return;
  await fetch(`/download/${id}`, { method: 'POST' });
  r.downloads++;
  if (r.link && r.link !== 'N/A' && r.link !== '') window.open(r.link, '_blank');
  notify('⬇️', 'Opening resource', r.name);
  renderResources(resources);
}

// ============================================================
// RESOURCE FILTERS (dynamic from backend)
// ============================================================
async function loadResourceFilters() {
  try {
    const res = await fetch('/resource_tags');
    if (!res.ok) return;
    const tags = await res.json();
    if (!tags.length) return;
    const container = document.getElementById('resourceFilterChips');
    const tagLabels = {
      'ML': 'Machine Learning',
      'DL': 'Deep Learning',
      'WebDB': 'Web / DB',
      'DataScience': 'Data Science'
    };
    container.innerHTML = `<div class="chip active" onclick="filterRes('all',this)">All</div>`
      + tags.map(tag =>
        `<div class="chip" onclick="filterRes('${tag}',this)">${tagLabels[tag] || tag}</div>`
      ).join('');
  } catch (e) { console.error('Resource filters:', e); }
}

// ============================================================
// SUBMIT RESOURCE
// ============================================================
async function submitResource() {
  const name = document.getElementById('newResName').value.trim();
  const tag = document.getElementById('newResTag').value;
  const type = document.getElementById('newResType').value.trim();
  const link = document.getElementById('newResLink').value.trim();
  if (!name) { notify('⚠️', 'Name required', ''); return; }
  try {
    await fetch('/add_resource', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: name, type: type || 'Resource', link, tags: tag, added_by: currentUser.member_id })
    });
    closeModal('addResModal');
    document.getElementById('newResName').value = '';
    document.getElementById('newResType').value = '';
    document.getElementById('newResLink').value = '';
    await loadResourcesFromBackend();
    await loadResourceFilters();
    notify('✅', 'Resource added', name);
  } catch (e) { notify('❌', 'Error', ''); }
}

// ============================================================
// SUBMIT EVENT
// ============================================================
async function submitEvent() {
  const title = document.getElementById('newEventTitle').value.trim();
  const type = document.getElementById('newEventType').value;
  const venue = document.getElementById('newEventVenue').value.trim();
  const date = document.getElementById('newEventDate').value;
  const seats = parseInt(document.getElementById('newEventSeats').value) || 50;
  const desc = document.getElementById('newEventDesc').value.trim();
  if (!title || !venue) { notify('⚠️', 'Missing fields', 'Title and venue required'); return; }
  const dateOnly = date ? date.split('T')[0] : '';
  const timeOnly = date ? date.split('T')[1] : '00:00';
  try {
    await fetch('/add_event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: desc, date: dateOnly, time: timeOnly, venue, category: type, seats })
    });
    closeModal('addEventModal');
    ['newEventTitle', 'newEventVenue', 'newEventDate', 'newEventDesc'].forEach(id => document.getElementById(id).value = '');
    await loadEventsFromBackend();
    renderAdminPanels();
    notify('✅', 'Event created', title);
  } catch (e) { notify('❌', 'Error', ''); }
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================
async function loadAnnouncements() {
  try {
    const res = await fetch('/announcements');
    const data = await res.json();
    const c = document.getElementById('homeAnnouncements');
    if (!data.length) { c.innerHTML = ''; return; }
    const isAdmin = currentUser?.role === 'core';
    c.innerHTML = `
      <div class="section-header"><h3>📢 Announcements</h3></div>
      ${data.map(a => `
        <div class="announcement-card" id="ann-${a.announcement_id}">
          <div class="announcement-icon">📌</div>
          <div style="flex:1">
            <div class="announcement-title">${a.title}</div>
            <div class="announcement-content">${a.content}</div>
            <div class="announcement-meta">Posted by ${a.created_by} · ${new Date(a.created_at).toLocaleDateString('en-IN')}</div>
          </div>
          ${isAdmin ? `
            <div style="display:flex;gap:6px;flex-shrink:0;margin-left:12px">
              <button class="btn btn-outline btn-sm" onclick="editAnnouncement(${a.announcement_id}, \`${encodeURIComponent(a.title)}\`, \`${encodeURIComponent(a.content)}\`)">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="deleteAnnouncement(${a.announcement_id})">✕</button>
            </div>` : ''}
        </div>`).join('')}`;
  } catch (e) { console.error(e); }
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  await fetch(`/delete_announcement/${id}`, { method: 'DELETE' });
  await loadAnnouncements();
  notify('🗑️', 'Announcement deleted', '');
}

function editAnnouncement(id, encodedTitle, encodedContent) {
  document.getElementById('newAnnTitle').value = decodeURIComponent(encodedTitle);
  document.getElementById('newAnnContent').value = decodeURIComponent(encodedContent);
  const btn = document.querySelector('#addAnnouncementModal .btn-primary');
  btn.setAttribute('onclick', `updateAnnouncement(${id})`);
  btn.textContent = 'Update Announcement →';
  openModal('addAnnouncementModal');
}

async function updateAnnouncement(id) {
  const title = document.getElementById('newAnnTitle').value.trim();
  const content = document.getElementById('newAnnContent').value.trim();
  if (!title || !content) { notify('⚠️', 'Fill all fields', ''); return; }
  await fetch(`/update_announcement/${id}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });
  closeModal('addAnnouncementModal');
  const btn = document.querySelector('#addAnnouncementModal .btn-primary');
  btn.setAttribute('onclick', 'submitAnnouncement()');
  btn.textContent = 'Post Announcement →';
  await loadAnnouncements();
  notify('✅', 'Announcement updated', '');
}

async function submitAnnouncement() {
  const title = document.getElementById('newAnnTitle').value.trim();
  const content = document.getElementById('newAnnContent').value.trim();
  if (!title || !content) { notify('⚠️', 'Fill all fields', ''); return; }
  try {
    await fetch('/add_announcement', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, created_by: currentUser.member_id })
    });
    closeModal('addAnnouncementModal');
    document.getElementById('newAnnTitle').value = '';
    document.getElementById('newAnnContent').value = '';
    await loadAnnouncements();
    notify('✅', 'Announcement posted', title);
  } catch (e) { notify('❌', 'Error', ''); }
}

// ============================================================
// MY REGISTRATIONS
// ============================================================
async function loadMyRegistrations() {
  if (!currentUser) {
    document.getElementById('myRegsContent').innerHTML = `<div class="empty-state"><div class="empty-icon">&#128272;</div><p>Please log in to view your registrations.</p></div>`;
    return;
  }
  try {
    const res = await fetch(`/my_registrations/${currentUser.member_id}`);
    const data = await res.json();
    const c = document.getElementById('myRegsContent');
    if (!data.length) {
      c.innerHTML = `<div class="empty-state"><div class="empty-icon">&#127967;</div><p>No registrations yet.</p><button class="btn btn-outline" style="margin-top:16px" onclick="showPage('events')">Browse Events &rarr;</button></div>`;
      return;
    }

    const confirmed = data.filter(e => e.status === 'registered');
    const waitlisted = data.filter(e => e.status === 'waitlisted');

    function statusBadge(status) {
      if (status === 'registered')
        return `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.4px">&#10003; CONFIRMED</span>`;
      return `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.4px">&#8987; WAITLISTED</span>`;
    }

    function actionBtn(e) {
      const isPast = new Date(e.date) < new Date();
      if (isPast && e.status === 'registered')
        return `<button class="btn btn-primary btn-sm" onclick="openFeedback(${e.event_id}, '${e.title}')">&#11088; Leave Feedback</button>`;
      if (e.status === 'waitlisted')
        return `<button class="btn btn-sm" style="background:rgba(245,158,11,0.12);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer" onclick="unregisterEvent(${e.event_id})">&#10005; Leave Waitlist</button>`;
      return `<button class="btn btn-danger btn-sm" onclick="unregisterEvent(${e.event_id})">Unregister</button>`;
    }

    function buildTable(items, accentColor) {
      return `<table class="reg-table" style="margin-bottom:8px">
        <tr><th>Event</th><th>Date</th><th>Venue</th><th>Category</th><th>Status</th><th>Action</th></tr>
        ${items.map(e => `<tr style="border-left:3px solid ${accentColor}">
          <td><strong>${e.title}</strong><div style="font-size:11px;color:var(--muted);margin-top:2px">&#128336; ${e.time}</div></td>
          <td>${e.date}</td>
          <td>${e.venue}</td>
          <td><span class="card-tag tag-${e.category}" style="margin:0">${e.category}</span></td>
          <td>${statusBadge(e.status)}</td>
          <td>${actionBtn(e)}</td>
        </tr>`).join('')}
      </table>`;
    }

    let html = '';

    if (confirmed.length) {
      html += `<div style="margin-bottom:30px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:14px 18px;background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.2);border-radius:12px">
          <span style="font-size:22px">&#10003;</span>
          <div style="flex:1">
            <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:15px;color:#10b981">Confirmed Registrations</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">You have a guaranteed spot at these events.</div>
          </div>
          <span style="background:rgba(16,185,129,0.2);color:#10b981;padding:2px 12px;border-radius:20px;font-size:13px;font-weight:700">${confirmed.length}</span>
        </div>
        ${buildTable(confirmed, '#10b981')}
      </div>`;
    }

    if (waitlisted.length) {
      html += `<div style="margin-bottom:30px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:14px 18px;background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);border-radius:12px">
          <span style="font-size:22px">&#8987;</span>
          <div style="flex:1">
            <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:15px;color:#f59e0b">Waitlist</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">You will be automatically confirmed if a spot opens up. No action needed.</div>
          </div>
          <span style="background:rgba(245,158,11,0.2);color:#f59e0b;padding:2px 12px;border-radius:20px;font-size:13px;font-weight:700">${waitlisted.length}</span>
        </div>
        ${buildTable(waitlisted, '#f59e0b')}
      </div>`;
    }

    c.innerHTML = html;
  } catch (e) { console.error(e); }
}
async function unregisterEvent(eventId) {
  if (!confirm('Unregister from this event?')) return;
  try {
    const res = await fetch('/unregister', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: currentUser.member_id, event_id: eventId })
    });
    const data = await res.json();
    if (!res.ok) { notify('❌', data.message, ''); return; }
    await loadEventsFromBackend();
    await loadMyRegistrations();
    notify('✅', 'Unregistered successfully', '');
  } catch (e) { notify('❌', 'Error', ''); }
}

// ============================================================
// PROFILE
// ============================================================
async function loadProfile() {
  if (!currentUser) {
    document.getElementById('profileContent').innerHTML = `<div class="empty-state"><div class="empty-icon">🔐</div><p>Please log in to view your profile.</p></div>`;
    return;
  }
  try {
    const res = await fetch(`/profile/${currentUser.member_id}`);
    const m = await res.json();
    document.getElementById('profileContent').innerHTML = `
      <!-- New Profile Banner Design -->
      <div style="position:relative;margin-bottom:60px;">
        <div style="height:120px;background:linear-gradient(135deg, var(--accent), var(--accent2));border-radius:16px 16px 0 0;position:relative;">
           <div style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.5);padding:4px 12px;border-radius:20px;font-size:12px;color:#fff;backdrop-filter:blur(4px);">Year ${m.year}</div>
        </div>
        <div class="profile-avatar ${m.role === 'core' ? 'avatar-admin' : 'avatar-member'}" style="position:absolute;bottom:-40px;left:30px;width:80px;height:80px;font-size:32px;border:4px solid var(--bg);">${m.name[0]}</div>
      </div>
      <div style="padding: 0 30px; margin-bottom: 30px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h2 style="font-family:'Outfit',sans-serif;font-weight:800;font-size:24px;margin-bottom:4px;">${m.name}</h2>
            <p style="color:var(--muted);">${m.email}</p>
            <div style="margin-top:12px;display:flex;gap:8px;">
              <span class="card-tag tag-${m.subcommittee || 'General'}" style="margin:0">${m.subcommittee || 'General'}</span>
              <span class="card-tag tag-ML" style="margin:0;background:rgba(16, 185, 129, 0.1);color:#10b981;border-color:rgba(16, 185, 129, 0.2)">${m.role === 'core' ? 'Admin' : 'Member'}</span>
            </div>
          </div>
          <div style="text-align:right;">
             <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Total Points</div>
             <div style="font-size:28px;font-family:'Outfit',sans-serif;font-weight:800;color:var(--accent)">${(m.events_attended * 10) + (m.resources_added * 20) + ((m.total_downloads || 0) * 2)}</div>
          </div>
        </div>
        ${m.bio ? `<p style="margin-top:20px;font-size:14px;color:var(--text);max-width:600px;line-height:1.6;padding:16px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:12px;">${m.bio}</p>` : ''}
      </div>
      <div class="profile-stats">
        <div class="profile-stat"><div class="profile-stat-value">${m.events_attended}</div><div class="profile-stat-label">Events Attended</div></div>
        <div class="profile-stat"><div class="profile-stat-value">${m.resources_added}</div><div class="profile-stat-label">Resources Added</div></div>
        <div class="profile-stat"><div class="profile-stat-value">${new Date(m.joined_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div><div class="profile-stat-label">Joined</div></div>
      </div>
      <div class="card" style="margin-top:20px">
        <h3 style="font-family:'Outfit',sans-serif;font-weight:700;margin-bottom:16px">Edit Profile</h3>
        <div class="form-group">
          <label class="form-label">Bio</label>
          <textarea class="form-textarea" id="editBio" placeholder="Tell us about yourself...">${m.bio || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Subcommittee</label>
          <select class="form-select" id="editSub">
            ${['Machine Learning', 'Deep Learning', 'Data Science', 'Web Development', 'NLP', 'Computer Vision', 'General']
        .map(s => `<option ${s === m.subcommittee ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-outline" onclick="updateProfile()">Save Changes</button>
      </div>`;
  } catch (e) { console.error(e); }
}

async function updateProfile() {
  const bio = document.getElementById('editBio').value;
  const sub = document.getElementById('editSub').value;
  try {
    await fetch('/update_profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: currentUser.member_id, bio, subcommittee: sub })
    });
    notify('✅', 'Profile updated', '');
    loadProfile();
  } catch (e) { notify('❌', 'Error', ''); }
}

async function submitSignup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPass').value;
  const year = document.getElementById('signupYear').value;
  const sub = document.getElementById('signupSub').value;
  const msg = document.getElementById('signupMsg');
  if (!name || !email || !pass) { msg.style.color = 'var(--danger)'; msg.textContent = 'Fill all fields.'; msg.style.display = 'block'; return; }
  try {
    const res = await fetch('/request_membership', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass, year: parseInt(year), subcommittee: sub })
    });
    const data = await res.json();
    msg.style.color = res.ok ? 'var(--success)' : 'var(--danger)';
    msg.textContent = data.message;
    msg.style.display = 'block';
  } catch (e) { msg.textContent = 'Server error.'; msg.style.display = 'block'; }
}

// ============================================================
// ADMIN PANELS
// ============================================================
async function renderAdminPanels() {
  const eList = document.getElementById('adminEventList');
  const rList = document.getElementById('adminResList');

  eList.innerHTML = events.map(e => `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px">
      <span class="card-tag tag-${e.type}" style="margin:0;font-size:10px">${e.category}</span>
      <span style="flex:1">${e.name}</span>
      <span style="color:var(--muted);font-size:11px">${e.seats} left</span>
      <button class="btn btn-cyan btn-sm" style="padding:3px 8px;font-size:11px" onclick="adminEditEvent(${e.id})">✏️</button>
      <button class="btn btn-danger btn-sm" style="padding:3px 8px;font-size:11px" onclick="adminDeleteEvent(${e.id})">✕</button>
    </div>`).join('');

  rList.innerHTML = resources.map(r => `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px">
      <span class="card-tag tag-${r.tag}" style="margin:0;font-size:10px">${r.tag}</span>
      <span style="flex:1">${r.name}</span>
      <button class="btn btn-cyan btn-sm" style="padding:3px 8px;font-size:11px" onclick="adminEditResource(${r.id})">✏️</button>
      <button class="btn btn-danger btn-sm" style="padding:3px 8px;font-size:11px" onclick="adminDeleteResource(${r.id})">✕</button>
    </div>`).join('');

  // Pending approvals
  const pendingDiv = document.getElementById('pendingSection');
  try {
    const pendRes = await fetch('/pending_members');
    const pending = await pendRes.json();
    if (pending.length) {
      pendingDiv.innerHTML = `<div class="card"><h3 style="font-family:'Outfit',sans-serif;font-weight:700;margin-bottom:16px">🕐 Pending Approvals (${pending.length})</h3>
        ${pending.map(m => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px">
            <div style="flex:1"><strong>${m.name}</strong> · ${m.email}<br><span style="color:var(--muted);font-size:11px">Year ${m.year} · ${m.subcommittee}</span></div>
            <button class="btn btn-success btn-sm" onclick="approveMember(${m.member_id})">Approve ✓</button>
          </div>`).join('')}
      </div>`;
    } else { pendingDiv.innerHTML = ''; }
  } catch (e) { pendingDiv.innerHTML = ''; }
}

async function approveMember(id) {
  await fetch(`/approve_member/${id}`, { method: 'POST' });
  notify('✅', 'Member approved', '');
  renderAdminPanels();
}

async function adminDeleteEvent(id) {
  if (!confirm('Delete this event and all its registrations?')) return;
  try {
    await fetch(`/delete_event/${id}`, { method: 'DELETE' });
    await loadEventsFromBackend();
    renderAdminPanels();
    notify('🗑️', 'Event deleted', '');
  } catch (e) { notify('❌', 'Error', ''); }
}

function adminEditEvent(id) {
  const e = events.find(x => x.id === id);
  if (!e) return;
  document.getElementById('newEventTitle').value = e.name;
  document.getElementById('newEventType').value = e.category;
  document.getElementById('newEventVenue').value = e.venue;
  document.getElementById('newEventDate').value = e.date ? e.date.substring(0, 16) : '';
  document.getElementById('newEventSeats').value = e.totalSeats;
  document.getElementById('newEventDesc').value = e.desc;
  const btn = document.querySelector('#addEventModal .btn-primary');
  btn.setAttribute('onclick', `submitEditEvent(${id})`);
  btn.textContent = 'Update Event →';
  openModal('addEventModal');
}

async function submitEditEvent(id) {
  const title = document.getElementById('newEventTitle').value.trim();
  const type = document.getElementById('newEventType').value;
  const venue = document.getElementById('newEventVenue').value.trim();
  const date = document.getElementById('newEventDate').value;
  const seats = parseInt(document.getElementById('newEventSeats').value) || 50;
  const desc = document.getElementById('newEventDesc').value.trim();
  if (!title || !venue) { notify('⚠️', 'Missing fields', ''); return; }
  await fetch(`/update_event/${id}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title, description: desc,
      date: date.split('T')[0], time: date.split('T')[1] || '00:00',
      venue, category: type, seats
    })
  });
  closeModal('addEventModal');
  const btn = document.querySelector('#addEventModal .btn-primary');
  btn.setAttribute('onclick', 'submitEvent()');
  btn.textContent = 'Create Event →';
  await loadEventsFromBackend();
  renderAdminPanels();
  notify('✅', 'Event updated', '');
}

async function adminDeleteResource(id) {
  if (!confirm('Delete this resource?')) return;
  try {
    await fetch(`/delete_resource/${id}`, { method: 'DELETE' });
    await loadResourcesFromBackend();
    renderAdminPanels();
    notify('🗑️', 'Resource deleted', '');
  } catch (e) { notify('❌', 'Error', ''); }
}


function adminEditResource(id) {
  const r = resources.find(x => x.id === id);
  if (!r) return;
  document.getElementById('newResName').value = r.name;
  document.getElementById('newResTag').value = r.tag;
  document.getElementById('newResType').value = r.desc;
  document.getElementById('newResLink').value = r.link;
  const btn = document.querySelector('#addResModal .btn-primary');
  btn.setAttribute('onclick', `submitEditResource(${id})`);
  btn.textContent = 'Update Resource →';
  openModal('addResModal');
}

async function submitEditResource(id) {
  const name = document.getElementById('newResName').value.trim();
  const tag = document.getElementById('newResTag').value;
  const type = document.getElementById('newResType').value.trim();
  const link = document.getElementById('newResLink').value.trim();
  if (!name) { notify('⚠️', 'Name required', ''); return; }
  try {
    await fetch(`/update_resource/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: name, tags: tag, type, link })
    });
    closeModal('addResModal');
    const btn = document.querySelector('#addResModal .btn-primary');
    btn.setAttribute('onclick', 'submitResource()');
    btn.textContent = 'Add Resource →';
    await loadResourcesFromBackend();
    renderAdminPanels();
    notify('✅', 'Resource updated', '');
  } catch (e) { notify('❌', 'Error', ''); }
}

// ============================================================
// ANALYTICS
// ============================================================
async function renderAnalytics() {
  const c = document.getElementById('analyticsContent');
  c.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted)">Loading analytics...</div>`;
  try {
    const [aRes, iRes] = await Promise.all([
      fetch('/analytics'),
      fetch('/ai/insights')
    ]);
    const a = await aRes.json();
    const ins = await iRes.json();
    const colors = ['#6366f1', '#06b6d4', '#f43f5e', '#10b981', '#f59e0b'];
    const maxReg = Math.max(...a.events_data.map(e => e.count), 1);
    const maxDl = Math.max(...a.top_resources.map(r => r.download_count), 1);

    c.innerHTML = `
      <div class="analytics-grid">
        <div class="analytics-card"><div class="a-label">Total Members</div><div class="a-value" style="color:var(--accent)">${a.total_members}</div><div class="a-sub">registered members</div></div>
        <div class="analytics-card"><div class="a-label">Total Events</div><div class="a-value" style="color:var(--accent2)">${a.total_events}</div><div class="a-sub">workshops & talks</div></div>
        <div class="analytics-card"><div class="a-label">Resources</div><div class="a-value" style="color:#818cf8">${a.total_resources}</div><div class="a-sub">in library</div></div>
        <div class="analytics-card"><div class="a-label">Registrations</div><div class="a-value" style="color:var(--success)">${a.total_registrations}</div><div class="a-sub">total signups</div></div>
      </div>
      <div class="insights-box">
        <div class="insights-title">🤖 AI Insights</div>
        ${(ins.insights || []).map((insight, i) => `
          <div class="insight-item">
            <div class="insight-num">${i + 1}</div>
            <div>${insight}</div>
          </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
        <div class="card">
          <div class="section-header"><h3>Registrations by Event</h3></div>
          <div class="bar-chart">
            ${a.events_data.map((e, i) => `
              <div class="bar-row">
                <div class="bar-label">${e.title}</div>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.round(e.count / maxReg * 100)}%;background:${colors[i % colors.length]}"></div></div>
                <div class="bar-count">${e.count}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="section-header"><h3>Top Resources</h3></div>
          <div class="bar-chart">
            ${a.top_resources.map((r, i) => `
              <div class="bar-row">
                <div class="bar-label">${r.title}</div>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.round(r.download_count / maxDl * 100)}%;background:${colors[i % colors.length]}"></div></div>
                <div class="bar-count">${r.download_count}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="section-header"><h3>Recent Registrations</h3></div>
        <table class="reg-table">
          <thead><tr><th>Member</th><th>Event</th><th>Time</th></tr></thead>
          <tbody>
            ${a.recent_registrations.map(r => `
              <tr>
                <td><strong>${r.name}</strong></td>
                <td>${r.title}</td>
                <td style="color:var(--muted)">${new Date(r.registered_at).toLocaleDateString('en-IN')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load analytics.</p></div>`;
  }
}

// ============================================================
// AI — RECOMMENDATIONS
// ============================================================
async function loadRecommendations() {
  if (!currentUser) return;
  const c = document.getElementById('homeRecommendations');
  c.innerHTML = `<div style="color:var(--muted);font-size:13px;margin-bottom:16px">⏳ Loading AI recommendations...</div>`;
  try {
    const res = await fetch(`/ai/recommendations/${currentUser.member_id}`);
    const data = await res.json();
    if (!data.events?.length && !data.resources?.length) { c.innerHTML = ''; return; }
    c.innerHTML = `
      <div class="rec-section">
        <div class="rec-title">✨ Recommended for You</div>
        ${data.events?.length ? `<div style="margin-bottom:10px"><div style="font-size:12px;color:var(--muted);margin-bottom:6px">EVENTS</div>
          <div class="rec-chips">${data.events.map(e => `<div class="rec-chip" onclick="showPage('events');openDetailById(${e.event_id || e.id})">${e.title || e.name}</div>`).join('')}</div></div>` : ''}
        ${data.resources?.length ? `<div><div style="font-size:12px;color:var(--muted);margin-bottom:6px">RESOURCES</div>
          <div class="rec-chips">${data.resources.map(r => `<div class="rec-chip" onclick="showPage('resources')">${r.title || r.name}</div>`).join('')}</div></div>` : ''}
      </div>`;
  } catch (e) { c.innerHTML = ''; }
}

// ============================================================
// AI — GENERATE DESCRIPTION
// ============================================================
async function generateDescription() {
  const title = document.getElementById('newEventTitle').value.trim();
  const type = document.getElementById('newEventType').value;
  const venue = document.getElementById('newEventVenue').value.trim();
  if (!title) { notify('⚠️', 'Enter a title first', ''); return; }
  const btn = document.querySelector('.ai-gen-btn');
  btn.textContent = '⏳ Generating...';
  try {
    const res = await fetch('/ai/generate_description', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category: type, venue })
    });
    const data = await res.json();
    document.getElementById('newEventDesc').value = data.description;
    btn.textContent = '✨ AI Generate Description';
    notify('✨', 'Description generated!', '');
  } catch (e) { btn.textContent = '✨ AI Generate Description'; }
}

// ============================================================
// AI — NATURAL LANGUAGE SEARCH
// ============================================================
async function doSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;
  const btn = document.querySelector('.search-btn');
  btn.textContent = '⏳ Searching...';
  try {
    const res = await fetch('/ai/search', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    const c = document.getElementById('searchResults');
    c.classList.add('visible');
    document.getElementById('searchMessage').textContent = data.message || 'Search results';

    const ec = document.getElementById('searchEventResults');
    ec.innerHTML = data.events?.length ? `
      <div style="font-size:12px;color:var(--muted);margin:12px 0 8px">EVENTS</div>
      <div class="grid">${data.events.map(e => `
        <div class="card" style="cursor:pointer" onclick="showPage('events');openDetailById(${e.event_id})">
          <div class="card-tag tag-${(e.category || '').toLowerCase()}">${e.category}</div>
          <div class="card-title">${e.title}</div>
          <div class="card-meta">${e.description}</div>
        </div>`).join('')}</div>` : '';

    const rc = document.getElementById('searchResourceResults');
    rc.innerHTML = data.resources?.length ? `
      <div style="font-size:12px;color:var(--muted);margin:12px 0 8px">RESOURCES</div>
      <div class="grid">${data.resources.map(r => `
        <div class="card" style="cursor:pointer" onclick="window.open('${r.link}','_blank')">
          <div class="card-tag tag-${r.tags}">${r.tags}</div>
          <div class="card-title">${r.title}</div>
          <div class="card-meta">${r.type}</div>
        </div>`).join('')}</div>` : '';

    btn.textContent = '✨ Search';
  } catch (e) { btn.textContent = '✨ Search'; }
}

// ============================================================
// CHATBOT
// ============================================================
function toggleChatbot() {
  document.getElementById('chatbotPanel').classList.toggle('open');
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  addChatMessage(msg, 'user');
  const typing = addTypingIndicator();
  try {
    const res = await fetch('/ai/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, member_id: currentUser?.member_id })
    });
    const data = await res.json();
    typing.remove();
    addChatMessage(data.response, 'bot');
  } catch (e) {
    typing.remove();
    addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
  }
}

function addChatMessage(text, type) {
  const c = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-msg ${type}`;
  div.innerHTML = type === 'bot'
    ? `<div class="chat-avatar-small">🤖</div><div class="chat-bubble bot">${text}</div>`
    : `<div class="chat-bubble user">${text}</div>`;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
  return div;
}

function addTypingIndicator() {
  const c = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<div class="chat-avatar-small">🤖</div><div class="chat-bubble bot"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
  return div;
}

// ============================================================
// STATS
// ============================================================
function updateStats() {
  const uniqueSubs = [...new Set(resources.map(r => r.tag))].length || 4;
  document.getElementById('homeStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${events.length}</div><div class="stat-label">Events</div></div>
    <div class="stat-item"><div class="stat-value">${resources.length}</div><div class="stat-label">Resources</div></div>
    <div class="stat-item"><div class="stat-value">${events.reduce((s, e) => s + e.registered, 0)}</div><div class="stat-label">Registrations</div></div>
    <div class="stat-item"><div class="stat-value">${uniqueSubs}</div><div class="stat-label">Resource Tags</div></div>`;
}

// ============================================================
// FILE MANAGER
// ============================================================
function handleMainUpload(input) {
  Array.from(input.files).forEach(f =>
    uploadedFiles.push({ name: f.name, size: f.size, type: f.type, date: new Date(), file: f })
  );
  renderFileList();
  notify('✅', `${input.files.length} file(s) uploaded`, '');
}

function renderFileList() {
  const c = document.getElementById('fileList');
  if (!uploadedFiles.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">📁</div><p>No files uploaded yet.</p></div>`;
    return;
  }
  c.innerHTML = uploadedFiles.map((f, i) => `
    <div class="file-item">
      <div class="file-icon">${fileIcon(f.name)}</div>
      <div class="file-info"><div class="file-name">${f.name}</div><div class="file-size">${formatSize(f.size)}</div></div>
      <div class="file-actions">
        <button class="btn btn-outline btn-sm" onclick="downloadFile(${i})">⬇</button>
        <button class="btn btn-danger btn-sm" onclick="deleteFile(${i})">✕</button>
      </div>
    </div>`).join('');
}

function downloadFile(i) {
  const f = uploadedFiles[i];
  if (f.file) { const a = document.createElement('a'); a.href = URL.createObjectURL(f.file); a.download = f.name; a.click(); }
}

function deleteFile(i) { uploadedFiles.splice(i, 1); renderFileList(); notify('🗑️', 'File deleted', ''); }
function fileIcon(n) { const e = n.split('.').pop().toLowerCase(); return { pdf: '📕', pptx: '📊', docx: '📝', ipynb: '🔬', csv: '📋', zip: '🗜', py: '🐍' }[e] || '📄'; }
function formatSize(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }

// ============================================================
// MODALS
// ============================================================
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ============================================================
// NOTIFICATION
// ============================================================
let notifTimer;
function notify(icon, title, sub) {
  document.getElementById('notifIcon').textContent = icon;
  document.getElementById('notifTitle').textContent = title;
  document.getElementById('notifSub').textContent = sub;
  const n = document.getElementById('notification');
  n.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => n.classList.remove('show'), 3500);
}

// ============================================================
// MOBILE
// ============================================================
function toggleMobileSidebar() { document.getElementById('sidebar').classList.toggle('mobile-open'); }

// ============================================================
// PARTICLES
// ============================================================
particlesJS('particles-js', {
  particles: {
    number: { value: 40 }, size: { value: 2 },
    color: { value: ['#6366f1', '#06b6d4', '#f43f5e'] },
    opacity: { value: 0.3 },
    line_linked: { enable: true, color: '#6366f1', opacity: 0.06, distance: 160 },
    move: { speed: 0.6, random: true }
  },
  interactivity: {
    events: { onhover: { enable: true, mode: 'grab' } },
    modes: { grab: { distance: 140, line_linked: { opacity: 0.15 } } }
  }
});

// ============================================================
// DASHBOARD OVERVIEW
// ============================================================
async function loadDashboardData() {
  if (!currentUser) return;
  document.getElementById('dashUserName').textContent = currentUser.name.split(' ')[0];

  // Stats
  const statsC = document.getElementById('homeStats');
  statsC.innerHTML = `
    <div class="card" style="padding:20px"><div style="color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Your Role</div><div style="font-size:24px;font-family:'Outfit',sans-serif;font-weight:700;color:var(--accent)">${currentUser.role === 'core' ? 'Admin' : 'Member'}</div></div>
    <div class="card" style="padding:20px"><div style="color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Subcommittee</div><div style="font-size:20px;font-family:'Outfit',sans-serif;font-weight:700;color:var(--accent2)">${currentUser.subcommittee || 'General'}</div></div>
  `;

  // Leaderboard
  try {
    const res = await fetch('/leaderboard');
    const leaders = await res.json();
    const lC = document.getElementById('leaderboardList');
    if (!leaders.length) {
      lC.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted)">No data yet.</div>`;
    } else {
      lC.innerHTML = leaders.map((l, i) => `
        <div style="display:flex;align-items:center;padding:12px 20px;border-bottom:1px solid var(--border);${l.member_id === currentUser.member_id ? 'background:rgba(99,102,241,0.1)' : ''}">
          <div style="width:30px;font-weight:bold;color:${i < 3 ? 'var(--accent)' : 'var(--muted)'}">${i + 1}</div>
          <div style="width:36px;height:36px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;margin-right:12px;font-weight:bold">${l.name[0]}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:14px">${l.name} ${l.member_id === currentUser.member_id ? '(You)' : ''}</div>
            <div style="font-size:11px;color:var(--muted)">${l.tier} Tier · ${l.subcommittee}</div>
          </div>
          <div style="font-weight:700;color:var(--accent2)">${l.points} pts</div>
        </div>
      `).join('');
    }
  } catch (e) { }

  // Up Next Event
  try {
    const myRegsRes = await fetch(`/my_registrations/${currentUser.member_id}`);
    const myRegs = await myRegsRes.json();
    const now = new Date();
    const upcoming = myRegs.filter(r => new Date(r.date + 'T' + r.time) > now && r.status === 'registered')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const unC = document.getElementById('homeUpNext');
    if (upcoming.length > 0) {
      const next = upcoming[0];
      const d = new Date(next.date);
      unC.innerHTML = `
        <div class="card" style="border-left: 4px solid var(--accent)">
          <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:center;padding-right:16px;border-right:1px solid var(--border)">
              <div style="font-size:12px;color:var(--accent);font-weight:bold;text-transform:uppercase">${d.toLocaleDateString('en-IN', { month: 'short' })}</div>
              <div style="font-size:24px;font-family:'Outfit',sans-serif;font-weight:800">${d.getDate()}</div>
            </div>
            <div>
              <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:16px;margin-bottom:4px">${next.title}</div>
              <div style="font-size:12px;color:var(--muted)">📍 ${next.venue} · ⏰ ${next.time}</div>
            </div>
          </div>
        </div>
      `;
    } else {
      unC.innerHTML = `<div class="card" style="text-align:center;padding:30px;color:var(--muted)">No upcoming events.<br><button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="showPage('events')">Browse Events</button></div>`;
    }
  } catch (e) { }
}


// ============================================================
// FEEDBACK SYSTEM
// ============================================================
let feedbackEventId = null;
function openFeedback(eventId, title) {
  feedbackEventId = eventId;
  document.getElementById('feedbackTitle').textContent = `Rate: ${title}`;
  document.getElementById('feedbackRating').value = '5';
  document.getElementById('feedbackReview').value = '';
  openModal('feedbackModal');
}

async function submitFeedback() {
  const rating = parseInt(document.getElementById('feedbackRating').value);
  const review = document.getElementById('feedbackReview').value.trim();

  try {
    const res = await fetch('/submit_feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: currentUser.member_id, event_id: feedbackEventId, rating, review })
    });
    const data = await res.json();
    if (!res.ok) { notify('❌', data.message, ''); return; }

    closeModal('feedbackModal');
    notify('✅', 'Thank you!', 'Your feedback has been recorded.');
  } catch (e) { notify('❌', 'Error', ''); }
}

// ============================================================
// EVENT CALENDAR
// ============================================================
let calendarDate = new Date();

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map event dates → events
  const evMap = {};
  events.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!evMap[key]) evMap[key] = [];
      evMap[key].push(e);
    }
  });

  // Category colour palette
  const catColor = { Workshop: '#6366f1', Talk: '#06b6d4', Hackathon: '#f43f5e' };
  function dotColor(cat) { return catColor[cat] || '#f59e0b'; }

  // Build grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMo = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  let cells = '';
  // Empty leading cells
  for (let i = 0; i < firstDay; i++) cells += `<div class="cal-cell cal-empty"></div>`;

  for (let d = 1; d <= daysInMo; d++) {
    const isToday = (today.getDate() === d && today.getMonth() === month && today.getFullYear() === year);
    const dayEvs = evMap[d] || [];
    const dots = dayEvs.map(e =>
      `<span class="cal-dot" style="background:${dotColor(e.category)}" title="${e.name}"></span>`
    ).join('');
    const clickFn = dayEvs.length ? `onclick="showCalDayEvents(${d},${year},${month})"` : '';
    cells += `
      <div class="cal-cell ${isToday ? 'cal-today' : ''} ${dayEvs.length ? 'cal-has-events' : ''}" ${clickFn}>
        <span class="cal-day-num">${d}</span>
        <div class="cal-dots">${dots}</div>
      </div>`;
  }

  document.getElementById('calendarGrid').innerHTML = `
    <div class="cal-header">
      <button class="btn btn-outline btn-sm" onclick="calNav(-1)">&#8592; Prev</button>
      <span class="cal-month-label">${monthNames[month]} ${year}</span>
      <button class="btn btn-outline btn-sm" onclick="calNav(1)">Next &#8594;</button>
    </div>
    <div class="cal-weekdays">
      ${dayNames.map(d => `<div class="cal-weekday">${d}</div>`).join('')}
    </div>
    <div class="cal-body">
      ${cells}
    </div>
    <div class="cal-legend">
      ${Object.entries(catColor).map(([cat, col]) =>
    `<span class="cal-legend-item"><span class="cal-dot" style="background:${col}"></span>${cat}</span>`
  ).join('')}
    </div>`;

  // Clear day panel
  document.getElementById('calDayPanel').innerHTML = '';
}

function calNav(dir) {
  calendarDate.setMonth(calendarDate.getMonth() + dir);
  renderCalendar();
}

function showCalDayEvents(day, year, month) {
  const d = new Date(year, month, day);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayEvs = events.filter(e => {
    const ed = new Date(e.date);
    return ed.getDate() === day && ed.getMonth() === month && ed.getFullYear() === year;
  });
  const catColor = { Workshop: '#6366f1', Talk: '#06b6d4', Hackathon: '#f43f5e' };
  function dotColor(cat) { return catColor[cat] || '#f59e0b'; }

  document.getElementById('calDayPanel').innerHTML = `
    <div class="cal-day-panel">
      <div class="cal-day-panel-title">
        📅 ${d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      ${dayEvs.map(e => {
    const t = new Date(e.date);
    const timeStr = t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `
          <div class="cal-event-row" style="border-left:4px solid ${dotColor(e.category)}">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="card-tag tag-${e.category}" style="margin:0;font-size:10px">${e.category}</span>
              <strong>${e.name}</strong>
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:6px">⏰ ${timeStr} &nbsp;|&nbsp; 📍 ${e.venue}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">${e.seats} seats left / ${e.totalSeats} total</div>
            <div style="margin-top:10px;display:flex;gap:8px">
              <button class="btn btn-outline btn-sm" onclick="openDetailById(${e.id})">Details →</button>
              ${e.seats > 0
        ? `<button class="btn btn-success btn-sm" onclick="openRegisterById(${e.id})">Register</button>`
        : `<button class="btn btn-sm" style="background:var(--warning);color:#000" onclick="openRegisterById(${e.id})">Join Waitlist</button>`}
            </div>
          </div>`;
  }).join('')}
    </div>`;
}

// ============================================================
// PROJECT SHOWCASE
// ============================================================
async function loadProjects() {
  const grid = document.getElementById('projectGrid');
  grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⏳</div><p>Loading projects...</p></div>`;
  try {
    const res = await fetch('/projects');
    const projects = await res.json();
    if (!projects.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div><p>No projects shared yet. Be the first!</p></div>`;
      return;
    }
    grid.innerHTML = projects.map(p => {
      const tags = p.tags ? p.tags.split(',').map(t => `<span class="proj-tag">${t.trim()}</span>`).join('') : '';
      const tech = p.tech_stack ? p.tech_stack.split(',').map(t => `<span class="tech-chip">${t.trim()}</span>`).join('') : '';
      const isOwn = currentUser && currentUser.id === p.member_id;
      const isLiked = currentUser && p.liked_by && p.liked_by.includes(currentUser.id);
      return `<div class="card" id="proj-${p.project_id}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="card-title" style="margin-bottom:6px; font-size:18px;">${p.title}</div>
          <div style="font-size:11px; color:var(--muted); background:var(--surface); padding:4px 8px; border-radius:12px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${p.views} Views</div>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:12px">by ${p.author} &nbsp;·&nbsp; ${p.created_at}</div>
        <div class="card-meta" style="margin-bottom:12px; font-size:14px; line-height:1.5;">${p.description}</div>
        ${tech ? `<div style="margin-bottom:8px; display:flex; flex-wrap:wrap; gap:6px;">${tech}</div>` : ''}
        ${tags ? `<div style="margin-bottom:16px">${tags}</div>` : ''}
        <div class="card-footer" style="flex-wrap:wrap;gap:8px; margin-top:auto; padding-top:16px;">
          ${p.github_link ? `<a class="btn btn-outline btn-sm" href="${p.github_link}" target="_blank" onclick="trackView(${p.project_id})" style="padding:6px 12px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg> GitHub</a>` : ''}
          ${p.demo_link ? `<a class="btn btn-primary btn-sm" href="${p.demo_link}" target="_blank" onclick="trackView(${p.project_id})" style="padding:6px 12px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Live Demo</a>` : ''}
          ${p.link ? `<a class="proj-link-btn" href="${p.link}" target="_blank" onclick="trackView(${p.project_id})">🔗 View Project</a>` : ''}
          <button class="like-btn ${isLiked ? 'liked' : ''}" id="like-${p.project_id}" onclick="toggleLike(${p.project_id})" style="margin-left:auto;">❤️ <span id="lc-${p.project_id}">${p.likes}</span></button>
          ${isOwn ? `<button class="btn btn-danger btn-sm" onclick="deleteProject(${p.project_id})">Delete</button>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><p>Could not load projects.</p></div>`;
  }
}

function trackView(projectId) {
  fetch(`/projects/${projectId}/view`, { method: 'POST' });
}

async function submitProject() {
  if (!currentUser) { showNotification('⚠️', 'Login required', 'Please log in to share projects.'); return; }
  const title = document.getElementById('projTitle').value.trim();
  const desc = document.getElementById('projDesc').value.trim();
  const tags = document.getElementById('projTags').value.trim();
  const tech = document.getElementById('projTech').value.trim();
  const github = document.getElementById('projGithub').value.trim();
  const demo = document.getElementById('projDemo').value.trim();

  if (!title || !desc) { showNotification('⚠️', 'Missing fields', 'Title and description are required.'); return; }
  await fetch('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title, description: desc, tags,
      tech_stack: tech, github_link: github, demo_link: demo,
      author: currentUser.name, member_id: currentUser.id
    })
  });
  closeModal('addProjectModal');
  ['projTitle', 'projDesc', 'projTags', 'projTech', 'projGithub', 'projDemo'].forEach(id => document.getElementById(id).value = '');
  showNotification('💻', 'Project Shared!', 'Your project is now live in the showcase.');
  loadProjects();
}

async function toggleLike(projectId) {
  if (!currentUser) { showNotification('⚠️', 'Login required', 'Please log in to like projects.'); return; }
  const res = await fetch(`/projects/${projectId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: currentUser.id })
  });
  const data = await res.json();
  const lc = document.getElementById(`lc-${projectId}`);
  const btn = document.getElementById(`like-${projectId}`);
  if (lc) lc.textContent = data.likes;
  if (btn) btn.classList.toggle('liked', data.liked);
}

async function deleteProject(projectId) {
  if (!currentUser) return;
  await fetch(`/projects/${projectId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: currentUser.id })
  });
  showNotification('🗑️', 'Deleted', 'Your project has been removed.');
  loadProjects();
}

// ============================================================
// TEAM FINDER
// ============================================================
async function loadTeamRequests() {
  const grid = document.getElementById('teamGrid');
  grid.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><p>Loading requests...</p></div>`;
  try {
    const res = await fetch('/team_requests');
    const reqs = await res.json();
    if (!reqs.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><p>No team requests yet. Post one to get started!</p></div>`;
      return;
    }
    grid.innerHTML = reqs.map(r => {
      const skills = r.skills_needed ? r.skills_needed.split(',').map(s => `<span class="skill-tag">${s.trim()}</span>`).join('') : '';
      const isOwn = currentUser && currentUser.id === r.member_id;
      const closedStyle = r.status === 'closed' ? 'opacity:0.6; filter:grayscale(1);' : '';
      return `<div class="team-card" style="${closedStyle} position:relative;">
        ${r.status === 'closed' ? `<div style="position:absolute;top:16px;left:16px;background:rgba(239,68,68,0.1);color:var(--danger);padding:4px 8px;font-size:11px;border-radius:4px;font-weight:600;">CLOSED</div><div style="height:24px;"></div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:18px;margin-bottom:4px">${r.title}</div>
            <div style="font-size:12px;color:var(--muted)">by ${r.author} &nbsp;·&nbsp; ${r.created_at}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
             ${r.event_name ? `<span style="font-size:11px;padding:4px 10px;border-radius:6px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);color:var(--warning);font-weight:500;">${r.event_name}</span>` : ''}
             ${r.team_size ? `<span style="font-size:11px;color:var(--muted);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:2px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Size: ${r.team_size}</span>` : ''}
          </div>
        </div>
        <div style="color:var(--muted2);font-size:14px;margin-bottom:16px;line-height:1.5;">${r.description}</div>
        <div style="margin-bottom:16px">${skills}</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          ${r.contact && r.status === 'open' ? `<span class="contact-chip" style="display:flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> ${r.contact}</span>` : ''}
          ${isOwn ? `<button class="btn btn-outline btn-sm" onclick="toggleTeamStatus(${r.request_id})" style="margin-left:auto;">${r.status === 'open' ? 'Close Request' : 'Reopen'}</button>` : ''}
          ${isOwn ? `<button class="btn btn-danger btn-sm" onclick="deleteTeamRequest(${r.request_id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Could not load team requests.</p></div>`;
  }
}

async function toggleTeamStatus(requestId) {
  if (!currentUser) return;
  await fetch(`/team_requests/${requestId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: currentUser.id })
  });
  loadTeamRequests();
}

async function submitTeamRequest() {
  if (!currentUser) { showNotification('⚠️', 'Login required', 'Please log in to post a team request.'); return; }
  const title = document.getElementById('teamTitle').value.trim();
  const event = document.getElementById('teamEvent').value.trim();
  const skills = document.getElementById('teamSkills').value.trim();
  const size = document.getElementById('teamSize').value.trim();
  const desc = document.getElementById('teamDesc').value.trim();
  const contact = document.getElementById('teamContact').value.trim();
  if (!title || !desc) { showNotification('⚠️', 'Missing fields', 'Title and description are required.'); return; }
  await fetch('/team_requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title, event_name: event, skills_needed: skills,
      team_size: size, description: desc, contact,
      author: currentUser.name, member_id: currentUser.id
    })
  });
  closeModal('addTeamModal');
  ['teamTitle', 'teamEvent', 'teamSkills', 'teamSize', 'teamDesc', 'teamContact'].forEach(id => document.getElementById(id).value = '');
  showNotification('🤝', 'Request Posted!', 'Your team request is now live.');
  loadTeamRequests();
}

async function deleteTeamRequest(requestId) {
  if (!currentUser) return;
  await fetch(`/team_requests/${requestId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: currentUser.id })
  });
  showNotification('🗑️', 'Deleted', 'Team request removed.');
  loadTeamRequests();
}
