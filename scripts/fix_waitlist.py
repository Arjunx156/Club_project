with open('static/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """async function loadMyRegistrations(){
  if(!currentUser){
    document.getElementById('myRegsContent').innerHTML = `<div class="empty-state"><div class="empty-icon">&#128272;</div><p>Please log in to view your registrations.</p></div>`;
    return;
  }
  try{
    const res  = await fetch(`http://127.0.0.1:5000/my_registrations/${currentUser.member_id}`);
    const data = await res.json();
    const c    = document.getElementById('myRegsContent');
    if(!data.length){
      c.innerHTML = `<div class="empty-state"><div class="empty-icon">&#127967;</div><p>No registrations yet.</p><button class="btn btn-outline" style="margin-top:16px" onclick="showPage('events')">Browse Events &rarr;</button></div>`;
      return;
    }

    const confirmed  = data.filter(e => e.status === 'registered');
    const waitlisted = data.filter(e => e.status === 'waitlisted');

    function statusBadge(status){
      if(status === 'registered')
        return `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.4px">&#10003; CONFIRMED</span>`;
      return `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.4px">&#8987; WAITLISTED</span>`;
    }

    function actionBtn(e){
      const isPast = new Date(e.date) < new Date();
      if(isPast && e.status === 'registered')
        return `<button class="btn btn-primary btn-sm" onclick="openFeedback(${e.event_id}, '${e.title}')">&#11088; Leave Feedback</button>`;
      if(e.status === 'waitlisted')
        return `<button class="btn btn-sm" style="background:rgba(245,158,11,0.12);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer" onclick="unregisterEvent(${e.event_id})">&#10005; Leave Waitlist</button>`;
      return `<button class="btn btn-danger btn-sm" onclick="unregisterEvent(${e.event_id})">Unregister</button>`;
    }

    function buildTable(items, accentColor){
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

    if(confirmed.length){
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

    if(waitlisted.length){
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
  }catch(e){ console.error(e); }
}"""

start_marker = 'async function loadMyRegistrations(){'
end_marker = '\nasync function unregisterEvent('

start_idx = content.index(start_marker)
end_idx = content.index(end_marker)

new_content = content[:start_idx] + new_func + '\n' + content[end_idx+1:]

with open('static/js/app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done!')
