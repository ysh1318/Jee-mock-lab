import os
import sys
import urllib.request
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

SHIFTS_2024 = {
    # --- MOTION EDUCATION (January / February Shifts - Full 90 Qs with Solutions & Diagrams) ---
    '2024-jan-27-s2': {
        'provider': 'motion',
        'folder': '2024 jan',
        'subjects': {
            'physics': 'https://cdn.motion.ac.in/pdf/PHYSICSJEE27thJanShift-2.pdf',
            'chemistry': 'https://cdn.motion.ac.in/pdf/Chemistry_JEEMains_2024-01-27Jan_2nd-Shift.pdf',
            'maths': 'https://cdn.motion.ac.in/pdf/Maths_27JanShift-2.pdf'
        }
    },
    '2024-jan-29-s1': {
        'provider': 'motion',
        'folder': '2024 jan',
        'subjects': {
            'physics': 'https://cdn.motion.ac.in/pdf/PHYSICSJEE29thJanShift-1.pdf',
            'chemistry': 'https://cdn.motion.ac.in/pdf/Chemistry_JEEMains_2024-01-29Jan_1st-Shift.pdf',
            'maths': 'https://cdn.motion.ac.in/pdf/Maths_29-Jan-Shift-1.pdf'
        }
    },
    '2024-jan-29-s2': {
        'provider': 'motion',
        'folder': '2024 jan',
        'subjects': {
            'physics': 'https://cdn.motion.ac.in/pdf/PHYSICSJEE29thJanShift-2.pdf',
            'chemistry': 'https://cdn.motion.ac.in/pdf/Chemistry_JEEMains_2024-01-29Jan_2nd-Shift.pdf',
            'maths': 'https://cdn.motion.ac.in/pdf/Maths_29JanShift-2.pdf'
        }
    },
    '2024-jan-30-s1': {
        'provider': 'motion',
        'folder': '2024 jan',
        'subjects': {
            'physics': 'https://cdn.motion.ac.in/pdf/Physics%20_%20JEE_30th_Jan_Shift_1_Final.pdf',
            'chemistry': 'https://cdn.motion.ac.in/pdf/Chemistry_%20JEE_2024_30_Jan_1st_Shift.pdf',
            'maths': 'https://cdn.motion.ac.in/pdf/Maths_JEE_30_Jan_Shift_1.pdf'
        }
    },
    '2024-jan-30-s2': {
        'provider': 'motion',
        'folder': '2024 jan',
        'subjects': {
            'physics': 'https://cdn.motion.ac.in/pdf/Physics%20_%20JEE%2030th%20Jan%20Shift%20-2__Final.pdf',
            'chemistry': 'https://cdn.motion.ac.in/pdf/Chemistry%20_%20JEE%202024_30%20Jan%202st%20Shift.pdf',
            'maths': 'https://cdn.motion.ac.in/pdf/Maths%20_%20JEE_30%20Jan%20Shift%20-%202.pdf'
        }
    },
    '2024-jan-31-s1': {
        'provider': 'motion',
        'folder': '2024 jan',
        'subjects': {
            'physics': 'https://cdn.motion.ac.in/pdf/Physics%20_%20JEE%2031th%20Jan%20Shift%20-1_Final.pdf',
            'chemistry': 'https://cdn.motion.ac.in/pdf/Chemistry%20_%20JEE%202024_31%20Jan%201st%20Shift.pdf',
            'maths': 'https://cdn.motion.ac.in/pdf/Maths%20_%20JEE_31%20Jan%20Shift%20-%201.pdf'
        }
    },
    '2024-jan-31-s2': {
        'provider': 'motion',
        'folder': '2024 jan',
        'subjects': {
            'physics': 'https://cdn.motion.ac.in/pdf/Physics%20_%20JEE%2031th%20Jan%20Shift%20-2_Final.pdf',
            'chemistry': 'https://cdn.motion.ac.in/pdf/Chemistry%20_%20JEE%202024_31%20Jan%202st%20Shift.pdf',
            'maths': 'https://cdn.motion.ac.in/pdf/Maths_31_Jan_Shift-2.pdf'
        }
    },
    '2024-feb-01-s1': {
        'provider': 'motion',
        'folder': '2024 jan',
        'subjects': {
            'physics': 'https://cdn.motion.ac.in/pdf/Physics%20_%20JEE%201st%20Feb.%20Shift%20-1_Final.pdf',
            'chemistry': 'https://cdn.motion.ac.in/pdf/Chemistry%20_%20JEE%202024_01%20Feb%201st%20Shift.pdf',
            'maths': 'https://cdn.motion.ac.in/pdf/Maths%20_%20JEE_01%20Feb%20Shift%20-%201.pdf'
        }
    },
    '2024-feb-01-s2': {
        'provider': 'motion',
        'folder': '2024 jan',
        'subjects': {
            'physics': 'https://cdn.motion.ac.in/pdf/Physics%20_%20JEE%201st%20Feb.%20Shift%20-2_Final.pdf',
            'chemistry': 'https://cdn.motion.ac.in/pdf/Chemistry%20_%20JEE%202024_01%20Feb%202nd%20Shift.pdf',
            'maths': 'https://cdn.motion.ac.in/pdf/Maths%20_%20JEE_01%20Feb%20Shift%20-%202.pdf'
        }
    },

    # --- COMPETISHUN (April Shifts - Full 90 Qs with NTA Answers Table & Diagrams) ---
    '2024-apr-04-s1': {
        'provider': 'competishun',
        'folder': '2024 april',
        'subjects': {
            'physics': 'http://competishun.com/wp-content/uploads/2025/06/0404-Physics-Paper-With-Solution-Morning.pdf',
            'chemistry': 'http://competishun.com/wp-content/uploads/2025/06/0404-CHEMISTRY-Paper-With-Solution-Morning.pdf',
            'maths': 'http://competishun.com/wp-content/uploads/2025/06/0404-Mathematics-Paper-With-Solution-Morning.pdf'
        }
    },
    '2024-apr-04-s2': {
        'provider': 'competishun',
        'folder': '2024 april',
        'subjects': {
            'physics': 'http://competishun.com/wp-content/uploads/2025/06/0404-Physics-Paper-With-Solution-Evening.pdf',
            'chemistry': 'http://competishun.com/wp-content/uploads/2025/06/0404-CHEMISTRY-Paper-With-Solution-Evening.pdf',
            'maths': 'http://competishun.com/wp-content/uploads/2025/06/0404-Mathematics-Paper-With-Solution-Evening.pdf'
        }
    },
    '2024-apr-05-s1': {
        'provider': 'competishun',
        'folder': '2024 april',
        'subjects': {
            'physics': 'http://competishun.com/wp-content/uploads/2025/06/0504-Physics-Paper-With-Solution-Morning.pdf',
            'chemistry': 'http://competishun.com/wp-content/uploads/2025/06/0504-CHEMISTRY-Paper-With-Solution-Morning.pdf',
            'maths': 'http://competishun.com/wp-content/uploads/2025/06/0504-Mathematics-Paper-With-Solution-Morning.pdf'
        }
    },
    '2024-apr-05-s2': {
        'provider': 'competishun',
        'folder': '2024 april',
        'subjects': {
            'physics': 'http://competishun.com/wp-content/uploads/2025/06/0504-Physics-Paper-With-Solution-Evening.pdf',
            'chemistry': 'http://competishun.com/wp-content/uploads/2025/06/0504-CHEMISTRY-Paper-With-Solution-Evening.pdf',
            'maths': 'http://competishun.com/wp-content/uploads/2025/06/0504-Mathematics-Paper-With-Solution-Evening.pdf'
        }
    },
    '2024-apr-06-s1': {
        'provider': 'competishun',
        'folder': '2024 april',
        'subjects': {
            'physics': 'http://competishun.com/wp-content/uploads/2025/06/0604-Physics-Paper-With-Solution-Morning.pdf',
            'chemistry': 'http://competishun.com/wp-content/uploads/2025/06/0604-CHEMISTRY-Paper-With-Solution-Morning.pdf',
            'maths': 'http://competishun.com/wp-content/uploads/2025/06/0604-Mathematics-Paper-With-Solution-Morning.pdf'
        }
    },
    '2024-apr-06-s2': {
        'provider': 'competishun',
        'folder': '2024 april',
        'subjects': {
            'physics': 'http://competishun.com/wp-content/uploads/2025/06/0604-Physics-Paper-With-Solution-Evening.pdf',
            'chemistry': 'http://competishun.com/wp-content/uploads/2025/06/0604-CHEMISTRY-Paper-With-Solution-Evening.pdf',
            'maths': 'http://competishun.com/wp-content/uploads/2025/06/0604-Mathematics-Paper-With-Solution-Evening.pdf'
        }
    },
    '2024-apr-08-s1': {
        'provider': 'competishun',
        'folder': '2024 april',
        'subjects': {
            'physics': 'http://competishun.com/wp-content/uploads/2025/06/0804-Physics-Paper-With-Solution-Morning.pdf',
            'chemistry': 'http://competishun.com/wp-content/uploads/2025/06/0804-CHEMISTRY-Paper-With-Solution-Morning.pdf',
            'maths': 'http://competishun.com/wp-content/uploads/2025/06/0804-Mathematics-Paper-With-Solution-Morning.pdf'
        }
    },
    '2024-apr-08-s2': {
        'provider': 'competishun',
        'folder': '2024 april',
        'subjects': {
            'physics': 'http://competishun.com/wp-content/uploads/2025/06/0804-Physics-Paper-With-Solution-Evening.pdf',
            'chemistry': 'http://competishun.com/wp-content/uploads/2025/06/0804-CHEMISTRY-Paper-With-Solution-Evening.pdf',
            'maths': 'http://competishun.com/wp-content/uploads/2025/06/0804-Mathematics-Paper-With-Solution-Evening.pdf'
        }
    },
    '2024-apr-09-s1': {
        'provider': 'competishun',
        'folder': '2024 april',
        'subjects': {
            'physics': 'http://competishun.com/wp-content/uploads/2025/06/0904-Physics-Paper-With-Solution-Morning.pdf',
            'chemistry': 'http://competishun.com/wp-content/uploads/2025/06/0904-CHEMISTRY-Paper-With-Solution-Morning.pdf',
            'maths': 'http://competishun.com/wp-content/uploads/2025/06/0904-Mathematics-Paper-With-Solution-Morning.pdf'
        }
    },
    '2024-apr-09-s2': {
        'provider': 'competishun',
        'folder': '2024 april',
        'subjects': {
            'physics': 'http://competishun.com/wp-content/uploads/2025/06/0904-Physics-Paper-With-Solution-Evening.pdf',
            'chemistry': 'http://competishun.com/wp-content/uploads/2025/06/0904-CHEMISTRY-Paper-With-Solution-Evening.pdf',
            'maths': 'http://competishun.com/wp-content/uploads/2025/06/0904-Mathematics-Paper-With-Solution-Evening.pdf'
        }
    }
}

