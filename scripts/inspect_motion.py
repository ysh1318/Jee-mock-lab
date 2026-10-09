import urllib.request
import re
from bs4 import BeautifulSoup

url = 'https://motion.ac.in/examinfo/jee-main-previous-year-question-paper/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

soup = BeautifulSoup(html, 'html.parser')
links = soup.find_all('a', href=lambda h: h and 'cdn.motion.ac.in' in h)
print(f"Total Motion PDF links: {len(links)}")

for a in links:
    # find row or parent table
    tr = a.find_parent('tr')
    row_text = tr.get_text(' | ', strip=True) if tr else a.get_text(strip=True)
    print(f"{row_text[:80]} ===> {a['href']}")
