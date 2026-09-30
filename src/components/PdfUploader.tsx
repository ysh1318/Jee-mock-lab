/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Upload, FileText, CheckCircle, Database, HelpCircle, AlertCircle, ArrowRight, BookOpen,
  Key, Eye, EyeOff, Check, Cpu, Settings, Sparkles
} from "lucide-react";
import { Question, UserAccount } from "../types";
import { PRESET_MOCK_TEST } from "./data/presetTest";

const ALICE_DIALOGUE_POOL = {
  cheering: [
    "Go go go, Rin-chan! No equation stands a chance! 📣",
    "Whoooo! Look at those math symbols flying out! You're a parsing superstar! ✨",
    "You got this, Rin! Extract those Chemistry reaction formulas! 💖",
    "Go fight! Standard-grade mock questions key set! 🚀"
  ],
  ramen: [
    "Mmm... this hot spicy Ramen tastes amazing! Want a bite, Rin-chan? 🍜",
    "Slurp slurp... Do Chemistry isomers smell like tasty pork broth? 🍥",
    "Ramen, coffee, and definite integrals are the breakfast of champions! 🍥",
    "Eating hot noodles triggers active brain power! Care for some? 🍜"
  ],
  sleeping: [
    "Zzz... only five more minutes mom... I'm integrating calculus bounds... 😴",
    "Zzz... atomic Bohr orbits make such cozy pillows... cuddle... 💤",
    "Zzz... why do complex pulley symbols keep jumping around in my head... 🥱",
    "Zzz... don't worry, my subconscious is cheering for you... 😴"
  ],
  boba: [
    "Ah! Brown sugar Boba tea! The tapioca pearls look like little atomic spheres! 🧋",
    "Sip, sip... Double sugar gives you double parsing speed! 🧋",
    "Sweet sweet boba milk turns complex Physics coordinate vector math into easy fun! 🧋",
    "Nothing beats cold bubble milk tea when we are auditing equations! ✨"
  ],
  peace: [
    "Peace peace! You've got this, Rin-chan! ✌️",
    "Perfect coordinate grid alignment achieved! Bravo! ✌️",
    "Woohoo! Rin-chan, you are literally the smartest black-haired coder! 🎉",
    "Smile! We're extracting this mock test beautifully! 📸"
  ]
};

const RIN_DIALOGUE_POOL = {
  idle: [
    "Calibrating neural layout coordinates for the mock test...",
    "Waking up NLP scanners to parse JEE syllabus chapters..."
  ],
  Physics: [
    "Writing OCR coordinate vector parameters for Physics MCQs... ⚙️",
    "Normalizing electromagnetic field equations and pulleys... ⚙️",
    "Converting kinematic and thermodynamics formulas into clean display LaTeX... ⚙️",
    "Securing standard MCQ layouts for Physics Section... ⚙️"
  ],
  Chemistry: [
    "Parsing Chemistry organic isomers and nomenclature chains... 🧪",
    "Formulating chemical gas equilibria constants Kc and Kp... 🧪",
    "Balancing chemical redox stoichiometry ratios... 🧪",
    "Converting hybrid orbitals into structured formulas... 🧪"
  ],
  Mathematics: [
    "Extracting Math definite calculus double integrals... 📈",
    "Structuring 3D vector math and direction cosines... 📈",
    "Formatting binomial progression sequence matrices... 📈",
    "Confirming differentiability limits of the mock equations... 📈"
  ]
};

export interface PartStatus {
  partIndex: number;
  rangeStr: string;
  status: "idle" | "running" | "done" | "error";
  questions: any[];
  error?: string;
}

export const PARTS_CONFIG_DISPLAY = [
  "Questions 1-13 (MCQ)",
  "Questions 14-25 (MCQ + NAT)",
];

export const PARTS_CONFIG_RANGES = [
  { qMin: 1, qMax: 13 },
  { qMin: 14, qMax: 25 },
];

/**
 * Highly resilient, specialized fetch wrapper that guarantees:
 * 1. An individual track request never hangs forever (strictly times out after 55 seconds).
 * 2. Autoretries once on timeout or transient errors to survive rate-limits.
 */
