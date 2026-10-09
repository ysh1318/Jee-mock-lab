import json
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

res = subprocess.check_output(['python', 'scripts/universal_manifest_extractor.py', 'jee mains shifts raw pdfs/2024 jan/2024-jan-30-s2.pdf', '2024-jan-30-s2'], encoding='utf-8')
data = json.loads(res)

print("--- Mathematics Q1 block ---")
print(data['questionBlocks'].get('Mathematics_1', 'NOT FOUND')[:400])
print("\n--- Mathematics Q1 Solution ---")
print(data['solutions'].get('Mathematics_1', 'NONE')[:400])

print("\n--- Mathematics Q21 block ---")
print(data['questionBlocks'].get('Mathematics_21', 'NOT FOUND')[:400])
print("\n--- Mathematics Q21 Solution ---")
print(data['solutions'].get('Mathematics_21', 'NONE')[:400])