def download_bytes(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()

def fetch_and_prepare_shift(shift_id, force=False):
    info = SHIFTS_2024.get(shift_id)
    if not info:
        print(f"Unknown shift: {shift_id}")
        return None

    base_dir = os.path.join("jee mains shifts raw pdfs", info['folder'])
    os.makedirs(base_dir, exist_ok=True)
    out_pdf = os.path.join(base_dir, f"{shift_id}.pdf")

    if not force and os.path.exists(out_pdf) and os.path.getsize(out_pdf) > 100000:
        print(f"Shift PDF already exists: {out_pdf} ({os.path.getsize(out_pdf)} bytes)")
        return out_pdf

    print(f"\n--- Downloading and Preparing {shift_id} ({info['provider']}) ---")

    merged_doc = pymupdf.open()
    # Order: physics, chemistry, maths
    for sub_name in ['physics', 'chemistry', 'maths']:
        sub_url = info['subjects'][sub_name]
        print(f"Downloading {sub_name} from {sub_url}...")
        data = download_bytes(sub_url)
        sub_doc = pymupdf.open(stream=data, filetype='pdf')
        print(f"  {sub_name}: {len(sub_doc)} pages")
        merged_doc.insert_pdf(sub_doc)
        sub_doc.close()

    merged_doc.save(out_pdf)
    merged_doc.close()
    print(f"Merged 3 subjects into {out_pdf} ({os.path.getsize(out_pdf)} bytes, {len(pymupdf.open(out_pdf))} pages)")
    return out_pdf

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if target == 'all':
        for s in SHIFTS_2024.keys():
            fetch_and_prepare_shift(s)
    else:
        force = '--force' in sys.argv
        fetch_and_prepare_shift(target, force=force)
