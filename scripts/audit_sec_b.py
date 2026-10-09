import glob
import re

files = sorted(glob.glob('src/data/shifts/2025-*.ts'))
print(f"Auditing Section B answers across all {len(files)} shifts of 2025:\n")

needs_update = []
for f in files:
    with open(f, encoding='utf-8') as fp:
        c = fp.read()
    ans = re.findall(r'correctAnswer:\s*"([^"]+)"', c)
    if len(ans) < 75:
        print(f"{f}: ONLY {len(ans)} ANSWERS!")
        needs_update.append(f)
        continue
    sec_b = ans[20:25] + ans[45:50] + ans[70:75]
    zero_count = sec_b.count('0')
    if zero_count > 0:
        print(f"{f}: {zero_count} zeros in Section B -> {sec_b}")
        needs_update.append(f)
    else:
        print(f"{f}: 100% OK! Sec B: {sec_b}")

print(f"\nTotal needing answer key update: {len(needs_update)}")
