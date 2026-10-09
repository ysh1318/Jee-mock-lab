import pymupdf
import re
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'jee mains shifts raw pdfs/2025 jan/1. 22-01-2025_S1.pdf'
doc = pymupdf.open(pdf_path)

subjects = ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS']
subject_pages = {'PHYSICS': [], 'CHEMISTRY': [], 'MATHEMATICS': []}

current_sub = 'PHYSICS'
for p_idx, page in enumerate(doc):
    t = page.get_text('text')
    for s in subjects:
        if s in t[:150]:
            current_sub = s
            break
    subject_pages[current_sub].append(p_idx)

print("Subject page distribution:")
for s, pages in subject_pages.items():
    print(f"  {s}: pages {pages[0]+1} to {pages[-1]+1} ({len(pages)} pages)")

# Now check Answer Keys for each subject
subject_keys = {}
for s, pages in subject_pages.items():
    # Answer key is usually on the last page of the subject
    last_page = doc[pages[-1]].get_text('text')
    m_key = re.search(r'NTA\s+ANSWERS([\s\S]*)', last_page, re.IGNORECASE)
    if not m_key:
        # Check second to last page if any
        if len(pages) > 1:
            prev_page = doc[pages[-2]].get_text('text')
            m_key = re.search(r'NTA\s+ANSWERS([\s\S]*)', prev_page, re.IGNORECASE)
            
    if m_key:
        raw_key = m_key.group(1).strip()
        tokens = re.split(r'(?:^|\s+)(\d{1,2})\.\s*', raw_key)
        km = {}
        i = 1
        while i < len(tokens):
            q_num = int(tokens[i])
            val = tokens[i+1].strip() if i+1 < len(tokens) else ''
            first_token = val.split()[0] if val.split() else ''
            # If Q1-20, convert (1)..(4) to A..D
            if q_num <= 20:
                m_opt = re.search(r'[1-4]', first_token)
                ans = ['A', 'B', 'C', 'D'][int(m_opt.group(0)) - 1] if m_opt else first_token
            else:
                m_num = re.search(r'[-+]?\d*\.?\d+', first_token)
                ans = m_num.group(0) if m_num else first_token
            km[q_num] = ans
            i += 2
        subject_keys[s] = km
        print(f"\n{s} Answer Key ({len(km)}/25 mapped):")
        print(" ", km)
    else:
        print(f"\n{s} Answer Key NOT FOUND!")
