import { Section } from "../types";

/**
 * Normalizes an MCQ option string (e.g. "(A)", "Option A", "1", "b") to a single uppercase letter "A"|"B"|"C"|"D".
 */
export function normalizeMcqOption(val: string): string {
  if (!val) return "";
  const cleaned = val.trim();

  // Direct single letter match
  if (/^[a-dA-D]$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }

  // Numerical 1, 2, 3, 4 -> A, B, C, D
  if (/^[1-4]$/.test(cleaned)) {
    const map: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
    return map[cleaned] || cleaned;
  }

  // Parentheses or brackets: (A), [B], (1)
  const bracketMatch = cleaned.match(/^[\(\[\{]\s*([a-dA-D1-4])\s*[\)\]\}]$/);
  if (bracketMatch) {
    const inner = bracketMatch[1];
    if (/^[1-4]$/.test(inner)) {
      const map: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
      return map[inner] || inner;
    }
    return inner.toUpperCase();
  }

  // Option prefix: "Option A", "Option (B)", "Opt A", "Option 2"
  const optionMatch = cleaned.match(/^(?:option|opt)\.?\s*[\(\[]?\s*([a-dA-D1-4])\s*[\)\]]?$/i);
  if (optionMatch) {
    const inner = optionMatch[1];
    if (/^[1-4]$/.test(inner)) {
      const map: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
      return map[inner] || inner;
    }
    return inner.toUpperCase();
  }

  return cleaned.toLowerCase();
}

/**
 * Normalizes a numerical answer string, replacing unicode minus/dashes and whitespace.
 */
function cleanNumericalString(str: string): string {
  return str
    .replace(/[\u2212\u2013\u2014]/g, "-") // Unicode minus, en-dash, em-dash
    .replace(/,/g, "") // Commas in numbers e.g. 1,000
    .trim();
}

/**
 * Determines whether a student's response matches the official answer key with domain-accurate
 * tolerance, numerical format normalization (integers, floats, ranges), and MCQ letter canonicalization.
 */
export function isAnswerCorrect(
  userAnswer?: string | null,
  officialAnswer?: string | null,
  section?: Section
): boolean {
  if (!userAnswer || !officialAnswer) return false;

  const userTrim = userAnswer.trim();
  const officialTrim = officialAnswer.trim();
  if (!userTrim || !officialTrim) return false;

  // 1. Direct case-insensitive string match
  if (userTrim.toLowerCase() === officialTrim.toLowerCase()) {
    return true;
  }

  // 2. Section A (MCQ) Evaluation
  if (section === Section.A || !section) {
    const userNorm = normalizeMcqOption(userTrim);
    const officialNorm = normalizeMcqOption(officialTrim);
    if (userNorm && officialNorm && userNorm === officialNorm) {
      return true;
    }
  }

  // 3. Section B (NAT / Numerical Answer Type) Evaluation
  const userClean = cleanNumericalString(userTrim);
  const userNum = parseFloat(userClean);

  if (!isNaN(userNum)) {
    const officialClean = cleanNumericalString(officialTrim);

    // 3a. Range matching: "24 to 26", "24 - 26", "24.0 to 26.0", "between 24 and 26"
    const rangeMatch = officialClean.match(
      /^(?:between\s+)?(-?\d+(?:\.\d+)?)\s*(?:to|-|\.{2,3})\s*(-?\d+(?:\.\d+)?)$/i
    );
    if (rangeMatch) {
      const lower = Math.min(parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2]));
      const upper = Math.max(parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2]));
      if (!isNaN(lower) && !isNaN(upper)) {
        return userNum >= lower - 1e-4 && userNum <= upper + 1e-4;
      }
    }

    // 3b. Alternatives matching: "24 or 25", "24 / 25", "24, 25"
    if (/[\s,/]+(?:or)?[\s,/]+/i.test(officialClean) || officialClean.includes(",")) {
      const parts = officialClean.split(/(?:\s+or\s+|\s*[/,]\s*)/i);
      for (const part of parts) {
        const targetNum = parseFloat(part.trim());
        if (!isNaN(targetNum) && Math.abs(userNum - targetNum) < 1e-4) {
          return true;
        }
      }
    }

    // 3c. Direct numerical float equality (handles "2" vs "2.0" vs "2.00")
    const officialNum = parseFloat(officialClean);
    if (!isNaN(officialNum)) {
      if (Math.abs(userNum - officialNum) < 1e-4) {
        return true;
      }
    }
  }

  return false;
}
