import re

# Test 1: Aakash format
aakash_mcq = """1. If the work function of a metal is 6.63 eV, then find its threshold frequency for photoelectric effect.
(1) 1.9 × 10^15 Hz
(2) 1.6 × 10^15 Hz
(3) 2 × 10^16 Hz
(4) 1.2 × 10^15 Hz
Answer (2)
Sol. f_0 = phi / h = 1.6 x 10^15 Hz"""

aakash_nat = """25. Pressures at ends of a horizontal pipe are given for water. Find speed v at end 2 if speed at end 1 is 10 m/s. (density of water = 1000 kg/m3). Find v (in m/s)
Answer (11.00)
Sol. p1 - p2 = 1/2 rho (v2^2 - v1^2) => v2 = 11 m/s"""

# Test 2: Motion format
motion_mcq = """31. The equation of state of a real gas is given by (P + a/V^2)(V - b) = RT...
(1) PV
(2) P
(3) RT
(4) R
Sol.
2
dimension [P] = [a]/[V^2] => [a] = [P][V^2]"""

motion_nat = """51. The magnetic field at the centre of a wire loop... is alpha x 10^-7 T. The value of alpha is _____.
Sol.
03.00
B = mu_0 I / 4 R => alpha = 3"""

def extract_inline_answer_and_clean(block, is_section_b=False):
    # Pattern A: Answer (X)
    m_aakash = re.search(r'Answer\s*\(([^\)]+)\)', block, re.IGNORECASE)
    if m_aakash:
        raw = m_aakash.group(1).strip()
        ans = raw
        if not is_section_b:
            m_opt = re.search(r'([1-4])', raw)
            if m_opt:
                ans = ['A', 'B', 'C', 'D'][int(m_opt.group(1)) - 1]
            elif raw.upper() in ['A', 'B', 'C', 'D']:
                ans = raw.upper()
        else:
            m_num = re.search(r'[-+]?\d*\.?\d+', raw)
            if m_num:
                v = float(m_num.group(0))
                ans = str(int(v)) if v.is_integer() else str(v)
        
        # Split into question and solution
        parts = re.split(r'Answer\s*\([^\)]+\)', block, flags=re.IGNORECASE)
        q_text = parts[0].strip()
        sol_text = ""
        if len(parts) > 1:
            sol_m = re.search(r'Sol\.\s*([\s\S]*)', parts[1], re.IGNORECASE)
            sol_text = sol_m.group(1).strip() if sol_m else parts[1].strip()
        return ans, q_text, sol_text

    # Pattern B: Sol. \n <ans>
    m_motion = re.search(r'Sol\.\s*\n\s*([A-Da-d0-9\.\-]+)\s*(?:\n|$)([\s\S]*)', block, re.IGNORECASE)
    if m_motion:
        raw = m_motion.group(1).strip()
        rest_sol = m_motion.group(2).strip()
        ans = raw
        if not is_section_b:
            m_opt = re.search(r'([1-4])', raw)
            if m_opt:
                ans = ['A', 'B', 'C', 'D'][int(m_opt.group(1)) - 1]
            elif raw.upper() in ['A', 'B', 'C', 'D']:
                ans = raw.upper()
        else:
            m_num = re.search(r'[-+]?\d*\.?\d+', raw)
            if m_num:
                v = float(m_num.group(0))
                ans = str(int(v)) if v.is_integer() else str(v)
        q_text = re.split(r'Sol\.', block, flags=re.IGNORECASE)[0].strip()
        return ans, q_text, rest_sol

    return None, block, ""

print("Test Aakash MCQ:", extract_inline_answer_and_clean(aakash_mcq, is_section_b=False))
print("Test Aakash NAT:", extract_inline_answer_and_clean(aakash_nat, is_section_b=True))
print("Test Motion MCQ:", extract_inline_answer_and_clean(motion_mcq, is_section_b=False))
print("Test Motion NAT:", extract_inline_answer_and_clean(motion_nat, is_section_b=True))
