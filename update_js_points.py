import re

with open('static/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace the incorrect point calculation
js = js.replace('${(m.events_attended*10) + (m.resources_added*20)}', '${(m.events_attended*10) + (m.resources_added*20) + ((m.total_downloads||0)*2)}')

with open('static/js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
