import json
import subprocess

shifts = [
    ('2024-jan-27-s2 (Aakash)', 'jee mains shifts raw pdfs/2024 jan/2024-jan-27-s2.pdf', '2024-jan-27-s2'),
    ('2024-jan-30-s2 (Motion)', 'jee mains shifts raw pdfs/2024 jan/2024-jan-30-s2.pdf', '2024-jan-30-s2'),
    ('2024-apr-04-s1 (Competishun)', 'jee mains shifts raw pdfs/2024 april/2024-apr-04-s1.pdf', '2024-apr-04-s1')
]

for label, pdf, sid in shifts:
    res = subprocess.check_output(['python', 'scripts/universal_manifest_extractor.py', pdf, sid], encoding='utf-8')
    data = json.loads(res)
    print(f"\n================ {label} ================")
    print("Subjects:", [s['name'] for s in data['subjects']])
    print("Numbering Mode:", data.get('numberingMode'))
    print("Target Qs per subject:", data.get('qCountPerSubject'))
    print("Total Diagrams Extracted:", len(data['diagrams']))
    for s in ['Physics', 'Chemistry', 'Mathematics']:
        q_count = data['questionCounts'].get(s, 0)
        ans_count = len(data['answerKeys'].get(s, {}))
        sol_count = sum(1 for k in data['solutions'] if k.startswith(s))
        print(f"  {s}: {q_count} text blocks, {ans_count} official answers, {sol_count} solutions")
