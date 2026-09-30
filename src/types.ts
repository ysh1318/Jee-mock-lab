/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Subject {
  PHYSICS = "Physics",
  CHEMISTRY = "Chemistry",
  MATHEMATICS = "Mathematics"
}

export enum Section {
  A = "Section A", // MCQ (Single Choice Object)
  B = "Section B"  // NAT (Numerical Answer Type)
}

export enum QuestionStatus {
  NOT_VISITED = "NOT_VISITED",
  NOT_ANSWERED = "NOT_ANSWERED",
  ANSWERED = "ANSWERED",
  MARKED_FOR_REVIEW = "MARKED_FOR_REVIEW",
  ANSWERED_AND_MARKED_FOR_REVIEW = "ANSWERED_AND_MARKED_FOR_REVIEW"
}

export interface Question {
  id: string; // e.g., "P-01", "M-15", etc.
  subject: Subject;
  section: Section;
  questionNumber: number; // 1 to 30
  questionText: string;
  options?: string[]; // exactly 4 for Section A, empty/undefined for Section B
  correctAnswer: string; // "A" | "B" | "C" | "D" or number value e.g., "5" or "12.5"
  topic: string; // e.g., "Electrostatics", "Thermodynamics", "Quadratic Equations"
  difficulty: "Easy" | "Medium" | "Hard";
  explanation?: string; // step-by-step resolution of question
  isOfflineFallback?: boolean; // indicator if generated via server-side offline presets
}

export interface TestState {
  questions: Question[];
  userResponses: Record<string, string>; // questionId -> response
  questionStatuses: Record<string, QuestionStatus>; // questionId -> status
  timeSpent: Record<string, number>; // questionId -> seconds spent
  timeLeft: number; // in seconds
  isCompleted: boolean;
  testName: string;
}

export interface AnalyticsSummary {
  totalScore: number;
  maxScore: number;
  subjectScores: Record<Subject, number>;
  subjectCounts: Record<Subject, { total: number; correct: number; incorrect: number; unattempted: number }>;
  accuracy: number;
  timeDistribution: Record<Subject, number>; // total seconds spent in each subject
  difficultyPerformance: Record<"Easy" | "Medium" | "Hard", { total: number; correct: number; incorrect: number; score: number }>;
  topicPerformance: Record<string, { total: number; correct: number; incorrect: number; unattempted: number }>;
  overtimeQuestions: string[]; // question ids where spent > 180s
}

export interface UserProfile {
  category: "General" | "OBC_NCL" | "SC" | "ST" | "EWS";
  homeState: string;
  gender: "Neutral" | "Female";
  targetPercentile: number;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  credits: number;
  customApiKey?: string;
  role: "user" | "admin";
  banned?: boolean;
  suspendedUntil?: string;
  suspensionReason?: string;
  deviceId?: string;
  messages?: UserMessage[];
  createdAt: string;
}

export interface UserMessage {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface PurchaseRequest {
  id: string;
  userId: string;
  userEmail: string;
  pack: string;
  amount: number;
  utrNumber: string;
  status: "pending" | "verifying" | "approved" | "declined";
  purchaseDate: string;
  expiresAt: string;
  approvedAt?: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "signup_bonus" | "purchase_grant" | "pdf_parse_burn" | "admin_adjustment" | "admin_bulk";
  description: string;
  createdAt: string;
}


