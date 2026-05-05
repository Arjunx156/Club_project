import re
import os

os.makedirs('static/css', exist_ok=True)
os.makedirs('static/js', exist_ok=True)

with open('templates/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

css = re.search(r'<style>(.*?)</style>', content, re.DOTALL).group(1)
js = re.search(r'<script>(.*?)</script>', content, re.DOTALL).group(1)

with open('static/css/style.css', 'w', encoding='utf-8') as f:
    f.write(css.strip())

with open('static/js/app.js', 'w', encoding='utf-8') as f:
    f.write(js.strip())
