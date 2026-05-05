import os, shutil
os.makedirs('static/images', exist_ok=True)
src = r'C:\Users\ARJUN KRISHNAN\.gemini\antigravity\brain\5b61382b-ba5c-4544-a477-dd96d728f72c\orca_logo_1777974474452.png'
dst = 'static/images/orca_logo.png'
shutil.copy(src, dst)
print('Logo copied successfully:', dst)
