import re

with open('templates/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

dashboard_home_replacement = """    <!-- HOME -->
    <div id="home" class="page active">
      <div class="dashboard-header" style="margin-bottom: 30px;">
        <h1 style="font-family:'Outfit',sans-serif;font-weight:800;font-size:28px;">Welcome back, <span id="dashUserName" class="gradient-text">Member</span>! 👋</h1>
        <p style="color:var(--muted);margin-top:8px;">Here's what's happening in the AI & DS Club today.</p>
      </div>
      
      <!-- Quick Stats -->
      <div class="stats-row" id="homeStats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:40px;">
        <!-- Filled via JS -->
      </div>
      
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:30px;">
        <!-- Left Column -->
        <div>
          <div class="section-header" style="margin-bottom:20px;">
            <h3 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;">🏆 Top Contributors</h3>
          </div>
          <div class="card" id="leaderboardList" style="padding:0;overflow:hidden;margin-bottom:30px;">
            <div style="padding:20px;color:var(--muted);text-align:center;">Loading Leaderboard...</div>
          </div>
          
          <div class="announcements-section" id="homeAnnouncements"></div>
        </div>
        
        <!-- Right Column -->
        <div>
          <div class="section-header" style="margin-bottom:20px;">
            <h3 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;">📅 Up Next</h3>
          </div>
          <div id="homeUpNext" style="margin-bottom:30px;">
             <!-- Next event filled via JS -->
          </div>
          
          <div id="homeRecommendations"></div>
        </div>
      </div>
    </div>"""

html = re.sub(r'<!-- HOME -->\s*<div id="home" class="page active">.*?<div id="homeRecommendations"></div>\s*</div>', dashboard_home_replacement, html, flags=re.DOTALL)

with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
