import urllib.request
import re
from bs4 import BeautifulSoup

url = 'https://motion.ac.in/examinfo/jee-main-previous-year-question-paper/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

soup = BeautifulSoup(html, 'html.parser')
links = soup.find_all('a', href=lambda h: h and 'cdn.motion.ac.in' in h)
found = 0
for a in links:
    tr = a.find_parent('tr')
    row = tr.get_text(' | ', strip=True) if tr else ''
    if '2024' in row or '2024' in a['href']:
        found += 1
        print(f"{row[:100]} ===> {a['href']}")

print(f"Total 2024 links found: {found}")
