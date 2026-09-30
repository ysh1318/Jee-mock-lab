/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from "react";
import { 
  Award, 
  MapPin, 
  Sliders, 
  Search, 
  TrendingUp, 
  Calendar,
  Layers,
  Sparkles,
  Users,
  ChevronRight,
  Filter
} from "lucide-react";
import { TestState, UserProfile } from "../types";

interface Attempt {
  id: string;
  testName: string;
  date: string;
  score: number;
  maxScore: number;
  testState: TestState;
}

interface PredictorHubProps {
  completedAttempts: Attempt[];
  onSelectAttempt: (attempt: Attempt) => void;
  savedPapersCount: number;
  userProfile: UserProfile;
  onEditProfile: () => void;
}

interface CollegePreset {
  name: string;
  location: string;
  branch: string;
  tier: "Tier-1" | "Tier-2" | "Tier-3";
  type: "NIT" | "IIIT" | "GFTI" | "COEP";
  cutoffs: {
    General: number;
    OBC_NCL: number;
    SC: number;
    ST: number;
  };
}

// Curated list of top-tier engineering institutions with realistic simulation cutoff values
const COLLEGES: CollegePreset[] = [
  { name: "NIT Trichy (NITT)", location: "Tiruchirappalli, Tamil Nadu", branch: "Computer Science & Engineering", tier: "Tier-1", type: "NIT", cutoffs: { General: 5100, OBC_NCL: 15400, SC: 30100, ST: 62000 } },
  { name: "NIT Trichy (NITT)", location: "Tiruchirappalli, Tamil Nadu", branch: "Electronics & Communication Engg", tier: "Tier-1", type: "NIT", cutoffs: { General: 9200, OBC_NCL: 27000, SC: 51200, ST: 98000 } },
  { name: "NIT Trichy (NITT)", location: "Tiruchirappalli, Tamil Nadu", branch: "Mechanical Engineering", tier: "Tier-1", type: "NIT", cutoffs: { General: 16505, OBC_NCL: 48020, SC: 92000, ST: 160000 } },
  
  { name: "NIT Surathkal (NITK)", location: "Mangaluru, Karnataka", branch: "Computer Science & Engineering", tier: "Tier-1", type: "NIT", cutoffs: { General: 6125, OBC_NCL: 18100, SC: 36000, ST: 70000 } },
  { name: "NIT Surathkal (NITK)", location: "Mangaluru, Karnataka", branch: "Artificial Intelligence & Data Sci", tier: "Tier-1", type: "NIT", cutoffs: { General: 7200, OBC_NCL: 21000, SC: 42000, ST: 81000 } },
  { name: "NIT Surathkal (NITK)", location: "Mangaluru, Karnataka", branch: "Electrical & Electronics Engg", tier: "Tier-1", type: "NIT", cutoffs: { General: 12500, OBC_NCL: 37500, SC: 71000, ST: 125000 } },

  { name: "NIT Warangal (NITW)", location: "Warangal, Telangana", branch: "Computer Science & Engineering", tier: "Tier-1", type: "NIT", cutoffs: { General: 6800, OBC_NCL: 20400, SC: 39500, ST: 78000 } },
  { name: "NIT Warangal (NITW)", location: "Warangal, Telangana", branch: "Electronics & Communication Engg", tier: "Tier-1", type: "NIT", cutoffs: { General: 11000, OBC_NCL: 32550, SC: 64000, ST: 115000 } },
  
  { name: "NIT Calicut (NITC)", location: "Kozhikode, Kerala", branch: "Computer Science & Engineering", tier: "Tier-1", type: "NIT", cutoffs: { General: 10500, OBC_NCL: 31000, SC: 58000, ST: 110000 } },
  { name: "NIT Calicut (NITC)", location: "Kozhikode, Kerala", branch: "Electronics & Communication Engg", tier: "Tier-1", type: "NIT", cutoffs: { General: 15400, OBC_NCL: 45000, SC: 88000, ST: 152000 } },

  { name: "MNIT Jaipur", location: "Jaipur, Rajasthan", branch: "Computer Science & Engineering", tier: "Tier-1", type: "NIT", cutoffs: { General: 8400, OBC_NCL: 25000, SC: 48000, ST: 94000 } },
  { name: "MNNIT Allahabad", location: "Prayagraj, Uttar Pradesh", branch: "Computer Science & Engineering", tier: "Tier-1", type: "NIT", cutoffs: { General: 7100, OBC_NCL: 21500, SC: 41000, ST: 80000 } },
  { name: "VNIT Nagpur", location: "Nagpur, Maharashtra", branch: "Computer Science & Engineering", tier: "Tier-1", type: "NIT", cutoffs: { General: 9500, OBC_NCL: 28005, SC: 54000, ST: 102000 } },
  
  { name: "DTU Delhi", location: "Rohini, New Delhi", branch: "Computer Science & Engineering (COE)", tier: "Tier-1", type: "GFTI", cutoffs: { General: 12500, OBC_NCL: 38000, SC: 78000, ST: 140000 } },
  { name: "DTU Delhi", location: "Rohini, New Delhi", branch: "Information Technology (IT)", tier: "Tier-1", type: "GFTI", cutoffs: { General: 16500, OBC_NCL: 49000, SC: 92000, ST: 168000 } },
  { name: "NSUT Delhi", location: "Dwarka, New Delhi", branch: "Computer Engg (Artificial Intelligence)", tier: "Tier-1", type: "GFTI", cutoffs: { General: 11800, OBC_NCL: 36000, SC: 74000, ST: 135000 } },
  
  { name: "IIIT Allahabad (IIITA)", location: "Allahabad, Uttar Pradesh", branch: "Information Technology (IT)", tier: "Tier-1", type: "IIIT", cutoffs: { General: 5800, OBC_NCL: 18000, SC: 35000, ST: 71000 } },
  { name: "IIIT Allahabad (IIITA)", location: "Allahabad, Uttar Pradesh", branch: "Electronics & Communication Engg", tier: "Tier-1", type: "IIIT", cutoffs: { General: 11200, OBC_NCL: 33000, SC: 62000, ST: 110000 } },
  { name: "IIIT Delhi", location: "Okhla, New Delhi", branch: "Computer Science & Applied Math", tier: "Tier-1", type: "IIIT", cutoffs: { General: 15500, OBC_NCL: 45000, SC: 85000, ST: 165000 } },
  { name: "IIIT Gwalior", location: "Gwalior, Madhya Pradesh", branch: "Computer Science & Engineering", tier: "Tier-1", type: "IIIT", cutoffs: { General: 13500, OBC_NCL: 39000, SC: 78000, ST: 145000 } },

  { name: "NIT Rourkela", location: "Rourkela, Odisha", branch: "Computer Science & Engineering", tier: "Tier-1", type: "NIT", cutoffs: { General: 8200, OBC_NCL: 24500, SC: 47000, ST: 92000 } },
  { name: "NIT Jalandhar", location: "Jalandhar, Punjab", branch: "Computer Science & Engineering", tier: "Tier-2", type: "NIT", cutoffs: { General: 16500, OBC_NCL: 49000, SC: 94000, ST: 180000 } },
  { name: "NIT Kurukshetra", location: "Kurukshetra, Haryana", branch: "Computer Science & Engineering", tier: "Tier-2", type: "NIT", cutoffs: { General: 12000, OBC_NCL: 35000, SC: 68000, ST: 130000 } },
  { name: "NIT Kurukshetra", location: "Kurukshetra, Haryana", branch: "Information Technology", tier: "Tier-2", type: "NIT", cutoffs: { General: 14500, OBC_NCL: 43000, SC: 81000, ST: 155000 } },
  { name: "NIT Silchar", location: "Silchar, Assam", branch: "Computer Science & Engineering", tier: "Tier-2", type: "NIT", cutoffs: { General: 21000, OBC_NCL: 62000, SC: 112000, ST: 210000 } },
  { name: "NIT Durgapur", location: "Durgapur, West Bengal", branch: "Computer Science & Engineering", tier: "Tier-2", type: "NIT", cutoffs: { General: 15000, OBC_NCL: 44000, SC: 84000, ST: 160000 } },
  
  { name: "MANIT Bhopal", location: "Bhopal, Madhya Pradesh", branch: "Computer Science & Engineering", tier: "Tier-1", type: "NIT", cutoffs: { General: 11000, OBC_NCL: 32000, SC: 61000, ST: 120000 } },
  { name: "SVNIT Surat", location: "Surat, Gujarat", branch: "Computer Science & Engineering", tier: "Tier-2", type: "NIT", cutoffs: { General: 14000, OBC_NCL: 41000, SC: 78000, ST: 150000 } },
  { name: "IIIT Pune", location: "Pune, Maharashtra", branch: "Computer Science & Engineering", tier: "Tier-2", type: "IIIT", cutoffs: { General: 17500, OBC_NCL: 51200, SC: 98000, ST: 190000 } },
  { name: "IIIT Lucknow", location: "Lucknow, Uttar Pradesh", branch: "Computer Science (CSE)", tier: "Tier-2", type: "IIIT", cutoffs: { General: 11500, OBC_NCL: 34000, SC: 69000, ST: 132000 } },
  { name: "IIIT Jabalpur (PDPM)", location: "Jabalpur, Madhya Pradesh", branch: "Computer Science & Engineering", tier: "Tier-2", type: "IIIT", cutoffs: { General: 15500, OBC_NCL: 46200, SC: 85200, ST: 156000 } },
  { name: "IIIT Bangalore", location: "Electronic City, Bengaluru", branch: "Integrated M.Tech Computer Science", tier: "Tier-1", type: "IIIT", cutoffs: { General: 8500, OBC_NCL: 26000, SC: 52000, ST: 104000 } },
  
  { name: "NIT Srinagar", location: "Srinagar, Jammu & Kashmir", branch: "Computer Science & Engineering", tier: "Tier-3", type: "NIT", cutoffs: { General: 32000, OBC_NCL: 94000, SC: 180000, ST: 310000 } },
  { name: "NIT Agartala", location: "Agartala, Tripura", branch: "Computer Science & Engineering", tier: "Tier-3", type: "NIT", cutoffs: { General: 29000, OBC_NCL: 86000, SC: 162000, ST: 280000 } },
  { name: "IIIT Vadodara", location: "Vadodara, Gujarat", branch: "Computer Science & Engineering", tier: "Tier-2", type: "IIIT", cutoffs: { General: 23500, OBC_NCL: 69050, SC: 130000, ST: 230000 } },
  { name: "PEC Chandigarh", location: "Chandigarh", branch: "Computer Science & Engineering", tier: "Tier-1", type: "GFTI", cutoffs: { General: 11500, OBC_NCL: 34000, SC: 66050, ST: 128000 } },
  { name: "BIT Mesra", location: "Ranchi, Jharkhand", branch: "Computer Science & Engineering", tier: "Tier-2", type: "GFTI", cutoffs: { General: 19500, OBC_NCL: 57000, SC: 110000, ST: 195000 } },
  { name: "COEP Tech University", location: "Pune, Maharashtra", branch: "Computer Engineering (MH State Code)", tier: "Tier-1", type: "COEP", cutoffs: { General: 4200, OBC_NCL: 12500, SC: 24000, ST: 51000 } },
  { name: "Jadavpur University", location: "Kolkata, West Bengal", branch: "Computer Science & Engineering", tier: "Tier-1", type: "GFTI", cutoffs: { General: 2100, OBC_NCL: 8200, SC: 19200, ST: 44000 } }
];

