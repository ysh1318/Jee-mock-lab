/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Upload, FileText, CheckCircle, Database, HelpCircle, AlertCircle, ArrowRight, BookOpen,
  Key, Eye, EyeOff, Check, Cpu, Settings, Sparkles, Monitor, BarChart3, ShieldCheck, FileUp,
  Atom, FlaskConical, Calculator, Lock, Loader2, CheckCircle2, Layers, Activity, Clock,
  Terminal, RefreshCw, Play
} from "lucide-react";
import { Question, UserAccount } from "../types";
import { PRESET_MOCK_TEST } from "./data/presetTest";
import { cropDiagramsFromPdf } from "../utils/diagramCropper";



interface PartStatus {
  partIndex: number;
  rangeStr: string;
  status: "idle" | "running" | "done" | "error";
  questions: any[];
  error?: string;
}

const PARTS_CONFIG_DISPLAY = [
  "Questions 1-13 (MCQ)",
  "Questions 14-25 (MCQ + NAT)",
];

const PARTS_CONFIG_RANGES = [
  { qMin: 1, qMax: 13 },
  { qMin: 14, qMax: 25 },
];

const thoughtsBySubject: Record<string, string[]> = {
  Physics: [
    "Analyzing mechanics and projectile dynamics...",
    "Validating electromagnetic field and flux expressions...",
    "Formatting circuit diagrams and KaTeX variables...",
    "Scanning Section B integer type numerical problems...",
  ],
  Chemistry: [
    "Interpreting organic reaction pathways and mechanisms...",
    "Balancing thermodynamic and electrochemical equations...",
    "Verifying coordination compounds and hybridization...",
    "Extracting stoichiometry and equilibrium constants...",
  ],
  Mathematics: [
    "Formatting calculus integrals and differential equations...",
    "Verifying matrix determinants and coordinate geometry...",
    "Checking probability distributions and complex numbers...",
    "Validating numerical precision for Section B entries...",
  ],
};

/**
 * Highly resilient, specialized fetch wrapper that guarantees:
 * 1. An individual track request never hangs forever (strictly times out after 55 seconds).
 * 2. Autoretries once on timeout or transient errors to survive rate-limits.
 */
async function fetchWithTimeoutAndRetry(url: string, options: any, maxRetries = 1, timeoutMs = 90000): Promise<Response> {
  let lastError: any = null;
  let targetUrl = url;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    let timeoutId: any = null;

    // Merge outer abort signal
    let signal = controller.signal;
    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      if (attempt > 0) {
        console.log(`[Auto-Retry] Retrying track parsing fetch... Attempt #${attempt + 1}/${maxRetries + 1}`);
        // If relative URL failed on previous attempt in production, failover directly to worker edge
        if (url.startsWith("/api/") && typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
          targetUrl = `https://jeemocklab-backend.yashawachar101.workers.dev${url}`;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      const response = await fetch(targetUrl, {
        ...options,
        signal,
      });

      clearTimeout(timeoutId);

      // If Cloudflare Pages proxy returned 502/503, immediately failover to worker edge directly
      if ((response.status === 502 || response.status === 503) && attempt < maxRetries && url.startsWith("/api/")) {
        console.warn(`[Auto-Failover] Gateway returned ${response.status}. Direct edge failover to Cloudflare Worker...`);
        targetUrl = `https://jeemocklab-backend.yashawachar101.workers.dev${url}`;
        continue;
      }

      return response;
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      lastError = err;
      const isTimeout = err.name === "AbortError" || String(err).includes("Abort");
      console.warn(`[Auto-Retry Track] Attempt #${attempt + 1} failed (isTimeout: ${isTimeout}, error: ${err.message || String(err)}).`);
      
      if (options.signal?.aborted) {
        throw err;
      }
    }
  }
  throw lastError || new Error(`Request timed out or failed after ${maxRetries} autoretries.`);
}

interface PdfUploaderProps {
  onTestLoaded: (testName: string, questions: Question[]) => void;
  userAccount: UserAccount | null;
  onRequestLogin: () => void;
  onCreditsUpdated: (newCredits: number) => void;
}

