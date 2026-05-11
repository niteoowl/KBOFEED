import os
import re

# Update style.css
css_path = 'css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

css_content = re.sub(r"@import url\(['\"].*?pretendard.*?\);", "@import url('./pretendard/pretendard.min.css');", css_content)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css_content)

# Update HTML files
html_files = [f for f in os.listdir('.') if f.endswith('.html')]
for html_file in html_files:
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Replace FontAwesome CDN
    html_content = re.sub(
        r'<link rel="stylesheet" href="https://cdnjs\.cloudflare\.com/ajax/libs/font-awesome/6\.\d+\.\d+/css/all\.min\.css"[^>]*>',
        '<link rel="stylesheet" href="/css/all.min.css">',
        html_content
    )
    
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

print("Replacement complete.")
