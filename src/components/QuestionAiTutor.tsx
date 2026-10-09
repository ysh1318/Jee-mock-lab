import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Key, Loader2, AlertCircle, 
  ExternalLink, Copy, Check, X,
  BookOpen, Compass, Layers, ShieldCheck
} from "lucide-react";
import { Question, Section } from "../types";
import { MarkdownMath } from "./MathText";

interface QuestionAiTutorProps {
  question: Question;
  userResponse?: string;
  markingStatus?: "Correct" | "Incorrect" | "Unattempted";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface AnalyticalMode {
  id: string;
  label: string;
  inquiry: string;
}

const ANALYTICAL_MODES: AnalyticalMode[] = [
  {
    id: "derivation",
    label: "Formal Derivation",
    inquiry: "Provide a formal step-by-step mathematical derivation from first principles, stating every governing law and intermediate algebraic transformation.",
  },
  {
    id: "alternative",
    label: "Alternative Solution Method",
    inquiry: "Demonstrate an alternative analytical method for this problem (such as symmetry arguments, graphical analysis, or dimensional checks) suitable for timed examination conditions.",
  },
  {
    id: "distractors",
    label: "Distractor Analysis",
    inquiry: "Analyze the incorrect options (distractors). For each wrong choice, identify the specific conceptual misconception, algebraic error, or sign convention slip that produces that result.",
  },
  {
    id: "theory",
    label: "Theoretical Foundations",
    inquiry: "State the foundational physical or mathematical theorems, boundary conditions, and domain approximations governing this problem.",
  },
];

async function callGeminiTutor(
  apiKey: string,
  question: Question,
  userResponse: string | undefined,
  messagesHistory: ChatMessage[],
  userPrompt: string
): Promise<string> {
  // 1. Primary execution via /api/tutor/inquire endpoint using server GoogleGenAI SDK with circular model fallback
  try {
    const res = await fetch("/api/tutor/inquire", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-gemini-api-key": apiKey.trim() } : {}),
      },
      body: JSON.stringify({
        question,
        userResponse,
        messages: messagesHistory,
        inquiry: userPrompt,
        apiKey: apiKey?.trim(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        return data.reply;
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 429) {
          throw new Error(errData.error);
        }
      }
    }
  } catch (backendErr: any) {
    if (backendErr.message && !backendErr.message.includes("Failed to fetch") && !backendErr.message.includes("500")) {
      throw backendErr;
    }
  }

  // 2. Direct client fallback using active production models (excluding deprecated gemini-1.5-flash)
  const systemPrompt = `You are a distinguished senior academic faculty member in ${question.subject} specializing in competitive entrance examinations (JEE Advanced / JEE Main).
A candidate is auditing Question ${question.questionNumber} from their computer-based examination.

PROBLEM CONTEXT:
${question.questionText}

${question.options && question.options.length > 0 ? `OPTIONS:\n${question.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join("\n")}` : ""}

OFFICIAL ANSWER KEY: ${question.section === Section.A ? `Option ${question.correctAnswer}` : question.correctAnswer}
CANDIDATE RESPONSE: ${userResponse ? userResponse : "Unattempted"}
INITIAL SOLUTION SUMMARY: ${question.explanation || "N/A"}

ACADEMIC STANDARDS:
1. Maintain rigorous scientific and mathematical precision.
2. Render all mathematical equations using standard LaTeX syntax. Wrap all inline math within single dollar signs ($...$) and block equations within double dollar signs ($$...$$). Never output raw unformatted equations.
3. Structure your response with concise analytical headings and clear, logically ordered deductions.
4. When examining options or errors, clearly point out the conceptual foundation or arithmetic pitfall.
5. Avoid informal colloquialisms; adopt a supportive, precise, and authoritative pedagogical tone.`;

  const contents: any[] = [];

  // Append prior message thread
  for (const msg of messagesHistory) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    });
  }

  // Append candidate inquiry
  contents.push({
    role: "user",
    parts: [{ text: userPrompt }]
  });

  const modelsToTry = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.5-flash",
  ];
  let lastErrorMsg = "";

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents,
            generationConfig: {
              temperature: 0.15,
              maxOutputTokens: 2048,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || response.statusText;
        if (response.status === 400 || response.status === 403) {
          throw new Error(`Gemini API key verification failed: ${errMsg}`);
        }
        if (response.status === 429) {
          throw new Error(`Gemini API rate limit reached. Please wait a brief moment before sending another query.`);
        }
        lastErrorMsg = errMsg;
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      if (err.message?.includes("verification failed") || err.message?.includes("rate limit")) {
        throw err;
      }
      lastErrorMsg = err.message;
    }
  }

  throw new Error(lastErrorMsg || "Unable to reach Gemini API. Please verify your network connection and API key.");
}

