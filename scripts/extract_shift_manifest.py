import pymupdf
import sys
import os
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

if len(sys.argv) < 3:
    print(json.dumps({"error": "Usage: extract_shift_manifest.py <pdfPath> <shiftId>"}))
    sys.exit(1)

pdf_path = sys.argv[1]
shift_id = sys.argv[2]

if not os.path.exists(pdf_path):
    print(json.dumps({"error": f"File not found: {pdf_path}"}))
    sys.exit(1)

doc = pymupdf.open(pdf_path)
total_pages = len(doc)

# 1. Answer Key Extraction
key_text = ''
for p_idx in range(len(doc)-1, max(-1, len(doc)-3), -1):
    t = doc[p_idx].get_text('text')
    if 'ANSWER KEY' in t:
        key_text = t[t.index('ANSWER KEY') + len('ANSWER KEY'):]
        break

ans_map = {}
if key_text:
    key_text = re.sub(r'52/6, OPPO\. METRO MAS HOSPITAL[\s\S]*$', '', key_text)
    key_text = re.sub(r'Page #\s*\d+', '', key_text)
    tokens = re.split(r'(?:^|\s+)(\d{1,2})\.\s*', key_text)
    i = 1
    sec_b_indices = set(range(21, 26)).union(set(range(46, 51))).union(set(range(71, 76)))
    while i < len(tokens):
        q_num = int(tokens[i])
        val = tokens[i+1].strip() if i+1 < len(tokens) else ''
        first_line = val.split('\n')[0].strip()
        m_nta = re.search(r'NTA\s*\(([1-4])\)', first_line, re.IGNORECASE)
        if m_nta:
            first_line = m_nta.group(1)
        if q_num in sec_b_indices:
            m_num = re.search(r'[-+]?\d*\.?\d+', first_line)
            clean_val = m_num.group(0) if m_num else first_line
        else:
            m_opt = re.search(r'\(?([1-4])\)?', first_line)
            if m_opt:
                clean_val = ['A', 'B', 'C', 'D'][int(m_opt.group(1)) - 1]
            elif any(c in first_line for c in ['1', '2', '3', '4']):
                clean_val = ['A', 'B', 'C', 'D'][int(re.search(r'[1-4]', first_line).group(0)) - 1]
            else:
                clean_val = first_line
        ans_map[str(q_num)] = clean_val
        i += 2

# 2. Page Questions & Diagram Extraction
diagram_dir = os.path.join('public', 'diagrams', shift_id)
os.makedirs(diagram_dir, exist_ok=True)
diagrams = {}

page_qs = {p: [] for p in range(1, total_pages + 1)}
q_pages = {}
for p_idx, page in enumerate(doc):
    p_num = p_idx + 1
    text = page.get_text('text')
    if 'ANSWER KEY' in text and p_num >= total_pages - 2:
        text = text[:text.index('ANSWER KEY')]
    for q in range(1, 76):
        matches = page.search_for(f'{q}.')
        for r in matches:
            if r.x0 < 120:
                page_qs[p_num].append((q, r.y0))
                if q not in q_pages:
                    q_pages[q] = p_num
                break
    page_qs[p_num].sort(key=lambda x: x[1])

watermark = (778, 469)
footer_logo = (374, 81)

for p_idx, page in enumerate(doc):
    p_num = p_idx + 1
    qs_on_page = page_qs[p_num]
    if not qs_on_page:
        continue
    for img_info in page.get_images():
        xref = img_info[0]
        base = doc.extract_image(xref)
        w, h = base['width'], base['height']
        if (w, h) == watermark or (w, h) == footer_logo or w <= 15 or h <= 15:
            continue
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        r = rects[0]
        if r.y1 > 750:
            continue
        assigned_q = qs_on_page[0][0]
        for q, y0 in qs_on_page:
            if y0 <= r.y0 + 10:
                assigned_q = q
            else:
                break
        if assigned_q not in diagrams:
            fn = f'q_{assigned_q}.png'
            with open(os.path.join(diagram_dir, fn), 'wb') as f:
                f.write(base['image'])
            diagrams[str(assigned_q)] = f'/diagrams/{shift_id}/{fn}'

math_start = q_pages.get(1, 1)
math_end = q_pages.get(25, q_pages.get(26, math_start + 3))
phys_start = q_pages.get(26, math_end)
phys_end = q_pages.get(50, q_pages.get(51, phys_start + 4))
chem_start = q_pages.get(51, phys_end)
chem_end = q_pages.get(75, total_pages)

result = {
    'totalPages': total_pages,
    'answerKey': ans_map,
    'diagrams': diagrams,
    'subjects': {
        'Mathematics': {'startPage': math_start, 'endPage': max(math_start, math_end)},
        'Physics': {'startPage': phys_start, 'endPage': max(phys_start, phys_end)},
        'Chemistry': {'startPage': chem_start, 'endPage': max(chem_start, chem_end)}
    }
}

print(json.dumps(result))
