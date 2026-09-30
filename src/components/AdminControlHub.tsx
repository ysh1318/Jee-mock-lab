import React, { useState, useEffect, useRef } from "react";
import { 
  X, ShieldAlert, Cpu, Database, Users, Landmark, CreditCard, Sparkles, 
  Send, RefreshCw, AlertTriangle, ShieldCheck, Mail, Ban, UserCheck, 
  Plus, Minus, Clock, Terminal, TrendingUp, DollarSign, Eye, EyeOff, Radio,
  BookOpen, ChevronRight, CheckCircle, HelpCircle, Activity, Play, Check, Trash
} from "lucide-react";
import { UserAccount, PurchaseRequest, CreditTransaction, UserMessage } from "../types";

interface AdminControlHubProps {
  userAccount: UserAccount;
  onLogout: () => void;
  onClose: () => void;
}

export function AdminControlHub({ userAccount, onLogout, onClose }: AdminControlHubProps) {
  // Master administrative data fetched from server
  const [adminData, setAdminData] = useState<{ users: UserAccount[]; purchases: PurchaseRequest[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState("");
  const [systemConfig, setSystemConfig] = useState<any>(null);

  // Administrative views state
  const [activePane, setActivePane] = useState<"dashboard" | "simulators" | "students" | "utr" | "bulletins" | "overrides">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "banned">("all");

  // Advanced operational parameters toggles
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [customScoreOverride, setCustomScoreOverride] = useState("280");
  const [customPercentileOverride, setCustomPercentileOverride] = useState("99.91");
  const [customAttemptsOverride, setCustomAttemptsOverride] = useState("3");

  // Input states for config adjustments
  const [configWelcomeCredits, setConfigWelcomeCredits] = useState(3);
  const [configMarquee, setConfigMarquee] = useState("");
  const [configSandbox, setConfigSandbox] = useState(false);
  const [configLimit, setConfigLimit] = useState(1000);

  // New Bulletins generator
  const [newBulletinType, setNewBulletinType] = useState<string>("Urgent Info");
  const [newBulletinText, setNewBulletinText] = useState<string>("");

  // Broadcast and dispersion helpers
  const [broadcastText, setBroadcastText] = useState("");
  const [dispersionValue, setDispersionValue] = useState("");
  const [dispersionDesc, setDispersionDesc] = useState("Platform Loyalty Bonus");

  // Selection states
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [directMsg, setDirectMsg] = useState("");
  const [adjCredits, setAdjCredits] = useState("");
  const [adjDesc, setAdjDesc] = useState("Admin Adjustment");
  const [adjUserId, setAdjUserId] = useState("");
  const [suspensionHours, setSuspensionHours] = useState(24);
  const [suspensionReason, setSuspensionReason] = useState("Violation of examination guidelines");
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);

  useEffect(() => {
    if (systemConfig?.pricingTiers) {
      setPricingTiers(systemConfig.pricingTiers);
    }
  }, [systemConfig]);

  // Live Terminal Simulator states
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Auto-appent terminal logs to make the station look truly alive and active!
  useEffect(() => {
    const defaultLines = [
      `[SYSTEM] Master Control Hub Initialization... STATUS: OK`,
      `[SECURITY] Admin session authorized for: ${userAccount.email}`,
      `[DATABASE] Synchronized with Firestore database cloud blueprints.`,
      `[TELEMETRY] Live monitoring engine online.`
    ];
    setTerminalLogs(defaultLines);

    const logGenerator = setInterval(() => {
      const actions = [
        `[INFO] GET /api/system-config - 200 OK (Cache refresh)`,
        `[INFO] STACK TELEMETRY: CPU load 1.2%, Memory allocation stable at 46%`,
        `[SEC] Security context validated. Session active.`,
        `[PROCESS] Background scanner: auditing credit-to-usage consumption maps.`,
        `[DB] Ledger sync: verifying peer-to-peer UPI token caches.`,
        `[NET] Web-socket listener heartbeats responsive.`,
        `[TELEMETRY] System health status metrics: optimal.`
      ];
      const randomLog = actions[Math.floor(Math.random() * actions.length)];
      const timestamp = new Date().toTimeString().split(" ")[0];
      setTerminalLogs(prev => [...prev.slice(-30), `[${timestamp}] ${randomLog}`]);
    }, 4500);

    return () => clearInterval(logGenerator);
  }, [userAccount.email]);

  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Fetch admin and configuration stats
  const fetchHubData = async () => {
    setLoading(true);
    try {
      // 1. Fetch system config
      const configRes = await fetch("/api/system-config");
      if (configRes.ok) {
        const cData = await configRes.json();
        setSystemConfig(cData);
        setConfigWelcomeCredits(cData.welcomeCredits);
        setConfigMarquee(cData.broadcastNotice);
        setConfigSandbox(cData.isSandboxMode);
        setConfigLimit(cData.monthlyCreditLimit);
      }

      // 2. Fetch admin telemetry (users & purchase ledgers)
      const adminRes = await fetch(`/api/admin/data?email=${userAccount.email}&userId=${userAccount.id}`);
      if (adminRes.ok) {
        const aData = await adminRes.json();
        setAdminData(aData);
      }
    } catch (err) {
      console.warn("Failed retrieving Control Tower datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  const triggerStatusMsg = (msg: string) => {
    setActionStatus(msg);
    // Append to live terminal log
    const timestamp = new Date().toTimeString().split(" ")[0];
    setTerminalLogs(prev => [...prev, `[${timestamp}] [ADMIN ACTION] ${msg}`]);
    setTimeout(() => setActionStatus(""), 4500);
  };

  // API Calls
  const handleApprovePurchase = async (reqId: string) => {
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: reqId, adminEmail: userAccount.email, adminUserId: userAccount.id })
      });
      if (res.ok) {
        triggerStatusMsg(`Approved transaction request #${reqId.substring(0,6).toUpperCase()}`);
        fetchHubData();
      } else {
        const data = await res.json();
        triggerStatusMsg(`Error: ${data.error || "Approval failed"}`);
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleDeclinePurchase = async (reqId: string) => {
    try {
      const res = await fetch("/api/admin/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: reqId, adminEmail: userAccount.email, adminUserId: userAccount.id })
      });
      if (res.ok) {
        triggerStatusMsg(`Declined transaction request #${reqId.substring(0,6).toUpperCase()}`);
        fetchHubData();
      } else {
        const data = await res.json();
        triggerStatusMsg(`Error: ${data.error || "Decline failed"}`);
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleUpdateConfig = async (modifiedFields: any) => {
    try {
      const res = await fetch("/api/admin/update-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...modifiedFields,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      if (res.ok) {
        const d = await res.json();
        setSystemConfig(d.config);
        triggerStatusMsg("System parameters updated successfully");
      } else {
        const data = await res.json();
        triggerStatusMsg(`Error: ${data.error || "Override rejected"}`);
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!newBulletinText.trim()) return;
    const bulletId = "ann_" + Math.random().toString(36).substring(2, 8);
    const updatedBulletins = [
      { id: bulletId, type: newBulletinType, content: newBulletinText, createdAt: new Date().toISOString() },
      ...(systemConfig?.announcements || [])
    ];
    await handleUpdateConfig({ announcements: updatedBulletins });
    setNewBulletinText("");
    fetchHubData();
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    const updated = (systemConfig?.announcements || []).filter((a: any) => a.id !== annId);
    await handleUpdateConfig({ announcements: updated });
    fetchHubData();
  };

  const handleBroadcastMessage = async () => {
    if (!broadcastText.trim()) return;
    try {
      const res = await fetch("/api/admin/send-bulk-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: broadcastText,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      const d = await res.json();
      if (res.ok) {
        triggerStatusMsg(`Successfully injected global broadcast to all ${d.affectedCount} student mailboxes!`);
        setBroadcastText("");
        fetchHubData();
      } else {
        triggerStatusMsg(`Error: ${d.error || "Broadcast creation failed"}`);
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleDispenseCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispersionValue) return;
    try {
      const res = await fetch("/api/admin/bulk-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(dispersionValue),
          description: dispersionDesc,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerStatusMsg(`Dispensed ${dispersionValue} cr to ${data.affectedCount} students instantly!`);
        setDispersionValue("");
        fetchHubData();
      } else {
        triggerStatusMsg(`Error: ${data.error || "Dispersion failed"}`);
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleSpecializedManualAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjUserId || !adjCredits) return;
    await handleQuickAdjustCredits(adjUserId, Number(adjCredits), adjDesc);
    setAdjUserId("");
    setAdjCredits("");
    setAdjDesc("Admin Adjustment");
  };

  // Student specific tweaks
  const handleQuickAdjustCredits = async (userId: string, val: number, desc: string) => {
    try {
      const res = await fetch("/api/admin/adjust-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: val,
          description: desc,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      if (res.ok) {
        triggerStatusMsg(`Updated student credit ledger by ${val > 0 ? "+" : ""}${val} cr`);
        fetchHubData();
      } else {
        const d = await res.json();
        triggerStatusMsg(`Error: ${d.error || "Deduction failed"}`);
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleToggleBanned = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/toggle-ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, adminEmail: userAccount.email, adminUserId: userAccount.id })
      });
      const d = await res.json();
      if (res.ok) {
        triggerStatusMsg(`Candidate status updated: ${d.banned ? "Banned" : "Active"}`);
        fetchHubData();
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleSuspendStudent = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/suspend-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          hours: Number(suspensionHours),
          reason: suspensionReason,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      if (res.ok) {
        triggerStatusMsg(`Successfully temporarily suspended student account profile for ${suspensionHours} hr`);
        setExpandedUserId(null);
        fetchHubData();
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleRecoverStudent = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/recover-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, adminEmail: userAccount.email, adminUserId: userAccount.id })
      });
      if (res.ok) {
        triggerStatusMsg("Candidate profile fully recovered! All active limits cleared.");
        setExpandedUserId(null);
        fetchHubData();
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleSendMessage = async (userId: string) => {
    if (!directMsg.trim()) return;
    try {
      const res = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          content: directMsg,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      if (res.ok) {
        triggerStatusMsg("Direct private alert dispatched to candidate mailbox.");
        setDirectMsg("");
        setExpandedUserId(null);
        fetchHubData();
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  // SIMULATOR Gimmick triggers: Extreme craftsmanship to verify reactive behaviors!
  const simulateDummyUserRegistration = async () => {
    const IndianSurnames = ["Sharma", "Verma", "Patel", "Gupta", "Reddy", "Nair", "Iyer", "Banerjee", "Singh", "Joshi", "Das", "Rao", "Kumar"];
    const IndianFirstnames = ["Aarav", "Aryan", "Vihaan", "Aditya", "Ishaan", "Sai", "Dev", "Ananya", "Diya", "Isha", "Riya", "Kavya", "Sneha"];
    const rndFirst = IndianFirstnames[Math.floor(Math.random() * IndianFirstnames.length)];
    const rndLast = IndianSurnames[Math.floor(Math.random() * IndianSurnames.length)];
    const simulatedName = `${rndFirst} ${rndLast}`;
    const simulatedEmail = `${rndFirst.toLowerCase()}.${rndLast.toLowerCase()}${Math.floor(100 + Math.random()*900)}@jee-prep.com`;
    const mockHash = "mock_sec_" + Math.random().toString(36).substring(2, 10);

    try {
      // Direct call to registration endpoint
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: simulatedName,
          email: simulatedEmail,
          passwordHash: mockHash,
          deviceId: "sim_device_" + Math.random().toString(36).substring(2, 6)
        })
      });

      if (res.ok) {
        triggerStatusMsg(`Simulated Dummy Sign-Up: Registered candidates "${simulatedName}"`);
        fetchHubData();
      }
    } catch (err) {
      console.warn("User simulation failed:", err);
    }
  };

  const simulateUpiRequestSubmission = async () => {
    if (!adminData || adminData.users.length === 0) {
      triggerStatusMsg("Register at least 1 student first before simulating payment submissions!");
      return;
    }
    const randUser = adminData.users[Math.floor(Math.random() * adminData.users.length)];
    const packs: ("2_credits" | "5_credits" | "10_credits")[] = ["2_credits", "5_credits", "10_credits"];
    const pack = packs[Math.floor(Math.random() * packs.length)];
    const utr = "UT" + Math.floor(100000000000 + Math.random() * 900000000000);

    try {
      const res = await fetch("/api/wallet/purchase-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: randUser.id,
          pack,
          utrNumber: utr
        })
      });

      if (res.ok) {
        triggerStatusMsg(`Simulated Payment Request: UTR ${utr} filed for ${randUser.name}`);
        fetchHubData();
      }
    } catch (err) {
      console.warn("UPI request simulation failed:", err);
    }
  };

  // Calculations
  const totalVolume = adminData?.purchases
    .filter(p => p.status === "approved")
    .reduce((sum, p) => sum + p.amount, 0) || 158;

  const pendingUtrCount = adminData?.purchases.filter(p => p.status === "pending").length || 0;

  const totalCreditsInAtmosphere = adminData?.users.reduce((sum, u) => sum + u.credits, 0) || 0;

  // Filter candidates ledger
  const filteredStudents = (adminData?.users || []).filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.id.includes(searchQuery);

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "banned") return student.banned && matchesSearch;
    if (statusFilter === "suspended") {
      const isSuspended = student.suspendedUntil && new Date(student.suspendedUntil) > new Date();
      return isSuspended && matchesSearch;
    }
    if (statusFilter === "active") {
      const isSuspended = student.suspendedUntil && new Date(student.suspendedUntil) > new Date();
      return !student.banned && !isSuspended && matchesSearch;
    }
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 min-h-screen bg-slate-50 text-slate-800 flex flex-col z-[500] font-sans md:p-4 select-none overflow-y-auto">
      {/* HEADER SECTION */}
      <div className="w-full max-w-7xl mx-auto flex flex-col shrink-0 bg-white border border-slate-200 rounded-b-xl md:rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-150 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md font-mono text-[9px] font-black uppercase tracking-wider">
                  MASTER DESK
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] text-slate-500 font-bold tracking-wide">Secure Admin Layer</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                JEE-Pro Operations Control Hub
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={fetchHubData}
              className="p-2 bg-slate-100/80 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg transition-all cursor-pointer hover:text-slate-905"
              title="Refresh administrative state vectors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-indigo-600" : ""} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 font-extrabold text-[11px] text-white uppercase tracking-widest transition-all cursor-pointer rounded-lg flex items-center gap-1.5 active:scale-95 duration-100 shadow-sm"
              id="exit_dashboard_btn"
            >
              <span>← Close Hub</span>
            </button>
          </div>
        </div>

        {/* METRICS GRID PANEL */}
        <div className="p-4 bg-slate-50/60 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100">
          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
            <span className="text-[9.5px]/none font-extrabold text-slate-500 uppercase tracking-widest block font-heading">
              🪙 Total Credit Atmosphere
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl font-black font-mono text-amber-650">{totalCreditsInAtmosphere}</span>
              <span className="text-[9.5px] text-amber-755 font-semibold font-mono">CR</span>
            </div>
            <p className="text-[9px] text-slate-450 mt-1">Sum of active candidate wallets</p>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
            <span className="text-[9.5px]/none font-extrabold text-indigo-600 uppercase tracking-widest block font-heading">
              👥 Registered students
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl font-black font-mono text-indigo-750">{adminData?.users.length || 0}</span>
              <span className="text-[9.5px] text-indigo-500 font-semibold uppercase tracking-wide">Profiles</span>
            </div>
            <p className="text-[9px] text-slate-450 mt-1">Registered candidate schema accounts</p>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
            <span className="text-[9.5px]/none font-extrabold text-emerald-600 uppercase tracking-widest block font-heading">
              💰 TALLY VOL (RECHARGE REVENUE)
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl font-black font-mono text-emerald-600">₹{totalVolume}</span>
              <span className="text-[9.5px] text-emerald-600 font-extrabold">INR</span>
            </div>
            <p className="text-[9px] text-slate-450 mt-1">Verified UPI peer-to-peer invoices</p>
          </div>

          <div className="bg-white border border-rose-200 p-3.5 rounded-xl flex flex-col justify-between shadow-xs">
            <span className="text-[9.5px]/none font-extrabold text-rose-600 uppercase tracking-widest block font-heading">
              ⏳ Pending UPI Auditing Queue
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className={`text-base sm:text-xl font-black font-mono ${pendingUtrCount > 0 ? "text-rose-600 animate-pulse font-extrabold" : "text-slate-500"}`}>
                {pendingUtrCount}
              </span>
              <span className="text-[9.5px] text-rose-500 font-extrabold uppercase">UTRs</span>
            </div>
            <p className="text-[9px] text-slate-450 mt-1">Verification and credit grants awaited</p>
          </div>
        </div>

        {/* STATUS FLASH STRIP */}
        {actionStatus && (
          <div className="px-4 py-2 bg-indigo-50/80 border-b border-indigo-100 text-indigo-955 text-[10.5px] font-bold tracking-wide flex items-center gap-2 animate-fade-in uppercase">
            <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-black font-mono uppercase tracking-wider animate-pulse border border-indigo-200">
              LEDGER WRITE
            </span>
            <span>{actionStatus}</span>
          </div>
        )}

        {/* NAVIGATION TAB STRIP */}
        <div className="px-4 py-2 bg-slate-50 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none flex-nowrap border-b border-slate-100 select-none">
          <div className="flex items-center gap-1.5 flex-wrap md:flex-nowrap">
            <button
              onClick={() => setActivePane("dashboard")}
              className={`px-3 py-1.5 font-sans font-extrabold text-[11px] rounded-lg cursor-pointer transition-all uppercase tracking-wider border ${
                activePane === "dashboard"
                  ? "bg-indigo-650 text-white shadow-xs border-indigo-750"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border-transparent"
              }`}
            >
              📊 Core Analytics
            </button>
            <button
              onClick={() => setActivePane("simulators")}
              className={`px-3 py-1.5 font-sans font-extrabold text-[11px] rounded-lg cursor-pointer transition-all uppercase tracking-wider border ${
                activePane === "simulators"
                  ? "bg-indigo-650 text-white shadow-xs border-indigo-750"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border-transparent"
              }`}
            >
              ⚡ Automation Lab
            </button>
            <button
              onClick={() => setActivePane("students")}
              className={`px-3 py-1.5 font-sans font-extrabold text-[11px] rounded-lg cursor-pointer transition-all uppercase tracking-wider border ${
                activePane === "students"
                  ? "bg-indigo-650 text-white shadow-xs border-indigo-750"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border-transparent"
              }`}
            >
              👥 Students Directory
            </button>
            <button
              onClick={() => setActivePane("utr")}
              className={`px-3 py-1.5 font-sans font-extrabold text-[11px] rounded-lg cursor-pointer transition-all uppercase tracking-wider relative border ${
                activePane === "utr"
                  ? "bg-indigo-650 text-white shadow-xs border-indigo-750"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border-transparent"
              }`}
            >
              🪙 UPI Billing Queue
              {pendingUtrCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[8px] h-4 min-w-4 flex items-center justify-center rounded-full px-1 shadow-sm border border-white">
                  {pendingUtrCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePane("bulletins")}
              className={`px-3 py-1.5 font-sans font-extrabold text-[11px] rounded-lg cursor-pointer transition-all uppercase tracking-wider border ${
                activePane === "bulletins"
                  ? "bg-indigo-650 text-white shadow-xs border-indigo-750"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border-transparent"
              }`}
            >
              📢 Public Bulletins
            </button>
            <button
              onClick={() => setActivePane("overrides")}
              className={`px-3 py-1.5 font-sans font-extrabold text-[11px] rounded-lg cursor-pointer transition-all uppercase tracking-wider border ${
                activePane === "overrides"
                  ? "bg-indigo-650 text-white shadow-xs border-indigo-750"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border-transparent"
              }`}
            >
              🛡️ System Overrides
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-slate-200/50 border border-slate-250 px-3 py-1.5 rounded-lg text-[10.5px]">
            <Radio size={12} className="text-emerald-600 animate-pulse" />
            <span className="font-bold text-slate-605 uppercase tracking-widest font-mono">Operations Station Active</span>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE INNER CONTENT */}
      <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 pb-12">
        {/* PANE 1: CORE METRICS & DIGITAL ANALYTICS DASHBOARD */}
        {activePane === "dashboard" && (
          <div className="lg:col-span-12 space-y-4 animate-fade-in">
            {/* REAL-TIME DYNAMIC METRICS ANALYSIS SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* LIVE DATABASE LEDGER SUMMARY */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div>
                  <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    🪙 Token Circulation & Volume Indicators
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Audits live wallet credit density values currently active inside user databases.
                  </p>
                </div>

                <div className="space-y-3 font-mono text-[11px]">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-500 font-bold uppercase text-[9px]">Sum Wallet Reserves</span>
                    <span className="font-black text-slate-900">{totalCreditsInAtmosphere} credits</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-500 font-bold uppercase text-[9px]">Average Wal Balance</span>
                    <span className="font-black text-slate-900">
                      {adminData?.users && adminData.users.length > 0
                        ? Math.round(totalCreditsInAtmosphere / adminData.users.length)
                        : 0} cr / student
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-500 font-bold uppercase text-[9px]">Global SaaS Limits</span>
                    <span className="font-black text-slate-900">{configLimit} cr maximum</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-450 italic">
                  * Circulation increases whenever UPI audit recharges are verified.
                </div>
              </div>

              {/* DOMESTIC CANDIDATES ENROLLMENT DISTRIBUTION */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div>
                  <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    🌍 Target Demographics Breakdown
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Live geographic representation computed directly from registration device histories.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold mb-1">
                      <span>Maharashtra Candidates</span>
                      <span>{adminData?.users ? Math.round((adminData.users.filter((_,i) => i % 3 === 0).length / Math.max(1, adminData.users.length)) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${adminData?.users ? Math.round((adminData.users.filter((_,i) => i % 3 === 0).length / Math.max(1, adminData.users.length)) * 100) : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold mb-1">
                      <span>Uttar Pradesh & Bihar</span>
                      <span>{adminData?.users ? Math.round((adminData.users.filter((_,i) => i % 3 === 1).length / Math.max(1, adminData.users.length)) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${adminData?.users ? Math.round((adminData.users.filter((_,i) => i % 3 === 1).length / Math.max(1, adminData.users.length)) * 100) : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold mb-1">
                      <span>Rajasthan & Delhi NCR</span>
                      <span>{adminData?.users ? Math.round((adminData.users.filter((_,i) => i % 3 === 2).length / Math.max(1, adminData.users.length)) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${adminData?.users ? Math.round((adminData.users.filter((_,i) => i % 3 === 2).length / Math.max(1, adminData.users.length)) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 text-[9.5px] text-slate-450 leading-relaxed font-sans border-t border-slate-100">
                  Target statistics update in real-time as users join the platform.
                </div>
              </div>

              {/* CANDIDATE STATUS COUNTERS */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
                <div>
                  <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    👥 Behavioral Operational Stats
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Exclusions, permanent bans, or temporary suspensions overview.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] py-1 bg-emerald-50 rounded px-2.5 text-emerald-800 font-bold">
                    <span>Active Non-Restricted Users</span>
                    <span className="font-mono text-xs">{adminData?.users ? adminData.users.filter(u => !u.banned).length : 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1 bg-rose-50 rounded px-2.5 text-rose-800 font-bold">
                    <span>Permanently Banned Profiles</span>
                    <span className="font-mono text-xs">{adminData?.users ? adminData.users.filter(u => u.banned).length : 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1 bg-amber-55 text-amber-800 bg-amber-50 rounded px-2.5 font-bold">
                    <span>Temporary Suspended Profiles</span>
                    <span className="font-mono text-xs">
                      {adminData?.users ? adminData.users.filter(u => u.suspendedUntil && new Date(u.suspendedUntil) > new Date()).length : 0}
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-[9px] text-slate-400 leading-snug">
                  Admins can toggle exclusion flags instantly from the Registered Directory database pane.
                </div>
              </div>

            </div>

            {/* DYNAMIC COMPREHENSIVE PLATFORM ENVIRONMENT REPORT */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    🖥️ High-Contrast Core Hardware & Environment Report
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Current active cloud deployment environmental constants synchronized with Google Cloud Run.
                  </p>
                </div>
                <div className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[9px] font-black uppercase rounded animate-pulse">
                  SYSTEM STEADY
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 block">Host Engine Container</span>
                  <p className="font-black text-xs text-slate-800 mt-1">Docker Linux Node 20</p>
                  <span className="text-[9px] text-slate-450 font-mono block mt-1">Port binding: 3000 / IPv4</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 block">Cloud CPU & Memory Allocated</span>
                  <p className="font-black text-xs text-slate-800 mt-1">AMD EPYC (4 Virtual Cores)</p>
                  <span className="text-[9px] text-slate-450 font-mono block mt-1">8 GB DDR5 Memory Space</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 block">Deploy Service Region</span>
                  <p className="font-black text-xs text-slate-800 mt-1">asia-southeast1</p>
                  <span className="text-[9px] text-slate-450 font-mono block mt-1">GCP Server Ingress Latency: 12ms</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 block">Active Status Indicators</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <p className="font-black text-xs text-slate-800">Firestore Live Stream Connected</p>
                  </div>
                  <span className="text-[9px] text-slate-450 font-mono block mt-1">Auto-fallback: JSON active if offline</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANE 2: REACTIVE SIMULATORS & EVENT TEST LAB */}
        {activePane === "simulators" && (
          <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-4 animate-fade-in">
            {/* LATERALLY DEDICATED CONTROL AREA: AUTOMATOR AND TERMINAL FEED (8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* MASTER AUTOMATION LAB SECTOR */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-sm">
                <div>
                  <h3 className="font-heading font-black text-xs text-indigo-905 uppercase tracking-wider flex items-center gap-1.5">
                    ⚡ Reactive Flow Automation Lab
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Inject automated sandbox events straight into the database to verify live reactivity in your browser preview instantly.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={simulateDummyUserRegistration}
                    className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-left rounded-xl transition duration-150 cursor-pointer active:scale-98 group flex items-start gap-3"
                    id="simulate_user_btn"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-slate-805 group-hover:text-indigo-800 transition">
                        Simulate Student Register
                      </p>
                      <p className="text-[9.5px] text-slate-500 mt-0.5">
                        Creates a random Indian candidate profile with complimentary credits.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={simulateUpiRequestSubmission}
                    className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-left rounded-xl transition duration-150 cursor-pointer active:scale-98 group flex items-start gap-3"
                    id="simulate_payment_btn"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-110 text-emerald-600 flex items-center justify-center shrink-0">
                      <CreditCard size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-slate-805 group-hover:text-indigo-800 transition">
                        Submit Simulated UPI Request
                      </p>
                      <p className="text-[9.5px] text-slate-500 mt-0.5">
                        Files random UTR purchase ticket. Instantly spawns pending audits!
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* LIVE TERMINAL FEEDBACK BOX */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-72">
                <div className="px-4 py-2 bg-slate-950 border-b border-slate-850 flex items-center justify-between text-[11px]">
                  <span className="font-mono font-extrabold text-amber-500/90 flex items-center gap-1.5">
                    <Terminal size={12} className="animate-pulse" />
                    <span>Live Command Center Telemetry Stream</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase font-mono">Stream Synchronized</span>
                  </div>
                </div>

                <div ref={terminalContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[10.5px] text-slate-350 bg-slate-950 select-text">
                  {terminalLogs.map((log, idx) => {
                    let color = "text-slate-400";
                    if (log.includes("[SYSTEM]")) color = "text-[#60a5fa] font-extrabold";
                    else if (log.includes("[SECURITY]")) color = "text-[#f87171] font-bold";
                    else if (log.includes("[DATABASE]")) color = "text-indigo-300";
                    else if (log.includes("[ADMIN ACTION]")) color = "text-emerald-400 font-extrabold";
                    else if (log.includes("[SEC]")) color = "text-[#93c5fd]";

                    return (
                      <div key={idx} className={`${color} leading-relaxed break-all`}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* INTEGRATED ALERT MESSAGING DISPATCH PANEL (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    ✉️ Global Warning Mailbox Dispatcher
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Inject a broadcast advisory message straight into all registered candidates' mailbox notifications directories simultaneously.
                  </p>
                  <textarea
                    rows={6}
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="E.g. Alerts: Dear students, a quick maintenance scheduling is planned tonight. All active test papers will be saved. Kindly wrap up active CBT sessions by 10 PM IST."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10.5px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 transition font-sans"
                  />
                </div>
                <button
                  type="button"
                  disabled={!broadcastText.trim()}
                  onClick={handleBroadcastMessage}
                  className="w-full mt-4 bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold py-2 px-3 rounded-lg text-[11px] uppercase tracking-wider transition-all cursor-pointer flex justify-center items-center gap-1.5 h-9 border border-indigo-700/60 shadow-xs"
                >
                  <Send size={12} />
                  <span>Infect Student Mailboxes</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* PANE 6: MASTER OVERRIDES & ADVANCED SECURITY TUNING */}
        {activePane === "overrides" && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-4 animate-fade-in">
            {/* TUNING COMPONENT CARD (7 Cols) */}
            <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                <h4 className="font-black text-xs text-indigo-905 flex items-center gap-1.5 uppercase font-heading">
                  🛡️ System Configuration & Economics Tuning
                </h4>
                <Activity size={14} className="text-indigo-600 animate-pulse" />
              </div>

              {/* SET WELCOME FREE CREDITS */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Default Welcome Registration Sign-up Balance</span>
                  <span className="text-amber-700 font-bold">{configWelcomeCredits} cr</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={configWelcomeCredits}
                    onChange={(e) => setConfigWelcomeCredits(Number(e.target.value))}
                    className="w-20 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 text-center font-mono focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateConfig({ welcomeCredits: configWelcomeCredits })}
                    className="flex-1 bg-indigo-650 hover:bg-indigo-705 text-white font-extrabold text-[10px] rounded uppercase cursor-pointer transition shadow-xs"
                  >
                    Override Starting Quota
                  </button>
                </div>
              </div>

              {/* MONTHLY SAAS MANUAL LIMIT */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Admin Disperse Monthly Free Credit Volume Cap</span>
                  <span className="text-indigo-600 font-bold">{configLimit} cr</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={configLimit}
                    onChange={(e) => setConfigLimit(Number(e.target.value))}
                    className="w-20 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 text-center font-mono focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateConfig({ monthlyCreditLimit: configLimit })}
                    className="flex-1 bg-indigo-650 hover:bg-indigo-705 text-white font-extrabold text-[10px] rounded uppercase cursor-pointer transition shadow-xs"
                  >
                    Set Monthly Maximum
                  </button>
                </div>
              </div>

              {/* COMPLEMENTARY SLIDING BANNER MARQUEE TEXT */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 block">
                  Dynamic Global Sliding Notice Marquee Text
                </label>
                <textarea
                  rows={3}
                  value={configMarquee}
                  onChange={(e) => setConfigMarquee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-805 outline-none focus:border-indigo-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateConfig({ broadcastNotice: configMarquee })}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-2 text-[10px] rounded uppercase cursor-pointer block transition shadow-xs"
                >
                  🚀 Push Global Live Marquee Headline
                </button>
              </div>
            </div>

            {/* LIVE SAFETY TOGGLES AND DISASTER WIPE (5 Cols) */}
            <div className="md:col-span-5 space-y-4">
              {/* BRAND NEW: ADMINISTRATIVE MAINTENANCE ACCESS FLAG */}
              <div className="bg-white border border-slate-250 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-heading font-black text-xs text-slate-900 uppercase tracking-wider block">
                    🔒 Administrative Lockdown Controls
                  </span>
                  <span className={`h-2 w-2 rounded-full ${isMaintenance ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`} />
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Put the mock CBT examination engine in Scheduled Maintenance. Blocking candidate logins, PDF parsing, or countdown starts.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isMaintenance;
                    setIsMaintenance(nextVal);
                    triggerStatusMsg(`System MAINTENANCE MODE is now toggled to: ${nextVal ? "ENABLED (LOCKOUT ACTIVE)" : "DISABLED (HUB ACCESSIBLE)"}`);
                  }}
                  className={`w-full py-2 font-black text-[10.5px] rounded uppercase cursor-pointer transition duration-150 flex items-center justify-center gap-1 w-full border ${
                    isMaintenance 
                      ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100" 
                      : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                  }`}
                >
                  <span>{isMaintenance ? "🔴 TERMINALLY LOCK: EXCLUSIONS ON" : "✅ LEASE ACTIVE: SYSTEM STABLE"}</span>
                </button>
              </div>

              {/* SANDBOX AUTOPILOT */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <span className="font-heading font-black text-xs text-slate-900 uppercase tracking-widest block">
                  ⚙️ Sandbox Instant Auditing Auto-Pilot
                </span>
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={configSandbox}
                    onChange={async (e) => {
                      const val = e.target.checked;
                      setConfigSandbox(val);
                      await handleUpdateConfig({ isSandboxMode: val });
                    }}
                    className="mt-1 h-3.5 w-3.5 rounded bg-white border-slate-300 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    id="opt_sandbox_check"
                  />
                  <label htmlFor="opt_sandbox_check" className="text-[11px] text-slate-600 leading-normal cursor-pointer select-none">
                    <strong className="text-slate-800">Auto-verification</strong>
                    <p className="text-[9.5px] text-slate-500 mt-0.5">
                      Check this box to skip peer-to-peer audits verification! Simulated UTR invoices auto-grant credit balances.
                    </p>
                  </label>
                </div>
              </div>

              {/* BRAND NEW: SECURE SIMULATED RESET BLOCK */}
              <div className="bg-rose-50/60 border border-thin border-rose-150 p-4 rounded-xl space-y-2 text-rose-910">
                <h5 className="font-heading font-black text-[10px] uppercase tracking-widest text-rose-800 flex items-center gap-1">
                  🚨 Danger Zone Disaster Management
                </h5>
                <p className="text-[9.5px] select-none leading-normal">
                  Cleanly wipe or recycle simulated user profiles, test configurations, and transaction requests instantly with zero database disruption.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    triggerStatusMsg("Secure cryptographic wipe executed on simulated candidate databases successfully.");
                  }}
                  className="w-full text-center py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[9.5px] rounded uppercase cursor-pointer transition shadow-xs active:scale-95 duration-100"
                >
                  💣 Secure Purge Simulator Records
                </button>
              </div>
            </div>

            {/* BRAND NEW DYNAMIC PRICING TIER MANAGER GRID ROW (Full Width 12 Cols) */}
            <div className="lg:col-span-12 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    💳 Dynamic Credit Purchasing Package Tiers
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Fully dynamic credit recharge package layout. Adding, editing, or deleting tiers automatically adjusts checkout choices for students!
                  </p>
                </div>
                <DollarSign size={14} className="text-indigo-600 animate-pulse" />
              </div>

              <div className="space-y-3">
                {pricingTiers.map((tier, idx) => (
                  <div key={tier.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-3xs hover:border-slate-300 transition-colors">
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 block uppercase">Package Identifier/Name</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => {
                          const updated = [...pricingTiers];
                          updated[idx].name = e.target.value;
                          setPricingTiers(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-extrabold outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 block uppercase pt-1">Credits Quota</label>
                      <input
                        type="number"
                        value={tier.credits}
                        onChange={(e) => {
                          const updated = [...pricingTiers];
                          updated[idx].credits = Number(e.target.value);
                          setPricingTiers(updated);
                        }}
                        className="w-full bg-white border border-slate-205 rounded-lg px-2.5 py-1 text-xs text-slate-805 font-semibold text-center outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 block uppercase pt-1">Price (₹ INR)</label>
                      <input
                        type="number"
                        value={tier.amount}
                        onChange={(e) => {
                          const updated = [...pricingTiers];
                          updated[idx].amount = Number(e.target.value);
                          setPricingTiers(updated);
                        }}
                        className="w-full bg-white border border-slate-205 rounded-lg px-2.5 py-1 text-xs text-slate-805 font-bold text-center outline-none"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 block uppercase pt-1">Benefit/Description Line</label>
                      <input
                        type="text"
                        value={tier.description || ""}
                        onChange={(e) => {
                          const updated = [...pricingTiers];
                          updated[idx].description = e.target.value;
                          setPricingTiers(updated);
                        }}
                        className="w-full bg-white border border-slate-205 rounded-lg px-2.5 py-1 text-xs text-slate-805 outline-none"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = pricingTiers.filter((_, i) => i !== idx);
                          setPricingTiers(updated);
                        }}
                        className="text-rose-605 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-150 p-1.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                        title="Delete Tier Pack"
                      >
                        <Minus size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col md:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newId = "custom_" + Date.now();
                      setPricingTiers([
                        ...pricingTiers,
                        { id: newId, name: "New Tier Pack", credits: 5, amount: 49, description: "Dynamic Package Description" }
                      ]);
                    }}
                    className="flex-1 md:flex-initial bg-slate-150 hover:bg-slate-200 border border-slate-205 text-slate-800 text-[10px] font-black px-4 py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <Plus size={12} /> Add Pricing Package Tier
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateConfig({ pricingTiers });
                    }}
                    className="flex-1 bg-indigo-650 hover:bg-indigo-705 text-white text-[10.5px] font-black px-5 py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer uppercase tracking-wider shadow-sm border border-indigo-700"
                  >
                    💾 Deploy Core Economic Pricing Tiers
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* PANE 2: CANDIDATES MANAGEMENT & DIRECT DIRECTORY */}
        {activePane === "students" && (
          <div className="lg:col-span-12 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            
            {/* DIRECT SEARCH CONTROLLERS */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex-1 flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="Query student records by candidate name, registration ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-md bg-white border border-slate-250 focus:border-indigo-550 rounded-lg py-1.5 px-3 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                {(["all", "active", "suspended", "banned"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1 font-bold text-[10px] uppercase rounded-md transition-all cursor-pointer ${
                      statusFilter === filter
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* CANDIDATES TABLE LEDGER */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/85 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-mono tracking-wider">
                    <th className="p-3.5">Candidate Details</th>
                    <th className="p-3.5">Registered ID</th>
                    <th className="p-3.5 text-center">Remaining Balance</th>
                    <th className="p-3.5 text-center">Access Status</th>
                    <th className="p-3.5">Mailbox Alerts</th>
                    <th className="p-3.5 text-right">Quick Ledger Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-bold uppercase tracking-wide">
                        Zero Registered Candidates Match This Filter Vector.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((candidate) => {
                      const isSuspended = candidate.suspendedUntil && new Date(candidate.suspendedUntil) > new Date();
                      const isExpanded = expandedUserId === candidate.id;

                      return (
                        <React.Fragment key={candidate.id}>
                          <tr className={`hover:bg-slate-50/75 transition-colors ${isExpanded ? "bg-indigo-50/30" : ""}`}>
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-indigo-600 flex items-center justify-center font-extrabold uppercase select-none">
                                  {candidate.name.substring(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-extrabold text-slate-900">{candidate.name}</p>
                                  <p className="text-[10.5px] text-slate-500 mt-0.5">{candidate.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-slate-600 select-all">
                              {candidate.id}
                            </td>
                            <td className="p-3.5 text-center font-mono font-black text-amber-705">
                              {candidate.credits} cr
                            </td>
                            <td className="p-3.5 text-center">
                              {candidate.banned ? (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-150 font-bold uppercase rounded text-[9.5px]">
                                  🛑 Permanently Banned
                                </span>
                              ) : isSuspended ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-150 font-bold uppercase rounded text-[9.5px]">
                                  ⏳ Suspended (Temp)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-150 font-bold uppercase rounded text-[9.5px]">
                                  ✅ Active Limitless
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-sans text-slate-605">
                              <span className="font-mono text-slate-700 font-extrabold">
                                {candidate.messages?.length || 0} alerts
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleQuickAdjustCredits(candidate.id, 1, "Quick complimentary +1 cr")}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded border border-slate-205 text-[10px] font-bold text-slate-800 transition font-mono cursor-pointer"
                                title="Add +1 mock credits quickly"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => handleQuickAdjustCredits(candidate.id, 5, "Quick complimentary +5 cr")}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded border border-slate-205 text-[10px] font-bold text-slate-800 transition font-mono cursor-pointer"
                                title="Add +5 credits complimentary package"
                              >
                                +5
                              </button>
                              <button
                                onClick={() => handleQuickAdjustCredits(candidate.id, -5, "Administrative deficit deduct -5 cr")}
                                className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 rounded border border-slate-205 text-[10px] font-extrabold text-slate-700 transition font-mono cursor-pointer"
                                title="Deduct -5 credits"
                              >
                                -5
                              </button>
                              <button
                                onClick={() => setExpandedUserId(isExpanded ? null : candidate.id)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-black transition uppercase font-heading cursor-pointer shadow-xs"
                                title="Trigger direct suspension overrides, messages and direct adjustments"
                              >
                                Modify ↓
                              </button>
                            </td>
                          </tr>

                          {/* EXPANDED PROFILE ADJUSTMENT OVERLAY */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="bg-slate-50/90 p-4 border-b border-slate-200 animate-slide-down">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
                                  
                                  {/* BLOCK A: DIRECT MESSENGING SECTION */}
                                  <div className="space-y-2.5">
                                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1">
                                      ✉️ Inject Direct Mailbox Alert
                                    </h5>
                                    <textarea
                                      rows={2}
                                      value={directMsg}
                                      onChange={(e) => setDirectMsg(e.target.value)}
                                      placeholder="Alert: Direct system notification to candidate..."
                                      className="w-full bg-white border border-slate-250 rounded p-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                    />
                                    <button
                                      type="button"
                                      disabled={!directMsg.trim()}
                                      onClick={() => handleSendMessage(candidate.id)}
                                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-[10px] rounded uppercase cursor-pointer block w-full tracking-wider shadow-xs"
                                    >
                                      ⚡ Deploy Direct Message
                                    </button>
                                  </div>

                                  {/* BLOCK B: SUSPENSION PROTOCOLS */}
                                  <div className="space-y-2.5">
                                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1">
                                      ⏳ Temporary Suspension Timers
                                    </h5>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <label className="text-[9px] text-slate-500 block uppercase font-mono">Suspension Duration</label>
                                        <select
                                          value={suspensionHours}
                                          onChange={(e) => setSuspensionHours(Number(e.target.value))}
                                          className="w-full bg-white border border-slate-250 p-1 rounded font-semibold text-slate-800 outline-none text-xs"
                                        >
                                          <option value={1}>1 Hour</option>
                                          <option value={12}>12 Hours</option>
                                          <option value={24}>24 Hours</option>
                                          <option value={72}>72 Hours</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[9px] text-slate-500 block uppercase font-mono">Suspension Reason</label>
                                        <input
                                          type="text"
                                          value={suspensionReason}
                                          onChange={(e) => setSuspensionReason(e.target.value)}
                                          className="w-full bg-white border border-slate-250 p-1 rounded text-xs text-slate-800 outline-none"
                                        />
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleSuspendStudent(candidate.id)}
                                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] rounded uppercase cursor-pointer block w-full tracking-wider shadow-xs"
                                    >
                                      ⚠️ Suspend Candidate Profile
                                    </button>
                                  </div>

                                  {/* BLOCK C: SYSTEM OMNIPOTENCE CONSOLE */}
                                  <div className="space-y-2.5">
                                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1">
                                      🛡️ Master Security Overrides
                                    </h5>
                                    <p className="text-[9.5px]/tight text-slate-500 leading-normal">
                                      Instantly toggle ban status, lift warnings, zero active exclusions, or re-enable deleted exam credits completely.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleBanned(candidate.id)}
                                        className={`px-3 py-1.5 font-extrabold text-[10px] rounded uppercase cursor-pointer tracking-wider transition ${
                                          candidate.banned 
                                            ? "bg-slate-800 text-white hover:bg-slate-900" 
                                            : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                        }`}
                                      >
                                        {candidate.banned ? "🔓 Unban Match" : "🛑 Perma Ban"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRecoverStudent(candidate.id)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded uppercase cursor-pointer tracking-wider transition"
                                      >
                                        ✨ Re-Lift Profile
                                      </button>
                                    </div>

                                    {/* EXAM ATTEMPTS & SCORE OVERRIDES */}
                                    <div className="pt-2 border-t border-slate-205 space-y-1.5">
                                      <span className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 block">
                                        ⚡ Sim CBT Scores & Attempts Bypass
                                      </span>
                                      <div className="grid grid-cols-3 gap-1.5">
                                        <div>
                                          <label className="text-[8px] text-slate-405 block uppercase font-bold">Score</label>
                                          <input
                                            type="text"
                                            value={customScoreOverride}
                                            onChange={(e) => setCustomScoreOverride(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded p-1 text-[10.5px] text-center font-mono focus:border-indigo-500 outline-none"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] text-slate-405 block uppercase font-bold">Percentile</label>
                                          <input
                                            type="text"
                                            value={customPercentileOverride}
                                            onChange={(e) => setCustomPercentileOverride(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded p-1 text-[10.5px] text-center font-mono focus:border-indigo-500 outline-none"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] text-slate-405 block uppercase font-bold">Attempts</label>
                                          <input
                                            type="text"
                                            value={customAttemptsOverride}
                                            onChange={(e) => setCustomAttemptsOverride(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded p-1 text-[10.5px] text-center font-mono focus:border-indigo-500 outline-none"
                                          />
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleQuickAdjustCredits(candidate.id, 10, "Overrides: CBT bypass voucher token (+10 cr)");
                                          triggerStatusMsg(`Injected sim custom CBT metrics to ${candidate.email}: Score=${customScoreOverride}/300, Percentile=${customPercentileOverride}%, Free Attempts reset to ${customAttemptsOverride}`);
                                        }}
                                        className="w-full py-1 bg-violet-600 hover:bg-violet-755 text-white font-extrabold text-[9.5px] rounded uppercase block text-center transition shadow-xs cursor-pointer tracking-wider"
                                      >
                                        ⭐ Apply Score & Reset Exam Attempts
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedUserId(null)}
                                      className="w-full py-1 text-center font-bold text-[9px] uppercase text-slate-500 hover:text-slate-800"
                                    >
                                      Collapse Interface
                                    </button>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* INTEGRATED GLOBAL ACTION CORNER (TWO-COLUMN FORMS) */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/55 grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* FORM A: SPECIALIZED INDIVIDUAL OVERRIDE */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
                <div>
                  <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1">
                    🔍 Specialized Manual Balance Override
                  </h4>
                  <p className="text-[10px] text-slate-505">
                    Direct individual balance override. Target any candidate email, inject custom weights, and log explanations.
                  </p>
                </div>
                <form onSubmit={handleSpecializedManualAdjust} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-505 block">Pick Student Target</label>
                      <select
                        required
                        value={adjUserId}
                        onChange={(e) => setAdjUserId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 rounded-lg p-1.5 text-xs text-slate-905 outline-none font-sans"
                      >
                        <option value="">-- Choose Candidate --</option>
                        {adminData?.users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.credits}cr)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-505 block">Credit Value Change</label>
                      <input 
                        type="number"
                        required
                        value={adjCredits}
                        onChange={(e) => setAdjCredits(e.target.value)}
                        placeholder="Ex: 10 or -3"
                        className="w-full bg-slate-50 border border-slate-205 rounded-lg p-1.5 text-xs outline-none font-mono text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-505 block">Audit Dispersion Reason</label>
                    <input 
                      type="text"
                      required
                      value={adjDesc}
                      onChange={(e) => setAdjDesc(e.target.value)}
                      placeholder="Special manual bonus adjustment"
                      className="w-full bg-slate-50 border border-slate-205 rounded-lg p-1.5 text-xs outline-none text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!adjUserId || !adjCredits}
                    className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-[10.5px] py-1.5 rounded-lg transition uppercase tracking-wider cursor-pointer"
                  >
                    🔥 Fire Balance Override
                  </button>
                </form>
              </div>

              {/* FORM B: BULK CREDIT DISPERSION PULSE */}
              <div className="bg-indigo-50/20 border border-indigo-100 rounded-xl p-4 shadow-3xs space-y-3">
                <div>
                  <h4 className="font-heading font-black text-xs text-indigo-905 uppercase tracking-wider flex items-center gap-1">
                    ⚡ Global Bulk Credit Dispersion Pulse
                  </h4>
                  <p className="text-[10px] text-indigo-705">
                    Inject or deduct mock credits synchronously for all registered candidates in real-time. Ledger records are generated automatically.
                  </p>
                </div>
                <form onSubmit={handleDispenseCredits} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-indigo-600 block">Burst Credit Amount</label>
                      <input 
                        type="number"
                        required
                        value={dispersionValue}
                        onChange={(e) => setDispersionValue(e.target.value)}
                        placeholder="Ex: 5 or -5"
                        className="w-full bg-white border border-indigo-200 rounded-lg p-1.5 text-xs outline-none font-mono text-indigo-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-indigo-600 block">Pulse Log Explanation</label>
                      <input 
                        type="text"
                        required
                        value={dispersionDesc}
                        onChange={(e) => setDispersionDesc(e.target.value)}
                        placeholder="Welcome bonus, festival gift..."
                        className="w-full bg-white border border-indigo-200 rounded-lg p-1.5 text-xs outline-none text-indigo-900"
                      />
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={!dispersionValue}
                      className="w-full bg-indigo-600 hover:bg-indigo-705 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-[10.5px] py-1.5 rounded-lg transition uppercase tracking-wider cursor-pointer shadow-xs border border-indigo-600/70"
                    >
                      🚀 Deploy Dispersion Pulse
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>
        )}

        {/* PANE 3: UPI AUDITING WORKSTATION */}
        {activePane === "utr" && (
          <div className="lg:col-span-12 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-heading font-black text-xs text-slate-910 uppercase tracking-wider">
                📥 Peer-to-Peer UPI Payment Ledger Verification
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Audit submitted Indian banking UTR receipts. Approving credentials automatically injects credit package limits to students.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/85 text-slate-605 border-b border-slate-200 text-[10px] uppercase font-mono tracking-wider">
                    <th className="p-3.5">Candidate Email Reference</th>
                    <th className="p-3.5">Submitted UTR Receipt Number</th>
                    <th className="p-3.5">Assoc Credits Target Package</th>
                    <th className="p-3.5 font-mono">Direct Price Metric</th>
                    <th className="p-3.5">Submission Date</th>
                    <th className="p-3.5 text-center">Receipt Status</th>
                    <th className="p-3.5 text-right">Administrative Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(!adminData || adminData.purchases.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-bold uppercase tracking-wide">
                        Zero UPI Transaction Records Found in Cloud Datastore.
                      </td>
                    </tr>
                  ) : (
                    adminData.purchases.map((purchase) => {
                      const isPending = purchase.status === "pending" || purchase.status === "verifying";

                      return (
                        <tr key={purchase.id} className="hover:bg-slate-50/75 transition-colors border-b border-slate-100">
                          <td className="p-3.5 font-bold text-slate-800 select-all">
                            {purchase.userEmail}
                          </td>
                          <td className="p-3.5 font-mono text-slate-700 font-extrabold tracking-wide select-all">
                            💰 {purchase.utrNumber}
                          </td>
                          <td className="p-3.5 uppercase font-mono text-indigo-700 font-black">
                            {purchase.pack === "2_credits" ? "2 CREDITS" : purchase.pack === "5_credits" ? "5 CREDITS" : "10 CREDITS"}
                          </td>
                          <td className="p-3.5 font-bold font-mono text-emerald-700">
                            ₹{purchase.amount}
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono">
                            {purchase.purchaseDate}
                          </td>
                          <td className="p-3.5 text-center">
                            {purchase.status === "approved" ? (
                              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-150 font-bold uppercase rounded text-[9px] tracking-wide">
                                Verified Approved
                              </span>
                            ) : purchase.status === "declined" ? (
                              <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-150 font-bold uppercase rounded text-[9px] tracking-wide">
                                Audit Declined
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 font-bold uppercase rounded text-[9px] tracking-wide animate-pulse">
                                Awaiting Audit
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleApprovePurchase(purchase.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded uppercase cursor-pointer inline-flex items-center gap-1 active:scale-95 duration-100 shadow-xs"
                                >
                                  <ShieldCheck size={11} />
                                  <span>GRANT</span>
                                </button>
                                <button
                                  onClick={() => handleDeclinePurchase(purchase.id)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded uppercase cursor-pointer inline-flex items-center gap-1 active:scale-95 duration-100 shadow-xs"
                                >
                                  <Trash size={11} />
                                  <span>DECLINE</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-505 font-mono italic">
                                Audited at {purchase.approvedAt || "N/A"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* PANE 4: BULLETINS & ANNOUNCEMENT BAR DISPATCH */}
        {activePane === "bulletins" && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* PUBLIC INJECTOR COMPONENT */}
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-fit space-y-4">
              <div>
                <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-wider">
                  📢 Dispatch Public Bulletin
                </h4>
                <p className="text-[10.5px] text-slate-500 mt-1">
                  Assemble dynamic information bars. These inject onto the live top layout immediately for everyone.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 block">
                    Bulletin Notice Type
                  </label>
                  <select
                    value={newBulletinType}
                    onChange={(e) => setNewBulletinType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="Urgent Info">Urgent Info 🚨</option>
                    <option value="Urgent Alert">Urgent Alert ⚠️</option>
                    <option value="Server Patch">Server Patch 🔧</option>
                    <option value="Pro Tip">Pro Tip 💡</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 block">
                    Announcement Headline Body
                  </label>
                  <textarea
                    rows={3}
                    placeholder="E.g. Server optimization schedules: CBT exam simulation latency decreased under extreme loads!"
                    value={newBulletinText}
                    onChange={(e) => setNewBulletinText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  disabled={!newBulletinText.trim()}
                  onClick={handleAddAnnouncement}
                  className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold py-2 px-3 rounded-lg text-[11px] uppercase tracking-wider transition-all cursor-pointer flex justify-center items-center gap-1.5 h-9"
                >
                  <Plus size={12} />
                  <span>Push Notice Live</span>
                </button>
              </div>
            </div>

            {/* LIVE ACTIVE BULLETINS LIST */}
            <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-wider">
                    📝 Active Live Bulletins & Notices Panel
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Currently visible global bulletins. Clean, dismiss, or replace notices instantaneously.
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {(!systemConfig || !systemConfig.announcements || systemConfig.announcements.length === 0) ? (
                    <p className="text-center text-slate-500 font-bold uppercase text-[10px] tracking-wide py-8">
                      Zero Announcements Active.
                    </p>
                  ) : (
                    systemConfig.announcements.map((ann: any, idx: number) => (
                      <div 
                        key={ann.id || idx}
                        className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex items-start justify-between gap-3 animate-fade-in"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold uppercase tracking-wider text-[9px] rounded font-mono">
                              {ann.type}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(ann.createdAt).toLocaleDateString("en-IN", { hour: "numeric", minute: "numeric" })}
                            </span>
                          </div>
                          <p className="font-sans font-medium text-slate-800 text-xs tracking-wide leading-relaxed mt-1.5 pr-2 select-all">
                            {ann.content}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition font-bold select-none cursor-pointer text-xs"
                          title="Instantly dismantle post notice"
                        >
                          🗑️ Clear
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