async function fetchWithTimeoutAndRetry(url: string, options: any, maxRetries = 1, timeoutMs = 90000): Promise<Response> {
  let lastError: any = null;
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
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal,
      });

      clearTimeout(timeoutId);
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
  
  // Custom states and refs for 12-track parallelized parsing & recoveries
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
    _setPartsProgress((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      partsProgressRef.current = next;
      return next;
    });
  };

  const parsedBase64Ref = useRef<string>("");
  const parsedFilenameRef = useRef<string>("");
  const activeAiProviderRef = useRef<string>("gemini");
  const userCustomKeyRef = useRef<string>("");
  const userAccountRef = useRef<any>(null);
  const parseSessionIdRef = useRef<string>("");

  useEffect(() => {
    userAccountRef.current = userAccount;
  }, [userAccount]);

  // Custom provider-specific API Key States
  const [showApiKeySettings, setShowApiKeySettings] = useState(true);
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

  // Custom high-resolution customizable images
  const [rinImageUrl, setRinImageUrl] = useState(() => {
    try {
      return localStorage.getItem("user_rin_image_url") || "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=450&h=450";
    } catch {
      return "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=450&h=450";
    }
  });

  const [aliceImageUrl, setAliceImageUrl] = useState(() => {
    try {
      return localStorage.getItem("user_alice_image_url") || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=450&h=450";
    } catch {
      return "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=450&h=450";
    }
  });

  const [rinImgBroken, setRinImgBroken] = useState(false);
  const [aliceImgBroken, setAliceImgBroken] = useState(false);

  // Real-time detailed logs stream for transparent PDF parsing
  const [liveLogs, setLiveLogs] = useState<{ id: string; msg: string; type: "info" | "success" | "work" | "warning"; time: string }[]>([]);

  const thoughtsBySubject = {
    Physics: [
      "Compiling radioactive decay kinematics...",
      "Converting electromagnetic vector field symbols...",
      "Formulating circular motion angular velocity equations...",
      "Drafting detailed mechanics work-energy explanations...",
      "Confirming friction coefficients are perfectly aligned with NTA standards.",
      "Applying vector cross product integrations... Success!",
      "Translating complex coordinate pulleys into dynamic mathematical nodes."
    ],
    Chemistry: [
      "Organizing Benzene-ring organic substitution mechanism logs...",
      "Checking periodic trends for electronegative stability limits...",
      "Verifying Gibbs free energy calculations for correctness...",
      "Polishing IUPAC nomenclature spelling for coordinate compounds...",
      "Resolving molecular kinetics half-life reaction rates...",
      "Parsing chemical gas equilibria coefficients: Kp and Kc values...",
      "Isolating stoichiometry atomic mass ratios... Match found!"
    ],
    Mathematics: [
      "Unpacking double-integration definite calculus bounds...",
      "Converting 3-dimensional vector direction cosines to display LaTeX...",
      "Verifying binomial sequence coefficient expansions...",
      "Translating trigonometric identity functions with high-precision ratios...",
      "Deducing limits-continuity differentiability bounds...",
      "Assembling coordinate matrix determinant column vectors...",
      "Formatting conic section tangents and hyperbola equations."
    ]
  };

  const [subjectProgress, setSubjectProgress] = useState<{
    Physics: "idle" | "running" | "done" | "empty" | "error";
    Chemistry: "idle" | "running" | "done" | "empty" | "error";
    Mathematics: "idle" | "running" | "done" | "empty" | "error";
  }>({
    Physics: "idle",
    Chemistry: "idle",
    Mathematics: "idle",
  });

  const [subjectPercent, setSubjectPercent] = useState<Record<string, number>>({
    Physics: 0,
    Chemistry: 0,
    Mathematics: 0,
  });

  const [isMappingLayout, setIsMappingLayout] = useState(false);

  const [extractedCount, setExtractedCount] = useState<{
    Physics: number;
    Chemistry: number;
    Mathematics: number;
  }>({ Physics: 0, Chemistry: 0, Mathematics: 0 });

  const [aliceAction, setAliceAction] = useState<"cheering" | "ramen" | "sleeping" | "boba" | "peace">("cheering");
  const [aliceDialogue, setAliceDialogue] = useState("Let's do this, Rin-chan! We're hand-crafting a gorgeous mock test! ✨");
  const [rinDialogue, setRinDialogue] = useState("Calibrated coordinates. Ready to convert PDF layout grids.");

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

  useEffect(() => {
    if (!isLoading) {
      setRinDialogue("Calibrated coordinates. Ready to convert PDF layout grids.");
      setAliceDialogue("Let's do this, Rin-chan! We're hand-crafting a gorgeous mock test! ✨");
      setAliceAction("cheering");
      return;
    }

    const timer = setInterval(() => {
      // Determine active subject
      let activeSubj: "Physics" | "Chemistry" | "Mathematics" | "idle" = "idle";
      if (subjectProgress.Physics === "running") activeSubj = "Physics";
      else if (subjectProgress.Chemistry === "running") activeSubj = "Chemistry";
      else if (subjectProgress.Mathematics === "running") activeSubj = "Mathematics";

      // 1. Pick Alice random action
      const actions: ("cheering" | "ramen" | "sleeping" | "boba" | "peace")[] = ["cheering", "ramen", "sleeping", "boba", "peace"];
      const nextAction = actions[Math.floor(Math.random() * actions.length)];
      setAliceAction(nextAction);

      // 2. Pick Alice dialogue matching her new action
      const aPool = ALICE_DIALOGUE_POOL[nextAction];
      const nextAliceDial = aPool[Math.floor(Math.random() * aPool.length)];
      setAliceDialogue(nextAliceDial);

      // 3. Pick Rin dialogue matching active subject
      const rPool = RIN_DIALOGUE_POOL[activeSubj];
      const nextRinDial = rPool[Math.floor(Math.random() * rPool.length)];
      setRinDialogue(nextRinDial);
    }, 3800);

    return () => clearInterval(timer);
  }, [isLoading, subjectProgress.Physics, subjectProgress.Chemistry, subjectProgress.Mathematics]);

  const handleSaveApiKey = () => {
    try {
      localStorage.setItem("user_gemini_api_key", apiKeys.gemini.trim());
      localStorage.setItem("user_groq_api_key", apiKeys.groq.trim());
      localStorage.setItem("user_rin_image_url", rinImageUrl.trim());
      localStorage.setItem("user_alice_image_url", aliceImageUrl.trim());
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
      localStorage.removeItem("user_rin_image_url");
      localStorage.removeItem("user_alice_image_url");
      setApiKeys({ gemini: "", groq: "" });
      setRinImageUrl("https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=450&h=450");
      setAliceImageUrl("https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=450&h=450");
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
    setLoadingStep("Extracting standard calibration elements...");
    setFileName("Benchmark JEE Mains Syllabus Mock Test");
    
    setTimeout(() => {
      onTestLoaded("Prescribed Benchmark JEE Mains syllabus Mock Test", PRESET_MOCK_TEST);
      setIsLoading(false);
    }, 1200);
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
    parseSessionId?: string
  ): Promise<any[]> => {
    setPartsProgress((prev) => {
      const list = prev[subjName] ? [...prev[subjName]] : [];
      const itemIdx = list.findIndex((p) => p.partIndex === partIndex);
      const targetDisplay = PARTS_CONFIG_DISPLAY[partIndex] || `Part ${partIndex + 1}`;
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
      const skipCreditDeduction = partIndex > 0;
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
      if (parsedData.creditsLeft !== undefined) {
        onCreditsUpdated(parsedData.creditsLeft);
      }

      if (parsedData.isOfflineFallback) {
        const fbNow = new Date();
        const fbTimeStr = fbNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        setLiveLogs(prev => [
          { id: `fallback-${subjName}-${partIndex}-${Math.random()}`, msg: `⚡ Offline Fallback requested for ${subjName} Part #${partIndex + 1}! Bypassed Gemini quota limits and injected calibrated expert mock questions. 100% Free!`, type: "warning", time: fbTimeStr },
          ...prev
        ]);
      }

      const questions = parsedData.questions || [];
      const startQNum = PARTS_CONFIG_RANGES[partIndex].qMin;
      const validated = questions.map((q: any, idx: number) => {
        const validId = q.id || `${prefix}-${String(startQNum + idx).padStart(2, "0")}`;
        const validSection = q.section || (startQNum + idx <= 20 ? "Section A" : "Section B");
        return {
          ...q,
          id: validId,
          subject: subjName,
          section: validSection,
          questionNumber: q.questionNumber || (startQNum + idx),
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
      { id: `retry-${subjName}-${partIdx}-${Math.random()}`, msg: `🔄 Retrying Part #${partIdx + 1} of ${subjName} (${PARTS_CONFIG_DISPLAY[partIdx] || `Part ${partIdx + 1}`})...`, type: "info", time: timeStr },
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
        parseSessionIdRef.current
      );

      // Now, adjust aggregate stats
      setPartsProgress(current => {
        const list = current[subjName] || [];
        const doneCount = list.filter(p => p.status === "done").length;
        const totalCount = list.length || 2;
        const computedPercent = Math.floor((doneCount / totalCount) * 100);
        
        setSubjectPercent(prev => ({ ...prev, [subjName]: computedPercent }));
        
        // Recalculate count of questions parsed in this subject
        const totalQs = list.flatMap(p => p.status === "done" ? p.questions : []).length;
        setExtractedCount(prev => ({ ...prev, [subjName]: totalQs }));

        // Adjust overall progress subjectProgress
        setSubjectProgress(prev => {
          let status: "idle" | "running" | "done" | "empty" | "error" = "error";
          if (doneCount === totalCount) status = "done";
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
        { id: `retry-sc-${subjName}-${partIdx}-${Math.random()}`, msg: `✓ Part #${partIdx + 1} of ${subjName} successfully re-parsed!`, type: "success", time: succTime },
        ...prev
      ]);

    } catch (e: any) {
      const errNow = new Date();
      const errTime = errNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      setLiveLogs(prev => [
        { id: `retry-fl-${subjName}-${partIdx}-${Math.random()}`, msg: `❌ Retry of Part #${partIdx + 1} on ${subjName} failed: ${e.message || String(e)}`, type: "warning", time: errTime },
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

    if (userAccount.credits < 1) {
      setErrorMsg("INSUFFICIENT CREDITS: Your parsing balance is empty (0 remaining). Please recharge your wallet with 25 credits (₹59) or 50 credits (₹99) using UPI QR to continue parsing mock exams!");
      return;
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
      { text: "🤖 StudyBot core online! Calibrating AI neural networks...", type: "info" as const },
      { text: `📖 Loaded PDF document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, type: "success" as const },
      { text: `⚡ Handshaking with ${activeAiProvider === "gemini" ? "Google Gemini" : "Groq Llama-3"} models...`, type: "info" as const },
      { text: "🎯 Calibrating OCR coordinate mapping vectors for Physics, Chemistry & Math sections...", type: "info" as const }
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
          { id: `start-${subj}-${Math.random()}`, msg: `🚀 Working on ${subj} Section: Transmitting page vectors to ${activeAiProvider === "gemini" ? "Gemini" : "Groq"} AI...`, type: "work", time: timeStr },
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
          { id: `thought-${subj}-${Math.random()}`, msg: `⚙️ [${subj}] StudyBot: ${chosen}`, type: "work", time: timeStr },
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
        Physics: [],
        Chemistry: [],
        Mathematics: [],
      };

      subjects.forEach((subj) => {
        for (let partIdx = 0; partIdx < PARTS_CONFIG_DISPLAY.length; partIdx++) {
          initialPartsProgress[subj.name].push({
            partIndex: partIdx,
            rangeStr: PARTS_CONFIG_DISPLAY[partIdx],
            status: "running",
            questions: [],
          });
        }
      });
      setPartsProgress(initialPartsProgress);
      setIsMappingLayout(false);

      const rightNow = new Date();
      const initialLogTime = rightNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

      setLiveLogs(prev => [
        {
          id: `layout-info-notice-${Math.random()}`,
          msg: `🔍 Direct Single-Pass Active: Your PDF is processed subject-by-subject in standard 1-stage extraction blocks, completely bypassing any layout mapping delays!`,
          type: "info",
          time: initialLogTime
        },
        {
          id: `sequential-queue-notice-${Math.random()}`,
          msg: `🚀 Initiating ultra-robust sequential parsing queue (running subjects one-by-one to prevent rate limits, prioritizing 100% successful extraction over speed)...`,
          type: "info",
          time: initialLogTime
        },
        ...prev
      ]);

      const taskConfigs: { subject: string; prefix: string; partIndex: number }[] = [];
      subjects.forEach((subj) => {
        for (let partIdx = 0; partIdx < PARTS_CONFIG_DISPLAY.length; partIdx++) {
          taskConfigs.push({
            subject: subj.name,
            prefix: subj.prefix,
            partIndex: partIdx,
          });
        }
      });

      const parallelIntervals: Record<string, any> = {};

      // Initialize all subjects to "idle" (In Queue) status with 0% progress at the start
      subjects.forEach((subj) => {
        setSubjectProgress((prev) => ({ ...prev, [subj.name]: "idle" }));
        setSubjectPercent((prev) => ({ ...prev, [subj.name]: 0 }));
      });

      for (const task of taskConfigs) {
        const { subject, prefix, partIndex } = task;

        // On-the-fly execution initialization: Activate progress indicators ONLY when the subject starts processing
        if (partIndex === 0) {
          setSubjectProgress((prev) => ({ ...prev, [subject]: "running" }));
          setSubjectPercent((prev) => ({ ...prev, [subject]: 5 }));
          startThoughtGenerator(subject as "Physics" | "Chemistry" | "Mathematics");

          // Start dynamic self-incrementing pseudo progress indicator for this active subject ONLY
          const progressInterval = setInterval(() => {
            setSubjectPercent((prev) => {
              const currentVal = prev[subject] || 5;
              const parts = partsProgressRef.current[subject] || [];
              const doneCount = parts.filter((pt) => pt.status === "done" || pt.status === "error").length;

              const basePercent = doneCount * (100 / PARTS_CONFIG_DISPLAY.length);
              const maxAllowed = Math.min(basePercent + 45, 99);

              if (currentVal < maxAllowed) {
                const increment = Math.floor(Math.random() * 2) + 1; // 1% to 2% increment
                return { ...prev, [subject]: Math.min(currentVal + increment, maxAllowed) };
              }
              if (currentVal > 99) {
                return { ...prev, [subject]: 99 };
              }
              return prev;
            });
          }, 600);
          parallelIntervals[subject] = progressInterval;
        }

        const scanNow = new Date();
        const scanTimeStr = scanNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        setLiveLogs(prev => [
          { id: `launch-${subject}-part-${partIndex}-${Math.random()}`, msg: `⚡ Spawning scanner pipeline for ${subject} [${PARTS_CONFIG_DISPLAY[partIndex]}]...`, type: "info", time: scanTimeStr },
          ...prev
        ]);

        try {
          const isBase64 = parsedBase64Ref.current.startsWith("data:") || parsedBase64Ref.current.length > 500;
          const response = await fetchWithTimeoutAndRetry("/api/parse-pdf", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pdfData: isBase64 ? parsedBase64Ref.current : undefined,
              fileId: !isBase64 ? parsedBase64Ref.current : undefined,
              filename: file.name,
              subject: subject,
              prefix: prefix,
              provider: activeAiProvider,
              apiKey: userCustomKey,
              userId: userAccount.id,
              partIndex: partIndex,
              parseSessionId: parseSessionIdRef.current,
            }),
          });

          if (!response.ok) {
            let errorText = `Failed to extract ${subject} [${PARTS_CONFIG_DISPLAY[partIndex]}]`;
            try {
              const errJson = await response.json();
              if (errJson && errJson.error) {
                errorText = errJson.error;
              }
            } catch {}
            throw new Error(errorText);
          }

          const parsedData = await response.json();
          if (parsedData.creditsLeft !== undefined) {
             onCreditsUpdated(parsedData.creditsLeft);
          }

          if (parsedData.isOfflineFallback) {
            const fbNow = new Date();
            const fbTimeStr = fbNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            setLiveLogs(prev => [
              { id: `fallback-part-${subject}-${partIndex}-${Math.random()}`, msg: `⚡ Offline Fallback Mode [${PARTS_CONFIG_DISPLAY[partIndex]}]: ${parsedData.fallbackMessage || "Loaded expert-calibrated standard syllabus questions."}`, type: "warning", time: fbTimeStr },
              ...prev
            ]);
          }

          if (parsedData.testName && !testTitle) {
            testTitle = parsedData.testName;
          }

          const questions = parsedData.questions || [];
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

          if (questions.length > 0) {
            const validated = questions.map((q: any, idx: number) => {
              const baseNum = PARTS_CONFIG_RANGES[partIndex]?.qMin || 1;
              const qNum = q.questionNumber || (baseNum + idx);
              const validId = q.id || `${prefix}-${String(qNum).padStart(2, "0")}`;
              const validSection = q.section || (qNum <= 20 ? "Section A" : "Section B");
              return {
                ...q,
                id: validId,
                subject: subject,
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

            setPartsProgress((prev: any) => {
              const updatedList = (prev[subject] || []).map((pt: any) => {
                if (pt.partIndex === partIndex) {
                  return {
                    ...pt,
                    status: "done",
                    questions: validated,
                  };
                }
                return pt;
              });
              return {
                ...prev,
                [subject]: updatedList,
              };
            });

            setLiveLogs(prev => [
              { id: `success-${subject}-part-${partIndex}-${Math.random()}`, msg: `✅ Done! Successfully extracted ${validated.length} questions for ${subject} [${PARTS_CONFIG_DISPLAY[partIndex]}].`, type: "success", time: timeStr },
              ...prev
            ]);
          } else {
            setPartsProgress((prev: any) => {
              const updatedList = (prev[subject] || []).map((pt: any) => {
                if (pt.partIndex === partIndex) {
                  return {
                    ...pt,
                    status: "done",
                    questions: [],
                  };
                }
                return pt;
              });
              return {
                ...prev,
                [subject]: updatedList,
              };
            });
            setLiveLogs(prev => [
              { id: `empty-${subject}-part-${partIndex}-${Math.random()}`, msg: `⚠️ Completed scan of ${subject} [${PARTS_CONFIG_DISPLAY[partIndex]}] section but found zero questions.`, type: "warning", time: timeStr },
              ...prev
            ]);
          }
        } catch (err: any) {
          const subErrorMsg = err?.name === "AbortError"
            ? "Network timeout (>60s): The server is currently taking too long to extract. Try using custom keys or re-trigger."
            : (err instanceof Error ? err.message : String(err));
          console.error(`Error parsing ${subject} Part ${partIndex}:`, err);
          
          setPartsProgress((prev: any) => {
            const updatedList = (prev[subject] || []).map((pt: any) => {
              if (pt.partIndex === partIndex) {
                return {
                  ...pt,
                  status: "error",
                  questions: [],
                  error: subErrorMsg,
                };
              }
              return pt;
            });
            return {
              ...prev,
              [subject]: updatedList,
            };
          });

          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
          setLiveLogs(prev => [
            { id: `error-${subject}-part-${partIndex}-${Math.random()}`, msg: `❌ ${subject} [${PARTS_CONFIG_DISPLAY[partIndex]}] failed: ${subErrorMsg}`, type: "warning", time: timeStr },
            ...prev
          ]);
        }

        // If this is the final part for the subject, instantly finalize progress
        if (partIndex === PARTS_CONFIG_DISPLAY.length - 1) {
          stopThoughtGenerator(subject);
          if (parallelIntervals[subject]) {
            clearInterval(parallelIntervals[subject]);
          }

          const parts = partsProgressRef.current[subject] || [];
          const doneCount = parts.filter((pt) => pt.status === "done").length;
          const errCount = parts.filter((pt) => pt.status === "error").length;

          const totalExtractedForSubj = parts.flatMap((pt) => pt.questions || []).length;
          setExtractedCount((prev) => ({ ...prev, [subject]: totalExtractedForSubj }));
          setSubjectPercent((prev) => ({ ...prev, [subject]: Math.floor((doneCount / PARTS_CONFIG_DISPLAY.length) * 100) }));
          setSubjectProgress((prev) => {
            let status: "idle" | "running" | "done" | "empty" | "error" = "empty";
            if (doneCount === PARTS_CONFIG_DISPLAY.length) status = "done";
            else if (errCount > 0) status = "error";
            return {
              ...prev,
              [subject]: status
            };
          });
        }

        // Turn off layout mapping flag as soon as the first task finishes
        if (taskConfigs.indexOf(task) === 0) {
          setIsMappingLayout(false);
        }

        // Add a safety cooldown delay of 1.5 seconds between tasks to let the key pool stay cool
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Failsafe cleanup for any un-cleared intervals
      subjects.forEach((subj) => {
        stopThoughtGenerator(subj.name);
        if (parallelIntervals[subj.name]) {
          clearInterval(parallelIntervals[subj.name]);
        }
      });

      const finalAll = getCompiledQuestions();
      allQuestions = finalAll;

      clearInterval(interval);

      if (allQuestions.length === 0) {
        throw new Error("No readable questions could be extracted from any section in this PDF. Is this a math-based Mock Test PDF?");
      }

      const finalNow = new Date();
      const finalTimeStr = finalNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      setLiveLogs(prev => [
        { id: `finish-${Math.random()}`, msg: `🎉 All completed! Extracted a total of ${allQuestions.length} questions. Initiating CBT engine mockup...`, type: "success", time: finalTimeStr },
        ...prev
      ]);

      // Briefly pause so the user sees the completed states
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onTestLoaded(testTitle || file.name, allQuestions);
    } catch (error: any) {
      console.error(error);
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
    if (userAccount && userAccount.credits < 1) {
      setErrorMsg("INSUFFICIENT CREDITS: Your parsing balance is empty (0 remaining). Please recharge your wallet with 25 credits (₹59) or 50 credits (₹99) using UPI QR to continue parsing mock exams!");
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-6xl w-full mx-auto py-8 px-4 md:px-6 select-none">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 shadow-xs border border-blue-100">
          <BookOpen size={12} />
          <span>JEE MAINS CBT REPLICA ENGINE</span>
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight sm:text-4xl">
          JEE Mains CBT Mock Test Simulator
        </h1>
        <p className="mt-3 text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
          Upload any paper PDF — Gemini AI automatically extracts complex diagrams, options, and math formulas with LaTeX, instantly deploying an authentic CBT Test replica.
        </p>

        {/* IMPORTANT USER BULLETINS (DISCLAIMER & ANSWER-KEY GUARANTEE) */}
        <div className="mt-5 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-3 bg-amber-50/75 border border-amber-200/60 rounded-xl shadow-2xs">
            <p className="text-[11px] text-amber-900 leading-relaxed font-semibold">
              <span className="text-xs mr-1">⚠️</span>
              <strong>NTA Disclaimer:</strong> This platform is an independent simulation tool and is <strong>not connected to NTA (National Testing Agency) in any manner</strong>.
            </p>
          </div>
          <div className="p-3 bg-emerald-50/75 border border-emerald-200/60 rounded-xl shadow-2xs">
            <p className="text-[11px] text-emerald-900 leading-relaxed font-semibold">
              <span className="text-xs mr-1">✨</span>
              <strong>No Answer Key?</strong> Absolutely no problem! The platform will <strong>auto-generate precise keys and solutions</strong> automatically.
            </p>
          </div>
        </div>
      </div>

      {/* AI KEY & DEVELOPER STORY HUB */}
      <div className="mb-10 max-w-6xl w-full mx-auto">
        <div className="bg-slate-50 rounded-2xl border-2 border-slate-200/80 overflow-hidden shadow-sm flex flex-col">
          
          {/* HEADER CO-PILOT WITH EMBEDDED TOGGLE CARD */}
          <div className="bg-linear-to-r from-slate-800 to-indigo-950 p-5 md:p-6 text-white text-left relative overflow-hidden select-none">
            {/* Subtle floating background patterns */}
            <div className="absolute top-0 right-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-1.5 flex-1 select-text">
                <span className="inline-block text-[10px] font-black tracking-widest text-indigo-300 uppercase bg-indigo-950/60 px-2.5 py-1 rounded border border-indigo-800">
                  🎓 PERSISTENT SECURE FUEL BOARD
                </span>
                <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>🚀</span>
                  <span>Developer's Desk & Dedicated API Fuel Hub</span>
                </h2>
                <p className="text-xs text-indigo-200 font-medium">
                  A middle-class student's answer to expensive test series. Bring your own free key to enjoy unlimited fast PDF mock parsing!
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setShowApiKeySettings(!showApiKeySettings)}
                className="shrink-0 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold rounded-lg text-white transition flex items-center gap-1 cursor-pointer self-start sm:self-center"
              >
                <Settings size={13} className="animate-pulse" />
                <span>{showApiKeySettings ? "Collapse Panel ▲" : "Expand Settings ▼"}</span>
              </button>
            </div>
          </div>

          {showApiKeySettings && (
            <div className="p-5 md:p-6 bg-white text-left text-xs select-text space-y-6">
              
              {/* SECTION 1: THE DEVELOPER'S STORY (JEE 94-PERCENTILER'S MISSION) */}
              <div className="bg-[#f8fafc] border border-slate-200/60 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute bottom-0 right-10 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                
                {/* Developer Persona Badge */}
                <div className="shrink-0 bg-linear-to-br from-amber-50 to-orange-100 border border-amber-200 w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-xs select-none">
                  <span className="text-sm font-black text-amber-600">JEE</span>
                  <span className="text-[10px] font-extrabold text-amber-700 leading-none">94%ile</span>
                </div>
                
                <div className="flex-1 space-y-2">
                  <h3 className="font-extrabold text-slate-800 text-[13px] flex items-center gap-1.5 select-none">
                    <span>👑</span>
                    <span>The 94th Percentile Mission (From Your Developer's Desk)</span>
                  </h3>
                  <div className="text-slate-600 space-y-2 text-[11.5px] leading-relaxed">
                    <p>
                      Hey there, fellow aspirants! I am the creator of this platform. Like you, I put my blood, sweat, and tears into preparing for <strong>JEE Mains</strong> and secured a <strong>94 percentile</strong>. During my exam grind, I noticed a huge gap: there is literally a goldmine of <strong>completely free, abandoned Mock Test PDFs</strong> lying on Telegram channels and forums, but doing mock tests on a flat paper PDF is incredibly static. What we truly need is an authentic screen-based simulator experience, step-by-step solutions with real calculations, and comprehensive diagnostics. But premium CBT test series charge thousands of rupees, which is out of reach for many.
                    </p>
                    <p>
                      This simulator is my solution to that. It instantly parses <strong>any free or abandoned PDF</strong>, reads complicated diagrams/chemistry nomenclature, formats mathematical expressions using beautiful <strong>LaTeX</strong>, and launches an absolutely precise NTA-style CBT test panel with fully detailed explanations and analysis metrics on-the-fly!
                    </p>
                    <p>
                      <strong>The Rate Limit & Budget Bottleneck:</strong> Because I am from a modest, middle-class family, I cannot afford a paid premium API key that bills me for every usage. The embedded key I have supplied is on Google's <strong>Free Tier</strong>. This free key is shared globally and is restricted by Google to handle a maximum of 2-3 requests per minute. If more than 5 to 10 students use it at the same time, it bottlenecks, rate-limits, or crashes. To ensure a 100% dedicated, independent, and blazing fast experience, I highly urge you to grab your own free key!
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ARCHITECTURE & PRIVACY GUARANTEE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5 select-none">
                    <span>🛡️</span>
                    <span>Secure Cloud & Firestore Persistent Sync</span>
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    This platform values your privacy and data security. <strong>Your custom API credentials, parser wallet balances, transactions, and profile records are synced securely with our Firebase Firestore cloud database</strong>. High-fidelity persistent state management lets you access your study stats safely across any browser device!
                  </p>
                </div>
                <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-amber-800 text-xs flex items-center gap-1.5 select-none">
                    <span>⚠️</span>
                    <span>Safety Warning & anti-Leak Disclaimer</span>
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Your API keys are stored 100% locally inside your browser cache. However, <strong>please note that the developer is not responsible if, due to your own oversight or mistakes</strong> (such as taking screen recordings showing your keys, leaving your session open on public computers in libraries or cyber-cafes, or sharing browser cache exports), your API key gets leaked. Guard your key like a password!
                  </p>
                </div>
              </div>

              {/* SECTION 3: WHAT IS AN API KEY? */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1 select-none">
                  <span>💡</span>
                  <span>Knowledge Corner: What is an API Key?</span>
                </h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  An <strong>API (Application Programming Interface) Key</strong> is a secret code that acts like a private secure keycard. It tells Google or other AI servers that you are a authorized caller, allowing your browser to send PDF pages directly to the AI model-brain to receive LaTeX translations. By putting your own key, Google assigns you a **100% isolated, dedicated free-tier quota** with zero central bottlenecks!
                </p>
              </div>

              {/* BRAND NEW: PROS COMPARISON DESK - Bring direct structural comparison */}
              <div className="border border-indigo-100 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-linear-to-r from-indigo-50 to-blue-50/70 p-3.5 border-b border-indigo-100 select-none">
                  <h4 className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                    <span>🌟</span>
                    <span>PROS COMPARE: Dedicated Custom API Key vs. Shared Global Key</span>
                  </h4>
                </div>
                <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shared Global Option */}
                  <div className="p-3 bg-red-50/45 rounded-lg border border-red-100/75 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="inline-block text-[9px] font-black tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-full select-none mb-1">
                        🚦 SHARED SYSTEM KEY
                      </span>
                      <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
                        <li><strong>Slow Traffic:</strong> Shares 1 free channel globally with hundreds of concurrent users.</li>
                        <li><strong>Rate-Limit Choke (429):</strong> Prone to failing when 5+ users process files simultaneously.</li>
                        <li><strong>25 Question Cap:</strong> High congestion limits maximum subject-parsing speeds.</li>
                        <li><strong>Unpredictable Latency:</strong> Queues can spin anywhere between 35s to over 2 minutes.</li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Bring Your Own Key */}
                  <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100/80 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="inline-block text-[9px] font-black tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full select-none mb-1">
                        🚀 DEDICATED CUSTOM KEY
                      </span>
                      <ul className="text-[11px] text-slate-700 space-y-1.5 list-disc list-inside">
                        <li><strong>Isolated Multi-Lane:</strong> Unleashes up to 12-track parallel requests for near-instant loads.</li>
                        <li><strong>Safe From Collisions:</strong> Enjoy private 15 Requests/Min limits from Google AI Studio.</li>
                        <li><strong>99.9% Success Rate:</strong> Solves throttling locks for flawless mock translations.</li>
                        <li><strong>100% Free Forever:</strong> Zero charges under Google's personal study plans.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: OPTIONS & GUIDE FOR DIFFERENT AIs */}
              <div className="space-y-3.5 pt-2">
                <label className="block text-xs font-extrabold text-slate-800 select-none">
                  🔍 Choose AI Provider & Set Key:
                </label>
                
                {/* Tabs */}
                <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2 select-none">
                  {[
                    { id: "gemini", label: "Google Gemini (Free & Recommended) ✨", activeColor: "bg-blue-600 text-white border-blue-600" },
                    { id: "groq", label: "Groq / DeepSeek (Fastest Generation) ⚡", activeColor: "bg-indigo-600 text-white border-indigo-600" }
                  ].map((tab) => {
                    const isActive = activeInstructionTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveInstructionTab(tab.id as any)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border cursor-pointer transition-all duration-200 ${
                          isActive 
                            ? tab.activeColor 
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 shadow-2xs"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <div className="bg-[#fefaf6]/50 p-4 rounded-xl border border-orange-100/60 mt-2 text-[11.5px] leading-relaxed text-slate-600">
                  
                  {activeInstructionTab === "gemini" ? (
                    <div className="space-y-2">
                      <div className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-tight">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span>Google Gemini API Key (100% Free - Highly Recommended)</span>
                      </div>
                      <p>
                        Google AI Studio grants students an incredibly generous, **permanently free API quota** (up to 15 Requests Per Minute)! It processes full PDF documents with robust LaTeX equations at ₹0 cost.
                      </p>
                      <div className="bg-white/80 rounded-lg p-3 border border-slate-200/50 space-y-1.5 text-slate-700">
                        <p className="font-black text-[11px] uppercase tracking-wider text-slate-500">Step-by-Step setup:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs font-medium">
                          <li>
                            Open <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-extrabold hover:underline">Google AI Studio (aistudio.google.com)</a> in a new tab and sign in using your standard Gmail.
                          </li>
                          <li>
                            Click the blue **"Get API key"** button on the side panel or navigation header.
                          </li>
                          <li>
                            Select **"Create API Key"** and choose to generate it in a new or default project.
                          </li>
                          <li>
                            Copy your secret key string (starting with <code className="font-mono bg-slate-100 px-1 py-[1.5px] text-slate-800 select-all rounded font-bold">AIzaSy...</code> or the new <code className="font-mono bg-slate-100 px-1 py-[1.5px] text-slate-800 select-all rounded font-bold">AQ...</code> format).
                          </li>
                          <li>
                            Paste this key into the field below and click **"Save Settings"**!
                          </li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-tight">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span>Groq API Integration Details</span>
                      </div>
                      <p>
                        Groq is widely known for ultra-high-speed processing of open weights like Llama and Mixtral. It generates exceptionally calibrated, curriculum-realistic questions from your syllabus perfectly!
                      </p>
                      <div className="bg-white/80 rounded-lg p-3 border border-slate-200/50 space-y-1.5 text-slate-700">
                        <p className="font-black text-[11px] uppercase tracking-wider text-slate-500">Step-by-Step setup:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs font-medium">
                          <li>Go to the <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-extrabold hover:underline">Groq Console (console.groq.com)</a>.</li>
                          <li>Navigate to the API Keys sidebar and generate your key (prefix <code className="bg-slate-100 font-mono px-1">gsk_...</code>).</li>
                          <li>Paste this key into the field below and click **"Save Settings"**!</li>
                        </ol>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* SECTION 5: INPUT FORM & AVATAR CONFIG */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1">
                      <span>🗝️</span> {
                        activeInstructionTab === "gemini" ? "Enter Your Actionable Gemini API Key(s):" :
                        "Enter Your Actionable Groq API Key(s):"
                      }
                    </label>
                    {((activeInstructionTab === "gemini" && serverConfig.geminiConfigured) ||
                      (activeInstructionTab === "groq" && serverConfig.groqConfigured)) && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200/50 animate-pulse animate-duration-1000">
                        ⚡ Shared Key Active
                      </span>
                    )}
                  </div>
                  {activeInstructionTab === "gemini" && (
                    <p className="text-[11px] text-blue-600 font-medium leading-normal mb-1">
                      💡 <strong>Rate-Limit Safe:</strong> Paste multiple keys separated by commas or lines to cycle through keys simultaneously!
                    </p>
                  )}
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
                        activeInstructionTab === "gemini" ? "APIKey1, APIKey2, APIKey3... (Paste multiple keys to cycle)" :
                        "gsk_... (Enter your Groq API key)"
                      }
                      className="w-full px-3 py-2.5 pr-10 border-2 border-slate-200 rounded-lg font-mono text-xs focus:border-indigo-500 focus:outline-hidden text-slate-850 bg-white shadow-xs focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsKeyVisible(!isKeyVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {isKeyVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Avatar Customization Block */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 select-none text-left">
                    <span>🌸</span>
                    <span>Customize Live Anime Parsing Companions</span>
                  </h4>
                  <p className="text-slate-505 text-[11px] leading-relaxed select-none text-left">
                    Give customized personal face details to our compiler study space! Paste any high-resolution image URL to instantly custom render Rin-chan and Alice-chan.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1 text-left">
                      <label className="block text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <span>🧠</span> Rin (Black Hair/Dev) URL:
                      </label>
                      <input
                        type="text"
                        value={rinImageUrl}
                        onChange={(e) => setRinImageUrl(e.target.value)}
                        placeholder="Paste image web address (https://...)"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-slate-700 bg-white"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="block text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <span>📣</span> Alice (Blonde Hair/AI) URL:
                      </label>
                      <input
                        type="text"
                        value={aliceImageUrl}
                        onChange={(e) => setAliceImageUrl(e.target.value)}
                        placeholder="Paste image web address (https://...)"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-slate-700 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Save and Reset Commands */}
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer hover:scale-[1.01]"
                  >
                    {saveStatus === "saved" ? (
                      <>
                        <Check size={13} strokeWidth={3} />
                        <span>All Changes Saved!</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={13} />
                        <span>Save Settings</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>

                {saveStatus === "saved" && (
                  <p className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1.5 py-2 bg-emerald-50 border border-emerald-100 px-3 rounded-lg text-left shadow-2xs">
                    ✓ Configuration saved successfully! Your dedicated API Key will now handle all upcoming mock translations with massive speed, completely separate from global limits.
                  </p>
                )}
                {saveStatus === "cleared" && (
                  <p className="text-[10.5px] text-indigo-700 font-bold flex items-center gap-1.5 py-2 bg-indigo-50 border border-indigo-100 px-3 rounded-lg text-left shadow-2xs">
                    ✓ Custom configurations cleared. Offline PDF compilation expects you to present your own dedicated Gemini key.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2.5 shadow-sm animate-shake">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <span className="font-bold">Extraction Error:</span> {errorMsg}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-linear-to-b from-amber-50/40 via-white to-orange-50/20 rounded-2xl border-2 border-amber-200/80 p-6 md:p-8 text-center shadow-xl relative overflow-hidden select-none text-slate-800 min-h-[460px]">
          {/* Custom style injection for high-performance pure-CSS animations */}
          <style>{`
            @keyframes scan-beam {
              0%, 100% { top: 0%; opacity: 0.8; }
              50% { top: 100%; opacity: 0.8; }
            }
            @keyframes bounce-cozy {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
            @keyframes float-cozy {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            @keyframes pulse-cozy {
              0%, 100% { transform: scale(3D); }
              50% { transform: scale(1.03); }
            }
            @keyframes tilt-cozy {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(3deg); }
            }
            @keyframes float-particle {
              0% { transform: translateY(15px) translateX(0px); opacity: 0; }
              40% { opacity: 0.95; }
              80% { opacity: 0.95; }
              100% { transform: translateY(-60px) translateX(var(--float-x, 15px)); opacity: 0; }
            }
            @keyframes rise-steam {
              0% { transform: translateY(0) scale(0.9); opacity: 0; }
              50% { opacity: 0.7; }
              100% { transform: translateY(-15px) scale(1.15); opacity: 0; }
            }
          `}</style>

          {/* Growing Ambient Background Circles */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Cute header layout */}
          <div className="flex flex-col items-center mb-6">
            <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 border border-rose-100 px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Cozy AI Study Room (Parsing in Progress...)
            </div>
            
            {/* Dynamic In-App Warning Banner - matches exact user requirements */}
            {parsedPaperCount >= 2 && (
              <div className="mt-3 w-full max-w-lg p-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-xl shadow-md text-xs font-bold text-center border border-amber-300 animate-pulse relative overflow-hidden">
                📢 You've parsed 2 mocks! you should continue practicing, by credits now pakages are limited
              </div>
            )}

            <h3 className="text-base font-black text-slate-800 tracking-tight mt-2 flex items-center gap-1.5">
              <span>🌸</span> Live Test Compiler Room <span>🌸</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
              Rin is compiling the mock paper with Gemini AI while Alice keeps her company!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch text-left">
            {/* LEFT SIDE: Chat dialogue room (lg:col-span-6) */}
            <div className="lg:col-span-7 bg-white/40 border border-slate-100 rounded-2xl p-4 md:p-5 flex flex-col justify-between min-h-[320px] space-y-4 shadow-xs">
              
              <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100/50 pb-1.5 mb-1 select-none">
                💬 AI Compiler Banter chat
              </div>

              {/* REAL-TIME MINI COMIC DIALOGUE FEED */}
              <div className="flex-1 flex flex-col justify-center space-y-4 py-1 select-text">
                
                {/* 1. Rin Dialogue (Interactive) */}
                <div className="flex gap-3 items-start select-text">
                  <div className="shrink-0 flex flex-col items-center select-none">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shadow-xs relative">
                      {/* Stylized dark-hair chibi avatar */}
                      <svg viewBox="0 0 35 35" className="w-full h-full">
                        <circle cx="17.5" cy="17.5" r="16" fill="#1e293b" />
                        <circle cx="17.5" cy="19.5" r="9.5" fill="#ffe4e6" />
                        {/* hair */}
                        <path d="M 7,12 Q 17.5,3 28,12 Q 26,16 17.5,13 Q 9,16 7,12" fill="#1e293b" />
                        <circle cx="14" cy="19" r="1.8" fill="#1d4ed8" />
                        <circle cx="21" cy="19" r="1.8" fill="#1d4ed8" />
                        <path d="M 16,24 Q 17.5,25.5 19,24" stroke="#ea580c" strokeWidth="0.8" fill="none" />
                      </svg>
                      {/* Active typing dot badge */}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-slate-900 animate-ping" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full border border-slate-900" />
                    </div>
                    <span className="text-[8px] font-black text-slate-500 mt-1 uppercase tracking-tight">Rin (Dev)</span>
                  </div>
                  
                  <div className="flex-1 bg-sky-50 border border-sky-100/80 text-left relative p-2.5 rounded-2xl rounded-tl-sm text-[11px] leading-relaxed text-slate-700 shadow-xs">
                    {/* Tail */}
                    <div className="absolute left-0 top-3 w-1.5 h-1.5 bg-sky-50 border-l border-b border-sky-100 rotate-45 -translate-x-[4.5px]" />
                    <span className="text-[8px] font-black text-sky-600 block mb-0.5 uppercase tracking-wider">⚡ SECTION EXTRACTOR ACTION</span>
                    <p className="font-bold text-slate-800 font-sans">{rinDialogue}</p>
                  </div>
                </div>

                {/* 2. Alice Dialogue (Randomized) */}
                <div className="flex gap-3 items-start flex-row-reverse select-text">
                  <div className="shrink-0 flex flex-col items-center select-none">
                    <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center overflow-hidden shadow-xs relative">
                      {/* Stylized blonde chibi avatar */}
                      <svg viewBox="0 0 35 35" className="w-full h-full">
                        <circle cx="17.5" cy="17.5" r="16" fill="#fef08a" />
                        <circle cx="17.5" cy="19.5" r="9.5" fill="#fff1f2" />
                        <path d="M 7,12 Q 17.5,3 28,12 Q 26,15 17.5,13.5 Q 9,15 7,12" fill="#fde047" />
                        <circle cx="14" cy="19" r="1.8" fill="#0891b2" />
                        <circle cx="21" cy="19" r="1.8" fill="#0891b2" />
                        <path d="M 16,24 Q 17.5,25.5 19,24" stroke="#db2777" strokeWidth="1" fill="none" />
                      </svg>
                      {/* Active icon badge */}
                      <span className="absolute -bottom-0.5 -right-0.5 text-[9px] drop-shadow-xs select-none">
                        {aliceAction === "ramen" ? "🍜" :
                         aliceAction === "sleeping" ? "😴" :
                         aliceAction === "boba" ? "🧋" :
                         aliceAction === "peace" ? "✌️" : "📣"}
                      </span>
                    </div>
                    <span className="text-[8px] font-black text-amber-600 mt-1 uppercase tracking-tight">Alice (AI)</span>
                  </div>
                  
                  <div className="flex-1 bg-amber-50/70 border border-amber-100 text-left relative p-2.5 rounded-2xl rounded-tr-sm text-[11px] leading-relaxed text-slate-700 shadow-xs">
                    {/* Tail */}
                    <div className="absolute right-0 top-3 w-1.5 h-1.5 bg-amber-50/70 border-r border-t border-amber-100 rotate-45 translate-x-[4.5px]" />
                    <span className="text-[8px] font-black text-amber-500 block mb-0.5 uppercase tracking-wider">🌸 COMPANION CHAT</span>
                    <p className="font-semibold text-slate-800 italic">"{aliceDialogue}"</p>
                  </div>
                </div>

              </div>

              {/* Status footer */}
              <div className="text-[9px] text-slate-400 select-none">
                💡 Mini dialogues update reactively in real-time as sections are processed.
              </div>
            </div>

            {/* RIGHT SIDE: Simplified Progress Board (lg:col-span-5) */}
            <div className="lg:col-span-5 flex flex-col justify-between min-h-[320px] space-y-4">
              
              {/* PROGRESS DECK (Clean and easy to digest) */}
              <div className="bg-white/80 border border-amber-100/70 p-3.5 rounded-xl shadow-xs space-y-2 text-xs select-none">
                <div className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest border-b border-amber-100 pb-1 flex justify-between items-center mb-1">
                  <span>📚 Subject Compiling Board</span>
                  <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black">
                    Extracted: {extractedCount.Physics + extractedCount.Chemistry + extractedCount.Mathematics}/75
                  </span>
                </div>

                {isMappingLayout && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg animate-pulse my-2 flex items-start gap-2.5 shadow-xs text-left">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] text-indigo-950 leading-relaxed">
                      <span className="font-extrabold text-indigo-900 block uppercase tracking-wide">🔍 STEP 1: INDEXING EXAM BOOKLET LAYOUT</span>
                      <span className="text-indigo-800/95 font-medium block mt-0.5">
                        Gemini-3.5-Flash is scanning the entire mock test PDF to identify and map the page boundaries between the Physics, Chemistry, and Mathematics sections.
                      </span>
                      <span className="text-indigo-700/90 font-semibold block mt-1">
                        🚀 Note: This is an intensive initial process (~15-20s) to guarantee 100% extraction accuracy and prevent overlapping questions. Slicing pipelines are being initialized in parallel!
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { name: "Physics", count: extractedCount.Physics, label: "Physics (20 MCQs + 5 NATs)", icon: "⚛️" },
                    { name: "Chemistry", count: extractedCount.Chemistry, label: "Chemistry (20 MCQs + 5 NATs)", icon: "🧪" },
                    { name: "Mathematics", count: extractedCount.Mathematics, label: "Mathematics (20 MCQs + 5 NATs)", icon: "📐" }
                  ].map((sub) => {
                    const status = subjectProgress[sub.name as keyof typeof subjectProgress];
                    return (
                      <div key={sub.name} className="flex flex-col gap-1.5 py-2 px-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm select-none">{sub.icon}</span>
                            <span className="font-bold text-slate-700 text-[11px] truncate tracking-tight">{sub.label}</span>
                          </div>
                          
                          <div>
                            {status === "running" && (
                              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 leading-none">
                                  {subjectPercent[sub.name] || 0}%
                                </span>
                                <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                                  {isMappingLayout && sub.name === "Physics" ? "Mapping Booklet..." : "Compiling..."}
                                </span>
                              </div>
                            )}
                            {status === "done" && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                ✓ {sub.count} Questions (100%)
                              </span>
                            )}
                            {status === "idle" && (
                              <span className="text-[9px] bg-slate-100 text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">
                                In Queue
                              </span>
                            )}
                            {status === "error" && (
                              <span className="text-[9px] bg-rose-100 text-rose-500 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                                Warning / Review
                              </span>
                            )}
                          </div>
                        </div>
                        {(status === "running" || status === "done" || status === "error") && (
                          <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ease-out rounded-full ${status === "done" ? "bg-emerald-500" : status === "error" ? "bg-rose-400" : "bg-indigo-600"}`}
                              style={{ width: `${status === "done" ? 100 : (subjectPercent[sub.name] || 0)}%` }}
                            />
                          </div>
                        )}

                        {/* 4-Track Parallel Segment visualizer (ONLY if loaded and active) */}
                        {partsProgress[sub.name] && partsProgress[sub.name].length > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-left">
                            <span className="text-[9px] font-black tracking-wider text-indigo-600 block mb-1 uppercase">⚡ 2-PART PARALLEL EXTRACTION GRID:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                              {partsProgress[sub.name].map((part) => {
                                return (
                                  <div 
                                    key={part.partIndex} 
                                    className={`p-1 rounded text-[8px] flex flex-col justify-between items-stretch border transition-all duration-200 ${
                                      part.status === "done" ? "bg-emerald-50/70 border-emerald-200 text-emerald-800" :
                                      part.status === "running" ? "bg-indigo-50 border-indigo-300 text-indigo-900 animate-pulse font-bold" :
                                      part.status === "error" ? "bg-rose-50 border-rose-300 text-rose-800 font-medium" :
                                      "bg-slate-100 border-slate-200 text-slate-400"
                                    }`}
                                  >
                                    <div className="flex justify-between items-center font-mono font-bold">
                                      <span>T#{part.partIndex + 1}</span>
                                      <span>
                                        {part.status === "done" ? "🟢" :
                                         part.status === "running" ? "⏳" :
                                         part.status === "error" ? "🔴" : "⚪"}
                                      </span>
                                    </div>
                                    <div className="font-semibold text-[8px] tracking-tight mt-0.5 truncate" title={part.rangeStr}>
                                      {part.rangeStr.replace("Questions ", "Q")}
                                    </div>

                                    {/* Detailed status action or error context */}
                                    {part.status === "error" && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleRetryPart(sub.name as "Physics" | "Chemistry" | "Mathematics", part.partIndex);
                                        }}
                                        className="mt-1 py-0.5 px-1 bg-rose-600 text-white rounded font-extrabold cursor-pointer text-[7px] text-center hover:bg-rose-700 active:scale-95 transition-all uppercase tracking-tighter"
                                      >
                                        Retry Part
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Manual Compilation launcher (only if custom key parallel mode is active) */}
                {(Object.values(partsProgress) as PartStatus[][]).some(list => list.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-amber-100 bg-amber-50/40 p-3 rounded-lg flex flex-col space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">⚡ HIGH-SPEED PARSING WORKSPACE</span>
                        <p className="text-[11px] font-bold text-slate-700">
                          Compiled: <span className="text-indigo-600 bg-indigo-50 font-black px-1.5 py-0.5 rounded font-mono">{getCompiledQuestions().length}</span> / 75 questions
                        </p>
                      </div>
                      
                      <div>
                        {(Object.values(partsProgress) as PartStatus[][]).flatMap(l => l).some(p => p.status === "error") ? (
                          <span className="text-[8px] bg-rose-100 text-rose-700 border border-rose-200 font-extrabold px-1.5 py-0.5 rounded uppercase animate-pulse">
                            ⚠️ Some tracks failed
                          </span>
                        ) : (Object.values(partsProgress) as PartStatus[][]).flatMap(l => l).every(p => p.status === "done") ? (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold px-1.5 py-0.5 rounded uppercase">
                            ✓ All clean! (100%)
                          </span>
                        ) : (
                          <span className="text-[8px] bg-indigo-100 text-indigo-800 border border-indigo-200 font-extrabold px-1.5 py-0.5 rounded uppercase animate-pulse">
                            ⏳ Parsing tracks...
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-normal">
                      {(Object.values(partsProgress) as PartStatus[][]).flatMap(l => l).some(p => p.status === "error") 
                        ? "Some parallel sections had rate limits or transient errors. Try clicking 'Retry Part' on failed red tiles to resolve them. You can also click below to proceed into the CBT simulator with the successfully parsed questions subset!"
                        : "All 12-track parallel pipelines finished! Click below to load your comprehensive Mock Test with perfect formatting!"}
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const finalAll = getCompiledQuestions();
                        if (finalAll.length === 0) {
                          alert("No questions have been successfully extracted yet. Please resolve error tracks or wait for completions!");
                          return;
                        }
                        onTestLoaded(fileName || "JEE Mains Custom Key Mock Test", finalAll);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all uppercase tracking-wider ${
                        (Object.values(partsProgress) as PartStatus[][]).flatMap(l => l).some(p => p.status === "error")
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10"
                      }`}
                    >
                      <span>🚀 Launch Mock Test Simulator ({getCompiledQuestions().length} Qs)</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* LIVE COZY FOCUS & REAL-TIME PARSING CONSOLE */}
              <div className="space-y-2 select-none">
                <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-lg text-left">
                  <p className="text-[10px] text-indigo-700 leading-relaxed font-bold flex items-center gap-1.5">
                    <span>💡</span> Live Focus Details: {loadingStep}
                  </p>
                </div>

                {liveLogs && liveLogs.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-left flex flex-col font-mono text-[10px]">
                    <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                        <span>Live Extraction Engine Console</span>
                      </div>
                      <span className="text-slate-500 font-mono text-[8px]">ACTIVE PROCESS</span>
                    </div>
                    <div className="p-2.5 max-h-32 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 text-slate-300">
                      {liveLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-1.5 leading-normal">
                          <span className="text-slate-500 text-[8px] mt-0.5 select-none font-mono">[{log.time}]</span>
                          <span className={`font-semibold ${
                            log.type === "success" ? "text-emerald-400" :
                            log.type === "warning" ? "text-amber-400" :
                            log.type === "error" ? "text-rose-400" :
                            "text-slate-300"
                          }`}>
                            {log.msg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* Uploader Card */}
          <motion.div
            className={`md:col-span-7 lg:col-span-8 bg-white rounded-xl border-2 border-dashed ${
              dragActive ? "border-blue-500 bg-blue-50/40" : "border-slate-300 hover:border-slate-400"
            } p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer shadow-xs min-h-[350px] relative`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: dragActive ? 1.03 : 1,
              borderColor: dragActive ? "rgb(59, 130, 246)" : "rgb(203, 213, 225)"
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            whileHover={{ scale: dragActive ? 1.03 : 1.01 }}
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
              animate={{ y: dragActive ? -10 : 0 }}
              className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-4 shadow-inner border border-slate-100"
            >
              <Upload size={22} className="text-slate-600" />
            </motion.div>

            <div className="font-bold text-sm text-slate-700">
              Drag & Drop PDF Mock Test File
            </div>
            <p className="text-xs text-slate-400 mt-1.5 max-w-[280px]">
              Supports standard Exam PDFs. Missing an answer key? No problem! The platform will auto-generate keys, marks, and explanations.
            </p>

            <button
              type="button"
              className="mt-5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-md shadow-blue-100 transition cursor-pointer"
            >
              Select PDF File
            </button>
          </motion.div>

          {/* Quick Preset Presets Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            whileHover={{ y: -4, borderColor: "rgba(59, 130, 246, 0.4)" }}
            className="md:col-span-5 lg:col-span-4 bg-slate-900 text-slate-100 rounded-xl p-5 flex flex-col justify-between shadow-lg border border-slate-800 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-4">
                <div className="flex items-center gap-1.5 text-blue-400 text-[10.5px] font-bold uppercase tracking-wider">
                  <Database size={13} />
                  <span>Instant Playgrounds</span>
                </div>
                <span className="text-[8px] bg-indigo-950 text-blue-300 border border-blue-800/40 px-1.5 py-0.5 rounded-full font-mono font-extrabold uppercase">
                  Free CBT Access
                </span>
              </div>

              <div className="text-left space-y-3">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1">
                  <span>📚 Benchmark Mock Test</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Instantly experience an authentic NTA CBT exam without any PDF upload. Features calibrated standard-quality physics mechanics, chemical equilibrium, and coordinate math questions.
                </p>

                <div className="bg-slate-800/50 p-3.5 rounded-lg border border-slate-800 select-text space-y-2">
                  <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Prescribed Syllabus Paper</div>
                  <div className="font-semibold text-xs text-white">Full Syllabus JEE Main Mock Test</div>
                  <div className="text-[10.5px] text-slate-400 space-y-1">
                    <div>• Physics (MCQ + Numerical Key)</div>
                    <div>• Chemistry (MCQ + Numerical Key)</div>
                    <div>• Mathematics (MCQ + Numerical Key)</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={selectPreset}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.01] text-white font-bold text-xs rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/20 active:scale-[0.99]"
            >
              <span>Launch Calibrated Simulator</span>
              <ArrowRight size={13} />
            </button>
          </motion.div>
        </div>
      )}

      {/* Quick guide */}
      <div className="mt-12 border-t pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-500 select-text text-xs leading-relaxed">
        <div className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition">
          <h4 className="font-bold text-slate-700 text-[13px] mb-2 flex items-center gap-1.5">
            <span>⚙️</span> Standard NTA CBT Replica
          </h4>
          The engine mimics the exact interface used in real JEE Mains centers, complete with the legend palette indices, timers, instructions, and save workflows.
        </div>
        <div className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition">
          <h4 className="font-bold text-slate-700 text-[13px] mb-2 flex items-center gap-1.5">
            <span>➗</span> Formulas with LaTeX
          </h4>
          Gemini automatically translates complicated mathematical vectors, chemistry stoichiometry elements, and coordinate layouts into clear-drawn math.
        </div>
        <div className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition">
          <h4 className="font-bold text-slate-700 text-[13px] mb-2 flex items-center gap-1.5">
            <span>📊</span> In-Depth Analytics
          </h4>
          Get granular subject statistics, correctness trackers, topic-wise accuracy metrics, and time-overrun diagnostics.
        </div>
      </div>

      {/* BENEFIT UNLOCKED MODAL POPUP */}
      {showBenefitsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md transition-all">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Cool background visual flair */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />
            
            <div className="p-6 md:p-8 text-center space-y-6">
              {/* Success Badge */}
              <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <Sparkles size={32} className="animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  🎉 Custom API Key Successfully Loaded!
                </h3>
                <p className="text-xs text-emerald-400/90 font-semibold uppercase tracking-wider font-mono">
                  DEDICATED VIP LANE ACTIVATED
                </p>
                <div className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  You've successfully secured your custom AI credentials. Our Alice settlement system has verified and loaded the model credentials into your browser's private sandbox slot.
                </div>
              </div>

              {/* List of Benefits */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-left space-y-3.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Unlocked Platform Powers:
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex gap-2.5 items-start text-xs">
                    <span className="shrink-0 text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded text-[10px]">4X FASTER</span>
                    <p className="text-slate-300"><strong className="text-white">Blazing-Fast Extraction:</strong> Enables high-resolution parallel subject parsing (Physics, Chemistry, Mathematics) running side-by-side concurrently without standard rate bottlenecks.</p>
                  </div>
                  <div className="flex gap-2.5 items-start text-xs">
                    <span className="shrink-0 text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded text-[10px]">15 RPM</span>
                    <p className="text-slate-300"><strong className="text-white">Isolated Quota Cap:</strong> Grants a completely private usage slot assigned directly from Google AI Studio. Say goodbye to shared proxy congestions and "429 Too Many Requests" locks.</p>
                  </div>
                  <div className="flex gap-2.5 items-start text-xs">
                    <span className="shrink-0 text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded text-[10px]">₹0 BILL</span>
                    <p className="text-slate-300"><strong className="text-white">100% Free Forever:</strong> Your personal API key runs natively under Google's permanently free student service plans. You keep full control of your costs and limits.</p>
                  </div>
                  <div className="flex gap-2.5 items-start text-xs">
                    <span className="shrink-0 text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded text-[10px]/none">🔒 PRIVATE</span>
                    <p className="text-slate-300"><strong className="text-white">Ultimate Shielded Security:</strong> Your keys are cached inside your secure local browser sandboxed storage. They never travel to nor get logged on any external servers.</p>
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
