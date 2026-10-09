import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

base = 'https://dcx0p3on5z8dw.cloudfront.net/Aakash/s3fs-public/pdf_management_files/target_solutions/'
dates = [
    ('2024-jan-27-s1', 'Ans-and-Sol_JEE_Main-2024_Phase-1_27-01-2024_Morning.pdf'),
    ('2024-jan-27-s2', 'Ans-and-Sol_JEE_Main-2024_Phase-1_27-01-2024_Evening.pdf'),
    ('2024-jan-29-s1', 'Ans-and-Sol_JEE_Main-2024_Phase-1_29-01-2024_Morning.pdf'),
    ('2024-jan-29-s2', 'Ans-and-Sol_JEE_Main-2024_Phase-1_29-01-2024_Evening.pdf'),
    ('2024-jan-30-s1', 'Ans-and-Sol_JEE_Main-2024_Phase-1_30-01-2024_Morning.pdf'),
    ('2024-jan-30-s2', 'Ans-and-Sol_JEE_Main-2024_Phase-1_30-01-2024_Evening.pdf'),
    ('2024-jan-31-s1', 'Ans-and-Sol_JEE_Main-2024_Phase-1_31-01-2024_Morning.pdf'),
    ('2024-jan-31-s2', 'Ans-and-Sol_JEE_Main-2024_Phase-1_31-01-2024_Evening.pdf'),
    ('2024-feb-01-s1', 'Ans-and-Sol_JEE_Main-2024_Phase-1_01-02-2024_Morning.pdf'),
    ('2024-feb-01-s2', 'Ans-and-Sol_JEE_Main-2024_Phase-1_01-02-2024_Evening.pdf'),
]

for shift_id, fn in dates:
    url = base + fn
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req) as resp:
            chunk = resp.read(100)
            sz = resp.headers.get("Content-Length")
            print(f"[OK] {shift_id}: status {resp.status}, size {sz} bytes")
    except Exception as e:
        print(f"[FAIL] {shift_id} ({fn}): {e}")