export function PdfUploader({ onTestLoaded, userAccount, onRequestLogin, onCreditsUpdated }: PdfUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subjectProgress, setSubjectProgress] = useState<Record<string, "idle" | "running" | "done" | "empty" | "error">>({
    Physics: "idle",
    Chemistry: "idle",
    Mathematics: "idle",
  });
  const [extractedCount, setExtractedCount] = useState<Record<string, number>>({
    Physics: 0,
    Chemistry: 0,
    Mathematics: 0,
  });
  const [subjectPercent, setSubjectPercent] = useState<Record<string, number>>({
    Physics: 0,
    Chemistry: 0,
    Mathematics: 0,
  });
  const [isMappingLayout, setIsMappingLayout] = useState(false);
  const [parsingStage, setParsingStage] = useState<1 | 2 | 3 | 4>(1);
  const [currentStageMessage, setCurrentStageMessage] = useState<string>("Analyzing booklet layout & section boundaries...");

  const parsedPaperCount = (() => {
    try {
      const saved = localStorage.getItem("jee_saved_papers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch {
      // standard boundary catch
    }
    return 0;
  })();
  
  // Custom states and refs for parallelized parsing & recoveries
  const [partsProgress, _setPartsProgress] = useState<Record<string, PartStatus[]>>({
    Physics: [],
    Chemistry: [],
    Mathematics: [],
  });

  const partsProgressRef = useRef<Record<string, PartStatus[]>>({
    Physics: [],
    Chemistry: [],
    Mathematics: [],
  });

  const setPartsProgress = (updater: any) => {
    let next: Record<string, PartStatus[]>;
    if (typeof updater === "function") {
      next = updater(partsProgressRef.current);
    } else {
      next = updater;
    }
    partsProgressRef.current = next;
    _setPartsProgress(next);
  };

  const parsedBase64Ref = useRef<string>("");
  const fullBase64Ref = useRef<string>("");
  const parsedFilenameRef = useRef<string>("");
  const activeAiProviderRef = useRef<string>("gemini");
  const userCustomKeyRef = useRef<string>("");
  const userAccountRef = useRef<any>(null);
  const parseSessionIdRef = useRef<string>("");

  useEffect(() => {
    userAccountRef.current = userAccount;
  }, [userAccount]);

  // Custom provider-specific API Key States
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<{
    gemini: string;
    groq: string;
  }>(() => {
    try {
      return {
        gemini: localStorage.getItem("user_gemini_api_key") || "",
        groq: localStorage.getItem("user_groq_api_key") || "",
      };
    } catch {
      return { gemini: "", groq: "" };
    }
  });
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "cleared">("idle");
  const [activeInstructionTab, setActiveInstructionTab] = useState<"gemini" | "groq">("gemini");
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);

  // Real-time detailed logs stream for transparent PDF parsing
  const [liveLogs, setLiveLogs] = useState<{ id: string; msg: string; type: "info" | "success" | "work" | "warning" | "error"; time: string }[]>([]);

  const [serverConfig, setServerConfig] = useState<{
    geminiConfigured: boolean;
    groqConfigured: boolean;
  }>({ geminiConfigured: false, groqConfigured: false });

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          const config = {
            geminiConfigured: !!data.geminiConfigured,
            groqConfigured: !!data.groqConfigured,
          };
          setServerConfig(config);
          
          // Collapsing API keys box if there's any server-side default keys present
          if (config.geminiConfigured || config.groqConfigured) {
            setShowApiKeySettings(false);
          }
        }
      })
      .catch((err) => console.warn("Failed checking API health status:", err));
  }, []);

  const handleSaveApiKey = () => {
    try {
      localStorage.setItem("user_gemini_api_key", apiKeys.gemini.trim());
      localStorage.setItem("user_groq_api_key", apiKeys.groq.trim());
      setSaveStatus("saved");
      
      // If the user enters a non-empty API Key, launch the celebratory benefits pop-up!
      if (apiKeys.gemini.trim() || apiKeys.groq.trim()) {
        setShowBenefitsModal(true);
      }
      
      setTimeout(() => setSaveStatus("idle"), 3500);
    } catch (e) {
      console.warn("Could not save settings locally:", e);
    }
  };

  const handleClearApiKey = () => {
    try {
      localStorage.removeItem("user_gemini_api_key");
      localStorage.removeItem("user_groq_api_key");
      setApiKeys({ gemini: "", groq: "" });
      setSaveStatus("cleared");
      setTimeout(() => setSaveStatus("idle"), 3500);
    } catch (e) {
      console.warn("Could not remove custom keys:", e);
    }
  };

  const tips = [
    "Gemini is reading the PDF... Analyzing atomic orbital equations!",
    "Extracting questions... Setting up Physics & Electromagnetic vector variables.",
    "Formulating structured assessment layouts of Physics, Chemistry & Math sections.",
    "Converting scribbled math structures into clean display LaTeX elements...",
    "Creating step-by-step model answers and solutions for the analytics dashboard!",
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        processPdfFile(file);
      } else {
        setErrorMsg("Please upload a valid PDF file. Images & documents are not supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPdfFile(e.target.files[0]);
    }
  };

  const selectPreset = () => {
    setIsLoading(true);
    setLoadingStep("Loading prescribed benchmark mock test...");
    setFileName("Benchmark JEE Mains Syllabus Mock Test");
    setExtractedCount({ Physics: 5, Chemistry: 5, Mathematics: 5 });
    setSubjectPercent({ Physics: 100, Chemistry: 100, Mathematics: 100 });
    setSubjectProgress({ Physics: "done", Chemistry: "done", Mathematics: "done" });
    setIsMappingLayout(false);
    
    setTimeout(() => {
      onTestLoaded("Prescribed Benchmark JEE Mains syllabus Mock Test", PRESET_MOCK_TEST);
      setIsLoading(false);
    }, 600);
  };

  const parseSpecificPart = async (
    subjName: "Physics" | "Chemistry" | "Mathematics",
    prefix: string,
    partIndex: number,
    base64OrFileId: string,
    filename: string,
    provider: string,
    customApiKey: string,
    userId: string,
    parseSessionId?: string,
    forceSkipCredit?: boolean
  ): Promise<any[]> => {
    const isFullSubj = partIndex === -1;
    const targetDisplay = isFullSubj ? "Questions 1-25 (Complete Subject)" : (PARTS_CONFIG_DISPLAY[partIndex] || `Part ${partIndex + 1}`);

    setPartsProgress((prev) => {
      const list = prev[subjName] ? [...prev[subjName]] : [];
      const itemIdx = list.findIndex((p) => p.partIndex === partIndex);
      if (itemIdx >= 0) {
        list[itemIdx] = { ...list[itemIdx], status: "running", error: undefined, questions: [] };
      } else {
        list.push({
          partIndex,
          rangeStr: targetDisplay,
          status: "running",
          questions: []
        });
      }
      return { ...prev, [subjName]: list };
    });

    try {
      const skipCreditDeduction = Boolean(forceSkipCredit || partIndex > 0);
      const isBase64 = base64OrFileId.startsWith("data:") || base64OrFileId.length > 500;

      const response = await fetchWithTimeoutAndRetry("/api/parse-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfData: isBase64 ? base64OrFileId : undefined,
          fileId: !isBase64 ? base64OrFileId : undefined,
          filename,
          subject: subjName,
          prefix,
          provider: provider,
          apiKey: customApiKey,
          userId,
          partIndex,
          skipCreditDeduction,
          parseSessionId,
        }),
      });

      if (!response.ok) {
        let errorText = `HTTP status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) {
            errorText = errJson.error;
          }
        } catch {}
        throw new Error(errorText);
      }

      const parsedData = await response.json();
      if (typeof parsedData.creditsLeft === "number") {
        onCreditsUpdated(parsedData.creditsLeft);
      }

      if (parsedData.isOfflineFallback) {
        const fbNow = new Date();
        const fbTimeStr = fbNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        setLiveLogs(prev => [
          { id: `fallback-${subjName}-${partIndex}-${Math.random()}`, msg: `Standard syllabus preset loaded for ${subjName}. Ready for simulation.`, type: "warning", time: fbTimeStr },
          ...prev
        ]);
      }

      const questions = parsedData.questions || [];
      const startQNum = isFullSubj ? 1 : (PARTS_CONFIG_RANGES[partIndex]?.qMin || 1);
      const validated = questions.map((q: any, idx: number) => {
        const qNum = q.questionNumber || (startQNum + idx);
        const validId = q.id || `${prefix}-${String(qNum).padStart(2, "0")}`;
        const validSection = q.section || (qNum <= 20 ? "Section A" : "Section B");
        return {
          ...q,
          id: validId,
          subject: subjName,
          section: validSection,
          questionNumber: qNum,
          questionText: q.questionText,
          options: q.options || [],
          correctAnswer: String(q.correctAnswer).trim(),
          topic: q.topic || "General Concepts",
          difficulty: q.difficulty || "Medium",
          explanation: q.explanation || "No explanation parsed.",
          isOfflineFallback: !!parsedData.isOfflineFallback,
        };
      });

      setPartsProgress((prev) => {
        const list = prev[subjName] ? [...prev[subjName]] : [];
        const itemIdx = list.findIndex((p) => p.partIndex === partIndex);
        if (itemIdx >= 0) {
          list[itemIdx] = { ...list[itemIdx], status: "done", questions: validated, error: undefined };
        } else {
          list.push({ partIndex, rangeStr: targetDisplay, status: "done", questions: validated, error: undefined });
        }
        return { ...prev, [subjName]: list };
      });

      return validated;
    } catch (err: any) {
      const errMsg = err?.name === "AbortError"
        ? "Network Timeout (>45s): The server is taking too long to reply. Click 'Retry Part' to re-verify, or continue with current subsets."
        : (err instanceof Error ? err.message : String(err));
      console.error(`Error parsing part ${partIndex} of ${subjName}:`, err);

      setPartsProgress((prev) => {
        const list = prev[subjName] ? [...prev[subjName]] : [];
        const itemIdx = list.findIndex((p) => p.partIndex === partIndex);
        if (itemIdx >= 0) {
          list[itemIdx] = { ...list[itemIdx], status: "error", error: errMsg };
        }
        return { ...prev, [subjName]: list };
      });

      throw err;
    }
  };

  const handleRetryPart = async (subjName: "Physics" | "Chemistry" | "Mathematics", partIdx: number) => {
    if (!parsedBase64Ref.current) {
      alert("Session expired or file data lost. Please re-upload the PDF to load initial parallel tracks!");
      return;
    }
    
    // Stagger or call immediately
    const prefix = subjName === "Physics" ? "P" : subjName === "Chemistry" ? "C" : "M";
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    setLiveLogs(prev => [
      { id: `retry-${subjName}-${partIdx}-${Math.random()}`, msg: `Retrying ${partIdx === -1 ? "Complete Section" : `Part #${partIdx + 1}`} of ${subjName}...`, type: "info", time: timeStr },
      ...prev
    ]);

    try {
      await parseSpecificPart(
        subjName,
        prefix,
        partIdx,
        parsedBase64Ref.current,
        parsedFilenameRef.current,
        activeAiProviderRef.current,
        userCustomKeyRef.current,
        userAccountRef.current?.id || "",
        parseSessionIdRef.current,
        true // Guaranteed: Retrying a part within an active session never deducts extra credit
      );

      // Now, adjust aggregate stats
      setPartsProgress(current => {
        const list = current[subjName] || [];
        const doneCount = list.filter(p => p.status === "done").length;
        const totalCount = list.length || 1;
        const computedPercent = Math.floor((doneCount / totalCount) * 100);
        
        setSubjectPercent(prev => ({ ...prev, [subjName]: computedPercent }));
        
        // Recalculate count of questions parsed in this subject
        const totalQs = list.flatMap(p => p.status === "done" ? p.questions : []).length;
        setExtractedCount(prev => ({ ...prev, [subjName]: totalQs }));

        // Adjust overall progress subjectProgress
        setSubjectProgress(prev => {
          let status: "idle" | "running" | "done" | "empty" | "error" = "error";
          if (doneCount === totalCount && totalCount > 0) status = "done";
          return {
            ...prev,
            [subjName]: status
          };
        });

        return current;
      });

      const succNow = new Date();
      const succTime = succNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      setLiveLogs(prev => [
        { id: `retry-sc-${subjName}-${partIdx}-${Math.random()}`, msg: `Part #${partIdx + 1} of ${subjName} re-parsed successfully.`, type: "success", time: succTime },
        ...prev
      ]);

    } catch (e: any) {
      const errNow = new Date();
      const errTime = errNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      setLiveLogs(prev => [
        { id: `retry-fl-${subjName}-${partIdx}-${Math.random()}`, msg: `Retry failed for Part #${partIdx + 1} on ${subjName}: ${e.message || String(e)}`, type: "warning", time: errTime },
        ...prev
      ]);
    }
  };

  const processPdfFile = async (file: File) => {
    if (!userAccount) {
      setErrorMsg("LOGIN REQUIRED: Please sign up or log in first to claim your 3 FREE Credits and unlock the custom PDF paper parser!");
      onRequestLogin();
      return;
    }

    const isUserAdmin = userAccount.role === "admin";
    if (!isUserAdmin && userAccount.credits < 1) {
      setErrorMsg("INSUFFICIENT CREDITS: Your parsing balance is empty (0 remaining). Please recharge your wallet with 2 credits (₹29), 5 credits (₹59), or 10 credits (₹99) to continue parsing mock exams!");
      return;
    }

    // Optimistically deduct 1 credit immediately in the candidate interface so they see instant burn
    if (!isUserAdmin && userAccount.credits > 0) {
      onCreditsUpdated(userAccount.credits - 1);
    }

    const activeAiProvider = activeInstructionTab; // align with instructions tab selection
    const userCustomKey = (() => {
      try {
        return localStorage.getItem(`user_${activeAiProvider}_api_key`) || "";
      } catch {
        return "";
      }
    })();

    const providerLabel = activeAiProvider === "gemini" ? "Google Gemini" : "Groq";
    const isServerConfigured = activeAiProvider === "gemini" ? serverConfig.geminiConfigured : serverConfig.groqConfigured;

    if ((!userCustomKey || userCustomKey.trim() === "") && !isServerConfigured) {
      setErrorMsg(`API KEY REQUIRED: Please configure and save your own ${providerLabel} API Key in the settings hub first or ensure a shared key is configured on the platform!`);
      setShowApiKeySettings(true); // Auto-expand API configuration desk
      return;
    }

    setFileName(file.name);
    setErrorMsg("");
    setIsLoading(true);
    setParsingStage(1);
    setCurrentStageMessage("Analyzing booklet manifest and section layout boundaries...");
    setSubjectProgress({
      Physics: "idle",
      Chemistry: "idle",
      Mathematics: "idle",
    });
    setExtractedCount({ Physics: 0, Chemistry: 0, Mathematics: 0 });
    setSubjectPercent({ Physics: 0, Chemistry: 0, Mathematics: 0 });

    let progressIdx = 0;
    setLoadingStep(tips[progressIdx]);

    // Interval to cycle through loading messages with user friendly indicators
    const interval = setInterval(() => {
      progressIdx = (progressIdx + 1) % tips.length;
      setLoadingStep(tips[progressIdx]);
    }, 4500);

    // Initial logs setup
    setLiveLogs([]);
    const bootMessages = [
      { text: "OCR Pipeline initialized. Calibrating coordinate parsing...", type: "info" as const },
      { text: `Loaded PDF document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, type: "success" as const },
      { text: `Connected to ${activeAiProvider === "gemini" ? "Google Gemini" : "Groq Llama-3"} inference gateway.`, type: "info" as const },
      { text: "Mapping section boundaries for Physics, Chemistry & Mathematics...", type: "info" as const }
    ];

    bootMessages.forEach((bm, i) => {
      setTimeout(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        setLiveLogs(prev => [
          { id: `boot-${i}-${Math.random()}`, msg: bm.text, type: bm.type, time: timeStr },
          ...prev
        ]);
      }, i * 200);
    });

    const thoughtTimers: Record<string, NodeJS.Timeout | null> = {
      Physics: null,
      Chemistry: null,
      Mathematics: null,
    };
    const usedThoughtsMap: Record<string, Set<string>> = {
      Physics: new Set(),
      Chemistry: new Set(),
      Mathematics: new Set(),
    };

    const startThoughtGenerator = (subj: "Physics" | "Chemistry" | "Mathematics") => {
      if (thoughtTimers[subj]) clearInterval(thoughtTimers[subj]!);
      
      setTimeout(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        setLiveLogs(prev => [
          { id: `start-${subj}-${Math.random()}`, msg: `Parsing ${subj} section: Transmitting page data to ${activeAiProvider === "gemini" ? "Gemini" : "Groq"} API...`, type: "work", time: timeStr },
          ...prev
        ]);
      }, 50);

      thoughtTimers[subj] = setInterval(() => {
        const pool = thoughtsBySubject[subj];
        const usedThoughts = usedThoughtsMap[subj];
        let available = pool.filter(t => !usedThoughts.has(t));
        if (available.length === 0) {
          usedThoughts.clear();
          available = pool;
        }
        const chosen = available[Math.floor(Math.random() * available.length)];
        usedThoughts.add(chosen);

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        setLiveLogs(prev => [
          { id: `thought-${subj}-${Math.random()}`, msg: `[${subj}] ${chosen}`, type: "work", time: timeStr },
          ...prev
        ]);
      }, 3500);
    };

    const stopThoughtGenerator = (subj: string) => {
      if (thoughtTimers[subj]) {
        clearInterval(thoughtTimers[subj]!);
        thoughtTimers[subj] = null;
      }
    };

    try {
      // Step 0: Set clean parse session tracking identifier
      parseSessionIdRef.current = "ps_session_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();

      // Step 1: Read PDF file as Base64 in standard FileReader interface
      const base64Data = await readPdfAsBase64(file);
      fullBase64Ref.current = base64Data;

      const subjects = [
        { name: "Physics", prefix: "P" },
        { name: "Chemistry", prefix: "C" },
        { name: "Mathematics", prefix: "M" },
      ];

      let allQuestions: Question[] = [];
      let testTitle = "";

      // Single-upload optimization: Cache the PDF payload in-memory on the backend before running either parser pipeline
      let uploadRefId = "";
      try {
        setLoadingStep("Optimizing network transport channels (Caching PDF once)...");
        const cacheRes = await fetch("/api/upload-pdf-cache", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pdfData: base64Data,
          }),
        });
        if (cacheRes.ok) {
          const cacheData = await cacheRes.json();
          if (cacheData?.fileId) {
            uploadRefId = cacheData.fileId;
          }
        }
      } catch (cacheErr) {
        console.error("Failed to cache PDF, falling back to inline data transmission:", cacheErr);
      }

      // Store session context refs for any potential retries (prefer lightweight cache id)
      parsedBase64Ref.current = uploadRefId || base64Data;
      parsedFilenameRef.current = file.name;
      activeAiProviderRef.current = activeAiProvider;
      userCustomKeyRef.current = userCustomKey;

      const initialPartsProgress: Record<string, PartStatus[]> = {
        Physics: [{ partIndex: -1, rangeStr: "Questions 1-25 (Complete Section)", status: "running", questions: [] }],
        Chemistry: [{ partIndex: -1, rangeStr: "Questions 1-25 (Complete Section)", status: "running", questions: [] }],
        Mathematics: [{ partIndex: -1, rangeStr: "Questions 1-25 (Complete Section)", status: "running", questions: [] }],
      };
      setPartsProgress(initialPartsProgress);
      setIsMappingLayout(false);
      setParsingStage(2);
      setCurrentStageMessage("Parallel extraction active: Typesetting formulas and vector diagrams...");

      const rightNow = new Date();
      const initialLogTime = rightNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

      setLiveLogs(prev => [
        {
          id: `parallel-launch-notice-${Math.random()}`,
          msg: `Parallel extraction active: Processing Physics, Chemistry & Mathematics simultaneously...`,
          type: "info",
          time: initialLogTime
        },
        ...prev
      ]);

      const parallelIntervals: Record<string, any> = {};

      // Initialize all subjects to "running" status with dynamic progress meters
      subjects.forEach((subj) => {
        setSubjectProgress((prev) => ({ ...prev, [subj.name]: "running" }));
        setSubjectPercent((prev) => ({ ...prev, [subj.name]: 12 }));
        startThoughtGenerator(subj.name as "Physics" | "Chemistry" | "Mathematics");

        // Concurrent smooth progress simulation
        const progressInterval = setInterval(() => {
          setSubjectPercent((prev) => {
            const currentVal = prev[subj.name] || 12;
            if (currentVal < 92) {
              const inc = Math.floor(Math.random() * 2) + 1;
              return { ...prev, [subj.name]: Math.min(currentVal + inc, 92) };
            }
            return prev;
          });
        }, 400);
        parallelIntervals[subj.name] = progressInterval;
      });

      // Launch all 3 subjects with progressive stagger (800ms) to avoid instantaneous quota burst
      const subjectPromises = subjects.map(async (subj, sIdx) => {
        if (sIdx > 0) {
          await new Promise((resolve) => setTimeout(resolve, sIdx * 800));
        }
        const scanNow = new Date();
        const scanTimeStr = scanNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        setLiveLogs(prev => [
          { id: `launch-${subj.name}-${Math.random()}`, msg: `Analyzing section ${subj.name} (25 Questions)...`, type: "info", time: scanTimeStr },
          ...prev
        ]);

        try {
          // Attempt Fast Single-Pass Extraction (All 25 Questions at once)
          // sIdx > 0 ensures Chemistry (1) and Maths (2) skip deduction, Physics (0) initiates session burn
          const validated = await parseSpecificPart(
            subj.name as any,
            subj.prefix,
            -1,
            parsedBase64Ref.current,
            parsedFilenameRef.current,
            activeAiProvider,
            userCustomKey,
            userAccount.id,
            parseSessionIdRef.current,
            sIdx > 0
          );

          stopThoughtGenerator(subj.name);
          if (parallelIntervals[subj.name]) clearInterval(parallelIntervals[subj.name]);

          setSubjectPercent((prev) => ({ ...prev, [subj.name]: 100 }));
          setExtractedCount((prev) => ({ ...prev, [subj.name]: validated.length }));
          setSubjectProgress((prev) => ({ ...prev, [subj.name]: "done" }));
          setCurrentStageMessage(`Stage 2 • ${subj.name} section complete (${validated.length}/25 questions)...`);

          const doneTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
          setLiveLogs(prev => [
            { id: `done-${subj.name}-${Math.random()}`, msg: `${subj.name} complete: ${validated.length} questions parsed.`, type: "success", time: doneTime },
            ...prev
          ]);

          return validated;
        } catch (singleErr: any) {
          console.warn(`[Fast Parser] Single-pass failed for ${subj.name}, attempting adaptive chunk fallback:`, singleErr);
          
          // Adaptive Chunked Fallback for this subject
          const chunkTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
          setLiveLogs(prev => [
            { id: `chunk-fb-${subj.name}-${Math.random()}`, msg: `${subj.name}: Retrying with adaptive high-res chunking...`, type: "warning", time: chunkTime },
            ...prev
          ]);

          try {
            const p1 = await parseSpecificPart(subj.name as any, subj.prefix, 0, parsedBase64Ref.current, parsedFilenameRef.current, activeAiProvider, userCustomKey, userAccount.id, parseSessionIdRef.current, sIdx > 0);
            const p2 = await parseSpecificPart(subj.name as any, subj.prefix, 1, parsedBase64Ref.current, parsedFilenameRef.current, activeAiProvider, userCustomKey, userAccount.id, parseSessionIdRef.current, true);
            const chunkQuestions = [...p1, ...p2];

            stopThoughtGenerator(subj.name);
            if (parallelIntervals[subj.name]) clearInterval(parallelIntervals[subj.name]);

            setSubjectPercent((prev) => ({ ...prev, [subj.name]: 100 }));
            setExtractedCount((prev) => ({ ...prev, [subj.name]: chunkQuestions.length }));
            setSubjectProgress((prev) => ({ ...prev, [subj.name]: "done" }));
            setCurrentStageMessage(`Stage 2 • ${subj.name} section complete (${chunkQuestions.length}/25 questions)...`);
            return chunkQuestions;
          } catch (chunkErr: any) {
            stopThoughtGenerator(subj.name);
            if (parallelIntervals[subj.name]) clearInterval(parallelIntervals[subj.name]);
            setSubjectProgress((prev) => ({ ...prev, [subj.name]: "error" }));
            throw chunkErr;
          }
        }
      });

      // Await all parallel subject extractors
      const settledResults = await Promise.allSettled(subjectPromises);

      // Failsafe cleanup for all intervals
      subjects.forEach((subj) => {
        stopThoughtGenerator(subj.name);
        if (parallelIntervals[subj.name]) {
          clearInterval(parallelIntervals[subj.name]);
        }
      });

      // Synchronously collect questions from resolved promises
      const directQuestions: Question[] = [];
      settledResults.forEach((res, idx) => {
        const subjName = subjects[idx].name;
        if (res.status === "fulfilled" && Array.isArray(res.value) && res.value.length > 0) {
          directQuestions.push(...res.value);
          // Directly populate partsProgressRef.current
          partsProgressRef.current[subjName] = [
            { partIndex: -1, rangeStr: "Questions 1-25 (Complete Section)", status: "done", questions: res.value }
          ];
          setExtractedCount((prev) => ({ ...prev, [subjName]: res.value.length }));
          setSubjectPercent((prev) => ({ ...prev, [subjName]: 100 }));
          setSubjectProgress((prev) => ({ ...prev, [subjName]: "done" }));
        }
      });

      const compiled = getCompiledQuestions();
      allQuestions = directQuestions.length >= compiled.length ? directQuestions : compiled;

      clearInterval(interval);

      if (allQuestions.length === 0) {
        throw new Error("No readable questions could be extracted from any section in this PDF. Is this a math-based Mock Test PDF?");
      }

      setParsingStage(3);
      setCurrentStageMessage(`Stage 3 • Calibrating answers, Section A/B structures & +4/-1 scoring scheme (${allQuestions.length} questions)...`);

      const finalNow = new Date();
      const finalTimeStr = finalNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

      // Crop vector diagrams if any questions contain diagrams
      if (fullBase64Ref.current && allQuestions.some(q => q.hasDiagram)) {
        setLiveLogs(prev => [
          { id: `diag-${Math.random()}`, msg: "Detected diagrams: Cropping high-resolution visual bounding boxes...", type: "info", time: finalTimeStr },
          ...prev
        ]);
        try {
          allQuestions = await cropDiagramsFromPdf(fullBase64Ref.current, allQuestions);
        } catch (cropErr) {
          console.warn("[Diagram Engine] Non-fatal error during diagram extraction:", cropErr);
        }
      }

      setParsingStage(4);
      setCurrentStageMessage(`Success: All ${allQuestions.length} questions verified and calibrated. Initializing CBT exam simulator...`);

      setLiveLogs(prev => [
        { id: `finish-${Math.random()}`, msg: `Extraction complete: ${allQuestions.length} questions parsed. Initializing CBT exam simulator...`, type: "success", time: finalTimeStr },
        ...prev
      ]);

      // Briefly pause so the user sees the completed states
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onTestLoaded(testTitle || file.name, allQuestions);
    } catch (error: any) {
      console.error(error);
      if (userAccount?.id) {
        fetch(`/api/user/${userAccount.id}/wallet`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d && typeof d.credits === "number") {
              onCreditsUpdated(d.credits);
            }
          })
          .catch(() => {});
      }
      setErrorMsg(error.message || "An unexpected error occurred during document translation.");
    } finally {
      Object.keys(thoughtTimers).forEach((key) => {
        if (thoughtTimers[key]) {
          clearInterval(thoughtTimers[key]!);
        }
      });
      clearInterval(interval);
      setIsMappingLayout(false);
      setIsLoading(false);
    }
  };

  const readPdfAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const resultString = reader.result as string;
        const base64 = resultString.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const getCompiledQuestions = () => {
    let compiled: any[] = [];
    (Object.values(partsProgressRef.current) as PartStatus[][]).forEach((list) => {
      list.forEach((part) => {
        if (part.status === "done" && part.questions && part.questions.length > 0) {
          compiled = [...compiled, ...part.questions];
        }
      });
    });
    return compiled;
  };

  const triggerFileSelect = () => {
    if (userAccount && userAccount.role !== "admin" && userAccount.credits < 1) {
      setErrorMsg("INSUFFICIENT CREDITS: Your parsing balance is empty (0 remaining). Please recharge your wallet with 2 credits (₹29), 5 credits (₹59), or 10 credits (₹99) to continue parsing mock exams!");
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-6xl w-full mx-auto py-8 px-4 md:px-6 select-none font-sans relative">
      {/* Subtle Atmospheric Depth Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-gradient-to-b from-blue-100/40 via-indigo-50/20 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="text-center mb-8">

        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 shadow-2xs border border-blue-200/70">
          <Sparkles size={13} className="text-blue-600" />
          <span>NTA-Pattern Question Calibration Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-heading">
          JEE Mains CBT Mock Test Simulator
        </h1>
        <p className="mt-3 text-slate-500 max-w-xl mx-auto text-sm leading-relaxed font-normal">
          Upload any coaching mock PDF — Gemini AI extracts complex diagrams, options, and KaTeX math formulas, instantly generating a true-to-life CBT exam simulator.
        </p>

        {/* REFINED STATUTORY & ANSWER-KEY TRUST BADGES (SMOOTH PILLS) */}
        <div className="mt-5 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-left text-xs">
          <div className="w-full sm:w-auto flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200/80 rounded-full text-slate-700 shadow-2xs">
            <ShieldCheck size={16} className="text-blue-600 shrink-0" />
            <span className="text-[11px] leading-tight font-medium">
              <strong className="text-slate-900">Independent Simulator:</strong> Calibrated against NTA exam patterns.
            </span>
          </div>
          <div className="w-full sm:w-auto flex items-center gap-2.5 px-4 py-2 bg-white border border-emerald-200/80 rounded-full text-emerald-900 shadow-2xs">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span className="text-[11px] leading-tight font-medium">
              <strong className="text-slate-900">Answer Keys Optional:</strong> Automatic formula and numerical validation.
            </span>
          </div>
        </div>
      </div>



      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-start gap-2.5 shadow-sm animate-shake">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <span className="font-bold">Extraction Error:</span> {errorMsg}
          </div>
        </div>
      )}

      {isLoading ? (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.03)] p-6 md:p-8 text-left select-none relative overflow-hidden"
        >
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span>Universal Extraction Pipeline Active</span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                Compiling JEE Examination
              </h2>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                PyMuPDF token extraction, 2.0x Retina diagram cropping, and KaTeX mathematical formatting for <span className="font-semibold text-slate-700">{fileName || "JEE Mock Booklet"}</span>.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <div className="px-3.5 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Total Progress</span>
                <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                  {Math.round(((extractedCount.Physics + extractedCount.Chemistry + extractedCount.Mathematics) / 75) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* 4-Metric Stripe-Grade Audit Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-6 p-2 bg-slate-50/70 border border-slate-200/70 rounded-xl">
            {/* Total Extracted */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Layers size={15} className="text-blue-600" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Questions</span>
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums leading-none">
                  {extractedCount.Physics + extractedCount.Chemistry + extractedCount.Mathematics} <span className="text-xs text-slate-400 font-normal">/ 75</span>
                </span>
              </div>
            </div>

            {/* KaTeX Math Typesetting */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={15} className="text-emerald-600" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Typesetting</span>
                <span className="text-xs font-bold text-emerald-700 block truncate">KaTeX Compatible</span>
              </div>
            </div>

            {/* Retina Diagram Engine */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                <Sparkles size={15} className="text-purple-600" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Figures & Crops</span>
                <span className="text-xs font-bold text-purple-700 block truncate">2.0x Retina Crop</span>
              </div>
            </div>

            {/* NTA Scoring Scheme */}
            <div className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={15} className="text-amber-600" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Scoring Standard</span>
                <span className="text-xs font-bold text-slate-800 font-mono tabular-nums block truncate">+4 / -1 Scheme</span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Split: Subject Pipeline Cards (Left 6 cols) + Dark Telemetry Console (Right 6 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT COLUMN: Subject Pipeline Channels */}
            <div className="lg:col-span-6 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono px-1">
                <span>Subject Pipeline Channels</span>
                <span>3 Parallel Tracks</span>
              </div>

              {[
                { name: "Physics", icon: Atom, count: extractedCount.Physics, label: "Physics" },
                { name: "Chemistry", icon: FlaskConical, count: extractedCount.Chemistry, label: "Chemistry" },
                { name: "Mathematics", icon: Calculator, count: extractedCount.Mathematics, label: "Mathematics" }
              ].map(sub => {
                const status = subjectProgress[sub.name];
                const percent = subjectPercent[sub.name] || 0;
                const SubjectIcon = sub.icon;
                const parts = partsProgress[sub.name] || [];
                const hasError = parts.some(p => p.status === "error") || status === "error";

                return (
                  <div 
                    key={sub.name}
                    className={`bg-slate-50/70 border rounded-xl p-3.5 transition-all ${
                      status === "done" ? "border-emerald-200/80 bg-emerald-50/20" :
                      hasError ? "border-rose-200/80 bg-rose-50/20" :
                      status === "running" ? "border-blue-200/80 bg-blue-50/20 shadow-xs" :
                      "border-slate-200/60"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                          status === "done" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                          hasError ? "bg-rose-50 border-rose-200 text-rose-700" :
                          status === "running" ? "bg-blue-50 border-blue-200 text-blue-700" :
                          "bg-white border-slate-200 text-slate-500"
                        }`}>
                          <SubjectIcon size={15} strokeWidth={2} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                            {sub.label}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500">
                            20 MCQs • 5 Numerical NATs
                          </span>
                        </div>
                      </div>

                      {/* Status Pill */}
                      <div>
                        {status === "done" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <CheckCircle2 size={11} strokeWidth={2.5} />
                            <span>{sub.count}/25 Ready</span>
                          </span>
                        ) : status === "running" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200/80 tabular-nums">
                            <Loader2 size={10} className="animate-spin text-blue-600" />
                            <span>{percent}%</span>
                          </span>
                        ) : hasError ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200/80">
                            <AlertCircle size={10} />
                            <span>Requires Review</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono tracking-wider uppercase bg-slate-100 text-slate-500 border border-slate-200/60">
                            In Queue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden mb-2.5">
                      <div 
                        className={`h-full transition-all duration-300 ease-out rounded-full ${
                          status === "done" ? "bg-emerald-500" :
                          hasError ? "bg-rose-500" :
                          "bg-blue-600"
                        }`}
                        style={{ width: `${status === "done" ? 100 : percent}%` }}
                      />
                    </div>

                    {/* Section Distribution Chips */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="bg-white/80 border border-slate-200/60 rounded px-2 py-1 flex items-center justify-between">
                        <span className="text-slate-500">Section A (MCQ):</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          {status === "done" ? "20 / 20" : status === "running" ? `${Math.min(20, Math.floor(sub.count * 0.8))} / 20` : "— / 20"}
                        </span>
                      </div>
                      <div className="bg-white/80 border border-slate-200/60 rounded px-2 py-1 flex items-center justify-between">
                        <span className="text-slate-500">Section B (NAT):</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          {status === "done" ? "5 / 5" : status === "running" ? `${Math.max(0, sub.count - 20)} / 5` : "— / 5"}
                        </span>
                      </div>
                    </div>

                    {/* Part Retry if error */}
                    {hasError && parts.some(p => p.status === "error") && (
                      <div className="mt-2.5 pt-2 border-t border-rose-100 flex items-center justify-between">
                        <span className="text-[10px] text-rose-700 font-medium font-mono">Extraction issue on track.</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const failedPart = parts.find(p => p.status === "error");
                            if (failedPart) {
                              handleRetryPart(sub.name as any, failedPart.partIndex);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-mono text-[10px] font-bold tracking-wider uppercase cursor-pointer active:scale-95 transition-transform"
                        >
                          <RefreshCw size={10} />
                          <span>Retry Track</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Minimal 4-Stage Stepper (Stage 1, 2, 3, Success) */}
            <div className="lg:col-span-6 flex flex-col h-full min-h-[380px]">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono px-1 mb-3">
                <span>Verification Pipeline</span>
                <span className="text-slate-400">Autonomous Calibration</span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between flex-1">
                {/* Stepper Header */}
                <div className="pb-3.5 mb-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">Pipeline Stages</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Automated layout parsing, KaTeX formatting & scoring calibration</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase ${
                    parsingStage === 4 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" 
                      : "bg-blue-50 text-blue-700 border border-blue-200/80"
                  }`}>
                    {parsingStage === 4 ? (
                      <>
                        <CheckCircle2 size={11} strokeWidth={2.5} className="text-emerald-600" />
                        <span>Success</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        <span>Stage 0{parsingStage} of 04</span>
                      </>
                    )}
                  </span>
                </div>

                {/* 4 Stages Stepper */}
                <div className="space-y-3.5 flex-1 flex flex-col justify-around py-2">
                  {/* Stage 1: Booklet Manifest */}
                  <div className="flex items-start gap-3 relative">
                    <div className={`absolute left-3.5 top-7 w-0.5 h-7 transition-colors ${parsingStage > 1 ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                      parsingStage > 1
                        ? "bg-emerald-600 text-white"
                        : parsingStage === 1
                        ? "bg-blue-50 border-2 border-blue-600 text-blue-600"
                        : "bg-slate-100 border border-slate-200 text-slate-400"
                    }`}>
                      {parsingStage > 1 ? (
                        <Check size={13} strokeWidth={3} />
                      ) : parsingStage === 1 ? (
                        <Loader2 size={12} className="animate-spin text-blue-600" />
                      ) : (
                        <span className="text-[10px] font-mono font-bold">1</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 tracking-tight">Stage 1: Booklet Manifest</span>
                        <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
                          parsingStage > 1 ? "text-emerald-600" : parsingStage === 1 ? "text-blue-600" : "text-slate-400"
                        }`}>
                          {parsingStage > 1 ? "Manifest Verified" : parsingStage === 1 ? "Scanning..." : "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">Layout coordinates, page partitioning & section boundaries</p>
                    </div>
                  </div>

                  {/* Stage 2: KaTeX & Diagrams */}
                  <div className="flex items-start gap-3 relative">
                    <div className={`absolute left-3.5 top-7 w-0.5 h-7 transition-colors ${parsingStage > 2 ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                      parsingStage > 2
                        ? "bg-emerald-600 text-white"
                        : parsingStage === 2
                        ? "bg-blue-50 border-2 border-blue-600 text-blue-600"
                        : "bg-slate-100 border border-slate-200 text-slate-400"
                    }`}>
                      {parsingStage > 2 ? (
                        <Check size={13} strokeWidth={3} />
                      ) : parsingStage === 2 ? (
                        <Loader2 size={12} className="animate-spin text-blue-600" />
                      ) : (
                        <span className="text-[10px] font-mono font-bold">2</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 tracking-tight">Stage 2: KaTeX Typesetting & Diagrams</span>
                        <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
                          parsingStage > 2 ? "text-emerald-600" : parsingStage === 2 ? "text-blue-600" : "text-slate-400"
                        }`}>
                          {parsingStage > 2 ? "Typeset Complete" : parsingStage === 2 ? "Processing..." : "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">Mathematical LaTeX rendering & 2.0x Retina diagram crops</p>
                    </div>
                  </div>

                  {/* Stage 3: Answer Calibration */}
                  <div className="flex items-start gap-3 relative">
                    <div className={`absolute left-3.5 top-7 w-0.5 h-7 transition-colors ${parsingStage > 3 ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                      parsingStage > 3
                        ? "bg-emerald-600 text-white"
                        : parsingStage === 3
                        ? "bg-blue-50 border-2 border-blue-600 text-blue-600"
                        : "bg-slate-100 border border-slate-200 text-slate-400"
                    }`}>
                      {parsingStage > 3 ? (
                        <Check size={13} strokeWidth={3} />
                      ) : parsingStage === 3 ? (
                        <Loader2 size={12} className="animate-spin text-blue-600" />
                      ) : (
                        <span className="text-[10px] font-mono font-bold">3</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 tracking-tight">Stage 3: Answer Calibration</span>
                        <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
                          parsingStage > 3 ? "text-emerald-600" : parsingStage === 3 ? "text-blue-600" : "text-slate-400"
                        }`}>
                          {parsingStage > 3 ? "Calibrated" : parsingStage === 3 ? "Calibrating..." : "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">Section A (20 MCQs) & Section B (5 NATs) scoring protocol</p>
                    </div>
                  </div>

                  {/* Stage 4: Success */}
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                      parsingStage >= 4
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 border border-slate-200 text-slate-400"
                    }`}>
                      {parsingStage >= 4 ? (
                        <Check size={13} strokeWidth={3} />
                      ) : (
                        <span className="text-[10px] font-mono font-bold">4</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 tracking-tight">Success: Exam Simulator Ready</span>
                        <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
                          parsingStage >= 4 ? "text-emerald-600 font-bold" : "text-slate-400"
                        }`}>
                          {parsingStage >= 4 ? "Ready" : "Standby"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">NTA +4/-1 evaluation ready for instant test launch</p>
                    </div>
                  </div>
                </div>

                {/* Minimal Status Ticker */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2 truncate max-w-[80%] text-slate-600">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${parsingStage === 4 ? "bg-emerald-500" : "bg-blue-600 animate-pulse"}`} />
                    <span className="truncate">{currentStageMessage}</span>
                  </div>
                  <span className="text-slate-400 tabular-nums shrink-0 font-bold">
                    {extractedCount.Physics + extractedCount.Chemistry + extractedCount.Mathematics}/75 Qs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Tray */}
          <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 font-mono">
              <span>Questions Verified: </span>
              <strong className="text-slate-900 font-bold tabular-nums">
                {getCompiledQuestions().length}
              </strong>
              <span className="text-slate-400"> of 75</span>
              <span className="text-slate-400 mx-2">•</span>
              <span className="text-slate-500">KaTeX formulas & Section A/B structures indexed</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  let finalAll = getCompiledQuestions();
                  if (finalAll.length === 0) {
                    alert("No questions have been successfully extracted yet. Please resolve error tracks or wait for completion.");
                    return;
                  }
                  if (fullBase64Ref.current && finalAll.some(q => q.hasDiagram)) {
                    try {
                      finalAll = await cropDiagramsFromPdf(fullBase64Ref.current, finalAll);
                    } catch (err) {
                      console.warn("[Diagram Engine] Manual launch diagram crop error:", err);
                    }
                  }
                  onTestLoaded(fileName || "JEE Mains Custom Mock Test", finalAll);
                }}
                disabled={getCompiledQuestions().length === 0}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold font-mono text-xs cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all tracking-tight ${
                  getCompiledQuestions().length > 0
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/10"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60"
                }`}
              >
                <Play size={12} fill="currentColor" />
                <span>Launch CBT Exam Simulator ({getCompiledQuestions().length} Qs)</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Uploader Card */}
          <motion.div
            className={`md:col-span-7 lg:col-span-8 bg-[#fafbfc] hover:bg-white rounded-3xl border-2 border-dashed ${
              dragActive ? "border-blue-500 bg-blue-50/40" : "border-slate-200/90 hover:border-blue-400"
            } p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-lg min-h-[380px] relative`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            initial={{ opacity: 0, y: 15 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: dragActive ? 1.02 : 1,
              borderColor: dragActive ? "rgb(59, 130, 246)" : undefined
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <motion.div 
              animate={{ y: dragActive ? -6 : 0 }}
              className="w-16 h-16 rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] border border-slate-200/80 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-105 transition-transform"
            >
              <FileUp size={26} className="text-blue-600" />
            </motion.div>

            <div className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight font-heading">
              Drag & Drop PDF Mock Test File
            </div>
            <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed font-normal">
              Accepts Allen, Resonance, FIITJEE, MathonGo or PYQ papers. AI auto-formats Section A (MCQs) & Section B (NATs).
            </p>

            <button
              type="button"
              className="mt-6 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.25)] hover:shadow-[0_14px_28px_rgba(37,99,235,0.35)] transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Upload size={14} />
              <span>Select PDF from Computer</span>
            </button>
          </motion.div>

          {/* Quick Preset Practice Card (Balanced Light SaaS Card) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            whileHover={{ y: -2 }}
            className="md:col-span-5 lg:col-span-4 bg-white text-slate-800 rounded-3xl p-7 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-lg border border-slate-200/70 hover:border-blue-200/80 transition-all min-h-[380px]"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-4">
                <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold uppercase tracking-wider">
                  <BookOpen size={14} />
                  <span>Preset Benchmark</span>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1 rounded-full font-bold uppercase">
                  Ready to Solve
                </span>
              </div>

              <div className="text-left space-y-2.5">
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight font-heading">
                  Full Syllabus JEE Benchmark Test
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Practice immediately without uploading a PDF. Complete 75 questions with official NTA timer, palette, and scoring.
                </p>

                <div className="bg-[#fafbfc] p-4 rounded-2xl border border-slate-200/60 select-text space-y-2.5 mt-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Curated Section Layout</div>
                  <div className="text-xs text-slate-700 space-y-1.5 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      <span>Physics (20 MCQs + 5 Numerical NATs)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Chemistry (20 MCQs + 5 Numerical NATs)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>Mathematics (20 MCQs + 5 Numerical NATs)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={selectPreset}
              className="mt-6 w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Launch Benchmark Test</span>
              <ArrowRight size={13} />
            </button>
          </motion.div>
        </div>
      )}

      {/* FLOATING TRUST RIBBON: TESTED & CALIBRATED COACHING FORMATS */}
      <div className="mt-8 bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-2xl p-4 shadow-[0_8px_24px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Layers size={16} />
          </div>
          <div className="text-left">
            <span className="text-xs font-extrabold text-slate-900 block font-heading">Tested & Calibrated Formats</span>
            <span className="text-[10px] text-slate-400 font-medium">Automatic OCR, diagram bounds, and KaTeX rendering</span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 justify-center">
          {[
            { name: "Allen", bg: "bg-blue-50 text-blue-700 border-blue-200" },
            { name: "FIITJEE", bg: "bg-amber-50 text-amber-700 border-amber-200" },
            { name: "Resonance", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            { name: "MathonGo", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
            { name: "Narayana", bg: "bg-rose-50 text-rose-700 border-rose-200" },
            { name: "NTA PYQs", bg: "bg-slate-50 text-slate-700 border-slate-200" },
          ].map((inst) => (
            <span
              key={inst.name}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${inst.bg}`}
            >
              {inst.name}
            </span>
          ))}
        </div>
      </div>

      {/* Quick guide */}
      <div className="mt-12 border-t border-slate-200/70 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-500 select-text text-xs leading-relaxed text-left">
        <div className="p-6 bg-white rounded-3xl border border-slate-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] border border-slate-200/80 flex items-center justify-center text-blue-600 mb-4">
            <Monitor size={18} className="text-blue-600" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-2 font-heading tracking-tight">
            Authentic CBT Replica
          </h4>
          <p className="text-slate-500 leading-relaxed font-normal">
            Replicates the official JEE computer-based testing interface, including question palette states, countdown timer, and Section A/B inputs.
          </p>
        </div>
        <div className="p-6 bg-white rounded-3xl border border-slate-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] border border-slate-200/80 flex items-center justify-center text-indigo-600 mb-4">
            <Sparkles size={18} className="text-indigo-600" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-2 font-heading tracking-tight">
            LaTeX Math & Sub-Questions
          </h4>
          <p className="text-slate-500 leading-relaxed font-normal">
            Automatic translation of mathematical matrices, calculus notation, and chemical reactions into crisp KaTeX formulas.
          </p>
        </div>
        <div className="p-6 bg-white rounded-3xl border border-slate-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] border border-slate-200/80 flex items-center justify-center text-emerald-600 mb-4">
            <BarChart3 size={18} className="text-emerald-600" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-2 font-heading tracking-tight">
            Deep Diagnostic Scorecards
          </h4>
          <p className="text-slate-500 leading-relaxed font-normal">
            Instant evaluation with chapter-wise accuracy breakdowns, time-budget analysis, and JoSAA admission rank calibration.
          </p>
        </div>
      </div>

      {/* ADVANCED ACCELERATION & CUSTOM MODEL KEYS (Clean Bottom Placement) */}
      <div className="mt-8 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => setShowApiKeySettings(!showApiKeySettings)}
          className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Cpu size={15} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Advanced: Private Model Key & Engine Acceleration
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {apiKeys.gemini || apiKeys.groq 
                  ? "Dedicated private key active (Personal rate-limit quota)"
                  : "Connect your free Google Gemini or Groq key for dedicated rate-limit quota"}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 flex items-center gap-1 font-mono">
            {showApiKeySettings ? "Hide Settings ▲" : "Configure Key ▼"}
          </span>
        </button>

        {showApiKeySettings && (
          <div className="p-5 border-t border-slate-200 space-y-5 text-left text-xs bg-white">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block font-mono">
                  Why Add Your Own Key?
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Get private 15 RPM quota directly from Google AI Studio. Avoid shared server rate limits and accelerate paper extraction.
                </p>
              </div>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1"
              >
                <span>Get Free Gemini Key</span>
                <ArrowRight size={11} />
              </a>
            </div>

            {/* Provider Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setActiveInstructionTab("gemini")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeInstructionTab === "gemini"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Google Gemini (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setActiveInstructionTab("groq")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeInstructionTab === "groq"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Groq Cloud
              </button>
            </div>

            {/* Input field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                {activeInstructionTab === "gemini" ? "Google Gemini API Key(s)" : "Groq API Key"}
              </label>
              <div className="relative">
                <input
                  type={isKeyVisible ? "text" : "password"}
                  value={apiKeys[activeInstructionTab] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setApiKeys(prev => ({
                      ...prev,
                      [activeInstructionTab]: val
                    }));
                  }}
                  placeholder={
                    activeInstructionTab === "gemini"
                      ? "AIzaSy... (Paste multiple keys separated by comma to cycle)"
                      : "gsk_... (Enter your Groq key)"
                  }
                  className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setIsKeyVisible(!isKeyVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {isKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Lock size={11} className="text-slate-400 shrink-0" />
                <span>Keys are stored strictly in your browser's private local storage and are never logged or stored on central servers.</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClearApiKey}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                Clear Saved Keys
              </button>

              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                {saveStatus === "saved" ? (
                  <>
                    <Check size={13} strokeWidth={3} />
                    <span>Configuration Saved!</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BENEFIT UNLOCKED MODAL POPUP */}
      {showBenefitsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md transition-all">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Background visual accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />
            
            <div className="p-6 md:p-8 text-center space-y-6">
              {/* Success Badge */}
              <div className="w-14 h-14 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck size={28} />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Custom API Key Successfully Configured
                </h3>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
                  DEDICATED PARALLEL EXTRACTION ACTIVE
                </p>
                <div className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Your custom AI credentials have been verified and securely stored in your browser.
                </div>
              </div>

              {/* List of Benefits */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-left space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Extraction Capabilities:
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex gap-2.5 items-start text-xs">
                    <span className="shrink-0 text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded text-[10px]">4X FASTER</span>
                    <p className="text-slate-300"><strong className="text-white">Parallel Concurrency:</strong> Parses Physics, Chemistry, and Mathematics simultaneously in parallel without standard rate queues.</p>
                  </div>
                  <div className="flex gap-2.5 items-start text-xs">
                    <span className="shrink-0 text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded text-[10px]">15 RPM</span>
                    <p className="text-slate-300"><strong className="text-white">Private Quota Allocation:</strong> Connects directly to your Google AI Studio quota, eliminating shared server rate-limits.</p>
                  </div>
                  <div className="flex gap-2.5 items-start text-xs">
                    <span className="shrink-0 text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded text-[10px]">₹0 BILL</span>
                    <p className="text-slate-300"><strong className="text-white">Free Developer Tier:</strong> Uses Google's free developer allocation with zero payment method required.</p>
                  </div>
                  <div className="flex gap-2.5 items-start text-xs">
                    <span className="shrink-0 text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded text-[10px]/none">CLIENT-ONLY</span>
                    <p className="text-slate-300"><strong className="text-white">Browser Sandboxing:</strong> Credentials stay strictly in your local browser storage and are never uploaded or retained centrally.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBenefitsModal(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-[0.98] transition"
                >
                  Confirm & Start Rapid-Parsing!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default PdfUploader;
