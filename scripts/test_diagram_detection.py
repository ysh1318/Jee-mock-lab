import pymupdf
import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'jee mains shifts raw pdfs/2026 jan/9. 28-01-2026_S1.pdf'
doc = pymupdf.open(pdf_path)

page_qs = {p: [] for p in range(1, len(doc) + 1)}
for p_idx, page in enumerate(doc):
    p_num = p_idx + 1
    text = page.get_text('text')
    if 'ANSWER KEY' in text and p_num >= len(doc) - 2:
        text = text[:text.index('ANSWER KEY')]
    for q in range(1, 76):
        matches = page.search_for(f'{q}.')
        for r in matches:
            if r.x0 < 100:
                page_qs[p_num].append((q, r.y0))
                break
    page_qs[p_num].sort(key=lambda x: x[1])

question_diagrams = {}
watermark_size = (778, 469)
footer_logo_size = (374, 81)

for p_idx, page in enumerate(doc):
    p_num = p_idx + 1
    qs_on_page = page_qs[p_num]
    if not qs_on_page:
        continue
    
    for img_info in page.get_images():
        xref = img_info[0]
        base = doc.extract_image(xref)
        w, h = base['width'], base['height']
        
        # Filter watermarks and logos
        if (w, h) == watermark_size or (w, h) == footer_logo_size:
            continue
        if w <= 10 or h <= 10:
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
                
        if assigned_q not in question_diagrams:
            question_diagrams[assigned_q] = []
        question_diagrams[assigned_q].append((xref, w, h, r))

print(f"Total questions with diagrams detected: {len(question_diagrams)}")
for q in sorted(question_diagrams.keys()):
    imgs = question_diagrams[q]
    dims = [f"{w}x{h}" for _, w, h, _ in imgs]
    print(f"Question {q}: {len(imgs)} image(s) -> {dims}")