export function QuestionAiTutor({ question, userResponse, markingStatus }: QuestionAiTutorProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [keyInput, setKeyInput] = useState<string>("");
  const [showKeySetup, setShowKeySetup] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load custom key on mount
  useEffect(() => {
    const saved = localStorage.getItem("user_gemini_api_key") || "";
    setApiKey(saved);
    if (!saved) {
      setKeyInput("");
    }
  }, []);

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    localStorage.setItem("user_gemini_api_key", trimmed);
    setApiKey(trimmed);
    setShowKeySetup(false);
    setErrorMessage(null);
  };

  const handleClearKey = () => {
    localStorage.removeItem("user_gemini_api_key");
    setApiKey("");
    setKeyInput("");
    setShowKeySetup(true);
  };

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    if (!apiKey) {
      setShowKeySetup(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt("");
    setLoading(true);
    setErrorMessage(null);

    try {
      const reply = await callGeminiTutor(apiKey, question, userResponse, messages, trimmed);
      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: Date.now(),
      };
      setMessages([...newHistory, assistantMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate faculty analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mt-5 pt-5 border-t border-slate-800 text-left font-sans">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
            <BookOpen size={13} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
              <span>Conceptual Inquiry & Solution Audit</span>
              <span className="text-[9px] bg-slate-850 text-slate-400 font-mono font-medium px-2 py-0.5 rounded border border-slate-750">
                Client-Side Inference
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Query specific mathematical steps, request alternate derivations, or audit distractor choices.
            </p>
          </div>
        </div>

        {apiKey ? (
          <div className="flex items-center gap-2 select-none">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Key: {apiKey.slice(0, 6)}...{apiKey.slice(-4)}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowKeySetup(!showKeySetup)}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              {showKeySetup ? "Close" : "Change Key"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowKeySetup(true)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-650 text-slate-200 hover:text-white font-medium text-[10px] tracking-wider rounded transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Key size={11} className="text-amber-400" />
            <span>Configure Gemini API Key</span>
          </button>
        )}
      </div>

      {/* KEY CONFIGURATION MODAL / DRAWER */}
      {showKeySetup && (
        <div className="mb-4 p-4 bg-slate-950 rounded-xl border border-slate-800 animate-in fade-in-50 duration-150">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h5 className="text-xs font-bold text-slate-250 flex items-center gap-1.5">
                <Key size={13} className="text-amber-400" />
                <span>Google Gemini API Key Configuration</span>
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Connect your personal Gemini API key to enable unlimited question inquiries. Keys are stored strictly in client-side browser storage and never transmitted to our backend.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowKeySetup(false)}
              className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <input
              type="password"
              placeholder="Paste AIzaSy... API key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-750 focus:border-slate-500 text-white text-xs px-3.5 py-2 rounded-lg outline-hidden font-mono placeholder:text-slate-600 transition"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveKey}
                disabled={!keyInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg cursor-pointer transition shadow-2xs"
              >
                Save Configuration
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="px-3 py-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg text-xs font-medium cursor-pointer transition"
                >
                  Clear Key
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
            <span>Free Tier: 15 RPM via Google AI Studio</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline"
            >
              <span>Get API Key from Google AI Studio</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold">Inquiry Error:</span> {errorMessage}
          </div>
        </div>
      )}

      {/* STRUCTURED ANALYTICAL MODES */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none select-none text-[11px]">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mr-1 shrink-0">Analytical Modes:</span>
        {ANALYTICAL_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            disabled={loading}
            onClick={() => handleSendMessage(mode.inquiry)}
            className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 text-slate-300 hover:text-slate-100 rounded-md font-medium text-[11px] transition cursor-pointer shrink-0 disabled:opacity-40"
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* CHAT THREAD */}
      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-slate-850 border border-slate-750 text-white ml-6 text-right"
                  : "bg-slate-950 border border-slate-850 text-slate-200 mr-2"
              }`}
            >
              {msg.role === "user" ? (
                <p className="font-medium text-slate-200">{msg.content}</p>
              ) : (
                <div>
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      <span>Academic Faculty Review</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 p-0.5 rounded cursor-pointer transition"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={11} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-sans select-text">
                    <MarkdownMath text={msg.content} />
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* LOADING INDICATOR */}
      {loading && (
        <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg mb-3 flex items-center gap-2.5 text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin text-indigo-400 shrink-0" />
          <span>Generating analytical deduction via Gemini 2.5 Flash...</span>
        </div>
      )}

      {/* INQUIRY INPUT FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputPrompt);
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={apiKey ? "Specify conceptual inquiry or mathematical step to review..." : "Configure a free Gemini API key to submit inquiries..."}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 focus:border-slate-650 text-white text-xs px-3.5 py-2.5 rounded-lg outline-hidden placeholder:text-slate-500 transition font-sans"
          />
        </div>
        <button
          type="submit"
          disabled={!inputPrompt.trim() || loading}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-white border border-slate-700 font-medium text-xs rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-2xs shrink-0 active:scale-95"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin text-slate-400" />
          ) : (
            <Send size={13} className="text-indigo-400" />
          )}
          <span className="hidden sm:inline">Send Inquiry</span>
        </button>
      </form>
    </div>
  );
}
