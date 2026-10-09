import os
import re

dir_path = "src/data/shifts"
files = sorted([f for f in os.listdir(dir_path) if re.match(r'^\d{4}-.*\.ts$', f)])

print(f"Auditing {len(files)} authentic shift modules across all years:\n")
total_q = 0
total_d = 0

for f in files:
    filepath = os.path.join(dir_path, f)
    with open(filepath, encoding="utf-8") as fp:
        c = fp.read()
    qs = len(re.findall(r'id:\s*"\d{4}-[PCM]-\d+"', c))
    ds = len(re.findall(r'hasDiagram:\s*true', c))
    total_q += qs
    total_d += ds
    status = "OK" if qs in [75, 90] else f"MISMATCH ({qs})"
    print(f"{f:<24} | Questions: {qs:2d} [{status}] | Diagrams: {ds:2d}")

print("-" * 55)
print(f"GRAND TOTAL: {total_q} Questions ({len(files)} shifts), {total_d} genuine Diagrams.")
