import sys
import json
import re
import os

try:
    import pymupdf
except ImportError:
    print(json.dumps({"error": "pymupdf_not_installed"}))
    sys.exit(0)

sys.stdout.reconfigure(encoding='utf-8')

def parse_answer_key_robust(doc):
    key_text = ''
    for p_idx in range(len(doc)-1, max(-1, len(doc)-3), -1):
        t = doc[p_idx].get_text('text')
        if 'ANSWER KEY' in t:
            key_text = t[t.index('ANSWER KEY') + len('ANSWER KEY'):]
            break
    if not key_text:
        return {}
    
    key_text = re.sub(r'52/6, OPPO\. METRO MAS HOSPITAL[\s\S]*$', '', key_text)
    key_text = re.sub(r'Page #\s*\d+', '', key_text)
    
    tokens = re.split(r'(?:^|\s+)(\d{1,2})\.\s*', key_text)
    ans_map = {}
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
                digit = re.search(r'[1-4]', first_line).group(0)
                clean_val = ['A', 'B', 'C', 'D'][int(digit) - 1]
            else:
                clean_val = first_line
                
        ans_map[str(q_num)] = clean_val
        i += 2
        
    return ans_map

def detect_structure(pdf_path):
    doc = pymupdf.open(pdf_path)
    total_pages = len(doc)
    
    # Extract header / test name from page 1
    p1_text = doc[0].get_text('text')
    lines = [l.strip() for l in p1_text.split('\n') if l.strip()]
    test_name = lines[0] if lines else "JEE-Main Official Shift Paper"
    for l in lines[:5]:
        if "JEE-MAIN" in l.upper() or "JEE MAIN" in l.upper():
            test_name = l
            break

    page_subjects = [None] * total_pages
    current_sub = None
    
    for p_idx, page in enumerate(doc):
        text = page.get_text('text')
        check_lines = [l.strip().upper() for l in text.split('\n') if l.strip()][:30]
        
        # Check for explicit section subject headers
        for line in check_lines:
            if re.search(r'\bPHYSICS\b', line):
                current_sub = 'Physics'
                break
            elif re.search(r'\bCHEMISTRY\b', line):
                current_sub = 'Chemistry'
                break
            elif re.search(r'\bMATHEMATICS\b|\bMATHS\b', line):
                current_sub = 'Mathematics'
                break
        page_subjects[p_idx] = current_sub

    # If first page wasn't labeled, inspect first page deeply
    if page_subjects[0] is None:
        t0 = doc[0].get_text('text').upper()
        if 'PHYSICS' in t0: page_subjects[0] = 'Physics'
        elif 'CHEMISTRY' in t0: page_subjects[0] = 'Chemistry'
        elif 'MATHEMATICS' in t0 or 'MATHS' in t0: page_subjects[0] = 'Mathematics'
        else: page_subjects[0] = 'Physics'

    # Forward fill unlabeled pages
    curr = page_subjects[0]
    for i in range(total_pages):
        if page_subjects[i] is None:
            page_subjects[i] = curr
        else:
            curr = page_subjects[i]

    subjects = {}
    for sub in ['Physics', 'Chemistry', 'Mathematics']:
        pages = [i + 1 for i, s in enumerate(page_subjects) if s == sub]
        if pages:
            subjects[sub] = {'startPage': min(pages), 'endPage': max(pages)}
        else:
            # Fallback 1/3 splits if a subject was somehow not tagged
            pages_per_sub = max(1, total_pages // 3)
            if sub == 'Physics':
                subjects[sub] = {'startPage': 1, 'endPage': pages_per_sub}
            elif sub == 'Chemistry':
                subjects[sub] = {'startPage': pages_per_sub + 1, 'endPage': 2 * pages_per_sub}
            else:
                subjects[sub] = {'startPage': 2 * pages_per_sub + 1, 'endPage': total_pages}

    answer_key = parse_answer_key_robust(doc)

    return {
        "testName": test_name,
        "totalPages": total_pages,
        "subjects": subjects,
        "answerKey": answer_key
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
        
    path = sys.argv[1]
    if not os.path.exists(path):
        print(json.dumps({"error": "File does not exist"}))
        sys.exit(1)
        
    result = detect_structure(path)
    print(json.dumps(result))
