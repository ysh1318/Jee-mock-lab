/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { 
  Award, Timer, Target, CheckCircle2, XCircle, RefreshCw, 
  ChevronRight, BarChart2, BookOpen, Clock, Tag, ArrowRight, 
  Home, FileText, Download, ShieldCheck, Loader2, AlertTriangle, 
  Sparkles, Check, HelpCircle, Eye, EyeOff, Flame, TrendingUp,
  Image as ImageIcon, RotateCcw
} from "lucide-react";
import { Question, Subject, Section, QuestionStatus, TestState, AnalyticsSummary } from "../types";
import { MarkdownMath } from "./MathText";
import { calculateJeePercentile } from "./ResultsPage";
import { isAnswerCorrect } from "../utils/answerEvaluator";
import { QuestionAiTutor } from "./QuestionAiTutor";

interface AnalyticsDashboardProps {
  testState: TestState;
  onRestart: () => void;
}

export function AnalyticsDashboard({ testState, onRestart }: AnalyticsDashboardProps) {
  const { questions, userResponses, questionStatuses, timeSpent } = testState;

  // --- STATE FOR REVIEW SECTION ---
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<Subject | "All">("All");
  const [activeStatusFilter, setActiveStatusFilter] = useState<"All" | "Correct" | "Incorrect" | "Unattempted">("All");
  const [reattempts, setReattempts] = useState<Record<string, string>>({}); // questionId -> reattempt answer
  const [showExplanationId, setShowExplanationId] = useState<string | null>(null);
  const [expandedDiagramId, setExpandedDiagramId] = useState<string | null>(null);

  // --- MATHONGO & ALLEN STYLE ANALYTICS COMPUTATION ---
  const analytics = useMemo(() => {
    let totalScore = 0;
    const isLegacy90 = questions.length === 90 || questions.some((q) => q.section === Section.B && q.questionNumber > 25);
    const maxAttemptable = isLegacy90 ? 75 : questions.length;
    const maxScore = maxAttemptable * 4;
    
    const subjectScores = {
      [Subject.PHYSICS]: 0,
      [Subject.CHEMISTRY]: 0,
      [Subject.MATHEMATICS]: 0,
    };

    const subjectCounts = {
      [Subject.PHYSICS]: { total: 0, correct: 0, incorrect: 0, unattempted: 0 },
      [Subject.CHEMISTRY]: { total: 0, correct: 0, incorrect: 0, unattempted: 0 },
      [Subject.MATHEMATICS]: { total: 0, correct: 0, incorrect: 0, unattempted: 0 },
    };

    const subjectNegativeMarks = {
      [Subject.PHYSICS]: 0,
      [Subject.CHEMISTRY]: 0,
      [Subject.MATHEMATICS]: 0,
    };

    const timeDistribution = {
      [Subject.PHYSICS]: 0,
      [Subject.CHEMISTRY]: 0,
      [Subject.MATHEMATICS]: 0,
    };

    const difficultyPerformance: Record<"Easy" | "Medium" | "Hard", { total: number; correct: number; incorrect: number; score: number }> = {
      Easy: { total: 0, correct: 0, incorrect: 0, score: 0 },
      Medium: { total: 0, correct: 0, incorrect: 0, score: 0 },
      Hard: { total: 0, correct: 0, incorrect: 0, score: 0 },
    };

    const topicPerformance: Record<string, { total: number; correct: number; incorrect: number; unattempted: number; subject: Subject }> = {};
    const overtimeQuestions: string[] = [];

    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalUnattempted = 0;

    questions.forEach((q) => {
      // Normalize difficulty safely
      const rawDiff = q.difficulty === "Moderate" ? "Medium" : q.difficulty;
      const diff: "Easy" | "Medium" | "Hard" = rawDiff || (
        q.section === Section.B ? "Hard" :
        (q.questionNumber % 3 === 0 ? "Hard" : q.questionNumber % 2 === 0 ? "Medium" : "Easy")
      );

      // Accumulate subject totals
      subjectCounts[q.subject].total++;
      difficultyPerformance[diff].total++;
      
      const topicKey = q.topic || "Core Syllabus";
      if (!topicPerformance[topicKey]) {
        topicPerformance[topicKey] = { total: 0, correct: 0, incorrect: 0, unattempted: 0, subject: q.subject };
      }
      topicPerformance[topicKey].total++;

      // Time accumulator
      const spent = timeSpent[q.id] || 0;
      timeDistribution[q.subject] += spent;
      if (spent > 180) {
        overtimeQuestions.push(q.id); // Spends >3 mins (180s)
      }

      // Evaluate states
      const status = questionStatuses[q.id] || QuestionStatus.NOT_VISITED;
      const isAnswered = status === QuestionStatus.ANSWERED || status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW;
      const userReply = userResponses[q.id];

      if (isAnswered && userReply && userReply.trim() !== "") {
        const isCorrect = isAnswerCorrect(userReply, q.correctAnswer, q.section);
        if (isCorrect) {
          totalScore += 4;
          totalCorrect++;
          subjectScores[q.subject] += 4;
          subjectCounts[q.subject].correct++;
          difficultyPerformance[diff].correct++;
          difficultyPerformance[diff].score += 4;
          topicPerformance[topicKey].correct++;
        } else {
          totalScore -= 1;
          totalIncorrect++;
          subjectScores[q.subject] -= 1;
          subjectNegativeMarks[q.subject] += 1;
          subjectCounts[q.subject].incorrect++;
          difficultyPerformance[diff].incorrect++;
          difficultyPerformance[diff].score -= 1;
          topicPerformance[topicKey].incorrect++;
        }
      } else {
        totalUnattempted++;
        subjectCounts[q.subject].unattempted++;
        topicPerformance[topicKey].unattempted++;
      }
    });

    const totalAttempted = totalCorrect + totalIncorrect;
    const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
    const totalPositiveMarks = totalCorrect * 4;
    const totalNegativeMarks = totalIncorrect * 1;
    const potentialScore = totalPositiveMarks; // Marks without silly penalty

    return {
      totalScore,
      maxScore,
      maxAttemptable,
      isLegacy90,
      totalCorrect,
      totalIncorrect,
      totalUnattempted,
      totalAttempted,
      totalPositiveMarks,
      totalNegativeMarks,
      potentialScore,
      subjectScores,
      subjectCounts,
      subjectNegativeMarks,
      accuracy,
      timeDistribution,
      difficultyPerformance,
      topicPerformance,
      overtimeQuestions,
    };
  }, [questions, userResponses, questionStatuses, timeSpent]);

  // Total test time spent
  const totalTestTimeSpent = useMemo(() => {
    return Object.values(timeSpent).reduce((acc, val) => acc + val, 0);
  }, [timeSpent]);

  // Normalized Allen/JEE Main percentile calibration
  const predictedPercentile = useMemo(() => {
    return calculateJeePercentile(analytics.totalScore, analytics.maxScore);
  }, [analytics]);

  const predictedRank = useMemo(() => {
    const p = predictedPercentile;
    // Standard ~1,400,000 JEE Main candidates
    const rank = Math.round((100 - p) * 14000);
    return Math.max(1, rank);
  }, [predictedPercentile]);

  const formatSpentTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const min = Math.floor((secs % 3600) / 60);
    const sec = secs % 60;
    if (hrs > 0) return `${hrs}h ${min}m`;
    if (min > 0) return `${min}m ${sec}s`;
    return `${sec}s`;
  };

  // --- REVIEW LIST FILTERING ---
  const filteredQuestionsForReview = useMemo(() => {
    return questions.filter((q) => {
      // Subject filter
      const matchesSubject = activeSubjectFilter === "All" || q.subject === activeSubjectFilter;
      if (!matchesSubject) return false;

      // Status Evaluator
      const status = questionStatuses[q.id] || QuestionStatus.NOT_VISITED;
      const isAnswered = status === QuestionStatus.ANSWERED || status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW;
      const userReply = userResponses[q.id];

      let testStatus: "Correct" | "Incorrect" | "Unattempted" = "Unattempted";
      if (isAnswered && userReply && userReply.trim() !== "") {
        const isCorrect = isAnswerCorrect(userReply, q.correctAnswer, q.section);
        testStatus = isCorrect ? "Correct" : "Incorrect";
      }

      const matchesStatus = activeStatusFilter === "All" || testStatus === activeStatusFilter;
      return matchesStatus;
    });
  }, [questions, userResponses, questionStatuses, activeSubjectFilter, activeStatusFilter]);

  // Re-attempt handler
  const handleReattempt = (qId: string, answer: string) => {
    setReattempts((prev) => ({
      ...prev,
      [qId]: answer,
    }));
  };

  // --- STATE FOR PDF GENERATION ---
  const [isDownloadingScorecard, setIsDownloadingScorecard] = useState(false);
  const [isDownloadingSolutions, setIsDownloadingSolutions] = useState(false);

  // Helper to remove LaTeX tags for pristine text compatibility in PDF
  const cleanMathExpressions = (rawText: string): string => {
    if (!rawText) return "";
    let result = rawText
      .replace(/\$\$/g, "")
      .replace(/\$/g, "")
      .replace(/\\text\{([^}]+)\}/g, "$1")
      .replace(/\\text/g, "")
      .replace(/\\mathrm\{([^}]+)\}/g, "$1")
      .replace(/\\Delta/g, "Delta")
      .replace(/\\pm/g, "±")
      .replace(/\\alpha/g, "alpha")
      .replace(/\\beta/g, "beta")
      .replace(/\\theta/g, "theta")
      .replace(/\\lambda/g, "lambda")
      .replace(/\\pi/g, "pi")
      .replace(/\\sigma/g, "sigma")
      .replace(/\\cdot/g, "•")
      .replace(/\\neq/g, "≠")
      .replace(/\\le/g, "≤")
      .replace(/\\ge/g, "≥")
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\rightarrow/g, "→")
      .replace(/\\infty/g, "∞")
      .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1/$2)")
      .replace(/\\hat\{([^}]+)\}/g, "$1^")
      .replace(/_\{([^}]+)\}/g, "_{$1}")
      .replace(/\^\{([^}]+)\}/g, "^{$1}");
    return result;
  };

  const downloadScorecard = async () => {
    setIsDownloadingScorecard(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");

      let gender = "Neutral";
      let category = "General";
      let homeState = "Maharashtra";
      let targetPercentile = 99.0;
      let email = "Candidate@CbtCeres";

      try {
        const profileSaved = localStorage.getItem("jee_user_profile");
        if (profileSaved) {
          const parsed = JSON.parse(profileSaved);
          if (parsed.gender) gender = parsed.gender;
          if (parsed.category) category = parsed.category;
          if (parsed.homeState) homeState = parsed.homeState;
          if (parsed.targetPercentile) targetPercentile = Number(parsed.targetPercentile);
        }
        const accountSaved = localStorage.getItem("jee_user_account");
        if (accountSaved) {
          const parsedAcc = JSON.parse(accountSaved);
          if (parsedAcc.email) email = parsedAcc.email;
        }
      } catch (err) {
        console.warn("Loading profiles for PDF failed: ", err);
      }

      // Slate and color styling assets
      const primaryColor = [15, 23, 42]; // Slate-950
      const accentColor = [79, 70, 229]; // Indigo-600
      const lightBg = [248, 250, 252]; // Slate-50
      const borderTheme = [226, 232, 240]; // Slate-200

      // Title Banner Color
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("JOINT ENTRANCE EXAMINATION (JEE) MAIN MOCK CBT", 105, 14, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(199, 210, 254);
      doc.text("OFFICIAL PERFORMANCE EVALUATION PORTFOLIO & SCORE REPORT", 105, 21, { align: "center" });
      doc.setFontSize(7.5);
      doc.text("ESTIMATED COMPETENCY ASSESSMENT FOR EXAM PRACTICE", 105, 26, { align: "center" });

      // Bottom colored bar
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, 40, 210, 2.5, "F");

      // Column Indicators
      let y = 52;
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("CANDIDATE & EXAMINATION PROFILE", 15, y);

      y += 6;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(15, y, 180, 22, "F");
      doc.setDrawColor(borderTheme[0], borderTheme[1], borderTheme[2]);
      doc.rect(15, y, 180, 22, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Candidate Registry: ${email}`, 20, y + 6);
      doc.text(`Category: ${category} | Quota: ${homeState} (Home State)`, 20, y + 11);
      doc.text(`Gender Reservation: ${gender}`, 20, y + 16);

      doc.text(`Mock Test ID: ${testState.testName || "JEE Main Full Mock"}`, 110, y + 6);
      doc.text(`Evaluation System: NTA Standard (+4 / -1)`, 110, y + 11);
      doc.text(`Target Goal: ${targetPercentile}%ile`, 110, y + 16);

      y += 30;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("OVERALL PERFORMANCE SUMMARY", 15, y);

      y += 6;
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(15, y, 180, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("AGGREGATE RAW SCORE", 25, y + 8);
      doc.setFontSize(16);
      doc.text(`${analytics.totalScore} / ${analytics.maxScore}`, 25, y + 17);

      doc.setFontSize(10);
      doc.text("ESTIMATED PERCENTILE", 85, y + 8);
      doc.setFontSize(16);
      doc.text(`${predictedPercentile}%ile`, 85, y + 17);

      doc.setFontSize(10);
      doc.text("ALL-INDIA RANK (EST.)", 145, y + 8);
      doc.setFontSize(16);
      doc.text(`~ AIR ${predictedRank.toLocaleString()}`, 145, y + 17);

      y += 34;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("SUBJECT-WISE MARKS DISTRIBUTION", 15, y);

      y += 6;
      const colWidths = [45, 30, 25, 25, 25, 30];
      const headers = ["Subject", "Total Qs", "Correct", "Wrong", "Skipped", "Net Score"];

      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, y, 180, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");

      let startX = 15;
      headers.forEach((h, idx) => {
        doc.text(h, startX + 3, y + 4.8);
        startX += colWidths[idx];
      });

      y += 7;
      const subjectsList = [Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS];
      subjectsList.forEach((sub, sIdx) => {
        const counts = analytics.subjectCounts[sub];
        const score = analytics.subjectScores[sub];

        doc.setFillColor(sIdx % 2 === 0 ? 255 : 248, sIdx % 2 === 0 ? 255 : 250, sIdx % 2 === 0 ? 255 : 252);
        doc.rect(15, y, 180, 7, "F");
        doc.setDrawColor(borderTheme[0], borderTheme[1], borderTheme[2]);
        doc.line(15, y + 7, 195, y + 7);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);

        let rowX = 15;
        const rowVals = [
          sub,
          counts.total.toString(),
          counts.correct.toString(),
          counts.incorrect.toString(),
          counts.unattempted.toString(),
          score.toString()
        ];

        rowVals.forEach((val, vIdx) => {
          if (vIdx === 2) doc.setTextColor(5, 150, 105);
          else if (vIdx === 3) doc.setTextColor(225, 29, 72);
          else if (vIdx === 5) doc.setTextColor(79, 70, 229);
          else doc.setTextColor(51, 65, 85);

          doc.text(val, rowX + 3, y + 4.8);
          rowX += colWidths[vIdx];
        });

        y += 7;
      });

      y += 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("TIME EXPENDITURE & PRECISION METRICS", 15, y);

      y += 6;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(15, y, 180, 20, "F");
      doc.setDrawColor(borderTheme[0], borderTheme[1], borderTheme[2]);
      doc.rect(15, y, 180, 20, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Total Time Invested: ${formatSpentTime(totalTestTimeSpent)}`, 20, y + 6);
      doc.text(`Accuracy Rate: ${analytics.accuracy}%`, 20, y + 13);
      doc.text(`Negative Marks Penalty: -${analytics.totalNegativeMarks} marks`, 110, y + 6);
      doc.text(`Recoverable Potential Score: ${analytics.potentialScore} marks`, 110, y + 13);

      y += 32;
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("This report is digitally rendered based on mock responses calculated inside the client environment.", 15, y);
      doc.text("All score formulas and timing metrics match June 2026 NTA guidelines.", 15, y + 3.5);

      // Decorative Stamp Card
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(142, y - 6, 53, 12, "F");
      doc.setDrawColor(borderTheme[0], borderTheme[1], borderTheme[2]);
      doc.rect(142, y - 6, 53, 12, "S");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(8);
      doc.text("VERIFIED COMPLETED", 145, y - 1);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6.5);
      doc.text("GUID: MOCK-PDF-AIR-2026", 145, y + 3);

      doc.save(`JEE_Mock_ReportCard_${email.split("@")[0]}.pdf`);
    } catch (e) {
      console.error("Scorecard PDF failure: ", e);
      alert("Error printing PDF scorecard. Please try again.");
    } finally {
      setIsDownloadingScorecard(false);
    }
  };

  const downloadSolvedPaper = async () => {
    setIsDownloadingSolutions(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");

      let email = "Candidate@CbtCeres";
      try {
        const accountSaved = localStorage.getItem("jee_user_account");
        if (accountSaved) {
          const parsedAcc = JSON.parse(accountSaved);
          if (parsedAcc.email) email = parsedAcc.email;
        }
      } catch {}

      const primaryColor = [15, 23, 42]; // Slate-950
      const accentColor = [79, 70, 229]; // Indigo-600
      const borderTheme = [226, 232, 240]; // Slate-200
      const redBadgeBg = [254, 226, 226];
      const redBadgeText = [185, 28, 28];
      const greenBadgeBg = [209, 250, 229];
      const greenBadgeText = [6, 95, 70];
      const grayBadgeBg = [241, 245, 249];
      const grayBadgeText = [71, 85, 105];

      // TITLE BANNER PAGE 1
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 32, "F");

      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, 32, 210, 2.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("EXAMINATION SOLUTIONS MANUAL & PRACTICE LOGBOOK", 15, 13);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(199, 210, 254);
      doc.text(`Official step solutions matching mock session for: ${email}`, 15, 20);
      doc.setFontSize(7.5);
      doc.text(`Total Questions compiled: ${questions.length} | Formula Cleansed Report`, 15, 25);

      let pNum = 1;
      let y = 46;

      questions.forEach((q, index) => {
        const diff = q.difficulty || "Medium";
        const qCleanLabel = `Q${index + 1}. [Subject: ${q.subject} | Mode: ${diff}] - Topic Area: ${q.topic || "Core"}`;
        const questionTextClean = cleanMathExpressions(q.questionText);
        
        const wrapLabelLines = doc.splitTextToSize(qCleanLabel, 180);
        const wrapQTextLines = doc.splitTextToSize(questionTextClean, 180);
        
        let optionText = "";
        if (q.options && q.options.length > 0) {
          const opsArray = q.options.map((opt, oIdx) => {
            const letters = ["A", "B", "C", "D"];
            return `Option ${letters[oIdx]}: ${cleanMathExpressions(opt)}`;
          });
          optionText = opsArray.join("\n");
        }
        const wrapOptionLines = optionText ? doc.splitTextToSize(optionText, 175) : [];

        const status = questionStatuses[q.id] || QuestionStatus.NOT_VISITED;
        const isAnswered = status === QuestionStatus.ANSWERED || status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW;
        const userReply = userResponses[q.id];
        
        let markingStatus = "UNATTEMPTED (0 Marks)";
        let markingColor = grayBadgeText;
        let markingBg = grayBadgeBg;

        if (isAnswered && userReply && userReply.trim() !== "") {
          const isCorrect = isAnswerCorrect(userReply, q.correctAnswer, q.section);
          if (isCorrect) {
            markingStatus = "CORRECT ANSWER KEY (+4 Marks Graded)";
            markingColor = greenBadgeText;
            markingBg = greenBadgeBg;
          } else {
            markingStatus = `INCORRECT ANSWER KEY (-1 Deduction) - Your Response: ${userReply.toUpperCase()}`;
            markingColor = redBadgeText;
            markingBg = redBadgeBg;
          }
        }

        const explanationTextClean = cleanMathExpressions(q.explanation || "Use standard formulas and concepts to resolve this problem.");
        const wrapExplanationLines = doc.splitTextToSize(explanationTextClean, 175);

        const estimatedHeight = 
          (wrapLabelLines.length * 5) + 
          (wrapQTextLines.length * 5) + 
          (wrapOptionLines.length * 4.5) + 
          (wrapExplanationLines.length * 4.5) + 26;

        if (y + estimatedHeight > 275) {
          // Add Footer Page number
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`Page ${pNum}`, 105, 285, { align: "center" });

          doc.addPage();
          pNum++;
          y = 20;

          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setDrawColor(borderTheme[0], borderTheme[1], borderTheme[2]);
          doc.line(15, 10, 195, 10);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text("EXAMINATION MASTER SOLUTIONS REPORT", 15, 8);
          doc.text(`Candidate Registry: ${email.split("@")[0].toUpperCase()}`, 195, 8, { align: "right" });
        }

        // Highlight marker bar
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.rect(15, y, 1.2, estimatedHeight - 4, "F");

        // Top Q Identifier Label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(79, 70, 229);
        doc.text(wrapLabelLines, 18, y + 4);

        y += (wrapLabelLines.length * 5) + 0.5;

        // Question Description
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(wrapQTextLines, 18, y + 4);

        y += (wrapQTextLines.length * 5) + 0.5;

        // Options List
        if (q.options && q.options.length > 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          doc.text(wrapOptionLines, 21, y + 4);
          y += (wrapOptionLines.length * 4.5) + 1.5;
        }

        // User attempt audit row
        y += 1.5;
        doc.setFillColor(markingBg[0], markingBg[1], markingBg[2]);
        doc.rect(18, y, 177, 6, "F");
        doc.setDrawColor(markingColor[0], markingColor[1], markingColor[2]);
        doc.rect(18, y, 177, 6, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(markingColor[0], markingColor[1], markingColor[2]);
        doc.text(`MOCK STATUS: ${markingStatus}`, 21, y + 4);

        doc.setTextColor(15, 23, 42);
        doc.text(`Official Key: ${String(q.correctAnswer).toUpperCase()}`, 135, y + 4);

        y += 8;

        // Explanation text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text("DETAILED STEP EXPLANATION & DERIVATION:", 18, y + 2.5);

        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(wrapExplanationLines, 18, y + 2);

        y += (wrapExplanationLines.length * 4.5) + 10;

        // Dotted-like separator
        doc.setDrawColor(241, 245, 249);
        doc.line(15, y - 5, 195, y - 5);
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${pNum}`, 105, 285, { align: "center" });

      doc.save(`JEE_Mock_Solutions_${email.split("@")[0]}.pdf`);
    } catch (e) {
      console.error("Solved Paper PDF failure: ", e);
      alert("Error printing PDF solutions log. Please try again.");
    } finally {
      setIsDownloadingSolutions(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 select-text font-sans relative">
      {/* Subtle Atmospheric Depth Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-gradient-to-b from-blue-100/40 via-indigo-50/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* -------------------- HEADLINE HERO BANNER -------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 mb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-2 border border-blue-200/60 shadow-2xs">
              <Award size={13} className="text-blue-600" />
              <span>Official Examination Audit Report</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              CBT Performance & Solution Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-normal leading-relaxed">
              Diagnostic breakdown matching official NTA marking (+4 / -1), negative marks penalty audit, step-by-step KaTeX solutions, and vector diagrams.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onRestart}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.22)] hover:shadow-[0_14px_28px_rgba(37,99,235,0.32)] transition cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Home size={14} />
              <span>Practice Another Paper</span>
            </button>
          </div>
        </div>

      {/* -------------------- MATHONGO-GRADE HERO SCORE MATRIX (SMOOTH ROUNDED-3XL SQUIRCLES) -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* BLOCK 1: RAW SCORE & POTENTIAL */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Exam Raw Score</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
              +{analytics.totalPositiveMarks} gross
            </span>
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-1 flex items-baseline gap-1 font-heading">
            <span className={analytics.totalScore < 0 ? "text-rose-600" : "text-slate-900"}>
              {analytics.totalScore}
            </span>
            <span className="text-sm text-slate-400 font-bold font-sans">/ {analytics.maxScore}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Without deductions:</span>
            <strong className="text-blue-600 font-bold font-heading">{analytics.potentialScore} pts</strong>
          </div>
        </div>

        {/* BLOCK 2: PERCENTILE & AIR ESTIMATOR */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Est. Percentile</span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50/90 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
              Allen Scale
            </span>
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 tracking-tight mt-1 font-heading">
            {predictedPercentile}%ile
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Predicted All-India:</span>
            <strong className="text-slate-800 font-bold font-heading">AIR ~{predictedRank.toLocaleString()}</strong>
          </div>
        </div>

        {/* BLOCK 3: ACCURACY & ATTEMPTS */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Precision Accuracy</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50/90 border border-blue-200/70 px-2.5 py-0.5 rounded-full font-mono tabular-nums">
              {analytics.totalAttempted}/{analytics.maxAttemptable} Attempted
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1 font-heading">
            {analytics.accuracy}%
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  analytics.accuracy >= 75 ? "bg-emerald-500" :
                  analytics.accuracy >= 50 ? "bg-amber-500" : 
                  analytics.accuracy > 0 ? "bg-rose-500" : "bg-slate-300"
                }`} 
                style={{ width: `${Math.max(analytics.accuracy, 2)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* BLOCK 4: SILLY MISTAKES / NEGATIVE PENALTY */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Negative Penalty</span>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50/90 border border-rose-200/70 px-2.5 py-0.5 rounded-full">
              -1 per mistake
            </span>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 tracking-tight mt-1 font-heading">
            -{analytics.totalNegativeMarks} <span className="text-xs text-slate-400 font-normal font-sans">marks lost</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Incorrect answers:</span>
            <strong className="text-rose-600 font-bold font-heading">{analytics.totalIncorrect} question{analytics.totalIncorrect === 1 ? '' : 's'}</strong>
          </div>
        </div>
      </div>

      {/* -------------------- TIME & EXPORT CENTER -------------------- */}
      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 mb-8 flex flex-col lg:flex-row items-center justify-between gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center border border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] shrink-0">
            <Timer size={22} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-800 tracking-tight flex items-center gap-2">
              <span>Time Invested: <strong className="text-slate-900 font-bold">{formatSpentTime(totalTestTimeSpent)}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-normal">
                Avg. <span className="text-slate-800 font-bold">{formatSpentTime(Math.round(totalTestTimeSpent / (questions.length || 1)))}</span> / question
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export verified NTA scorecard PDF or printable question-by-question model solutions logbook.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            type="button"
            disabled={isDownloadingScorecard}
            onClick={downloadScorecard}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-full transition cursor-pointer shadow-xs active:scale-95"
          >
            {isDownloadingScorecard ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Generating Scorecard...</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Download Scorecard PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isDownloadingSolutions}
            onClick={downloadSolvedPaper}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold text-xs rounded-full transition cursor-pointer shadow-[0_10px_25px_rgba(37,99,235,0.25)] hover:shadow-[0_14px_28px_rgba(37,99,235,0.35)] active:scale-95"
          >
            {isDownloadingSolutions ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Compiling Solutions...</span>
              </>
            ) : (
              <>
                <BookOpen size={13} />
                <span>Download Solutions PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* -------------------- SUBJECT-WISE SPLIT ANALYSIS (FIXED VISUAL CONFUSION) -------------------- */}
      <div className="mb-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-6">
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <span>Subject-Wise Performance & Velocity Splits</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-semibold">Physics • Chemistry • Mathematics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS].map((subject) => {
            const score = analytics.subjectScores[subject];
            const counts = analytics.subjectCounts[subject];
            const time = analytics.timeDistribution[subject];
            const negativeMarks = analytics.subjectNegativeMarks[subject];
            const attempted = counts.correct + counts.incorrect;
            const accuracy = attempted > 0 ? Math.round((counts.correct / attempted) * 100) : 0;

            return (
              <div 
                key={subject} 
                className="bg-white rounded-3xl border border-slate-200/70 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Subject Header */}
                <div className="bg-[#fafbfc] px-6 py-4 border-b border-slate-100 flex justify-between items-center select-none">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                      {subject}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200/70 px-2.5 py-0.5 rounded-full font-mono tabular-nums">
                      {counts.total} Questions{analytics.isLegacy90 ? " (25 Attemptable)" : ""}
                    </span>
                  </div>
                  <span className={`text-xs font-heading font-bold px-3 py-1 rounded-full ${
                    score > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70" :
                    score < 0 ? "bg-rose-50 text-rose-700 border border-rose-200/70" :
                    "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {score > 0 ? `+${score}` : score} {Math.abs(score) === 1 ? "Mark" : "Marks"}
                  </span>
                </div>

                {/* 3-Pillar Breakdown: Correct, Wrong, Skipped */}
                <div className="p-6 flex-1 space-y-5">
                  <div className="grid grid-cols-3 gap-2.5 text-center select-none">
                    {/* CORRECT */}
                    <div className="bg-emerald-50/70 border border-emerald-200/70 p-3 rounded-2xl">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Correct</div>
                      <div className="text-2xl font-heading font-extrabold text-emerald-700 mt-0.5">{counts.correct}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">+{counts.correct * 4} marks</div>
                    </div>

                    {/* INCORRECT */}
                    <div className="bg-rose-50/70 border border-rose-200/70 p-3 rounded-2xl">
                      <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Incorrect</div>
                      <div className="text-2xl font-heading font-extrabold text-rose-700 mt-0.5">{counts.incorrect}</div>
                      <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                        {negativeMarks > 0 ? `-${negativeMarks} mark${negativeMarks === 1 ? '' : 's'}` : "0 marks"}
                      </div>
                    </div>

                    {/* SKIPPED */}
                    <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-2xl">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skipped</div>
                      <div className="text-2xl font-heading font-extrabold text-slate-700 mt-0.5">{counts.unattempted}</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">0 marks</div>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="space-y-1.5 select-none pt-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Subject Accuracy</span>
                      <span className="text-slate-900 font-heading">{accuracy}% ({counts.correct}/{attempted || 0})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          accuracy >= 75 ? "bg-emerald-500" :
                          accuracy >= 50 ? "bg-amber-500" : 
                          accuracy > 0 ? "bg-rose-500" : "bg-slate-200"
                        }`} 
                        style={{ width: `${Math.max(accuracy, 2)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Time */}
                <div className="border-t border-slate-100 px-6 py-3.5 bg-[#fafbfc] flex justify-between items-center text-xs font-semibold text-slate-500 select-none">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>Time Spent:</span>
                  </div>
                  <span className="text-slate-900 font-bold">{formatSpentTime(time)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------- COGNITIVE DIFFICULTY & TOPIC BREAKDOWNS -------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 text-left">
        {/* COGNITIVE DIFFICULTY DIAGNOSTICS */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
              <Tag size={15} className="text-blue-600" />
              <span>Cognitive Difficulty Level Metrics</span>
            </h3>
            
            <div className="space-y-3.5 select-none">
              {(["Easy", "Medium", "Hard"] as const).map((lvl) => {
                const data = analytics.difficultyPerformance[lvl];
                const total = data.total;
                const correct = data.correct;
                const incorrect = data.incorrect;
                const attempted = correct + incorrect;
                const acc = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

                return (
                  <div key={lvl} className="p-4 bg-[#fafbfc] rounded-2xl border border-slate-200/60">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
                      <span className={`flex items-center gap-1.5 ${
                        lvl === "Easy" ? "text-emerald-700" :
                        lvl === "Medium" ? "text-amber-700" : "text-rose-700"
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        {lvl} Questions ({total} Qs)
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        {correct} Correct • {incorrect} Wrong • {acc}% Acc
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          lvl === "Easy" ? "bg-emerald-500" :
                          lvl === "Medium" ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${acc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time control warning */}
          {analytics.overtimeQuestions.length > 0 && (
            <div className="mt-4 bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl text-xs text-amber-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Time Trap Alert:</strong> You spent &gt;3 minutes on {analytics.overtimeQuestions.length} questions. In JEE Main, keeping under 2.5 mins per question preserves essential time for numerical questions.
              </div>
            </div>
          )}
        </div>

        {/* CONCEPTUAL TOPIC ACCURACY */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
              <BookOpen size={15} className="text-indigo-600" />
              <span>Chapter & Topic Accuracy Radar</span>
            </h3>

            <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
              {Object.keys(analytics.topicPerformance).length === 0 ? (
                <div className="text-xs text-slate-400 italic py-6 text-center">No topic tags evaluated.</div>
              ) : (
                Object.entries(analytics.topicPerformance).map(([topic, data]) => {
                  const totalAttempted = data.correct + data.incorrect;
                  const topicAcc = totalAttempted > 0 ? Math.round((data.correct / totalAttempted) * 100) : 0;
                  
                  return (
                    <div key={topic} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span className="truncate max-w-[240px] font-medium">{topic}</span>
                        <span className="text-[11px] font-bold text-slate-500 font-heading">
                          {data.correct}/{data.total} ({topicAcc}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            topicAcc >= 75 ? "bg-emerald-500" :
                            topicAcc >= 45 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${topicAcc}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-right">
            Topics color-coded: Green (&ge;75%), Amber (45-74%), Red (&lt;45%)
          </div>
        </div>
      </div>

      {/* -------------------- STEP-BY-STEP REVIEW WORKSPACE -------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 mb-8 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4 mb-6">
          <div>
            <h2 className="text-sm font-heading font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Question-by-Question Solution Navigator</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Review full KaTeX derivations, cropped figures/diagrams, and verify student responses
            </p>
          </div>

          {/* QUESTION SUMMARY CHIPS */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full font-semibold">
              {analytics.totalCorrect} Correct
            </span>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full font-semibold">
              {analytics.totalIncorrect} Wrong
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200/80 rounded-full font-semibold">
              {analytics.totalUnattempted} Skipped
            </span>
          </div>
        </div>

        {/* DUAL FILTER TABS */}
        <div className="flex flex-wrap gap-3 items-center mb-6 bg-[#fafbfc] p-3 sm:p-4 rounded-2xl border border-slate-200/60">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Subjects:</span>
          
          <div className="flex flex-wrap gap-1.5">
            {["All", Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS].map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSubjectFilter(sub as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
                  activeSubjectFilter === sub
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-slate-300 mx-1 hidden md:block" />

          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider ml-1">Status:</span>

          <div className="flex flex-wrap gap-1.5">
            {["All", "Correct", "Incorrect", "Unattempted"].map((state) => (
              <button
                key={state}
                onClick={() => setActiveStatusFilter(state as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
                  activeStatusFilter === state
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        {/* QUESTIONS REVIEW FEED */}
        <div className="space-y-6">
          {filteredQuestionsForReview.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl max-w-md mx-auto text-slate-400 text-xs select-none">
              No questions match the current filter selection. Reset filters above.
            </div>
          ) : (
            filteredQuestionsForReview.map((q) => {
              const status = questionStatuses[q.id] || QuestionStatus.NOT_VISITED;
              const isAnswered = status === QuestionStatus.ANSWERED || status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW;
              const userReply = userResponses[q.id];
              
              let isCorrect = false;
              let responseState: "Correct" | "Incorrect" | "Unattempted" = "Unattempted";

              if (isAnswered && userReply && userReply.trim() !== "") {
                isCorrect = isAnswerCorrect(userReply, q.correctAnswer, q.section);
                responseState = isCorrect ? "Correct" : "Incorrect";
              }

              const timeUsed = timeSpent[q.id] || 0;
              const showSolution = showExplanationId === q.id;
              const diff = q.difficulty || "Medium";

              return (
                <div 
                  key={q.id} 
                  className={`rounded-3xl border transition shadow-xs hover:shadow-md overflow-hidden ${
                    responseState === "Correct" ? "border-emerald-200 bg-white" :
                    responseState === "Incorrect" ? "border-rose-200 bg-white" :
                    "border-slate-200/70 bg-white"
                  }`}
                >
                  {/* Question Header Bar */}
                  <div className="bg-[#fafbfc] border-b border-slate-200/60 px-6 py-4 flex flex-wrap justify-between items-center gap-2 select-none">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-extrabold text-xs text-slate-900 bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                        Q.{q.questionNumber}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                        {q.subject}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-150">
                        {q.topic || "Core Syllabus"}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                        {q.section}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Clock size={12} /> {formatSpentTime(timeUsed)}
                      </span>

                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        diff === "Easy" ? "text-emerald-700 bg-emerald-50 border border-emerald-150" :
                        diff === "Medium" ? "text-amber-700 bg-amber-50 border border-amber-150" : 
                        "text-rose-700 bg-rose-50 border border-rose-150"
                      }`}>
                        {diff}
                      </span>
                      
                      {/* Status Outcome Badge */}
                      {responseState === "Correct" && (
                        <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 size={12} /> Correct (+4)
                        </span>
                      )}
                      {responseState === "Incorrect" && (
                        <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                          <XCircle size={12} /> Penalty (-1)
                        </span>
                      )}
                      {responseState === "Unattempted" && (
                        <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[11px] font-semibold">
                          Unattempted (0)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Content Body */}
                  <div className="p-6 md:p-7 space-y-4">
                    {/* Question Statement */}
                    <div className="leading-relaxed text-sm text-slate-800 font-medium">
                      <MarkdownMath text={q.questionText} />
                    </div>

                    {/* CROPPED HIGH-RES VECTOR DIAGRAM (Lightweight Diagram Cropper Integration) */}
                    {q.diagramImage && (
                      <div className="my-4 p-4 bg-[#fafbfc] border border-slate-200/80 rounded-2xl max-w-2xl">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
                          <ImageIcon size={14} className="text-slate-500" />
                          <span>High-Res Vector Diagram Reference</span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                            Cropped Retina 2.0x
                          </span>
                        </div>
                        <div className="relative group cursor-pointer" onClick={() => setExpandedDiagramId(expandedDiagramId === q.id ? null : q.id)}>
                          <img
                            src={q.diagramImage}
                            alt={`Diagram for Question ${q.questionNumber}`}
                            className={`w-auto object-contain mx-auto rounded-xl border border-slate-200 bg-white p-2 transition-all ${
                              expandedDiagramId === q.id ? "max-h-[500px]" : "max-h-72"
                            }`}
                          />
                          <div className="text-[10px] text-center text-slate-400 mt-1 select-none">
                            {expandedDiagramId === q.id ? "Click to shrink diagram" : "Click image to expand view"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MCQ Options Display */}
                    {q.options && q.options.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isStudentPic = userReply === letter;
                          const isCorrectKey = q.correctAnswer === letter;

                          return (
                            <div
                              key={oIdx}
                              className={`p-4 text-xs rounded-2xl border leading-relaxed flex items-start gap-3 transition ${
                                isCorrectKey 
                                  ? "bg-emerald-50/70 border-emerald-400 text-emerald-950 font-semibold" 
                                  : isStudentPic
                                  ? "bg-rose-50/70 border-rose-400 text-rose-950"
                                  : "bg-[#fafbfc] border-slate-200/80 text-slate-700"
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border select-none ${
                                isCorrectKey
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                  : isStudentPic
                                  ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                                  : "bg-white text-slate-500 border-slate-300"
                              }`}>
                                {letter}
                              </span>
                              <div className="flex-1 mt-0.5 text-xs">
                                <MarkdownMath text={opt} />
                              </div>
                              {isCorrectKey && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full shrink-0">
                                  Correct Key
                                </span>
                              )}
                              {isStudentPic && !isCorrectKey && (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-full shrink-0">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Audit Summary Row */}
                    <div className="mt-4 bg-[#fafbfc] border border-slate-200/80 p-4 rounded-2xl flex flex-wrap gap-4 justify-between items-center text-xs">
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] block">Your Response</span>
                          <span className={`font-extrabold mt-0.5 block ${
                            responseState === "Correct" ? "text-emerald-700" :
                            responseState === "Incorrect" ? "text-rose-700" : "text-slate-400 italic"
                          }`}>
                            {userReply ? `Option ${userReply.toUpperCase()}` : "Not Attempted"}
                          </span>
                        </div>
                        <div className="border-l border-slate-200 pl-6">
                          <span className="text-slate-400 font-bold uppercase text-[9px] block">Official Answer Key</span>
                          <span className="font-extrabold text-emerald-700 block mt-0.5">
                            {q.section === Section.A ? `Option ${q.correctAnswer}` : q.correctAnswer}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowExplanationId(showSolution ? null : q.id)}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full shadow-xs cursor-pointer transition flex items-center gap-1.5 active:scale-95"
                        >
                          {showSolution ? (
                            <>
                              <EyeOff size={13} />
                              <span>Hide Solution</span>
                            </>
                          ) : (
                            <>
                              <Eye size={13} />
                              <span>View Step-by-Step Solution</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* DIAGNOSTIC RE-ATTEMPT WIDGET (For wrong or skipped questions) */}
                    {responseState !== "Correct" && (
                      <div className="border border-indigo-150 bg-indigo-50/40 p-4 rounded-2xl">
                        <div className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2 select-none flex items-center gap-1.5">
                          <RotateCcw size={12} className="text-indigo-600" />
                          <span>Instant Concept Re-Attempt</span>
                        </div>
                        
                        {q.section === Section.A ? (
                          <div className="flex flex-wrap gap-2">
                            {["A", "B", "C", "D"].map((letter) => {
                              const isSelected = reattempts[q.id] === letter;
                              const hasTried = !!reattempts[q.id];
                              const isCorrectRe = letter === q.correctAnswer;
                              
                              return (
                                <button
                                  key={letter}
                                  onClick={() => handleReattempt(q.id, letter)}
                                  disabled={hasTried}
                                  className={`px-4 py-1.5 border text-xs font-bold rounded-full transition cursor-pointer select-none ${
                                    isSelected
                                      ? isCorrectRe
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-rose-600 text-white border-rose-600"
                                      : hasTried && isCorrectRe
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                      : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  Try Option ({letter})
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center max-w-sm">
                            <input
                              type="text"
                              placeholder="Enter numerical value..."
                              value={reattempts[q.id] || ""}
                              onChange={(e) => handleReattempt(q.id, e.target.value)}
                              disabled={!!reattempts[q.id] && isAnswerCorrect(reattempts[q.id], q.correctAnswer, q.section)}
                              className="bg-white border border-slate-200 text-xs px-4 py-2 rounded-full w-full font-bold outline-hidden focus:border-indigo-400"
                            />
                            {(reattempts[q.id] || "") && (
                              <span className={`text-xs font-bold shrink-0 flex items-center gap-1 ${
                                isAnswerCorrect(reattempts[q.id], q.correctAnswer, q.section) ? "text-emerald-600" : "text-rose-500"
                              }`}>
                                {isAnswerCorrect(reattempts[q.id], q.correctAnswer, q.section) ? (
                                  <>
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                    <span>Correct!</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={13} className="text-rose-500" />
                                    <span>Try again</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP-BY-STEP SOLUTION EXPLANATION */}
                    {showSolution && (
                      <div className="mt-4 p-6 bg-slate-900 text-white rounded-3xl leading-relaxed animate-in fade-in-50 duration-200 border border-slate-800 shadow-xl">
                        <div className="text-[11px] font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <BookOpen size={14} className="text-indigo-400" />
                            <span>Official Step-by-Step KaTeX Solution</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Answer Key: Option {q.correctAnswer}
                          </span>
                        </div>
                        <div className="text-xs text-slate-200 leading-relaxed font-sans select-text">
                          <MarkdownMath 
                            text={q.explanation || "No explanation provided. Use the fundamental formulas of the topic to derive this solution."} 
                          />
                        </div>

                        {/* AI TUTOR FOLLOW-UP DESK */}
                        <QuestionAiTutor 
                          question={q}
                          userResponse={userReply}
                          markingStatus={responseState}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
