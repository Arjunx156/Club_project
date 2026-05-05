import re

with open('templates/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the HTML body content (everything between </style> and <script>)
html_body_match = re.search(r'</style>\s*</head>\s*<body>(.*?)<script>', content, re.DOTALL)
html_body = html_body_match.group(1).strip() if html_body_match else ""

# The original HTML body has <div class="layout"> for the dashboard and the modals.
# I will wrap the original layout in <div id="dashboard-layout">
# And prepend the new landing page html.

landing_page_html = """
<!-- LANDING PAGE -->
<div id="landing-page">
  <nav class="top-nav">
    <div class="nav-brand">
      <div class="logo-icon" style="width:32px;height:32px;font-size:16px;margin:0;">🧠</div>
      AI & DS Club
    </div>
    <div class="nav-links">
      <a href="#hero">Home</a>
      <a href="#about">About Us</a>
      <a href="#features">Features</a>
    </div>
    <div class="nav-actions">
      <button class="btn btn-outline btn-sm" onclick="openLogin()">Login</button>
      <button class="btn btn-primary btn-sm" onclick="openModal('signupModal')">Sign Up</button>
    </div>
  </nav>

  <section id="hero" class="landing-hero section-padding">
    <div class="landing-hero-content">
      <div class="hero-eyebrow" style="justify-content:center; margin-bottom: 24px;">Welcome to the Future</div>
      <h1>Build the future<br>with <span class="gradient-text">Intelligence</span></h1>
      <p class="hero-desc" style="margin: 0 auto 40px;">A premier student-led community for builders, researchers, and tech enthusiasts to explore Artificial Intelligence and Data Science. Join us to learn, build, and connect.</p>
      <div class="hero-actions" style="justify-content:center;">
        <button class="btn btn-primary" onclick="openModal('signupModal')" style="width:auto; padding: 14px 32px;">Join the Community</button>
        <button class="btn btn-outline" onclick="openLogin()" style="padding: 14px 32px;">Member Portal</button>
      </div>
    </div>
  </section>

  <section id="about" class="about-section section-padding">
    <div class="section-title">Empowering the Next <span class="highlight">AI Leaders</span></div>
    <p class="section-desc">We are dedicated to demystifying Artificial Intelligence and Data Science. Whether you are building your first neural network or researching advanced generative models, our club provides the mentorship and environment you need to thrive.</p>
    
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">📚</div>
        <div class="feature-title">Learn</div>
        <div class="feature-desc">Access our curated library of ML/DL resources, attend weekly workshops, and learn from industry experts.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🚀</div>
        <div class="feature-title">Build</div>
        <div class="feature-desc">Participate in hackathons, collaborate on open-source projects, and build real-world AI applications.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🤝</div>
        <div class="feature-title">Connect</div>
        <div class="feature-desc">Network with like-minded peers, alumni, and professionals in the rapidly growing field of Data Science.</div>
      </div>
    </div>
  </section>

  <section id="features" class="features-section section-padding">
    <div class="section-title">Everything You Need to <span class="highlight">Succeed</span></div>
    <p class="section-desc">Our custom-built portal offers powerful features to supercharge your learning journey.</p>
    
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">📅</div>
        <div class="feature-title">Event Management</div>
        <div class="feature-desc">Seamlessly discover and register for workshops, guest lectures, and hackathons all in one place.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🤖</div>
        <div class="feature-title">AI Assistant</div>
        <div class="feature-desc">Use our built-in Gemini AI to instantly search for resources, get personalized recommendations, and analyze data.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <div class="feature-title">Resource Library</div>
        <div class="feature-desc">Access a centralized repository of PDFs, notebooks, and videos curated by your peers across various subcommittees.</div>
      </div>
    </div>
  </section>

  <footer class="footer">
    <p>&copy; 2025 AI & DS Club. Built with Intelligence.</p>
  </footer>
</div>
"""

# Now we need to wrap the old .layout in <div id="dashboard-layout">
# Also, we keep the particles, blobs, modals at the top level or inside the layout?
# The background blobs and particles should apply to the whole page, so they can stay outside.
# Let's replace `<div class="layout">` with `<div id="dashboard-layout" class="layout">`

html_body_modified = html_body.replace('<div class="layout">', '<div id="dashboard-layout" class="layout">')

# Also, the #home page inside the dashboard still has a hero section. That's fine, it acts as a logged-in dashboard overview.
# We can slightly tweak the dashboard hero text if we want, but it's fine.

new_index_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI & DS Club Portal</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/particles.js"></script>
<link rel="stylesheet" href="{{{{ url_for('static', filename='css/style.css') }}}}">
</head>
<body>

{landing_page_html}

{html_body_modified}

<script src="{{{{ url_for('static', filename='js/app.js') }}}}"></script>
</body>
</html>
"""

with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(new_index_html)
