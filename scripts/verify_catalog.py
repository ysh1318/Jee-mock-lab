import os
import re

with open("src/data/shiftsCatalog.ts", encoding="utf-8") as f:
    text = f.read()

# Extract all shift objects
blocks = re.findall(r'\{\s*id:\s*"([^"]+)",[\s\S]*?isFlagshipFree:\s*(true|false)', text)
print(f"Total cataloged shifts: {len(blocks)}")

by_year = {}
free_shifts = []

for sid, is_free in blocks:
    year = sid.split("-")[0]
    by_year[year] = by_year.get(year, 0) + 1
    if is_free == "true":
        free_shifts.append((sid, year))

print("Breakdown by year:")
for yr, cnt in sorted(by_year.items()):
    print(f"  {yr}: {cnt} shifts")

print(f"\nFlagship Free shifts ({len(free_shifts)}):")
for sid, yr in free_shifts:
    print(f"  - {sid} (Year {yr})")
