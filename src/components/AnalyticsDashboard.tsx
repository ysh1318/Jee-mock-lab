/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Award, Timer, Target, CheckCircle2, XCircle, RefreshCw, ChevronRight, BarChart2, BookOpen, Clock, Tag, ArrowRight, Home, FileText, Download, ShieldCheck, Loader2 } from "lucide-react";
import { Question, Subject, Section, QuestionStatus, TestState, AnalyticsSummary } from "../types";
import { MarkdownMath } from "./MathText";

interface AnalyticsDashboardProps {
  testState: TestState;
  onRestart: () => void;
}

export function AnalyticsDashboard({ testState, onRestart }: AnalyticsDashboardProps) {
  const { questions, userResponses, questionStatuses, timeSpent, timeLeft } = testState;

  // --- STATE FOR REVIEW SECTION ---
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<Subject | "All">("All");
  const [activeStatusFilter, setActiveStatusFilter] = useState<"All" | "Correct" | "Incorrect" | "Unattempted">("All");
  const [reattempts, setReattempts] = useState<Record<string, string>>({}); // questionId -> reattempt answer
  const [showExplanationId, setShowExplanationId] = useState<string | null>(null);

  // --- MATHONGO & ALLEN STYLE ANALYTICS COMPUTATION ---
  const analytics = useMemo((): AnalyticsSummary => {
    let totalScore = 0;
    const maxScore = questions.length * 4;
    
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

    const timeDistribution = {
      [Subject.PHYSICS]: 0,
      [Subject.CHEMISTRY]: 0,
      [Subject.MATHEMATICS]: 0,
    };

    const difficultyPerformance = {
      Easy: { total: 0, correct: 0, incorrect: 0, score: 0 },
      Medium: { total: 0, correct: 0, incorrect: 0, score: 0 },
      Hard: { total: 0, correct: 0, incorrect: 0, score: 0 },
    };

    const topicPerformance: Record<string, { total: number; correct: number; incorrect: number; unattempted: number }> = {};
    const overtimeQuestions: string[] = [];

    questions.forEach((q) => {
      // Accumulate subject totals
      subjectCounts[q.subject].total++;
      difficultyPerformance[q.difficulty].total++;
      
      if (!topicPerformance[q.topic]) {
        topicPerformance[q.topic] = { total: 0, correct: 0, incorrect: 0, unattempted: 0 };
      }
      topicPerformance[q.topic].total++;

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

      if (isAnswered && userReply) {
        const isCorrect = userReply.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        if (isCorrect) {
          totalScore += 4;
          subjectScores[q.subject] += 4;
          subjectCounts[q.subject].correct++;
          difficultyPerformance[q.difficulty].correct++;
          difficultyPerformance[q.difficulty].score += 4;
          topicPerformance[q.topic].correct++;
        } else {
          totalScore -= 1;
          subjectScores[q.subject] -= 1;
          subjectCounts[q.subject].incorrect++;
          difficultyPerformance[q.difficulty].incorrect++;
          difficultyPerformance[q.difficulty].score -= 1;
          topicPerformance[q.topic].incorrect++;
        }
      } else {
        subjectCounts[q.subject].unattempted++;
        topicPerformance[q.topic].unattempted++;
      }
    });

    const totalAttempted = questions.length - (subjectCounts[Subject.PHYSICS].unattempted + subjectCounts[Subject.CHEMISTRY].unattempted + subjectCounts[Subject.MATHEMATICS].unattempted);
    const totalCorrect = subjectCounts[Subject.PHYSICS].correct + subjectCounts[Subject.CHEMISTRY].correct + subjectCounts[Subject.MATHEMATICS].correct;
    const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    return {
      totalScore,
      maxScore,
      subjectScores,
      subjectCounts,
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

  // Percentile Estimator logic (Allen calibration):
  // Score mapping standard to JEE Mains percentile calibration
  const predictedPercentile = useMemo(() => {
    const rawScore = analytics.totalScore;
    if (rawScore >= 240) return 99.9;
    if (rawScore >= 200) return 99.5;
    if (rawScore >= 180) return 99.2;
    if (rawScore >= 150) return 98.5;
    if (rawScore >= 120) return 96.5;
    if (rawScore >= 100) return 94.0;
    if (rawScore >= 80) return 90.0;
    if (rawScore >= 50) return 78.0;
    if (rawScore >= 30) return 60.0;
    return Math.max(0, Math.round((rawScore + 40) * 1.5 * 10) / 10);
  }, [analytics]);

  const predictedRank = useMemo(() => {
    const p = predictedPercentile;
    // Assuming standard 1,400,000 candidates
    const rank = Math.round((100 - p) * 14000);
    return Math.max(1, rank);
  }, [predictedPercentile]);

  const formatSpentTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min}m ${sec}s`;
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
      if (isAnswered && userReply) {
        const isCorrect = userReply.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
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
      let targetPercentile = 98.5;
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
      doc.text("1. CANDIDATE IDENTITY SPECIFICATION", 15, y);

      y += 4;
      doc.setDrawColor(borderTheme[0], borderTheme[1], borderTheme[2]);
      doc.setLineWidth(0.4);
      doc.line(15, y, 195, y);

      // Value Box
      y += 4;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(15, y, 180, 22, "F");
      doc.rect(15, y, 180, 22, "S");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      
      doc.text("Candidate Registered Email:", 18, y + 5.5);
      doc.text("Home State / Gender:", 18, y + 11.5);
      doc.text("Target Percentile setup:", 18, y + 17.5);

      doc.text("Reservation Eligibility Status:", 110, y + 5.5);
      doc.text("Mock Exam Pattern Mode:", 110, y + 11.5);
      doc.text("Evaluation Timestamp (UTC):", 110, y + 17.5);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.text(email, 64, y + 5.5);
      doc.text(`${homeState} / ${gender}`, 64, y + 11.5);
      doc.text(`${targetPercentile}%ile`, 64, y + 17.5);

      doc.text(category, 156, y + 5.5);
      doc.text("JEE Main NTA CBT Pattern", 156, y + 11.5);
      doc.text(new Date().toISOString().replace("T", " ").substring(0, 19), 156, y + 17.5);

      // Section 2: Core parameters
      y += 31;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("2. METRICS & COMPETENCY SCORES", 15, y);

      y += 4;
      doc.line(15, y, 195, y);

      y += 4;
      const cardWidth = 56;
      const cardHeight = 20;
      const gap = 6;
      
      const cards = [
        { label: "RAW SCORE", val: `${analytics.totalScore} / ${analytics.maxScore}`, color: [249, 115, 22] },
        { label: "ACCURACY PR.", val: `${analytics.accuracy}%`, color: [59, 130, 246] },
        { label: "TOTAL TIME SPENT", val: formatSpentTime(totalTestTimeSpent), color: [139, 92, 246] }
      ];

      cards.forEach((card, index) => {
        const cx = 15 + index * (cardWidth + gap);
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.rect(cx, y, cardWidth, cardHeight, "F");

        doc.setFillColor(card.color[0], card.color[1], card.color[2]);
        doc.rect(cx, y, 2.5, cardHeight, "F");

        doc.setDrawColor(borderTheme[0], borderTheme[1], borderTheme[2]);
        doc.rect(cx, y, cardWidth, cardHeight, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(card.label, cx + 5, y + 5.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(card.val, cx + 5, y + 13.5);
      });

      // Section 3: Subject splits
      y += 28;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("3. SUBJECT PERFORMANCE SPLITS", 15, y);

      y += 4;
      doc.line(15, y, 195, y);

      y += 4;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, y, 180, 8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Subject Area", 18, y + 5.5);
      doc.text("Total Qs", 65, y + 5.5);
      doc.text("Correct", 95, y + 5.5);
      doc.text("Incorrect", 125, y + 5.5);
      doc.text("Skipped", 155, y + 5.5);
      doc.text("Score", 182, y + 5.5);

      const subjects = [Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS];
      subjects.forEach((subj, idx) => {
        const rowY = y + 8 + (idx * 8);
        const counts = analytics.subjectCounts[subj];
        const score = analytics.subjectScores[subj];

        if (idx % 2 === 0) {
          doc.setFillColor(241, 245, 249);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(15, rowY, 180, 8, "F");
        doc.setDrawColor(borderTheme[0], borderTheme[1], borderTheme[2]);
        doc.rect(15, rowY, 180, 8, "S");

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text(subj, 18, rowY + 5.5);

        doc.setFont("helvetica", "normal");
        doc.text(String(counts.total), 65, rowY + 5.5);
        doc.text(String(counts.correct), 95, rowY + 5.5);
        doc.text(String(counts.incorrect), 125, rowY + 5.5);
        doc.text(String(counts.unattempted), 155, rowY + 5.5);

        doc.setFont("helvetica", "bold");
        doc.text(score >= 0 ? `+${score}` : `${score}`, 182, rowY + 5.5);
      });

      // Section 4: Recommendation
      y += 40;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("4. ACADEMIC ADVISORY & REVISION STRATEGY", 15, y);

      y += 4;
      doc.line(15, y, 195, y);

      y += 4;
      doc.setFillColor(254, 243, 199);
      doc.rect(15, y, 180, 24, "F");
      doc.setDrawColor(245, 158, 11);
      doc.rect(15, y, 180, 24, "S");

      doc.setTextColor(146, 64, 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("SIMULATOR STRATEGY ADVISOR FEEDBACK:", 18, y + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 53, 4);

      let recommendation = "";
      if (analytics.accuracy >= 85) {
        recommendation = "Excellent precision! You are maintaining a highly stable correct-to-attempted coefficient. Concentrate fully on minimizing silly numerical slips in NAT Section B questions. Revise high-scoring areas in chemistry regularly to lock down a 99.8+ percentile easily.";
      } else if (analytics.accuracy >= 65) {
        recommendation = "Moderate precision observed. Your scoring index can improve drastically by strictly avoiding wild guesses on doubtful MCQs (-1 penalties add up quickly!). Focus your next 3 days on formula testing exercises in Coordinate Geometry and Ionic Equilibrium.";
      } else {
        recommendation = "Critical accuracy threshold alert! You are currently losing significant scoring weight due to incorrect guesswork. Limit yourself to only 100% verified question keys during mock rounds. Re-examine standard NCERT exemplars to solve fundamental gaps.";
      }

      const wrappedRec = doc.splitTextToSize(recommendation, 172);
      doc.text(wrappedRec, 18, y + 10.5);

      // Sign-off section
      y += 34;
      doc.setDrawColor(borderTheme[0], borderTheme[1], borderTheme[2]);
      doc.line(15, y, 195, y);

      y += 8;
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("This report is digitally rendered based on mock responses calculated inside the client environment.", 15, y);
      doc.text("All score formulas and timing metrics match June 2026 guidelines.", 15, y + 3.5);

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

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Page 1 of 1", 105, 285, { align: "center" });

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
        const qCleanLabel = `Q${index + 1}. [Subject: ${q.subject} | Mode: ${q.difficulty}] - Topic Area: ${q.topic}`;
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

        if (isAnswered && userReply) {
          const isCorrect = userReply.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
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

        const explanationTextClean = cleanMathExpressions(q.explanation || "No manual chemical/physical guidelines supplied. Use core formula rules to compute the parameters.");
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
        doc.text(`Official Solution Key: Option ${String(q.correctAnswer).toUpperCase()}`, 125, y + 4);

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
    <div className="max-w-6xl mx-auto py-10 px-4 select-text">
      {/* -------------------- HEADLINE CARD -------------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-xl mb-6 select-none animate-fade-in relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="text-center md:text-left leading-tight">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded-full mb-3 shadow shadow-indigo-900 border border-indigo-500/20">
            <Award size={12} />
            <span>EXAMINATION EVALUATED STATUS: COMMITTED</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Performance Analytics Portfolio</h1>
          <p className="text-xs text-indigo-200 mt-2 max-w-xl">
            Derived using standard mock parameters from Allen Institutes and MathonGo scoring curves, featuring detailed conceptual tags, timing matrices, and LaTeX models.
          </p>
        </div>

        <button
          onClick={onRestart}
          className="mt-6 md:mt-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-900/45 select-none"
        >
          <Home size={14} />
          <span>Test Another Paper</span>
        </button>
      </div>

      {/* -------------------- PORTABLE PDF DOWNLOAD CENTER -------------------- */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-10 flex flex-col lg:flex-row items-center justify-between gap-4 select-none animate-fade-in">
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-950/20 border border-indigo-750">
            <FileText size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-heading font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <span>Portable PDF Export Terminal</span>
              <span className="bg-indigo-200/60 text-indigo-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">June 2026 Ready</span>
            </h3>
            <p className="text-[11px] text-slate-505 mt-0.5 max-w-xl">
              Securely download offline scorecards & full solution papers with LaTeX clean step formulas to solve, revise and study anytime!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 w-full lg:w-auto">
          <button
            type="button"
            disabled={isDownloadingScorecard}
            onClick={downloadScorecard}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-400 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm min-w-[160px]"
          >
            {isDownloadingScorecard ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>My Report PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isDownloadingSolutions}
            onClick={downloadSolvedPaper}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-555 disabled:bg-indigo-400 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md shadow-indigo-950/10 min-w-[190px]"
          >
            {isDownloadingSolutions ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Compiling Book...</span>
              </>
            ) : (
              <>
                <BookOpen size={13} />
                <span>Full Solutions PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* -------------------- MULTI KEY METRICS CARD (BENTO BOX) -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* TOTAL SCORE CARD */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-inner border border-orange-100">
            <Award size={22} />
          </div>
          <div className="leading-tight text-left">
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Exam Raw Score</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
              {analytics.totalScore} <span className="text-xs text-slate-400 font-bold">/ {analytics.maxScore}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {analytics.subjectCounts[Subject.PHYSICS].correct +
                analytics.subjectCounts[Subject.CHEMISTRY].correct +
                analytics.subjectCounts[Subject.MATHEMATICS].correct} Corrects total
            </div>
          </div>
        </div>

        {/* ACCURACY CARD */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner border border-blue-100">
            <Target size={22} />
          </div>
          <div className="leading-tight text-left">
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Precision Accuracy</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{analytics.accuracy}%</div>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${analytics.accuracy}%` }} />
            </div>
          </div>
        </div>

        {/* TOTAL TIME TAKEN */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-inner border border-purple-100">
            <Timer size={22} />
          </div>
          <div className="leading-tight text-left">
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Time Spent</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">{formatSpentTime(totalTestTimeSpent)}</div>
            <div className="text-[10px] text-slate-500 mt-1">
              Avg. Time / Question: {formatSpentTime(Math.round(totalTestTimeSpent / (questions.length || 1)))}
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- SUBJECT-WISE SPLIT ANALYSIS -------------------- */}
      <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest border-b pb-2 mb-6 text-left select-none">
        Subject Performance Breakdown
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
        {[Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS].map((subject) => {
          const score = analytics.subjectScores[subject];
          const counts = analytics.subjectCounts[subject];
          const time = analytics.timeDistribution[subject];
          const percentage = counts.total > 0 ? Math.round((counts.correct / counts.total) * 100) : 0;

          return (
            <div key={subject} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
              {/* Card Header */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center select-none">
                <span className="font-bold text-[13px] text-slate-700 uppercase tracking-wide">{subject}</span>
                <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Score: {score}
                </span>
              </div>

              {/* Stats Block */}
              <div className="p-5 flex-1">
                <div className="grid grid-cols-3 gap-2 text-center select-none mb-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-2 rounded">
                    <div className="text-[10px] font-bold text-emerald-600 uppercase">Correct</div>
                    <div className="text-base font-black text-emerald-700 mt-0.5">{counts.correct}</div>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 p-2 rounded">
                    <div className="text-[10px] font-bold text-rose-600 uppercase">Wrong</div>
                    <div className="text-base font-black text-rose-700 mt-0.5">{counts.incorrect}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-150 p-2 rounded">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Skipped</div>
                    <div className="text-base font-black text-slate-600 mt-0.5">{counts.unattempted}</div>
                  </div>
                </div>

                {/* Accuracy progress bar */}
                <div className="space-y-1 select-none">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                    <span>Subject Accuracy</span>
                    <span className="text-slate-600">{percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              </div>

              {/* Time Indicator Footer */}
              <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase select-none">
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  <span>Time Invested:</span>
                </div>
                <span className="font-mono text-slate-700">{formatSpentTime(time)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* -------------------- DETAIL REPORT GRAPHS AND DIAGNOSTICS (Bento Rows) -------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 text-left">
        {/* TOPIC-WISE ACCURACY BREAKDOWN */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-black text-slate-800 text-sm mb-4 uppercase tracking-wider select-none flex items-center gap-2">
            <BookOpen size={16} className="text-blue-600" />
            <span>Conceptual Topic Accuracy (allen metrics)</span>
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {Object.keys(analytics.topicPerformance).length === 0 ? (
              <div className="text-xs text-slate-400 italic">No topic tags evaluated.</div>
            ) : (
              Object.entries(analytics.topicPerformance).map(([topic, rawData]) => {
                const data = rawData as { total: number; correct: number; incorrect: number; unattempted: number };
                const totalAttempted = data.total - data.unattempted;
                const topicAccuracy = totalAttempted > 0 ? Math.round((data.correct / totalAttempted) * 100) : 0;
                
                return (
                  <div key={topic} className="space-y-1 select-text">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{topic}</span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        ({data.correct}/{data.total} correct, {topicAccuracy}% acc)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          topicAccuracy >= 75 ? "bg-emerald-500" :
                          topicAccuracy >= 45 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${topicAccuracy}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COGNITIVE DIFFICULTY DIAGNOSTICS */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-800 text-sm mb-4 uppercase tracking-wider select-none flex items-center gap-2">
              <Tag size={16} className="text-blue-600" />
              <span>Cognitive Difficulty Level Metrics</span>
            </h3>
            
            <div className="space-y-5 select-none">
              {["Easy", "Medium", "Hard"].map((lvl) => {
                const data = analytics.difficultyPerformance[lvl as "Easy" | "Medium" | "Hard"];
                const correctCount = data.correct;
                const totalCount = data.total;
                const difficultyAccuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

                return (
                  <div key={lvl} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span className={`${
                        lvl === "Easy" ? "text-emerald-600" :
                        lvl === "Medium" ? "text-amber-600" : "text-rose-600"
                      }`}>{lvl} Questions</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        Accuracy: {difficultyAccuracy}% ({correctCount}/{totalCount})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          lvl === "Easy" ? "bg-emerald-500" :
                          lvl === "Medium" ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${difficultyAccuracy}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 bg-slate-50 border border-slate-150 p-3 rounded-lg text-xs leading-relaxed text-slate-500 select-text">
            <span>⏱️ <strong>Time Control Diagnostic:</strong> </span>
            <span>
              You spent over 3 minutes on <strong>{analytics.overtimeQuestions.length} questions</strong>. In a JEE Main examination, maintaining a budget of 2 minutes per question is key to avoiding final segment pressure.
            </span>
          </div>
        </div>
      </div>

      {/* -------------------- STEP-BY-STEP REVIEW WORKSPACE -------------------- */}
      <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest border-b pb-2 mb-6 text-left select-none">
        Question Review & Step Solutions
      </h2>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-2.5 items-center mb-6 text-left select-none bg-slate-100 p-3 rounded-lg border border-slate-200">
        <span className="text-[10px] font-extrabold uppercase text-slate-500 font-sans mr-2">Filters:</span>
        
        {/* Subject Filter Tab */}
        <div className="flex gap-1">
          {["All", Subject.PHYSICS, Subject.CHEMISTRY, Subject.MATHEMATICS].map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubjectFilter(sub as any)}
              className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${
                activeSubjectFilter === sub
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-slate-300 mx-1 hidden sm:block" />

        {/* Status Filter Tab */}
        <div className="flex gap-1">
          {["All", "Correct", "Incorrect", "Unattempted"].map((state) => (
            <button
              key={state}
              onClick={() => setActiveStatusFilter(state as any)}
              className={`px-3 py-1 text-xs font-bold rounded cursor-pointer ${
                activeStatusFilter === state
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* QUESTIONS REVIEW FEED */}
      <div className="space-y-6 text-left">
        {filteredQuestionsForReview.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl max-w-md mx-auto text-slate-400 text-xs italic select-none shadow-xs">
            No mock questions matches active search constraints. Adjust your subject filters.
          </div>
        ) : (
          filteredQuestionsForReview.map((q) => {
            const status = questionStatuses[q.id] || QuestionStatus.NOT_VISITED;
            const isAnswered = status === QuestionStatus.ANSWERED || status === QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW;
            const userReply = userResponses[q.id];
            
            let isCorrect = false;
            let responseState: "Correct" | "Incorrect" | "Unattempted" = "Unattempted";

            if (isAnswered && userReply) {
              isCorrect = userReply.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              responseState = isCorrect ? "Correct" : "Incorrect";
            }

            const timeUsed = timeSpent[q.id] || 0;
            const showSolution = showExplanationId === q.id;

            return (
              <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden select-text">
                {/* Header detail */}
                <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex flex-wrap justify-between items-center gap-2 select-none">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                      Q.{q.questionNumber}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {q.subject}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                      {q.topic}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      Time Invested: {formatSpentTime(timeUsed)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      q.difficulty === "Easy" ? "text-emerald-600 bg-emerald-50" :
                      q.difficulty === "Medium" ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50"
                    }`}>
                      {q.difficulty}
                    </span>
                    
                    {/* Status Badge */}
                    {responseState === "Correct" && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Correct
                      </span>
                    )}
                    {responseState === "Incorrect" && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold flex items-center gap-1">
                        <XCircle size={11} /> Incorrect
                      </span>
                    )}
                    {responseState === "Unattempted" && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[10px] font-bold select-none">
                        Unattempted
                      </span>
                    )}
                  </div>
                </div>

                {/* Content area */}
                <div className="p-5">
                  <div className="leading-relaxed text-[13px] text-slate-800">
                    <MarkdownMath text={q.questionText} />
                  </div>

                  {/* MCQ Options Display */}
                  {q.options && q.options.length > 0 && (
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 pl-3">
                      {q.options.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const isStudentPic = userReply === letter;
                        const isCorrectKey = q.correctAnswer === letter;

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 text-xs rounded-lg border leading-snug flex items-start gap-4 ${
                              isCorrectKey 
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900" 
                                : isStudentPic
                                ? "bg-rose-50 border-rose-300 text-rose-900"
                                : "bg-slate-50/50 border-slate-200 text-slate-600"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 border select-none ${
                              isCorrectKey
                                ? "bg-emerald-500 text-white border-emerald-600"
                                : isStudentPic
                                ? "bg-rose-500 text-white border-rose-600"
                                : "bg-white text-slate-500 border-slate-300"
                            }`}>
                              {letter}
                            </span>
                            <div className="flex-1 mt-0.5">
                              <MarkdownMath text={opt} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Responses Summary */}
                  <div className="mt-5 bg-slate-50 border border-slate-150 p-4 rounded-lg flex flex-wrap gap-x-6 gap-y-3 justify-between items-center text-xs">
                    <div className="flex gap-6 select-text">
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Your Response</span>
                        <span className={`font-bold mt-0.5 block ${
                          responseState === "Correct" ? "text-emerald-700" :
                          responseState === "Incorrect" ? "text-rose-700" : "text-slate-500 italic"
                        }`}>
                          {userReply ? userReply : "No Response Saved"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] block">Correct Key</span>
                        <span className="font-bold text-slate-800 block mt-0.5">
                          {q.correctAnswer}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 select-none">
                      {/* Toggle solution button */}
                      <button
                        onClick={() => setShowExplanationId(showSolution ? null : q.id)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs cursor-pointer transition"
                      >
                        {showSolution ? "Hide Solution" : "View Step-by-Step Solution"}
                      </button>
                    </div>
                  </div>

                  {/* RE-ATTEMPT SECTION (if skipped/incorrect) */}
                  {responseState !== "Correct" && (
                    <div className="mt-4 border border-indigo-100 bg-indigo-50/20 px-4 py-3 rounded-lg">
                      <div className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest mb-2 select-none">
                        🎯 Diagnostic Re-Attempt Box
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
                                className={`px-3 py-1 border text-xs font-bold rounded transition cursor-pointer select-none ${
                                  isSelected
                                    ? isCorrectRe
                                      ? "bg-emerald-600 text-white border-emerald-600"
                                      : "bg-rose-600 text-white border-rose-600"
                                    : hasTried && isCorrectRe
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                                }`}
                              >
                                Try ({letter})
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center max-w-xs">
                          <input
                            type="text"
                            placeholder="Enter new numerical value"
                            value={reattempts[q.id] || ""}
                            onChange={(e) => handleReattempt(q.id, e.target.value)}
                            disabled={!!reattempts[q.id] && reattempts[q.id] === q.correctAnswer}
                            className="bg-white border text-xs px-3 py-1 rounded w-full font-bold outline-hidden"
                          />
                          {(reattempts[q.id] || "") && (
                            <span className={`text-[10px] font-black shrink-0 ${
                              reattempts[q.id]?.trim() === q.correctAnswer ? "text-emerald-600" : "text-rose-500"
                            }`}>
                              {reattempts[q.id]?.trim() === q.correctAnswer ? "✓ Correct!" : "✗ Try again!"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP SOLUTION EXHIBITION */}
                  {showSolution && q.explanation && (
                    <div className="mt-4 p-5 bg-emerald-50/30 border border-emerald-100 rounded-xl leading-relaxed text-slate-700 animate-slide-down">
                      <div className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-widest border-b border-emerald-100 pb-1 mb-3 flex items-center gap-1 select-none">
                        <span>📖</span>
                        <span>Official Step-by-Step Model Answer</span>
                      </div>
                      <div className="text-[13px] text-slate-800 select-text">
                        <MarkdownMath text={q.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
export default AnalyticsDashboard;
