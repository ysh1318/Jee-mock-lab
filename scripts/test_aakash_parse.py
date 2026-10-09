import pymupdf
import re
import sys
import os
import json

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'scratch/test_aakash/2024-jan-27-s2.pdf'
shift_id = '2024-jan-27-s2'

doc = pymupdf.open(pdf_path)
print(f"Opened {pdf_path}: {len(doc)} pages")

# 1. Detect Subjects
subject_candidates = [
    ('Physics', r'\bPHYSICS\b'),
    ('Chemistry', r'\bCHEMISTRY\b'),
    ('Mathematics', r'\b(?:MATHEMATICS|MATHS)\b')
]

subject_spans = []
for p_idx, page in enumerate(doc):
    text = page.get_text('text')[:300].upper()
    for name, pat in subject_candidates:
        if re.search(pat, text):
            if not subject_spans or subject_spans[-1][0] != name:
                subject_spans.append((name, p_idx + 1))
            break

print("Subject spans:", subject_spans)

# Calculate end pages
subjects = []
for i in range(len(subject_spans)):
    name, start = subject_spans[i]
    end = subject_spans[i+1][1] - 1 if i+1 < len(subject_spans) else len(doc)
    subjects.append({'name': name, 'startPage': start, 'endPage': end})

print("Subjects:", subjects)

# 2. For Aakash style: parse each question block and inline answers
for sub in subjects:
    s_name = sub['name']
    full_text = ""
    for p_idx in range(sub['startPage'] - 1, sub['endPage']):
        full_text += f"\n--- PAGE {p_idx + 1} ---\n" + doc[p_idx].get_text('text')
    
    # Check for inline answers: e.g. "Answer (2)" or "Answer (11.00)"
    ans_matches = re.findall(r'(?:^|\n)\s*(\d{1,2})\.[\s\S]*?Answer\s*\(([^\)]+)\)', full_text)
    print(f"{s_name}: found {len(ans_matches)} inline answers")
    if ans_matches:
        for q, a in ans_matches[:5]:
            print(f"  Q{q} -> {a}")
