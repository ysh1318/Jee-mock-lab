import pymupdf
import re
import sys
import os
import json
import base64

sys.stdout.reconfigure(encoding='utf-8')

PUA_MAP = {
    '\uf028': '(', '\uf029': ')', '\uf05b': '[', '\uf05d': ']',
    '\uf07b': '{', '\uf07d': '}', '\uf02b': '+', '\uf02d': '-',
    '\uf03d': '=', '\uf03c': '<', '\uf03e': '>', '\uf0b1': '±',
    '\uf0b4': '×', '\uf0f7': '÷', '\uf0a4': '→', '\uf0ae': '→', '\uf0ac': '↔',
    '\uf0b0': '°', '\uf0a3': '≤', '\uf0b3': '≥', '\uf0b9': '≠',
    '\uf0a5': '∞', '\uf061': 'α', '\uf062': 'β', '\uf067': 'γ',
    '\uf064': 'δ', '\uf071': 'θ', '\uf06c': 'λ', '\uf06d': 'μ',
    '\uf070': 'π', '\uf073': 'σ', '\uf077': 'ω', '\uf044': 'Δ',
    '\uf057': 'Ω', '\uf025': '%', '\uf02f': '/', '\uf02e': '.',
    '\uf02c': ',', '\uf03a': ':', '\uf03b': ';', '\uf021': '!'
}

def clean_pua(text):
    if not text:
        return ""
    for pua, repl in PUA_MAP.items():
        text = text.replace(pua, repl)
    # Strip any remaining unmapped PUA chars
    return re.sub(r'[\uf000-\uf0ff]', '', text)

def parse_answer_key_tokens(key_text, is_section_b_fn):
    matches = re.findall(r'(?:^|\s+)(\d{1,2})\.\s*\(?([A-Da-d0-9\.\-]+)\)?', key_text)
    ans_map = {}
    for q_str, raw_val in matches:
        try:
            q_num = int(q_str)
        except ValueError:
            continue
            
        m_nta = re.search(r'NTA\s*\(([1-4])\)', raw_val, re.IGNORECASE)
        if m_nta:
            raw_val = m_nta.group(1)
            
        if is_section_b_fn(q_num):
            m_num = re.search(r'[-+]?\d*\.?\d+', raw_val)
            if m_num:
                v = float(m_num.group(0))
                clean_val = str(int(v)) if v.is_integer() else str(v)
            else:
                clean_val = raw_val
        else:
            m_opt = re.search(r'\(?([1-4])\)?', raw_val)
            if m_opt:
                clean_val = ['A', 'B', 'C', 'D'][int(m_opt.group(1)) - 1]
            elif any(c in raw_val for c in ['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd']):
                m_letter = re.search(r'[A-Da-d]', raw_val)
                clean_val = m_letter.group(0).upper() if m_letter else raw_val
            elif any(c in raw_val for c in ['1', '2', '3', '4']):
                m_dig = re.search(r'[1-4]', raw_val)
                clean_val = ['A', 'B', 'C', 'D'][int(m_dig.group(0)) - 1] if m_dig else raw_val
            else:
                clean_val = raw_val
        ans_map[q_num] = clean_val
    return ans_map

def extract_inline_answer(text, is_sec_b):
    m = re.search(r'(?:Ans\.|Answer|Sol\.)\s*(?:\:\s*)?(?:\(([^\)]+)\)|\n\s*\(?([A-Da-d0-9\.\-]+)\)?)', text, re.I)
    if not m:
        return None
    raw = (m.group(1) or m.group(2) or '').strip()
    if not is_sec_b:
        m_opt = re.search(r'([1-4])', raw)
        if m_opt:
            return ['A', 'B', 'C', 'D'][int(m_opt.group(1)) - 1]
        m_let = re.search(r'[A-Da-d]', raw)
        if m_let:
            return m_let.group(0).upper()
    else:
        m_num = re.search(r'[-+]?\d*\.?\d+', raw)
        if m_num:
            v = float(m_num.group(0))
            return str(int(v)) if v.is_integer() else str(v)
    return raw

