import { Subject, Section, ShiftPattern, ShiftMetadata } from "../types";

export const SHIFTS_CATALOG: ShiftMetadata[] = [
  // ==========================================
  // JEE MAIN 2026 (LATEST STANDARD • 75 QS)
  // ==========================================
  // Session 1 (January 2026)
  {
    id: "2026-jan-21-s1",
    title: "JEE Main 2026 • 21 Jan Shift 1",
    year: 2026,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "21 Jan 2026",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 198,
    isFlagshipFree: false,
    tagline: "Balanced opening shift • Calculus-heavy mathematics",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-jan-21-s2",
    title: "JEE Main 2026 • 21 Jan Shift 2",
    year: 2026,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "21 Jan 2026",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 178,
    isFlagshipFree: false,
    tagline: "High conceptual depth in Electrodynamics & Vectors",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-jan-22-s1",
    title: "JEE Main 2026 • 22 Jan Shift 1",
    year: 2026,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "22 Jan 2026",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Easy",
    marksFor99Percentile: 214,
    isFlagshipFree: false,
    tagline: "Formula-focused Physics • High scoring rate",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-jan-22-s2",
    title: "JEE Main 2026 • 22 Jan Shift 2",
    year: 2026,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "22 Jan 2026",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 192,
    isFlagshipFree: false,
    tagline: "Physical Chemistry calculations & Organic synthesis",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-jan-23-s1",
    title: "JEE Main 2026 • 23 Jan Shift 1",
    year: 2026,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "23 Jan 2026",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 188,
    isFlagshipFree: false,
    tagline: "Definite integrals & Coordinate Geometry traps",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-jan-23-s2",
    title: "JEE Main 2026 • 23 Jan Shift 2",
    year: 2026,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "23 Jan 2026",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 172,
    isFlagshipFree: false,
    tagline: "Rigorous Mechanics & Thermodynamics questions",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-jan-24-s1",
    title: "JEE Main 2026 • 24 Jan Shift 1",
    year: 2026,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "24 Jan 2026",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 196,
    isFlagshipFree: false,
    tagline: "Balanced mix of Waves, Optics & Physical Chemistry",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-jan-24-s2",
    title: "JEE Main 2026 • 24 Jan Shift 2",
    year: 2026,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "24 Jan 2026",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 176,
    isFlagshipFree: false,
    tagline: "Intricate Modern Physics & Conics Section problem bank",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-jan-28-s1",
    title: "JEE Main 2026 • 28 Jan Shift 1",
    year: 2026,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "28 Jan 2026",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 194,
    isFlagshipFree: true, // FLAGSHIP FREE 2026
    tagline: "★ OFFICIAL FLAGSHIP: Calibrated benchmark for 2026 standard",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-jan-28-s2",
    title: "JEE Main 2026 • 28 Jan Shift 2",
    year: 2026,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "28 Jan 2026",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 170,
    isFlagshipFree: false,
    tagline: "Challenging multi-concept electromagnetism & Organic mechanisms",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },

  // Session 2 (April 2026)
  {
    id: "2026-apr-02-s1",
    title: "JEE Main 2026 • 02 Apr Shift 1",
    year: 2026,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "02 Apr 2026",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 196,
    isFlagshipFree: false,
    tagline: "Competitive Session 2 opener • Sharp speed required",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-apr-02-s2",
    title: "JEE Main 2026 • 02 Apr Shift 2",
    year: 2026,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "02 Apr 2026",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 182,
    isFlagshipFree: false,
    tagline: "Lengthy algebraic calculations in Section B",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-apr-04-s1",
    title: "JEE Main 2026 • 04 Apr Shift 1",
    year: 2026,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "04 Apr 2026",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 190,
    isFlagshipFree: false,
    tagline: "Balanced mix of Waves, Rotational & Coordination compounds",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-apr-04-s2",
    title: "JEE Main 2026 • 04 Apr Shift 2",
    year: 2026,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "04 Apr 2026",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Easy",
    marksFor99Percentile: 212,
    isFlagshipFree: false,
    tagline: "Direct formula questions in Modern Physics & Electrochemistry",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-apr-05-s1",
    title: "JEE Main 2026 • 05 Apr Shift 1",
    year: 2026,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "05 Apr 2026",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 176,
    isFlagshipFree: false,
    tagline: "Complex numbers & Differential Equations masterclass",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-apr-05-s2",
    title: "JEE Main 2026 • 05 Apr Shift 2",
    year: 2026,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "05 Apr 2026",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 188,
    isFlagshipFree: false,
    tagline: "Organic multi-step mechanism evaluation",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-apr-06-s1",
    title: "JEE Main 2026 • 06 Apr Shift 1",
    year: 2026,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "06 Apr 2026",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 194,
    isFlagshipFree: false,
    tagline: "Solid State replacement syllabus topics & Ray Optics",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2026-apr-08-s2",
    title: "JEE Main 2026 • 08 Apr Shift 2",
    year: 2026,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "08 Apr 2026",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 180,
    isFlagshipFree: false,
    tagline: "Rigorous Vector 3D & Magnetism problem set",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },

  // ==========================================
  // JEE MAIN 2025 (FIRST NEW PATTERN • 75 QS)
  // ==========================================
  // Session 1 (January 2025)
  {
    id: "2025-jan-22-s1",
    title: "JEE Main 2025 • 22 Jan Shift 1",
    year: 2025,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "22 Jan 2025",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 190,
    isFlagshipFree: false,
    tagline: "First official paper without Section B optional choice",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-jan-22-s2",
    title: "JEE Main 2025 • 22 Jan Shift 2",
    year: 2025,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "22 Jan 2025",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 172,
    isFlagshipFree: false,
    tagline: "Heavy rotational dynamics & indefinite integration",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-jan-23-s1",
    title: "JEE Main 2025 • 23 Jan Shift 1",
    year: 2025,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "23 Jan 2025",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 184,
    isFlagshipFree: false,
    tagline: "Physical Chemistry calculations & Modern Physics",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-jan-23-s2",
    title: "JEE Main 2025 • 23 Jan Shift 2",
    year: 2025,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "23 Jan 2025",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Easy",
    marksFor99Percentile: 206,
    isFlagshipFree: false,
    tagline: "Speed shift • High accuracy required",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-jan-24-s1",
    title: "JEE Main 2025 • 24 Jan Shift 1",
    year: 2025,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "24 Jan 2025",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 186,
    isFlagshipFree: true, // FLAGSHIP FREE 2025
    tagline: "★ OFFICIAL FLAGSHIP: The landmark first implementation of the 75-question standard",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-jan-24-s2",
    title: "JEE Main 2025 • 24 Jan Shift 2",
    year: 2025,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "24 Jan 2025",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 175,
    isFlagshipFree: false,
    tagline: "Conics & Probability problem traps",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-jan-28-s1",
    title: "JEE Main 2025 • 28 Jan Shift 1",
    year: 2025,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "28 Jan 2025",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 191,
    isFlagshipFree: false,
    tagline: "Electrostatics dipole derivation & GOC stability",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-jan-28-s2",
    title: "JEE Main 2025 • 28 Jan Shift 2",
    year: 2025,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "28 Jan 2025",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Easy",
    marksFor99Percentile: 210,
    isFlagshipFree: false,
    tagline: "High-scoring direct formula paper",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-jan-29-s1",
    title: "JEE Main 2025 • 29 Jan Shift 1",
    year: 2025,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "29 Jan 2025",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 169,
    isFlagshipFree: false,
    tagline: "Brutal Mathematics section • 99%ile at 169 marks",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-jan-29-s2",
    title: "JEE Main 2025 • 29 Jan Shift 2",
    year: 2025,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "29 Jan 2025",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 188,
    isFlagshipFree: false,
    tagline: "Thermodynamics heat engines & Chemical Bonding",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },

  // Session 2 (April 2025)
  {
    id: "2025-apr-02-s1",
    title: "JEE Main 2025 • 02 Apr Shift 1",
    year: 2025,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "02 Apr 2025",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 195,
    isFlagshipFree: false,
    tagline: "Session 2 kickoff • Stiff percentile curve",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-apr-02-s2",
    title: "JEE Main 2025 • 02 Apr Shift 2",
    year: 2025,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "02 Apr 2025",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 179,
    isFlagshipFree: false,
    tagline: "Vector Triple Product & Ray Optics questions",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-apr-03-s1",
    title: "JEE Main 2025 • 03 Apr Shift 1",
    year: 2025,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "03 Apr 2025",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 192,
    isFlagshipFree: false,
    tagline: "Coordination Compounds isomerism & EMI Faraday laws",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-apr-03-s2",
    title: "JEE Main 2025 • 03 Apr Shift 2",
    year: 2025,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "03 Apr 2025",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Easy",
    marksFor99Percentile: 214,
    isFlagshipFree: false,
    tagline: "Rapid calculations • Speed benchmark paper",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-apr-04-s1",
    title: "JEE Main 2025 • 04 Apr Shift 1",
    year: 2025,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "04 Apr 2025",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 177,
    isFlagshipFree: false,
    tagline: "Rigorous Differential Equations & Modern Physics",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-apr-04-s2",
    title: "JEE Main 2025 • 04 Apr Shift 2",
    year: 2025,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "04 Apr 2025",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 189,
    isFlagshipFree: false,
    tagline: "Equilibrium buffer solutions & Definite integration",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-apr-07-s1",
    title: "JEE Main 2025 • 07 Apr Shift 1",
    year: 2025,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "07 Apr 2025",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 191,
    isFlagshipFree: false,
    tagline: "Fluid dynamics & Probability binomial distributions",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-apr-07-s2",
    title: "JEE Main 2025 • 07 Apr Shift 2",
    year: 2025,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "07 Apr 2025",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Tough",
    marksFor99Percentile: 181,
    isFlagshipFree: false,
    tagline: "Tricky questions in Section B NAT calculations",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2025-apr-08-s2",
    title: "JEE Main 2025 • 08 Apr Shift 2",
    year: 2025,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "08 Apr 2025",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "NEW_75",
    totalQuestions: 75,
    difficulty: "Moderate",
    marksFor99Percentile: 196,
    isFlagshipFree: false,
    tagline: "Closing shift of JEE Main 2025 edition",
    questionDistribution: {
      physics: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 5, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 5, secBMaxAttempt: 5 }
    }
  },

  // ==========================================
  // JEE MAIN 2024 (LEGACY PATTERN • 90 QS • ATTEMPT 5/10)
  // ==========================================
  // Session 1 (January 2024)
  {
    id: "2024-jan-27-s1",
    title: "JEE Main 2024 • 27 Jan Shift 1",
    year: 2024,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "27 Jan 2024",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Easy",
    marksFor99Percentile: 236, // Historical record
    isFlagshipFree: true, // FLAGSHIP FREE 2024
    tagline: "★ OFFICIAL FLAGSHIP: The infamous record-high cutoff shift (99%ile at 236 marks)",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-jan-27-s2",
    title: "JEE Main 2024 • 27 Jan Shift 2",
    year: 2024,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "27 Jan 2024",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Easy",
    marksFor99Percentile: 224,
    isFlagshipFree: false,
    tagline: "High cutoff twin of Jan 27 S1 • Speed solving test",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-jan-29-s1",
    title: "JEE Main 2024 • 29 Jan Shift 1",
    year: 2024,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "29 Jan 2024",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Easy",
    marksFor99Percentile: 218,
    isFlagshipFree: false,
    tagline: "Direct formula questions in Modern Physics & Solutions",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-jan-29-s2",
    title: "JEE Main 2024 • 29 Jan Shift 2",
    year: 2024,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "29 Jan 2024",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Moderate",
    marksFor99Percentile: 204,
    isFlagshipFree: false,
    tagline: "Thermodynamics cycles & Organic conversions",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-jan-30-s1",
    title: "JEE Main 2024 • 30 Jan Shift 1",
    year: 2024,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "30 Jan 2024",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Moderate",
    marksFor99Percentile: 196,
    isFlagshipFree: false,
    tagline: "Balanced paper with standard JEE Main difficulty",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-jan-30-s2",
    title: "JEE Main 2024 • 30 Jan Shift 2",
    year: 2024,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "30 Jan 2024",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Moderate",
    marksFor99Percentile: 192,
    isFlagshipFree: false,
    tagline: "Definite integrals & Coordinate geometry challenges",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-jan-31-s1",
    title: "JEE Main 2024 • 31 Jan Shift 1",
    year: 2024,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "31 Jan 2024",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Tough",
    marksFor99Percentile: 151, // One of the lowest in history!
    isFlagshipFree: false,
    tagline: "Legendary tough shift • 99%ile at just 151 marks!",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-jan-31-s2",
    title: "JEE Main 2024 • 31 Jan Shift 2",
    year: 2024,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "31 Jan 2024",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Tough",
    marksFor99Percentile: 162,
    isFlagshipFree: false,
    tagline: "Rigorous Vector 3D & Magnetism problems",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-feb-01-s1",
    title: "JEE Main 2024 • 01 Feb Shift 1",
    year: 2024,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "01 Feb 2024",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Tough",
    marksFor99Percentile: 160,
    isFlagshipFree: false,
    tagline: "Complex numbers & Differential equations heavy",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-feb-01-s2",
    title: "JEE Main 2024 • 01 Feb Shift 2",
    year: 2024,
    session: 1,
    sessionName: "Session 1 (January)",
    date: "01 Feb 2024",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Tough",
    marksFor99Percentile: 156,
    isFlagshipFree: false,
    tagline: "Lowest marks for 99%ile in JEE 2024 Session 1",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },

  // Session 2 (April 2024)
  {
    id: "2024-apr-04-s1",
    title: "JEE Main 2024 • 04 Apr Shift 1",
    year: 2024,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "04 Apr 2024",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Moderate",
    marksFor99Percentile: 198,
    isFlagshipFree: false,
    tagline: "Session 2 opener • Calibrated normalization curve",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-apr-04-s2",
    title: "JEE Main 2024 • 04 Apr Shift 2",
    year: 2024,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "04 Apr 2024",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Moderate",
    marksFor99Percentile: 194,
    isFlagshipFree: false,
    tagline: "Equilibrium & Rotational mechanics focus",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-apr-05-s1",
    title: "JEE Main 2024 • 05 Apr Shift 1",
    year: 2024,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "05 Apr 2024",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Tough",
    marksFor99Percentile: 182,
    isFlagshipFree: false,
    tagline: "Lengthy numerical Section B in Mathematics",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-apr-05-s2",
    title: "JEE Main 2024 • 05 Apr Shift 2",
    year: 2024,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "05 Apr 2024",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Easy",
    marksFor99Percentile: 216,
    isFlagshipFree: false,
    tagline: "Direct formula questions in Modern Physics",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-apr-06-s1",
    title: "JEE Main 2024 • 06 Apr Shift 1",
    year: 2024,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "06 Apr 2024",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Moderate",
    marksFor99Percentile: 190,
    isFlagshipFree: false,
    tagline: "Ray Optics & Organic name reactions test",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-apr-06-s2",
    title: "JEE Main 2024 • 06 Apr Shift 2",
    year: 2024,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "06 Apr 2024",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Tough",
    marksFor99Percentile: 180,
    isFlagshipFree: false,
    tagline: "Deep coordinate geometry & integration bounds",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-apr-08-s1",
    title: "JEE Main 2024 • 08 Apr Shift 1",
    year: 2024,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "08 Apr 2024",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Moderate",
    marksFor99Percentile: 196,
    isFlagshipFree: false,
    tagline: "Thermal expansion, SHM & Probability",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-apr-08-s2",
    title: "JEE Main 2024 • 08 Apr Shift 2",
    year: 2024,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "08 Apr 2024",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Tough",
    marksFor99Percentile: 178,
    isFlagshipFree: false,
    tagline: "Rigorous Vector 3D & Magnetism",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-apr-09-s1",
    title: "JEE Main 2024 • 09 Apr Shift 1",
    year: 2024,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "09 Apr 2024",
    shift: 1,
    timeWindow: "9:00 AM – 12:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Easy",
    marksFor99Percentile: 220,
    isFlagshipFree: false,
    tagline: "High scoring session 2 shift • High accuracy required",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  },
  {
    id: "2024-apr-09-s2",
    title: "JEE Main 2024 • 09 Apr Shift 2",
    year: 2024,
    session: 2,
    sessionName: "Session 2 (April)",
    date: "09 Apr 2024",
    shift: 2,
    timeWindow: "3:00 PM – 6:00 PM",
    pattern: "LEGACY_90",
    totalQuestions: 90,
    difficulty: "Moderate",
    marksFor99Percentile: 194,
    isFlagshipFree: false,
    tagline: "Final shift of JEE Main 2024 cycle",
    questionDistribution: {
      physics: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      chemistry: { secA: 20, secB: 10, secBMaxAttempt: 5 },
      maths: { secA: 20, secB: 10, secBMaxAttempt: 5 }
    }
  }
];

export const FREE_FLAGSHIP_IDS = [
  "2026-jan-28-s1",
  "2025-jan-24-s1",
  "2024-jan-27-s1"
];
