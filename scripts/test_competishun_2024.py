import urllib.request
from bs4 import BeautifulSoup
import sys

sys.stdout.reconfigure(encoding='utf-8')

req = urllib.request.Request(
    'https://competishun.com/jee-main-2024-question-paper',
    headers={'User-Agent': 'Mozilla/5.0'}
)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

soup = BeautifulSoup(html, 'html.parser')
links = soup.find_all('a', href=lambda h: h and '.pdf' in h.lower())

print(f"Total 2024 links: {len(links)}")
for a in links:
    parent = a.find_parent('div')
    t = parent.get_text(' ', strip=True) if parent else a.get_text(strip=True)
    print(f"{t} -> {a['href']}")
