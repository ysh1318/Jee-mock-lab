import urllib.request
import pypdf
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

urls = [
    ('Physics', 'http://competishun.com/wp-content/uploads/2025/06/22-1-25-PHYSICS-PAPER-WITH-ANSWERS-S-1.pdf'),
    ('Chemistry', 'http://competishun.com/wp-content/uploads/2025/06/22-1-25-CHEMISTRY-PAPER-WITH-ANSWERS-S-1.pdf'),
    ('Mathematics', 'http://competishun.com/wp-content/uploads/2025/06/22-1-25-MATHEMATICS-PAPER-WITH-ANSWERS-S-1.pdf')
]

os.makedirs('scratch/test_merge', exist_ok=True)
merger = pypdf.PdfWriter()

for subj, url in urls:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    print(f"Downloading {subj} from {url}...")
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        print(f"  Downloaded {len(data)} bytes")
        tmp_path = f"scratch/test_merge/{subj}.pdf"
        with open(tmp_path, 'wb') as f:
            f.write(data)
        reader = pypdf.PdfReader(tmp_path)
        print(f"  {subj} pages: {len(reader.pages)}")
        print(f"  {subj} page 0 snippet: {reader.pages[0].extract_text()[:150]}")
        for page in reader.pages:
            merger.add_page(page)

merged_path = 'scratch/test_merge/2025-01-22_S1_combined.pdf'
with open(merged_path, 'wb') as f:
    merger.write(f)

print(f"\nSuccessfully merged into {merged_path}!")
merged_reader = pypdf.PdfReader(merged_path)
print(f"Total merged pages: {len(merged_reader.pages)}")
