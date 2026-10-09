import urllib.request
from bs4 import BeautifulSoup
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

req = urllib.request.Request(
    'https://competishun.com/jee-main-2025-question-paper',
    headers={'User-Agent': 'Mozilla/5.0'}
)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

soup = BeautifulSoup(html, 'html.parser')
links = soup.find_all('a', href=lambda h: h and '.pdf' in h.lower())

items = []
for a in links:
    parent = a.find_parent('div')
    t = parent.get_text(' ', strip=True) if parent else a.get_text(strip=True)
    href = a['href']
    items.append((t, href))

print(f"Total links: {len(items)}")
for t, href in items:
    print(f"{t} -> {href}")
