import os
import glob
import re
import json
import subprocess

def patch_keys():
    pdf_mapping = {
        '2025-apr-02-s1': 'jee mains shifts raw pdfs/2025 april/1. 02-04-2025_S1.pdf',
        '2025-apr-02-s2': 'jee mains shifts raw pdfs/2025 april/2. 02-04-2025_S2.pdf',
        '2025-apr-04-s1': 'jee mains shifts raw pdfs/2025 april/5. 04-04-2025_S1.pdf',
        '2025-apr-04-s2': 'jee mains shifts raw pdfs/2025 april/6. 04-04-2025_S2.pdf',
        '2025-apr-07-s2': 'jee mains shifts raw pdfs/2025 april/8. 07-04-2025_S2.pdf',
        '2025-apr-08-s2': 'jee mains shifts raw pdfs/2025 april/9. 08-04-2025_S2.pdf',
        '2025-jan-24-s1': 'jee mains shifts raw pdfs/2025 jan/5. 24-01-2025_S1.pdf',
        '2025-jan-29-s2': 'jee mains shifts raw pdfs/2025 jan/10. 29-01-2025_S2.pdf',
    }

    for shift_id, pdf_path in pdf_mapping.items():
        ts_path = f"src/data/shifts/{shift_id}.ts"
        if not os.path.exists(ts_path):
            print(f"Skipping {shift_id}, file not found")
            continue
            
        print(f"Extracting authentic keys for {shift_id} from {pdf_path}...")
        cmd = ["python", "scripts/universal_manifest_extractor.py", pdf_path, shift_id]
        res = subprocess.check_output(cmd, encoding='utf-8')
        manifest = json.loads(res.strip())
        
        answer_keys = manifest.get('answerKeys', {})
        total_k = sum(len(v) for v in answer_keys.values())
        print(f"  Found {total_k}/75 answers: Physics={len(answer_keys.get('Physics',{}))}, Chemistry={len(answer_keys.get('Chemistry',{}))}, Maths={len(answer_keys.get('Mathematics',{}))}")
        
        with open(ts_path, encoding='utf-8') as f:
            content = f.read()

        # Replace correctAnswer for each question:
        # Match pattern: id: "2025-P-01", ... correctAnswer: "...",
        def replace_ans(match):
            q_id = match.group(1) # e.g. 2025-P-01
            m = re.match(r'\d{4}-([PCM])-(\d+)', q_id)
            if not m:
                return match.group(0)
            sub_char = m.group(1)
            q_num = int(m.group(2))
            
            sub_map = {'P': 'Physics', 'C': 'Chemistry', 'M': 'Mathematics'}
            sub_name = sub_map[sub_char]
            
            official_ans = answer_keys.get(sub_name, {}).get(str(q_num))
            if official_ans:
                return f'id: "{q_id}"{match.group(2)}correctAnswer: "{official_ans}"'
            return match.group(0)

        pattern = re.compile(r'id:\s*"([0-9]{4}-[PCM]-\d+)"([\s\S]*?)correctAnswer:\s*"[^"]*"')
        new_content = pattern.sub(replace_ans, content)
        
        with open(ts_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  Patched {ts_path} successfully!\n")

if __name__ == '__main__':
    patch_keys()
