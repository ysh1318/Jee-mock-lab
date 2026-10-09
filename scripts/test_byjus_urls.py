import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

candidates = [
    'https://cdn1.byjus.com/wp-content/uploads/2024/01/jee-main-2024-shift1-jan29-morning.pdf',
    'https://cdn1.byjus.com/wp-content/uploads/2024/01/JEE-Main-2024-jan30-shift1-Morning.pdf',
    'https://cdn1.byjus.com/wp-content/uploads/2024/01/JEE-Main-2024-jan30-shift2-Evening.pdf',
    'https://cdn1.byjus.com/wp-content/uploads/2024/01/jee-main-2024-jan30-shift2-evening.pdf',
    'https://cdn1.byjus.com/wp-content/uploads/2024/01/JEE-Main-2024-jan31-shift1-Morning.pdf',
    'https://cdn1.byjus.com/wp-content/uploads/2024/01/JEE-Main-2024-jan31-shift2-Evening.pdf',
    'https://cdn1.byjus.com/wp-content/uploads/2024/01/JEE-Main-2024-feb01-shift1-Morning.pdf',
    'https://cdn1.byjus.com/wp-content/uploads/2024/01/JEE-Main-2024-feb01-shift2-Evening.pdf',
    'https://cdn1.byjus.com/wp-content/uploads/2024/01/jee-main-2024-shift2-jan27-evening.pdf',
    'https://cdn1.byjus.com/wp-content/uploads/2024/01/JEE-Main-2024-jan27-shift2-Evening.pdf',
    'https://cdn1.byjus.com/wp-content/uploads/2024/02/JEE-Main-2024-feb01-shift1-Morning.pdf',
    'https://cdn1.byjus.com/wp-content/uploads/2024/02/JEE-Main-2024-feb01-shift2-Evening.pdf',
]

for url in candidates:
    fn = url.split('/')[-1]
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req) as resp:
            print(f"[OK] {fn} -> size {resp.headers.get('Content-Length')} bytes")
    except Exception as e:
        print(f"[FAIL] {fn} -> {e}")
