import re
import sys

filename = sys.argv[1] if len(sys.argv) > 1 else 'src/data/shifts/2025-jan-22-s1.ts'

with open(filename, encoding='utf-8') as f:
    text = f.read()

qs = re.findall(r'id:\s*"([0-9]{4}-[PCM]-\d+)"', text)
diagrams = re.findall(r'hasDiagram:\s*true', text)
answers = re.findall(r'correctAnswer:\s*"([^"]+)"', text)
options = re.findall(r'options:\s*\[([\s\S]*?)\]', text)
placeholders = re.findall(r'"Option [A-D]"', text)
pua = re.findall(r'[\uf000-\uf0ff]', text)

print(f"=== Audit Report for {filename} ===")
print("Total Questions:", len(qs))
print("Total Diagrams:", len(diagrams))
print("Total Answers:", len(answers))
print("Total Options Blocks (Section A):", len(options))
print("Placeholder Options found:", len(placeholders))
print("PUA characters found:", len(pua))
print("First 3 Answers (Physics Sec A):", answers[:3])
print("Numerical Answers (Sec B Physics):", answers[20:25])
print("Numerical Answers (Sec B Chemistry):", answers[45:50])
print("Numerical Answers (Sec B Mathematics):", answers[70:75])
