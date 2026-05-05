import re

with open('static/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Add call to loadDashboardData in doLogin
js = js.replace("showPage('home');", "showPage('home');\n    loadDashboardData();")

# 2. Add Leaderboard and Dashboard logic
dashboard_logic = """
// ============================================================
// DASHBOARD OVERVIEW
// ============================================================
async function loadDashboardData() {
  if(!currentUser) return;
  document.getElementById('dashUserName').textContent = currentUser.name.split(' ')[0];
  
  // Stats
  const statsC = document.getElementById('homeStats');
  statsC.innerHTML = `
    <div class="card" style="padding:20px"><div style="color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Your Role</div><div style="font-size:24px;font-family:'Outfit',sans-serif;font-weight:700;color:var(--accent)">${currentUser.role === 'core' ? 'Admin' : 'Member'}</div></div>
    <div class="card" style="padding:20px"><div style="color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Subcommittee</div><div style="font-size:20px;font-family:'Outfit',sans-serif;font-weight:700;color:var(--accent2)">${currentUser.subcommittee || 'General'}</div></div>
  `;

  // Leaderboard
  try{
    const res = await fetch('http://127.0.0.1:5000/leaderboard');
    const leaders = await res.json();
    const lC = document.getElementById('leaderboardList');
    if(!leaders.length){
      lC.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted)">No data yet.</div>`;
    } else {
      lC.innerHTML = leaders.map((l, i) => `
        <div style="display:flex;align-items:center;padding:12px 20px;border-bottom:1px solid var(--border);${l.member_id === currentUser.member_id ? 'background:rgba(99,102,241,0.1)' : ''}">
          <div style="width:30px;font-weight:bold;color:${i<3?'var(--accent)':'var(--muted)'}">${i+1}</div>
          <div style="width:36px;height:36px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;margin-right:12px;font-weight:bold">${l.name[0]}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:14px">${l.name} ${l.member_id === currentUser.member_id ? '(You)' : ''}</div>
            <div style="font-size:11px;color:var(--muted)">${l.tier} Tier · ${l.subcommittee}</div>
          </div>
          <div style="font-weight:700;color:var(--accent2)">${l.points} pts</div>
        </div>
      `).join('');
    }
  }catch(e){}

  // Up Next Event
  try{
    const myRegsRes = await fetch(`http://127.0.0.1:5000/my_registrations/${currentUser.member_id}`);
    const myRegs = await myRegsRes.json();
    const now = new Date();
    const upcoming = myRegs.filter(r => new Date(r.date + 'T' + r.time) > now && r.status === 'registered')
                           .sort((a,b) => new Date(a.date) - new Date(b.date));
    
    const unC = document.getElementById('homeUpNext');
    if(upcoming.length > 0){
      const next = upcoming[0];
      const d = new Date(next.date);
      unC.innerHTML = `
        <div class="card" style="border-left: 4px solid var(--accent)">
          <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:center;padding-right:16px;border-right:1px solid var(--border)">
              <div style="font-size:12px;color:var(--accent);font-weight:bold;text-transform:uppercase">${d.toLocaleDateString('en-IN',{month:'short'})}</div>
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
  }catch(e){}
}
"""

js = js + "\n" + dashboard_logic

# 3. Modify renderEvents for Waitlist
render_events_old = """${e.seats > 0
          ? `<button class="btn btn-sm btn-success" onclick="openRegisterById(${e.id})">Register</button>`
          : `<span class="seats-badge seats-full">Full</span>`}"""
render_events_new = """${e.seats > 0
          ? `<button class="btn btn-sm btn-success" onclick="openRegisterById(${e.id})">Register</button>`
          : `<button class="btn btn-sm" style="background:var(--warning);color:#000" onclick="openRegisterById(${e.id})">Join Waitlist</button>`}"""
js = js.replace(render_events_old, render_events_new)

# 4. Modify loadMyRegistrations for Feedback & Waitlist
myregs_old = """<td><button class="btn btn-danger btn-sm" onclick="unregisterEvent(${e.event_id})">Unregister</button></td>"""
myregs_new = """<td>
          ${e.status === 'waitlisted' ? '<span style="color:var(--warning);font-size:12px;font-weight:bold;margin-right:10px">⏳ Waitlisted</span>' : ''}
          ${new Date(e.date) < new Date() && e.status === 'registered' 
            ? `<button class="btn btn-primary btn-sm" onclick="openFeedback(${e.event_id}, '${e.title}')">Leave Feedback</button>` 
            : `<button class="btn btn-danger btn-sm" onclick="unregisterEvent(${e.event_id})">Unregister</button>`}
        </td>"""
js = js.replace(myregs_old, myregs_new)

# 5. Add Feedback JS Functions
feedback_js = """
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
    const res = await fetch('http://127.0.0.1:5000/submit_feedback', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({member_id: currentUser.member_id, event_id: feedbackEventId, rating, review})
    });
    const data = await res.json();
    if(!res.ok) { notify('❌', data.message, ''); return; }
    
    closeModal('feedbackModal');
    notify('✅', 'Thank you!', 'Your feedback has been recorded.');
  } catch(e) { notify('❌', 'Error', ''); }
}
"""
js = js + "\n" + feedback_js

with open('static/js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