def extract_manifest(pdf_path, shift_id):
    if not os.path.exists(pdf_path):
        return {"error": f"File not found: {pdf_path}"}

    doc = pymupdf.open(pdf_path)
    total_pages = len(doc)
    
    # Determine exam year and expected question count
    year = int(shift_id.split('-')[0]) if shift_id and shift_id[0].isdigit() else 2025
    q_count_per_subject = 30 if year <= 2024 else 25

    # 1. Subject Page Segmentation (Dynamic Order: supports Physics -> Chemistry -> Mathematics, Mathematics -> Physics -> Chemistry, etc.)
    subject_pats = {
        'Physics': r'\bPHYSICS\b',
        'Chemistry': r'\bCHEMISTRY\b',
        'Mathematics': r'\b(?:MATHEMATICS|MATHS)\b'
    }

    subj_first_page = {}
    # Pass 1: Scan top 600 chars of each page for subject header
    for p_idx, page in enumerate(doc):
        t = page.get_text('text')
        top = t[:600]
        for s_name, pat in subject_pats.items():
            if s_name not in subj_first_page:
                if re.search(r'(?:^|\n)\s*(?:SECTION|PART|SUBJECT)?\s*' + pat, top, re.IGNORECASE):
                    subj_first_page[s_name] = p_idx + 1

    # Pass 2: Fallback to full page scanning if any subject was missed in header
    if len(subj_first_page) < 3:
        for p_idx, page in enumerate(doc):
            t = page.get_text('text')
            for s_name, pat in subject_pats.items():
                if s_name not in subj_first_page:
                    if re.search(r'(?:^|\n)\s*' + pat + r'\s*(?:\n|$)', t, re.IGNORECASE):
                        subj_first_page[s_name] = p_idx + 1

    # Pass 3: Ultimate fallback to 3 equal parts if subject headings are completely absent
    if len(subj_first_page) < 3:
        p_third = total_pages // 3
        defaults = [('Physics', 1), ('Chemistry', p_third + 1), ('Mathematics', 2 * p_third + 1)]
        for s_name, sp in defaults:
            if s_name not in subj_first_page:
                subj_first_page[s_name] = sp

    # Sort detected subjects by startPage so chronological order in PDF is preserved
    sorted_spans = sorted(subj_first_page.items(), key=lambda x: x[1])
    subjects = []
    for i in range(len(sorted_spans)):
        name, start = sorted_spans[i]
        end = sorted_spans[i+1][1] - 1 if i+1 < len(sorted_spans) else total_pages
        subjects.append({
            'name': name,
            'startPage': start,
            'endPage': max(start, end)
        })

    # 2. Numbering Scheme Check
    s2_start_page = subjects[1]['startPage']
    s2_text = doc[s2_start_page - 1].get_text('text')
    has_q1_in_s2 = bool(re.search(r'(?:^|\n)\s*1\.\s+', s2_text))
    has_q26_in_s2 = bool(re.search(r'(?:^|\n)\s*(?:26|31)\.\s+', s2_text))
    is_per_subject_numbering = has_q1_in_s2 or not has_q26_in_s2

    # 3. Answer Key Extraction (Table-based check first)
    answer_keys = {'Physics': {}, 'Chemistry': {}, 'Mathematics': {}}
    
    for sub in subjects:
        s_name = sub['name']
        s_pages = range(sub['startPage'] - 1, sub['endPage'])
        for p_idx in reversed(s_pages):
            t = clean_pua(doc[p_idx].get_text('text'))
            m_key = re.search(r'(?:NTA\s+ANSWERS?|ANSWER\s+KEYS?|HINTS\s*&\s*SOLUTIONS?|ANSWERS?)([\s\S]*)', t, re.IGNORECASE)
            if m_key:
                raw_k = m_key.group(1).strip()
                sec_b_check = lambda q: q >= 21
                sub_keys = parse_answer_key_tokens(raw_k, sec_b_check)
                if len(sub_keys) >= 10:
                    answer_keys[s_name] = sub_keys
                    break

    # If any subject key missing, check consolidated end-of-document key
    missing_any = any(len(answer_keys[s]) < 10 for s in ['Physics', 'Chemistry', 'Mathematics'])
    if missing_any:
        consolidated_text = ''
        for p_idx in range(total_pages - 1, max(-1, total_pages - 4), -1):
            t = clean_pua(doc[p_idx].get_text('text'))
            if re.search(r'(?:ANSWER\s+KEYS?|NTA\s+ANSWERS?|ANSWERS?)', t, re.IGNORECASE):
                consolidated_text = t
                break
        if consolidated_text:
            m_k = re.search(r'(?:ANSWER\s+KEYS?|NTA\s+ANSWERS?|ANSWERS?)([\s\S]*)', consolidated_text, re.IGNORECASE)
            if m_k:
                raw_k = m_k.group(1).strip()
                sec_b_check_all = lambda q: (q % q_count_per_subject) > 20 or (q % q_count_per_subject) == 0
                all_keys = parse_answer_key_tokens(raw_k, sec_b_check_all)
                
                if any(q > q_count_per_subject for q in all_keys.keys()):
                    for idx, sub in enumerate(subjects):
                        s_name = sub['name']
                        offset = idx * q_count_per_subject
                        sub_km = {}
                        for sub_q in range(1, q_count_per_subject + 1):
                            doc_q = offset + sub_q
                            if doc_q in all_keys:
                                sub_km[sub_q] = all_keys[doc_q]
                        if len(sub_km) >= 10:
                            answer_keys[s_name] = sub_km

    # 4. Diagram Extraction (Per-Subject Qualified)
    diagram_dir = os.path.join('public', 'diagrams', shift_id)
    os.makedirs(diagram_dir, exist_ok=True)
    diagrams = {} # key: f"{sub_name}_{qNum}" -> path

    watermark = (778, 469)
    footer_logo = (374, 81)

    for s_idx, sub in enumerate(subjects):
        s_name = sub['name']
        s_pages = range(sub['startPage'] - 1, sub['endPage'])
        
        for p_idx in s_pages:
            page = doc[p_idx]
            qs_on_page = []
            for q in range(1, 91):
                matches = page.search_for(f"{q}.")
                for r in matches:
                    if r.x0 < 140:
                        qs_on_page.append((q, r.y0))
                        break
            qs_on_page.sort(key=lambda x: x[1])

            if not qs_on_page:
                continue

            for img_info in page.get_images():
                xref = img_info[0]
                base = doc.extract_image(xref)
                w, h = base['width'], base['height']
                if (w, h) == watermark or (w, h) == footer_logo or w <= 25 or h <= 25:
                    continue
                rects = page.get_image_rects(xref)
                if not rects:
                    continue
                r = rects[0]
                if r.y1 > 750 or r.y0 < 40:
                    continue
                    
                assigned_q = qs_on_page[0][0]
                for q, y0 in qs_on_page:
                    if y0 <= r.y0 + 20:
                        assigned_q = q
                    else:
                        break
                
                # Normalize assigned_q to 1..q_count_per_subject
                if not is_per_subject_numbering:
                    norm_assigned_q = assigned_q - s_idx * q_count_per_subject
                else:
                    norm_assigned_q = assigned_q
                if norm_assigned_q <= 0 or norm_assigned_q > q_count_per_subject:
                    norm_assigned_q = ((assigned_q - 1) % q_count_per_subject) + 1
                        
                diag_key = f"{s_name}_{norm_assigned_q}"
                if diag_key not in diagrams:
                    fn = f"{s_name.lower()}_q_{norm_assigned_q}.png"
                    with open(os.path.join(diagram_dir, fn), 'wb') as f:
                        f.write(base['image'])
                    ext = base['ext']
                    mime = 'image/jpeg' if ext in ['jpg', 'jpeg'] else 'image/png'
                    b64 = base64.b64encode(base['image']).decode('utf-8')
                    diagrams[diag_key] = f"data:{mime};base64,{b64}"

    # 5. Extract Question Text Blocks & Inline Answers
    question_blocks = {} # key: f"{sub_name}_{qNum}" -> raw_text
    solutions = {}       # key: f"{sub_name}_{qNum}" -> sol_text

    for s_idx, sub in enumerate(subjects):
        s_name = sub['name']
        full_sub_text = ''
        for p_idx in range(sub['startPage'] - 1, sub['endPage']):
            t = doc[p_idx].get_text('text')
            if re.search(r'(?:NTA\s+ANSWERS|ANSWER\s+KEY)', t, re.IGNORECASE):
                t = re.split(r'(?:NTA\s+ANSWERS|ANSWER\s+KEY)', t, flags=re.IGNORECASE)[0]
            full_sub_text += clean_pua(t) + '\n'

        # Multi-pattern regex for robust question boundary splitting:
        # Handles: "1.", "1)", "1-", "1:", "Q.1", "Q1.", "Question 1", and isolated digit on newline "1 \n Let..."
        pattern = r'(?:^|\n)\s*(?:(?:Q(?:uestion)?\.?\s*(\d{1,2}))|(\d{1,2})(?:\.|\s*[\)\-:]|\s*\n\s*(?=[A-Z])))\s*'
        q_tokens = re.split(pattern, full_sub_text)
        i = 1
        while i < len(q_tokens):
            g1 = q_tokens[i]
            g2 = q_tokens[i+1] if i+1 < len(q_tokens) else None
            qn_str = g1 if (g1 is not None and g1.strip().isdigit()) else (g2 if (g2 is not None and g2.strip().isdigit()) else None)
            raw_block = q_tokens[i+2].strip() if i+2 < len(q_tokens) else ''
            i += 3
            if not qn_str:
                continue
            try:
                qn = int(qn_str)
            except ValueError:
                continue
            
            # Clean generic coaching headers & footers
            raw_block = re.sub(r'www\.competishun\.com', '', raw_block, flags=re.IGNORECASE)
            raw_block = re.sub(r'OFFICE ADDRESS[\s\S]*?Jaipur[^\n]*', '', raw_block)
            raw_block = re.sub(r'MOB\.\s*[\d,\s\-]+', '', raw_block)
            raw_block = re.sub(r'Motion Education[\s\S]*?Rajeev Gandhi Nagar[^\n]*', '', raw_block)
            raw_block = re.sub(r'url\s*:\s*www\.motion\.ac\.in[^\n]*', '', raw_block)
            raw_block = re.sub(r'Corporate Office\s*:\s*Aakash Tower[^\n]*', '', raw_block)
            raw_block = re.sub(r'Page\s*#\s*\d+', '', raw_block)
            raw_block = re.sub(r'JEE-MAIN EXAM[^\n]*', '', raw_block)
            raw_block = re.sub(r'JEE\s*\(Main\)[^\n]*', '', raw_block)
            raw_block = re.sub(r'Date:\s*-[^\n]*', '', raw_block)
            raw_block = re.sub(r'-\s*\d+\s*-', '', raw_block)
            
            # Normalize internal question number (1..30 or 1..25)
            if not is_per_subject_numbering:
                min_q = s_idx * q_count_per_subject + 1
                max_q = (s_idx + 1) * q_count_per_subject
                if min_q <= qn <= max_q:
                    norm_qn = qn - s_idx * q_count_per_subject
                elif 1 <= qn <= q_count_per_subject:
                    norm_qn = qn
                else:
                    norm_qn = ((qn - 1) % q_count_per_subject) + 1
            else:
                if qn > q_count_per_subject:
                    norm_qn = ((qn - 1) % q_count_per_subject) + 1
                else:
                    norm_qn = qn

            is_sec_b = norm_qn > 20
            k = f"{s_name}_{norm_qn}"

            # Check for inline answer if not already in answer_keys
            if norm_qn not in answer_keys[s_name]:
                inline_ans = extract_inline_answer(raw_block, is_sec_b)
                if inline_ans:
                    answer_keys[s_name][norm_qn] = inline_ans

            # Extract solution and clean block
            q_clean = raw_block
            sol_clean = ""
            
            # Universal solution split: Ans. / Answer / Sol.
            m_split = re.split(r'(?:^|\n)\s*(?:Ans\.|Answer|Sol\.)\b', raw_block, flags=re.IGNORECASE)
            if len(m_split) > 1:
                q_clean = m_split[0].strip()
                sol_clean = "\n".join(m_split[1:]).strip()

            if 1 <= norm_qn <= q_count_per_subject:
                if k not in question_blocks or len(q_clean) > len(question_blocks[k]):
                    question_blocks[k] = q_clean
                if sol_clean and (k not in solutions or len(sol_clean) > len(solutions[k])):
                    solutions[k] = sol_clean

    return {
        'shiftId': shift_id,
        'totalPages': total_pages,
        'qCountPerSubject': q_count_per_subject,
        'numberingMode': 'PER_SUBJECT' if is_per_subject_numbering else 'CONTINUOUS',
        'subjects': subjects,
        'answerKeys': answer_keys,
        'diagrams': diagrams,
        'questionCounts': {s['name']: sum(1 for k in question_blocks if k.startswith(s['name'])) for s in subjects},
        'questionBlocks': question_blocks,
        'solutions': solutions
    }

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: universal_manifest_extractor.py <pdfPath> <shiftId>"}))
        sys.exit(1)
    res = extract_manifest(sys.argv[1], sys.argv[2])
    print(json.dumps(res, indent=2))
