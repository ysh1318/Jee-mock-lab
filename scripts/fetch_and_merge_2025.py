import urllib.request
import pypdf
import os
import sys
import re
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')

PAGE_URL = 'https://competishun.com/jee-main-2025-question-paper'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

print(f"Fetching link index from {PAGE_URL}...")
req = urllib.request.Request(PAGE_URL, headers=headers)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

soup = BeautifulSoup(html, 'html.parser')
links = soup.find_all('a', href=lambda h: h and '.pdf' in h.lower())

# Map shifts: key -> { 'Physics': url, 'Chemistry': url, 'Mathematics': url, 'date_str': ..., 'session': ... }
shifts = {}

for a in links:
    parent = a.find_parent('div')
    t = parent.get_text(' ', strip=True) if parent else a.get_text(strip=True)
    href = a['href']
    
    # Extract Subject
    subj = None
    if 'physics' in t.lower(): subj = 'Physics'
    elif 'chemistry' in t.lower(): subj = 'Chemistry'
    elif 'math' in t.lower(): subj = 'Mathematics'
    
    if not subj:
        continue
        
    # Extract shift number
    shift_match = re.search(r'shift[\s\-_]*([12])', t, re.IGNORECASE)
    shift_num = shift_match.group(1) if shift_match else '1'
    
    # Extract date
    # Format e.g. "22 Jan 2025" or "02 Apr 2025"
    date_match = re.search(r'(\d{1,2})\s+(Jan|Apr)\w*\s+(2025)', t, re.IGNORECASE)
    if not date_match:
        # Fallback from filename e.g. 22-1-25 or 02.04.2025
        fn = href.split('/')[-1]
        m_fn = re.search(r'(\d{1,2})[\.\-_](\d{1,2})[\.\-_](2025|25)', fn)
        if m_fn:
            day = int(m_fn.group(1))
            month_num = int(m_fn.group(2))
            month = 'Jan' if month_num == 1 else 'Apr'
        else:
            print(f"Skipping unrecognized link: {t} -> {href}")
            continue
    else:
        day = int(date_match.group(1))
        month = date_match.group(2).capitalize()
    
    month_name = 'jan' if month.lower().startswith('jan') else 'april'
    shift_key = f"2025-{month_name}-{day:02d}-s{shift_num}"
    
    if shift_key not in shifts:
        shifts[shift_key] = {
            'day': day,
            'month': month_name,
            'shift': shift_num,
            'subjects': {}
        }
    shifts[shift_key]['subjects'][subj] = href

print(f"Identified {len(shifts)} shifts across 2025:")
for k in sorted(shifts.keys()):
    subjs = shifts[k]['subjects']
    print(f"  {k}: {list(subjs.keys())}")

# Target directories
base_dir = r"c:\Users\YASH\projects\main1 - Copy\jeemocklab\jee mains shifts raw pdfs"
jan_dir = os.path.join(base_dir, "2025 jan")
apr_dir = os.path.join(base_dir, "2025 april")
os.makedirs(jan_dir, exist_ok=True)
os.makedirs(apr_dir, exist_ok=True)
os.makedirs("scratch/downloads_2025", exist_ok=True)

jan_shifts = [k for k in sorted(shifts.keys()) if shifts[k]['month'] == 'jan']
apr_shifts = [k for k in sorted(shifts.keys()) if shifts[k]['month'] == 'april']

def process_shift(shift_key, out_path):
    data = shifts[shift_key]
    subjs = data['subjects']
    
    # We want order: Mathematics -> Physics -> Chemistry (or Physics -> Chemistry -> Mathematics)
    # In 2026, the order in Competishun papers was Mathematics -> Physics -> Chemistry or Physics -> Chemistry -> Mathematics.
    # Let's check: our parser handles any subject order since section titles define them!
    # But let's standardise: Physics, Chemistry, Mathematics
    order = ['Physics', 'Chemistry', 'Mathematics']
    
    merger = pypdf.PdfWriter()
    temp_files = []
    
    for subj in order:
        url = subjs.get(subj)
        if not url:
            print(f"  WARNING: Missing {subj} for {shift_key}")
            continue
            
        fn = f"scratch/downloads_2025/{shift_key}_{subj}.pdf"
        if not os.path.exists(fn):
            r = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(r) as resp:
                with open(fn, 'wb') as f:
                    f.write(resp.read())
        
        try:
            reader = pypdf.PdfReader(fn)
            for page in reader.pages:
                merger.add_page(page)
        except Exception as e:
            print(f"  Error reading {fn}: {e}")
            
    with open(out_path, 'wb') as f:
        merger.write(f)
    print(f"Saved: {out_path} ({len(merger.pages)} pages)")

print("\n--- Processing January 2025 Shifts ---")
for idx, k in enumerate(jan_shifts, 1):
    day = shifts[k]['day']
    s_num = shifts[k]['shift']
    out_filename = f"{idx}. {day:02d}-01-2025_S{s_num}.pdf"
    out_path = os.path.join(jan_dir, out_filename)
    print(f"Merging {k} -> {out_filename}...")
    process_shift(k, out_path)

print("\n--- Processing April 2025 Shifts ---")
for idx, k in enumerate(apr_shifts, 1):
    day = shifts[k]['day']
    s_num = shifts[k]['shift']
    out_filename = f"{idx}. {day:02d}-04-2025_S{s_num}.pdf"
    out_path = os.path.join(apr_dir, out_filename)
    print(f"Merging {k} -> {out_filename}...")
    process_shift(k, out_path)

print("\nAll 2025 shifts processed and merged successfully into single-file PDFs!")
