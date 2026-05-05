import re

with open('static/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_profile_content = r"""      <div class="profile-header">.*?<button class="btn btn-outline" onclick="updateProfile\(\)">Save Changes</button>\s*</div>`"""

new_profile_content = r"""      <!-- New Profile Banner Design -->
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
             <div style="font-size:28px;font-family:'Outfit',sans-serif;font-weight:800;color:var(--accent)">${(m.events_attended*10) + (m.resources_added*20)}</div>
          </div>
        </div>
        ${m.bio ? `<p style="margin-top:20px;font-size:14px;color:var(--text);max-width:600px;line-height:1.6;padding:16px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:12px;">${m.bio}</p>` : ''}
      </div>
      <div class="profile-stats">
        <div class="profile-stat"><div class="profile-stat-value">${m.events_attended}</div><div class="profile-stat-label">Events Attended</div></div>
        <div class="profile-stat"><div class="profile-stat-value">${m.resources_added}</div><div class="profile-stat-label">Resources Added</div></div>
        <div class="profile-stat"><div class="profile-stat-value">${new Date(m.joined_at).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</div><div class="profile-stat-label">Joined</div></div>
      </div>
      <div class="card" style="margin-top:20px">
        <h3 style="font-family:'Outfit',sans-serif;font-weight:700;margin-bottom:16px">Edit Profile</h3>
        <div class="form-group">
          <label class="form-label">Bio</label>
          <textarea class="form-textarea" id="editBio" placeholder="Tell us about yourself...">${m.bio||''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Subcommittee</label>
          <select class="form-select" id="editSub">
            ${['Machine Learning','Deep Learning','Data Science','Web Development','NLP','Computer Vision','General']
              .map(s => `<option ${s===m.subcommittee?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-outline" onclick="updateProfile()">Save Changes</button>
      </div>`"""

js = re.sub(old_profile_content, new_profile_content, js, flags=re.DOTALL)

with open('static/js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
