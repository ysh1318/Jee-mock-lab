import urllib.request
import re
import json

url = 'https://allen.in/jee-main/january-2024-question-paper-with-solutions'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

pdfs = set(re.findall(r'https?://[^\s"\'<>]+\.pdf', html, re.I))
print(f"Total PDFs found in raw html: {len(pdfs)}")
for p in sorted(pdfs):
    print(" ", p)

# Also check for Next.js __NEXT_DATA__ JSON script tag
match = re.search(r'<script id="__NEXT_DATA__" type="application/json">([\s\S]*?)</script>', html)
if match:
    data = json.loads(match.group(1))
    print("Found __NEXT_DATA__! Searching for pdf/links...")
    s = json.dumps(data)
    inner_pdfs = set(re.findall(r'https?://[^\s"\'<>]+\.pdf', s, re.I))
    print(f"Total PDFs inside NEXT_DATA: {len(inner_pdfs)}")
    for p in sorted(inner_pdfs):
        print("  NEXT:", p)
