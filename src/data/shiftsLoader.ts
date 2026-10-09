import { Question, Subject, Section, ShiftMetadata } from "../types";
import { SHIFTS_CATALOG, FREE_FLAGSHIP_IDS } from "./shiftsCatalog";
// Vite code-splitting: dynamically index and lazy-load all authentic shift modules on demand
const shiftFileModules = import.meta.glob<{ [key: string]: Question[] }>("./shifts/*.ts");

/**
 * Retrieve shift metadata by ID
 */
export function getShiftMetadata(shiftId: string): ShiftMetadata | undefined {
  return SHIFTS_CATALOG.find((s) => s.id === shiftId);
}

/**
 * Check whether a user has access to a specific shift
 */
export function canAccessShift(shiftId: string, hasAllAccessPass: boolean = false): boolean {
  if (FREE_FLAGSHIP_IDS.includes(shiftId)) return true;
  return hasAllAccessPass;
}

/**
 * Loads the questions for a specific shift.
 * ONLY loads 100% verified, authentic official papers.
 * No synthetic or fake papers are permitted.
 */
export async function loadShiftPaper(shiftId: string): Promise<Question[]> {
  // 1. Check dynamically bundled shift modules
  const modulePath = `./shifts/${shiftId}.ts`;
  if (shiftFileModules[modulePath]) {
    try {
      const mod = await shiftFileModules[modulePath]();
      // Locate the exported question array (e.g. QUESTIONS_2026_JAN_28_S1)
      const questions = Object.values(mod).find(Array.isArray);
      if (questions && questions.length > 0) {
        return questions as Question[];
      }
    } catch (err) {
      console.warn(`Failed loading module chunk for ${shiftId}:`, err);
    }
  }

  // 2. Check verified local shift store (from official PDF ingestion)
  try {
    const storedPaper = localStorage.getItem(`jee_official_shift_${shiftId}`);
    if (storedPaper) {
      return JSON.parse(storedPaper);
    }
  } catch {}

  const shift = getShiftMetadata(shiftId);
  if (!shift) {
    throw new Error(`Shift not found in catalog: ${shiftId}`);
  }

  throw new Error(`The official NTA question paper for ${shift.title} is currently queued for official PDF ingestion with full diagrams. Zero synthetic papers are permitted on JEE Mock Lab.`);
}