export function PredictorHub({ completedAttempts, onSelectAttempt, savedPapersCount, userProfile, onEditProfile }: PredictorHubProps) {
  // Navigation tabs for source
  type PredictionMode = "LATEST_SOLVE" | "OVERALL_STATS" | "CUSTOM_MANUAL";
  const [activeMode, setActiveMode] = useState<PredictionMode>(
    completedAttempts.length > 0 ? "LATEST_SOLVE" : "CUSTOM_MANUAL"
  );

  // Shift Difficulty Normalizer parameters (MathonGo / Allen scale parameters)
  const [difficultyMode, setDifficultyMode] = useState<"TOUGH" | "MODERATE" | "EASY">("MODERATE");

  // Manual Sandbox sliders
  const [customInputType, setCustomInputType] = useState<"SCORE" | "PERCENTILE" | "RANK">("SCORE");
  const [customScoreValue, setCustomScoreValue] = useState<number>(160);
  const [customPercentileValue, setCustomPercentileValue] = useState<number>(98.5);
  const [customRankValue, setCustomRankValue] = useState<number>(21000);
  
  const customCategory = userProfile.category;
  const [hoveredPoint, setHoveredPoint] = useState<{ score: number, percentile: number } | null>(null);
  const graphContainerRef = useRef<SVGSVGElement | null>(null);

  // Filters for College Listing
  const [searchCollegeQuery, setSearchCollegeQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<"All" | "Tier-1" | "Tier-2" | "Tier-3">("All");
  const [typeFilter, setTypeFilter] = useState<"All" | "NIT" | "IIIT" | "GFTI">("All");

  // Mode evaluations
  const latestAttempt = useMemo(() => {
    return completedAttempts.length > 0 ? completedAttempts[0] : null;
  }, [completedAttempts]);

  const overallPerformance = useMemo(() => {
    if (completedAttempts.length === 0) return null;
    const totalScoreSum = completedAttempts.reduce((acc, a) => acc + a.score, 0);
    const avgScore = Math.round((totalScoreSum / completedAttempts.length) * 10) / 10;
    const maxAttemptScore = Math.max(...completedAttempts.map(a => a.score));
    const minAttemptScore = Math.min(...completedAttempts.map(a => a.score));

    return {
      count: completedAttempts.length,
      averageScore: avgScore,
      maxScore: maxAttemptScore,
      minScore: minAttemptScore,
    };
  }, [completedAttempts]);

  // Score To Percentile Calibration Curves for June 2026 Shift Scenarios
  const getPercentileFromScore = (score: number, shift: "TOUGH" | "MODERATE" | "EASY"): number => {
    const s = Math.max(0, Math.min(300, score));
    let calibratedScore = s;
    if (shift === "TOUGH") {
      calibratedScore = s * 1.18;
    } else if (shift === "EASY") {
      calibratedScore = s * 0.86;
    }

    if (calibratedScore >= 285) return 99.98;
    if (calibratedScore >= 270) return 99.95;
    if (calibratedScore >= 255) return 99.90;
    if (calibratedScore >= 240) return 99.81;
    if (calibratedScore >= 225) return 99.68;
    if (calibratedScore >= 210) return 99.52;
    if (calibratedScore >= 195) return 99.28;
    if (calibratedScore >= 180) return 99.02;
    if (calibratedScore >= 165) return 98.45;
    if (calibratedScore >= 150) return 97.80;
    if (calibratedScore >= 135) return 96.95;
    if (calibratedScore >= 120) return 95.80;
    if (calibratedScore >= 105) return 93.90;
    if (calibratedScore >= 90)  return 90.80;
    if (calibratedScore >= 75)  return 85.50;
    if (calibratedScore >= 60)  return 78.20;
    if (calibratedScore >= 45)  return 68.40;
    if (calibratedScore >= 30)  return 52.10;
    return Math.max(0, Math.round((calibratedScore * 1.7 * 10)) / 10);
  };

  const getScoreFromPercentile = (percentile: number, shift: "TOUGH" | "MODERATE" | "EASY"): number => {
    const p = Math.max(0, Math.min(100, percentile));
    let baseScore = 0;

    if (p >= 99.98) baseScore = 285;
    else if (p >= 99.95) baseScore = 270;
    else if (p >= 99.90) baseScore = 255;
    else if (p >= 99.81) baseScore = 240;
    else if (p >= 99.68) baseScore = 225;
    else if (p >= 99.52) baseScore = 210;
    else if (p >= 99.28) baseScore = 195;
    else if (p >= 99.02) baseScore = 180;
    else if (p >= 98.45) baseScore = 165;
    else if (p >= 97.80) baseScore = 150;
    else if (p >= 96.95) baseScore = 135;
    else if (p >= 95.80) baseScore = 120;
    else if (p >= 93.90) baseScore = 105;
    else if (p >= 90.80) baseScore = 90;
    else if (p >= 85.50) baseScore = 75;
    else if (p >= 78.20) baseScore = 60;
    else if (p >= 68.40) baseScore = 45;
    else if (p >= 52.10) baseScore = 30;
    else baseScore = p / 1.7;

    if (shift === "TOUGH") {
      return Math.round(baseScore / 1.18);
    } else if (shift === "EASY") {
      return Math.round(baseScore / 0.86);
    }
    return Math.round(baseScore);
  };

  const totalJEEAspirants = 1450000;

  const getRankFromPercentile = (percentile: number): number => {
    const p = Math.max(0.0001, Math.min(100, percentile));
    return Math.max(1, Math.round(((100 - p) / 100) * totalJEEAspirants));
  };

  const getPercentileFromRank = (rank: number): number => {
    const r = Math.max(1, Math.min(totalJEEAspirants, rank));
    return Math.min(99.999, Math.round((1 - r / totalJEEAspirants) * 100 * 100000) / 100000);
  };

  // Compute stats according to selection
  const activeStats = useMemo(() => {
    let score = 0;
    let percentile = 0;
    let rank = 0;
    let category: UserProfile["category"] = "General";
    let subtextContext = "";

    if (activeMode === "LATEST_SOLVE") {
      score = latestAttempt ? latestAttempt.score : 0;
      percentile = getPercentileFromScore(score, difficultyMode);
      rank = getRankFromPercentile(percentile);
      category = customCategory; 
      subtextContext = `Calculated using live raw score (${score} Pts) adjusted for ${difficultyMode} Shift metrics.`;
    } 
    else if (activeMode === "OVERALL_STATS") {
      score = overallPerformance ? overallPerformance.averageScore : 0;
      percentile = getPercentileFromScore(score, difficultyMode);
      rank = getRankFromPercentile(percentile);
      category = customCategory;
      subtextContext = `Uses historical weighted averages across all of your parsed reports under ${difficultyMode} shift.`;
    } 
    else {
      category = customCategory;
      subtextContext = `Interactive sandbox. Adjust metrics manually to simulate admissions scenarios.`;
      
      if (customInputType === "SCORE") {
        score = customScoreValue;
        percentile = getPercentileFromScore(score, difficultyMode);
        rank = getRankFromPercentile(percentile);
      } else if (customInputType === "PERCENTILE") {
        percentile = customPercentileValue;
        score = getScoreFromPercentile(percentile, difficultyMode);
        rank = getRankFromPercentile(percentile);
      } else {
        rank = customRankValue;
        percentile = getPercentileFromRank(rank);
        score = getScoreFromPercentile(percentile, difficultyMode);
      }
    }

    return { score, percentile, rank, category, subtextContext };
  }, [activeMode, latestAttempt, overallPerformance, customInputType, customScoreValue, customPercentileValue, customRankValue, customCategory, difficultyMode]);

  // College admissions list generator
  const predictedColleges = useMemo(() => {
    const { rank, category } = activeStats;
    const userHomeState = userProfile?.homeState || "Maharashtra";
    const userGenderFemale = userProfile?.gender === "Female";
    
    return COLLEGES.map(college => {
      const cutoffMapKey = category === "OBC_NCL" ? "OBC_NCL" : category === "SC" ? "SC" : category === "ST" ? "ST" : "General";
      let thresholdRank = college.cutoffs[cutoffMapKey];
      
      if (category === "EWS") {
        thresholdRank = Math.round(college.cutoffs.General * 1.25);
      }

      const colLoc = college.location.toLowerCase();
      const colName = college.name.toLowerCase();
      const cleanState = userHomeState.toLowerCase();
      
      let isHS = false;
      if (cleanState !== "other state") {
        if (colLoc.includes(cleanState)) {
          isHS = true;
        }
        else if (cleanState === "delhi" && (colName.includes("dtu") || colName.includes("nsut") || colName.includes("iiit delhi"))) {
          isHS = true;
        }
        else if (cleanState === "maharashtra" && colName.includes("coep")) {
          isHS = true;
        }
        else if (cleanState === "tamil nadu" && colName.includes("trichy")) {
          isHS = true;
        }
        else if (cleanState === "karnataka" && colName.includes("surathkal")) {
          isHS = true;
        }
      }

      if (isHS) {
        thresholdRank = Math.round(thresholdRank * 1.50);
      }

      if (userGenderFemale) {
        thresholdRank = Math.round(thresholdRank * 1.35);
      }
      
      let chance: "HIGH" | "MEDIUM" | "DREAM" = "DREAM";
      let matchPercent = 0;

      if (rank <= thresholdRank * 0.75) {
        chance = "HIGH";
        matchPercent = Math.min(100, Math.round(100 - (rank / thresholdRank) * 20));
      } else if (rank <= thresholdRank) {
        chance = "MEDIUM";
        matchPercent = Math.round(70 + ((thresholdRank - rank) / (thresholdRank * 0.25)) * 25);
      } else {
        chance = "DREAM";
        matchPercent = Math.max(5, Math.round(100 - (rank / thresholdRank) * 55));
      }

      return {
        ...college,
        thresholdRank,
        chance,
        matchPercent,
        isHS,
        isFemale: userGenderFemale
      };
    }).filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchCollegeQuery.toLowerCase()) || 
                          c.location.toLowerCase().includes(searchCollegeQuery.toLowerCase()) ||
                          c.branch.toLowerCase().includes(searchCollegeQuery.toLowerCase());
      const matchTier = tierFilter === "All" || c.tier === tierFilter;
      const matchType = typeFilter === "All" || c.type === typeFilter;
      return matchSearch && matchTier && matchType;
    }).sort((a, b) => b.matchPercent - a.matchPercent);

  }, [activeStats, searchCollegeQuery, tierFilter, typeFilter, userProfile]);

  // SVG Spline plotting points
  const splinePoints = useMemo(() => {
    const points: { score: number; percentile: number }[] = [];
    for (let s = 10; s <= 300; s += 20) {
      points.push({
        score: s,
        percentile: getPercentileFromScore(s, difficultyMode)
      });
    }
    return points;
  }, [difficultyMode]);

  const getSvgCoordinates = (score: number, percentile: number) => {
    const x = (score / 300) * 340 + 30; 
    const y = 145 - (percentile / 100) * 115; 
    return { x, y };
  };

  const svgPathStr = useMemo(() => {
    return splinePoints.map((p, idx) => {
      const { x, y } = getSvgCoordinates(p.score, p.percentile);
      return `${idx === 0 ? "M" : "L"}${x} ${y}`;
    }).join(" ");
  }, [splinePoints]);

  const handleGraphMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!graphContainerRef.current) return;
    const rect = graphContainerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const targetScore = Math.round(((clientX - 30) / 340) * 300);
    const scoreClamped = Math.max(0, Math.min(300, targetScore));
    const targetPercentile = getPercentileFromScore(scoreClamped, difficultyMode);
    
    setHoveredPoint({
      score: scoreClamped,
      percentile: targetPercentile
    });
  };

  const handleGraphMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 select-text font-sans text-slate-800">
      
      {/* HEADER SECTION - SIMPLE & PROFESSIONAL */}
      <div className="border-b border-slate-200 pb-6 mb-8 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-xs uppercase tracking-wider font-mono">
              <Award size={16} />
              <span>JoSAA Simulated Counseling Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
              JEE Main Rank Predictor & College Selector
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-4xl font-medium">
              Calibrated mapping software for the June 2026 JEE examinations. Check simulated percentiles, CRL merit ranks, and model-matched seat allocations across {COLLEGES.length} engineering institutions based on historical JoSAA data.
            </p>
          </div>
          
          <div className="flex gap-3 shrink-0 self-start sm:self-center">
            <div className="bg-slate-100/80 border border-slate-200 px-4 py-2.5 rounded-xl text-center min-w-[90px]">
              <div className="text-lg font-black text-slate-900 font-mono">{completedAttempts.length}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Mocks Done</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl text-center min-w-[90px]">
              <div className="text-lg font-black text-indigo-800 font-mono">{savedPapersCount}</div>
              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Papers</div>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD GRID CONFIGURATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: SIMULATION PARAMETERS AND INPUTS */}
        <div className="lg:col-span-4 flex flex-col gap-6 text-left">
          
          {/* TAB CARDS - DATA SOURCE */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-slate-150">
              <Sliders size={14} className="text-indigo-650" />
              <span>Data Calibration Source</span>
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (completedAttempts.length > 0) setActiveMode("LATEST_SOLVE");
                }}
                disabled={completedAttempts.length === 0}
                className={`w-full p-3 rounded-lg border text-left transition flex flex-col justify-start relative cursor-pointer ${
                  activeMode === "LATEST_SOLVE" 
                    ? "border-indigo-600 bg-indigo-50/30 text-indigo-950 font-bold" 
                    : "border-slate-250 hover:bg-slate-50 text-slate-650 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold uppercase tracking-wide">1. Latest Mock Exam Mark</span>
                  {activeMode === "LATEST_SOLVE" && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <span className="text-[10px] text-slate-450 mt-1 leading-normal">
                  Predict using the results of your single most recently completed mock test.
                </span>
                {completedAttempts.length === 0 && (
                  <span className="text-[9px] text-rose-600 font-bold uppercase mt-1">No completed mocks found</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (completedAttempts.length > 0) setActiveMode("OVERALL_STATS");
                }}
                disabled={completedAttempts.length === 0}
                className={`w-full p-3 rounded-lg border text-left transition flex flex-col justify-start relative cursor-pointer ${
                  activeMode === "OVERALL_STATS" 
                    ? "border-indigo-600 bg-indigo-50/30 text-indigo-950 font-bold" 
                    : "border-slate-250 hover:bg-slate-50 text-slate-650 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold uppercase tracking-wide">2. Cumulative Multi-Mock Average</span>
                  {activeMode === "OVERALL_STATS" && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <span className="text-[10px] text-slate-450 mt-1 leading-normal">
                  Averaged scorecard parameters calculated from all processed mock attempts.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("CUSTOM_MANUAL")}
                className={`w-full p-3 rounded-lg border text-left transition flex flex-col justify-start relative cursor-pointer ${
                  activeMode === "CUSTOM_MANUAL" 
                    ? "border-indigo-600 bg-indigo-50/30 text-indigo-950 font-bold" 
                    : "border-slate-250 hover:bg-slate-50 text-slate-650"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold uppercase tracking-wide">3. Interactive Sandbox Simulation</span>
                  {activeMode === "CUSTOM_MANUAL" && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <span className="text-[10px] text-slate-450 mt-1 leading-normal">
                  Test custom score and rank targets directly using manual parameter sliders.
                </span>
              </button>
            </div>
          </div>

          {/* SIMULATION PARAMS & CANDIDATE PROFILE */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-150">
                <Layers size={14} className="text-indigo-650" />
                <span>Simulation Parameters</span>
              </h3>

              {/* SHIFT DIFFICULTY SELECTION */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                  1. Shift Competition Level:
                </span>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Shift toughness dictates normalized percentiles over same raw score curves.
                </p>
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  {[
                    { id: "TOUGH", label: "Tough Shift" },
                    { id: "MODERATE", label: "Moderate Shift" },
                    { id: "EASY", label: "Easy Shift" }
                  ].map(sh => (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => setDifficultyMode(sh.id as any)}
                      className={`py-2 px-1 rounded border text-[10px] font-bold text-center transition cursor-pointer ${
                        difficultyMode === sh.id 
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs" 
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {sh.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CANDIDATE PROFILE SYNC STATUS */}
              <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-lg text-xs space-y-2.5">
                <div className="flex justify-between items-center border-b border-indigo-100/60 pb-1.5">
                  <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                    <span>👤</span> Core Candidate Profile
                  </span>
                  <span className="bg-indigo-100 text-indigo-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                    Active
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[10.5px]">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block leading-tight">Eligibility State:</span>
                    <strong className="text-slate-800 font-bold">{userProfile.homeState}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block leading-tight">Reservation Quota:</span>
                    <strong className="text-slate-800 font-bold">{userProfile.category === "General" ? "Open (CRL)" : userProfile.category}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block leading-tight">Gender Stream:</span>
                    <strong className="text-slate-800 font-bold">{userProfile.gender === "Female" ? "Female Advantage" : "Gender-Neutral"}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block leading-tight">Percentile Goal:</span>
                    <strong className="text-indigo-700 font-bold">{userProfile.targetPercentile.toFixed(2)}%ile</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onEditProfile}
                  className="w-full mt-1.5 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 py-1.5 font-bold text-[10.5px] rounded text-indigo-700 transition cursor-pointer text-center block"
                >
                  Edit Profile & Quota Settings
                </button>
              </div>

              {/* LIVE CONTEXTUAL INPUT FOR SELECTED TAB */}
              {activeMode === "LATEST_SOLVE" && latestAttempt && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Mock Metric</div>
                  <div className="text-xs font-bold text-slate-800 truncate">{latestAttempt.testName}</div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-1">
                    {latestAttempt.score} <span className="text-[10px] text-slate-500 font-bold">/ {latestAttempt.maxScore} Pts</span>
                  </div>
                </div>
              )}

              {activeMode === "OVERALL_STATS" && overallPerformance && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 text-xs">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Average Performance Metric</div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Total Attempts:</span>
                    <span className="font-bold text-slate-800">{overallPerformance.count}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Average Score:</span>
                    <span className="font-bold text-[#1a3a5f]">{overallPerformance.averageScore} / 300</span>
                  </div>
                </div>
              )}

              {activeMode === "CUSTOM_MANUAL" && (
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Sandbox Simulation Parameter:
                    </label>
                    <div className="flex rounded border border-slate-200 overflow-hidden">
                      {[
                        { id: "SCORE", label: "Score" },
                        { id: "PERCENTILE", label: "Percentile" },
                        { id: "RANK", label: "CRL Rank" }
                      ].map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setCustomInputType(type.id as any)}
                          className={`flex-1 py-1.5 text-[10px] font-bold text-center transition cursor-pointer ${
                            customInputType === type.id 
                              ? "bg-slate-900 text-white font-bold" 
                              : "bg-white hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SANDBOX CONTROLS */}
                  {customInputType === "SCORE" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
                        <span className="text-[10px] font-bold text-slate-600">Simulate Score:</span>
                        <input
                          type="number"
                          min="0"
                          max="300"
                          value={customScoreValue}
                          onChange={(e) => setCustomScoreValue(Math.max(0, Math.min(300, Number(e.target.value) || 0)))}
                          className="w-14 text-center font-bold text-slate-800 bg-white border border-slate-200 rounded text-xs py-0.5"
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="300"
                        value={customScoreValue}
                        onChange={(e) => setCustomScoreValue(Number(e.target.value))}
                        className="w-full accent-slate-900 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                        <span>0 Marks</span>
                        <span>150</span>
                        <span>300 Marks</span>
                      </div>
                    </div>
                  )}

                  {customInputType === "PERCENTILE" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
                        <span className="text-[10px] font-bold text-slate-600">Simulate Percentile:</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={customPercentileValue}
                          onChange={(e) => setCustomPercentileValue(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                          className="w-16 text-center font-bold text-slate-800 bg-white border border-slate-200 rounded text-xs py-0.5"
                        />
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="100"
                        step="0.1"
                        value={customPercentileValue}
                        onChange={(e) => setCustomPercentileValue(Number(e.target.value))}
                        className="w-full accent-slate-900 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                        <span>60%ile</span>
                        <span>80%ile</span>
                        <span>100%ile</span>
                      </div>
                    </div>
                  )}

                  {customInputType === "RANK" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
                        <span className="text-[10px] font-bold text-slate-600">Simulate Rank:</span>
                        <input
                          type="number"
                          min="1"
                          max={totalJEEAspirants}
                          value={customRankValue}
                          onChange={(e) => setCustomRankValue(Math.max(1, Math.min(totalJEEAspirants, Number(e.target.value) || 1)))}
                          className="w-20 text-center font-bold text-slate-800 bg-white border border-slate-200 rounded text-xs py-0.5"
                        />
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="150000"
                        step="100"
                        value={customRankValue > 150000 ? 150000 : customRankValue}
                        onChange={(e) => setCustomRankValue(Number(e.target.value))}
                        className="w-full accent-slate-900 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                        <span>Rank 1</span>
                        <span>Rank 75,000</span>
                        <span>Rank 150,000+</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <p className="mt-6 text-[10px] text-slate-400 leading-relaxed font-medium bg-slate-50 p-3.5 border border-slate-200 rounded-lg">
              * Simulated rankings are based on standard Gaussian statistical distribution curves modeled across the {totalJEEAspirants.toLocaleString("en-IN")} candidate pool.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYTICAL RESULTS & ADMISSIBILITY DIRECTORY */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* SIMULATION SUMMARY STATS */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-650" />
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Predicted Calibration Outcomes</span>
                <p className="text-[11px] text-indigo-700 font-bold mt-0.5 font-mono">{activeStats.subtextContext}</p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded font-mono">June 2026 Shift</span>
            </div>

            {/* THREE PRIMARY KPIS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Normalized Score</span>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-3xl font-black text-slate-900 leading-none">{Math.round(activeStats.score)}</span>
                  <span className="text-xs text-slate-500 font-bold">/300 Pts</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-3">
                  <div className="bg-slate-900 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (activeStats.score / 300) * 100)}%` }} />
                </div>
              </div>

              <div className="bg-indigo-50/45 p-4 border border-indigo-100 rounded-xl">
                <span className="text-[9.5px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">Calibrated Percentile</span>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-3xl font-black text-indigo-900 leading-none">{activeStats.percentile.toFixed(2)}</span>
                  <span className="text-xs text-indigo-600 font-bold">%ile</span>
                </div>
                <div className="w-full bg-indigo-100 h-1 rounded-full overflow-hidden mt-3">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${activeStats.percentile}%` }} />
                </div>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pan-India Merit CRL</span>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    ~{activeStats.rank.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">Rank</span>
                </div>
                <p className="text-[9px] text-slate-400 font-semibold mt-2.5">
                  Simulated national percentile limit.
                </p>
              </div>
            </div>

            {/* DYNAMIC INTERACTIVE LINE PLOT CHART */}
            <div className="mt-6 p-4 bg-slate-950 text-white rounded-xl border border-slate-900 relative">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Interactive Score-to-Percentile Curve
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono hidden sm:inline">
                  Hover curve to probe different score milestones
                </span>
              </div>

              {/* DRAW SVG SPACE */}
              <div className="relative h-44 w-full">
                <svg 
                  ref={graphContainerRef}
                  viewBox="0 0 400 160" 
                  className="w-full h-full cursor-crosshair overflow-visible"
                  onMouseMove={handleGraphMouseMove}
                  onMouseLeave={handleGraphMouseLeave}
                >
                  {/* Grid Lines */}
                  <line x1="30" y1="30" x2="370" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="30" y1="87" x2="370" y2="87" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="30" y1="145" x2="370" y2="145" stroke="#334155" strokeWidth="1" />
                  
                  {/* Score intervals */}
                  <text x="30" y="155" fill="#64748b" fontSize="8" textAnchor="middle" fontWeight="bold">0</text>
                  <text x="115" y="155" fill="#64748b" fontSize="8" textAnchor="middle" fontWeight="bold">75</text>
                  <text x="200" y="155" fill="#64748b" fontSize="8" textAnchor="middle" fontWeight="bold">150</text>
                  <text x="285" y="155" fill="#64748b" fontSize="8" textAnchor="middle" fontWeight="bold">225</text>
                  <text x="370" y="155" fill="#64748b" fontSize="8" textAnchor="middle" fontWeight="bold">300 Pts</text>

                  {/* Y Axis descriptors */}
                  <text x="24" y="33" fill="#64748b" fontSize="8" textAnchor="end" fontWeight="bold">100%</text>
                  <text x="24" y="90" fill="#64748b" fontSize="8" textAnchor="end" fontWeight="bold">50%</text>
                  <text x="24" y="148" fill="#64748b" fontSize="8" textAnchor="end" fontWeight="bold">0%</text>

                  {/* Fill area under spline */}
                  <path 
                    d={`M 30 145 ${svgPathStr.slice(1)} L 370 145 Z`} 
                    fill="url(#grad)" 
                    className="opacity-10 transition-all duration-300"
                  />

                  {/* Curve Path */}
                  <path 
                    d={svgPathStr} 
                    fill="none" 
                    stroke="url(#curvePathGrad)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />

                  {/* CURRENT USER POSITION POPPED POINT */}
                  {(() => {
                    const coord = getSvgCoordinates(activeStats.score, activeStats.percentile);
                    return (
                      <g className="transition-all duration-300">
                        <line x1={coord.x} y1="145" x2={coord.x} y2={coord.y} stroke="#818cf8" strokeDasharray="2 2" strokeWidth="1" />
                        <line x1="30" y1={coord.y} x2={coord.x} y2={coord.y} stroke="#818cf8" strokeDasharray="2 2" strokeWidth="1" />
                        <circle cx={coord.x} cy={coord.y} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                      </g>
                    );
                  })()}

                  {/* HOVER COORDINATE LINE TOOL */}
                  {hoveredPoint && (
                    <g>
                      {(() => {
                        const coord = getSvgCoordinates(hoveredPoint.score, hoveredPoint.percentile);
                        return (
                          <>
                            <line x1={coord.x} y1="145" x2={coord.x} y2={coord.y} stroke="#10b981" strokeWidth="1" />
                            <circle cx={coord.x} cy={coord.y} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                          </>
                        );
                      })()}
                    </g>
                  )}

                  {/* Gradient shaders */}
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="curvePathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="60%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* DYNAMIC METRIC TOOLTIP POPUP */}
              <div className="absolute top-3.5 right-4 pointer-events-none min-w-[130px]">
                {hoveredPoint ? (
                  <div className="bg-slate-900/90 backdrop-blur-xs p-2 rounded border border-slate-700 text-left text-[10px] space-y-1 font-mono">
                    <span className="text-[#34d399] font-black uppercase text-[8px] tracking-wider block">🔍 Graph Probe</span>
                    <div>Marks: <span className="text-white font-bold">{hoveredPoint.score}</span></div>
                    <div>Percentile: <span className="text-white font-bold">{hoveredPoint.percentile.toFixed(2)}%</span></div>
                    <div>Est Rank: <span className="text-slate-300">~{getRankFromPercentile(hoveredPoint.percentile).toLocaleString("en-IN")}</span></div>
                  </div>
                ) : (
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800 text-left text-[10px] space-y-1 font-mono">
                    <span className="text-indigo-400 font-black uppercase text-[8px] tracking-wider block">📈 Active Score</span>
                    <div>Marks: <span className="text-white font-bold">{Math.round(activeStats.score)}</span></div>
                    <div>Percentile: <span className="text-white font-bold">{activeStats.percentile.toFixed(2)}%</span></div>
                    <div>Est Rank: <span className="text-slate-300">~{activeStats.rank.toLocaleString("en-IN")}</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROADMAP TARGET SEGMENTS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-left">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3.5 flex items-center gap-1.5 pb-2 border-b border-sidebar-150">
              <TrendingUp size={14} className="text-indigo-650" />
              <span>Calibrated Admission Mileposts</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  id: "adv_qualify",
                  title: "1. Advanced Eligibility",
                  reqPercentile: userProfile.category === "General" ? 90.5 : userProfile.category === "EWS" ? 75.0 : userProfile.category === "OBC_NCL" ? 72.5 : userProfile.category === "SC" ? 50.0 : 42.0,
                  sub: "Entrance cutoff for JEE Advanced",
                },
                {
                  id: "state_seat",
                  title: "2. State Reserve Cutoff",
                  reqPercentile: 91.5,
                  sub: `Broad seat eligibility in ${userProfile.homeState}`
                },
                {
                  id: "target_goal",
                  title: "3. Simulated Target Goal",
                  reqPercentile: userProfile.targetPercentile,
                  sub: `Calculated CSE/ECE target`
                },
                {
                  id: "elite_tier",
                  title: "4. Tier-1 National CSE",
                  reqPercentile: 99.2,
                  sub: "Admission standard for Top-3 NITs"
                }
              ].map((milestone) => {
                const achieved = activeStats.percentile >= milestone.reqPercentile;
                const scoreNeeded = getScoreFromPercentile(milestone.reqPercentile, difficultyMode);
                const marksRemaining = Math.max(0, scoreNeeded - Math.round(activeStats.score));
                
                return (
                  <div 
                    key={milestone.id}
                    className={`p-3.5 rounded-lg border flex flex-col justify-between space-y-3 ${
                      achieved 
                        ? "bg-emerald-50/20 border-emerald-200" 
                        : "bg-slate-50/40 border-slate-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-black uppercase ${achieved ? "text-emerald-700" : "text-slate-400"}`}>
                          Target threshold
                        </span>
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${
                          achieved ? "bg-emerald-600 text-white" : "bg-indigo-100 text-indigo-700"
                        }`}>
                          {achieved ? "✓" : "•"}
                        </span>
                      </div>
                      <h5 className="text-xs font-black text-slate-800 leading-tight">{milestone.title}</h5>
                      <span className="text-[10px] text-slate-450 leading-tight font-medium block">{milestone.sub}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 font-mono text-[10.5px]">
                      {achieved ? (
                        <span className="text-emerald-700 font-extrabold text-[10px] uppercase">✓ Completed</span>
                      ) : (
                        <div className="text-[10px]">
                          <span className="text-slate-450 font-medium font-bold block">Need: <strong className="text-slate-700">{scoreNeeded} Pts</strong></span>
                          <span className="text-indigo-700 font-extrabold block">+{marksRemaining} Pts Gap</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* JOSAA SEAT ALLOCATIONS DIRECTORY */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs text-left flex-1 flex flex-col">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={16} className="text-slate-700" />
                  <span>Realistic JoSAA Seat Allocations</span>
                </h3>
                <p className="text-[11px] text-slate-450 font-bold mt-1">
                  Matched rank list for simulated <span className="text-indigo-700 font-extrabold">CRL Rank {activeStats.rank.toLocaleString("en-IN")}</span> under <span className="text-slate-800 font-extrabold">{customCategory} Category Code</span>.
                </p>
              </div>

              {/* SEARCH & SELECT FILTERS */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search NITs/IIITs or branches..."
                    value={searchCollegeQuery}
                    onChange={(e) => setSearchCollegeQuery(e.target.value)}
                    className="w-full sm:w-48 pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-800"
                  />
                  <Search size={11} className="text-slate-400 absolute left-2.5 top-3" />
                </div>

                <div className="flex gap-2">
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold py-1.5 px-2 rounded-lg text-slate-700 cursor-pointer"
                  >
                    <option value="All">All Tiers</option>
                    <option value="Tier-1">Tier-1 Elite</option>
                    <option value="Tier-2">Tier-2 Normal</option>
                    <option value="Tier-3">Tier-3 Peripheral</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold py-1.5 px-2 rounded-lg text-slate-700 cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="NIT">NITs Only</option>
                    <option value="IIIT">IIITs Only</option>
                    <option value="GFTI">GFTIs/DTU</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RESPONSE LIST */}
            <div className="space-y-3.5 overflow-y-auto max-h-[460px] pr-2">
              {predictedColleges.length > 0 ? (
                predictedColleges.map((college, idx) => {
                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 hover:border-slate-300 transition duration-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{college.name}</h4>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            college.tier === "Tier-1" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                            college.tier === "Tier-2" ? "bg-teal-50 text-teal-800 border border-teal-200" :
                            "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {college.tier}
                          </span>
                          <span className="text-[8px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {college.type}
                          </span>
                        </div>
                        
                        <p className="text-[10.5px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                          <MapPin size={10} className="text-slate-400 shrink-0" />
                          <span>{college.location}</span>
                        </p>
                        
                        {/* ADMISSION BONUSES ACTIVATED */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {college.isHS && (
                            <span className="text-[9px] bg-emerald-100/60 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                              🏠 {userProfile.homeState} State Quota Active (+50% Rank relaxation)
                            </span>
                          )}
                          {college.isFemale && (
                            <span className="text-[9px] bg-pink-100/60 text-pink-800 font-extrabold px-1.5 py-0.5 rounded border border-pink-200">
                              👩 Female Supernumerary Pool (+35% Rank relaxation)
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2.5 bg-slate-50 p-2 border border-slate-150 rounded-lg flex flex-col xs:flex-row xs:justify-between xs:items-center text-[11px] font-medium text-slate-700 gap-1">
                          <span className="truncate text-slate-800 font-semibold">Stream: <strong className="text-slate-900">{college.branch}</strong></span>
                          <span className="text-slate-500 shrink-0 font-mono text-[10px]">
                            Closing Cutoff: <strong className="text-slate-800 font-black">{college.thresholdRank.toLocaleString("en-IN")} CRL</strong>
                          </span>
                        </div>
                      </div>

                      {/* CHANCE OF SEAT SECURED */}
                      <div className="flex flex-row sm:flex-col items-center sm:justify-center text-center gap-2 sm:gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-5 shrink-0 min-w-[130px] justify-between">
                        <div className="text-left sm:text-center">
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Allocation Odds</span>
                          <span className={`text-[11px] font-black block mt-0.5 uppercase ${
                            college.chance === "HIGH" ? "text-emerald-700" :
                            college.chance === "MEDIUM" ? "text-indigo-800" :
                            "text-amber-700"
                          }`}>
                            {college.chance === "HIGH" ? "✓ Safe Admission" :
                             college.chance === "MEDIUM" ? "⚡ Moderate Fit" :
                             "✨ Dream Target"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${
                              college.chance === "HIGH" ? "bg-emerald-500" :
                              college.chance === "MEDIUM" ? "bg-indigo-650" :
                              "bg-amber-500"
                            }`} style={{ width: `${college.matchPercent}%` }} />
                          </div>
                          <span className="text-[10.5px] font-mono font-bold text-slate-700">{college.matchPercent}%</span>
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <span className="text-3xl">🧩</span>
                  <p className="text-xs font-bold text-slate-700">No matching institutions found</p>
                  <p className="text-[10.5px] text-slate-500 max-w-sm mt-1 leading-normal">
                    Try adjusting search queries, changing category pools, or selecting a lower shift competition index.
                  </p>
                </div>
              )}
            </div>
            
          </div>

        </div>

      </div>

      {/* STATUTORY DISCLAIMER - MINIMALIST */}
      <div className="mt-8 bg-slate-100 border border-slate-200 rounded-xl p-4 sm:p-5 text-left select-text">
        <div className="flex gap-3 items-start text-[10.5px] text-slate-500 leading-relaxed font-semibold">
          <span className="text-sm mt-0.5 select-none">⚠️</span>
          <div>
            <strong className="text-slate-800 uppercase tracking-wider text-[9.5px] font-black block mb-1">
              Simulated Counseling Guide & Legal Disclaimers
            </strong>
            <p className="mb-2">
              This simulation tool is compiled exclusively for candidate mock exam practice, target score benchmarking, and peer-to-peer IIT/NIT JoSAA guidance. This simulation is strictly <strong>independent</strong> and does <strong>NOT</strong> represent and is not sponsored, authorized, or associated with the <strong>National Testing Agency (NTA)</strong>, the <strong>Joint Seat Allocation Authority (JoSAA)</strong>, or any central educational boards.
            </p>
            <p>
              Actual JEE Mains exam percentiles, state quotas, and JoSAA seat allotment matrices are governed strictly by statutory guidelines. All trademarks ("JEE Main", "NTA", "JoSAA") mentioned herein remain the properties of their respective trademark holders.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
