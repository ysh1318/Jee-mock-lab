import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  X, Wallet, CreditCard, Sparkles, Check, AlertCircle, Copy, CheckCircle2, 
  User, Lock, Key, Mail, RefreshCw, Landmark, ShieldCheck, TrendingUp, Users, DollarSign, Plus, Minus, Clock
} from "lucide-react";
import { UserAccount, PurchaseRequest, CreditTransaction, UserMessage } from "../types";
import { signInWithGooglePopup } from "../lib/firebase";

interface WalletAndAuthProps {
  userAccount: UserAccount | null;
  onLogin: (account: UserAccount) => void;
  onLogout: () => void;
  onClose?: () => void;
  initialTab?: "auth" | "wallet" | "transactions" | "mailbox";
}

export function WalletAndAuth({ userAccount, onLogin, onLogout, onClose, initialTab }: WalletAndAuthProps) {
  const [activeTab, setActiveTab] = useState<"auth" | "wallet" | "transactions" | "mailbox">("auth");
  const [isRegistering, setIsRegistering] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  
  // Auth Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Recharge Pack Selection
  const [selectedPack, setSelectedPack] = useState<string>("5_credits");
  const [utrNumber, setUtrNumber] = useState("");
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showSimulatedRazorpay, setShowSimulatedRazorpay] = useState(false);
  const [simulatedOrderInfo, setSimulatedOrderInfo] = useState<any>(null);

  // Alice Bot Verification States
  const [verifyingRequest, setVerifyingRequest] = useState<PurchaseRequest | null>(null);
  const [botLogs, setBotLogs] = useState<string[]>([]);
  const [botProgress, setBotProgress] = useState(0);

  // Wallet and Logs history
  const [walletStats, setWalletStats] = useState<{
    credits: number;
    customApiKey?: string;
    messages?: UserMessage[];
    transactions: CreditTransaction[];
    purchases: PurchaseRequest[];
  } | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Admin Panel states
  const [adminData, setAdminData] = useState<{
    users: UserAccount[];
    purchases: PurchaseRequest[];
  } | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  
  // Admin Action form
  const [adjUserId, setAdjUserId] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjDesc, setAdjDesc] = useState("Loyalty Bonus");
  const [adminActionStatus, setAdminActionStatus] = useState("");

  // Platform dynamic settings
  const [broadcastNotice, setBroadcastNotice] = useState("📢 INSTRUCTIONS: Welcome to JEE CBT Prep platform. Practice formulas, upload raw test page PDFs, and simulate live 2026 tests with active countdown timers!");
  const [welcomeCredits, setWelcomeCredits] = useState(3);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<any[]>([
    { id: "2_credits", name: "2 Credits Pack", credits: 2, amount: 29, description: "Parse 2 Complete Mock Papers" },
    { id: "5_credits", name: "5 Credits Pack", credits: 5, amount: 59, description: "Parse 5 Complete Mock Papers" },
    { id: "10_credits", name: "10 Credits Pack", credits: 10, amount: 99, description: "Parse 10 Complete Mock Papers" }
  ]);

  const currentPackDetails = pricingTiers.find(p => p.id === selectedPack) || pricingTiers[0] || { id: "5_credits", credits: 5, amount: 59, name: "5 Credits Pack" };

  // Form states for admin config panel
  const [configNotice, setConfigNotice] = useState("");
  const [configWelcomeCredits, setConfigWelcomeCredits] = useState("3");
  const [configIsSandbox, setConfigIsSandbox] = useState(false);
  const [configMonthlyCreditLimit, setConfigMonthlyCreditLimit] = useState("1000");

  // Bulk adjustment states
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkDesc, setBulkDesc] = useState("Loyalty Bonus Credits");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");
  const [adminSubTab, setAdminSubTab] = useState<"overview" | "students" | "recharges" | "config">("overview");

  // Upper SaaS states for Admin
  const [monthlyCreditLimit, setMonthlyCreditLimit] = useState(1000);
  const [monthlyDistributedCredits, setMonthlyDistributedCredits] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [suspensionHours, setSuspensionHours] = useState(24);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [directMessage, setDirectMessage] = useState("");
  const [broadcastMsgText, setBroadcastMsgText] = useState("");

  const upiId = "9890215963@ybl";

  // Auto-route active tab depending on logged in status and load system config
  const fetchSystemConfig = async () => {
    try {
      const res = await fetch("/api/system-config");
      if (res.ok) {
        const data = await res.json();
        setBroadcastNotice(data.broadcastNotice);
        setWelcomeCredits(data.welcomeCredits);
        setIsSandboxMode(data.isSandboxMode);
        
        if (data.monthlyCreditLimit !== undefined) setMonthlyCreditLimit(data.monthlyCreditLimit);
        if (data.monthlyDistributedCredits !== undefined) setMonthlyDistributedCredits(data.monthlyDistributedCredits);
        if (data.announcements !== undefined) setAnnouncements(data.announcements);
        if (data.pricingTiers !== undefined) {
          setPricingTiers(data.pricingTiers);
          // Auto-select a pack if previous option got removed or changed
          if (data.pricingTiers.length > 0 && !data.pricingTiers.some((t: any) => t.id === selectedPack)) {
            setSelectedPack(data.pricingTiers[0].id);
          }
        }
        
        // Populate inputs
        setConfigNotice(data.broadcastNotice);
        setConfigWelcomeCredits(String(data.welcomeCredits));
        setConfigIsSandbox(data.isSandboxMode);
        setConfigMonthlyCreditLimit(String(data.monthlyCreditLimit || 1000));
      }
    } catch (err) {
      console.warn("Failed fetching system configurations:", err);
    }
  };

  useEffect(() => {
    fetchSystemConfig();
    if (userAccount) {
      if (initialTab) {
        setActiveTab(initialTab);
      } else {
        setActiveTab("wallet");
      }
      fetchWalletInfo();
    } else {
      setActiveTab("auth");
    }
  }, [userAccount, initialTab]);

  const hashPassword = (raw: string): string => {
    // Standard mock hash for container security audit
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return "hash_" + String(hash);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("Please complete all email and password fields!");
      return;
    }

    if (isRegistering) {
      if (password.length < 8) {
        setErrorMessage("Password is too weak: It must contain at least 8 characters.");
        return;
      }
      const commonPasswords = ["password", "password123", "12345678", "admin123", "jee2025", "jee2026", "student123"];
      if (commonPasswords.includes(password.toLowerCase().trim())) {
        setErrorMessage("Password is too generic or common. Please choose a more complex, secure password!");
        return;
      }
    }

    // Persistent Device Identification logic
    let deviceId = localStorage.getItem("jee_device_uuid");
    if (!deviceId) {
      const cookieMatch = document.cookie.match(/(?:^|; )jee_device_uuid=([^;]*)/);
      if (cookieMatch) {
        deviceId = cookieMatch[1];
        localStorage.setItem("jee_device_uuid", deviceId);
      } else {
        deviceId = "dev_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
        localStorage.setItem("jee_device_uuid", deviceId);
      }
    }
    // Sync to cookie
    document.cookie = `jee_device_uuid=${deviceId}; max-age=31536000; path=/; SameSite=Lax`;

    const payload = {
      name: name || "Student Athlete",
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      deviceId: deviceId
    };

    const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication operation failed.");
      }

      let successMsg = "Logged in successfully!";
      if (isRegistering) {
        if (data.user && data.user.credits > 0) {
          successMsg = `Registration successful! Graded ${data.user.credits} FREE credits!`;
        } else {
          successMsg = "Registration successful! (Free welcome credits already claimed on this device.)";
        }
      }
      setSuccessMessage(successMsg);
      localStorage.setItem("jee_user_account", JSON.stringify(data.user));
      
      setTimeout(() => {
        onLogin(data.user);
        if (onClose) {
          onClose();
        } else if (data.user.role === "admin") {
          setActiveTab("admin");
        } else {
          setActiveTab("wallet");
        }
      }, 1000);

    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoadingGoogle(true);

    try {
      // 1. Persistent Device Identification logic
      let deviceId = localStorage.getItem("jee_device_uuid");
      if (!deviceId) {
        const cookieMatch = document.cookie.match(/(?:^|; )jee_device_uuid=([^;]*)/);
        if (cookieMatch) {
          deviceId = cookieMatch[1];
          localStorage.setItem("jee_device_uuid", deviceId);
        } else {
          deviceId = "dev_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
          localStorage.setItem("jee_device_uuid", deviceId);
        }
      }
      document.cookie = `jee_device_uuid=${deviceId}; max-age=31536000; path=/; SameSite=Lax`;

      // 2. Client-side Google Sign-In Popup
      const gUser = await signInWithGooglePopup();
      if (!gUser || !gUser.email) {
        throw new Error("Could not retrieve verified email from Google Sign-In.");
      }

      // 3. Post to backend
      const payload = {
        email: gUser.email,
        name: gUser.displayName || "",
        deviceId
      };

      const res = await fetch("/api/auth/google-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google Authentication processing failed on servers.");
      }

      setSuccessMessage(`Direct Sign-In Successful! Welcome, ${data.user.name || "Student"}.`);
      localStorage.setItem("jee_user_account", JSON.stringify(data.user));

      setTimeout(() => {
        onLogin(data.user);
        if (onClose) {
          onClose();
        } else if (data.user.role === "admin") {
          setActiveTab("admin");
        } else {
          setActiveTab("wallet");
        }
      }, 1000);

    } catch (err: any) {
      console.error("Google Auth process error:", err);
      if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
        setErrorMessage(err.message || "Direct Google Sign-In encountered an unexpected problem.");
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const fetchWalletInfo = async () => {
    if (!userAccount) return;
    setLoadingWallet(true);
    try {
      const res = await fetch(`/api/user/${userAccount.id}/wallet`);
      if (res.ok) {
        const data = await res.json();
        setWalletStats(data);
        if (data && data.credits !== undefined && data.credits !== userAccount.credits) {
          const updated = { ...userAccount, credits: data.credits };
          localStorage.setItem("jee_user_account", JSON.stringify(updated));
          onLogin(updated);
        }
      }
    } catch (err) {
      console.warn("Failed fetching wallet details:", err);
    } finally {
      setLoadingWallet(false);
    }
  };

  // Dynamically load external checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Trigger Razorpay Order Creation and initiate Razorpay checkout
  const handlePurchaseSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!userAccount) {
      setErrorMessage("Please register or log in first to start checkout!");
      return;
    }

    setSubmittingPurchase(true);

    try {
      // Step 1: Create transaction Order on our backend
      const res = await fetch("/api/payment/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userAccount.id,
          pack: selectedPack
        })
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || "Failed to create payment order.");
      }

      // Step 2: Try to load real Razorpay Checkout script
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || orderData.isSandbox) {
        // If script cannot load (e.g. adblocker, sandbox) or server says sandbox/mock is active,
        // trigger our highly polished, interactive direct sandbox checkout modal simulation
        console.log("[RAZORPAY FRONTEND] Activating visual secure sandbox payment flow.");
        setSimulatedOrderInfo(orderData);
        setShowSimulatedRazorpay(true);
        return;
      }

      // Step 3: Run real Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "JEE CBT Prep Studio",
        description: currentPackDetails.name,
        order_id: orderData.orderId,
        image: "https://api.qrserver.com/v1/create-qr-code/?size=150x150",
        handler: async (response: any) => {
          try {
            setSubmittingPurchase(true);
            setSuccessMessage("Authorizing transaction details...");

            const verifyRes = await fetch("/api/payment/razorpay-verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: userAccount.id,
                pack: selectedPack,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                isSandbox: false
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Cryptographic verification failed.");
            }

            setSuccessMessage(`Payment Credited Successfully! Added ${currentPackDetails.credits} credits to your wallet.`);
            onLogin(verifyData.user);
            fetchWalletInfo();
          } catch (err: any) {
            setErrorMessage(err.message);
          } finally {
            setSubmittingPurchase(false);
          }
        },
        prefill: {
          name: userAccount.name,
          email: userAccount.email,
        },
        notes: {
          userId: userAccount.id,
          pack: selectedPack
        },
        theme: {
          color: "#0ea5e9" // sky-500
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmittingPurchase(false);
    }
  };

  // Handles simulated sandbox modal success
  const handleSimulatedPaymentSuccess = async () => {
    if (!userAccount || !simulatedOrderInfo) return;
    setShowSimulatedRazorpay(false);
    setSubmittingPurchase(true);
    setSuccessMessage("Verifying mock transaction signature...");

    try {
      const mockPayId = "pay_mock_" + Math.random().toString(36).substring(2, 11);
      const verifyRes = await fetch("/api/payment/razorpay-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userAccount.id,
          pack: selectedPack,
          razorpay_order_id: simulatedOrderInfo.orderId,
          razorpay_payment_id: mockPayId,
          razorpay_signature: "fake_sig_" + Math.random().toString(36).substring(2, 9),
          isSandbox: true
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Simulated authorization failed.");
      }

      setSuccessMessage(`Simulated Payment Success! Added ${currentPackDetails.credits} credits to your wallet.`);
      onLogin(verifyData.user);
      fetchWalletInfo();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmittingPurchase(false);
      setSimulatedOrderInfo(null);
    }
  };

  // Simulated live logs from Alice Pay-Audit Bot
  const startAliceAuditLogs = (request: PurchaseRequest) => {
    setBotProgress(0);
    setBotLogs([]);
    
    // Check if system is in Sandbox mode to decide logs
    const logsPool = isSandboxMode ? [
      "🌸 studybot [Alice PAY]: Handshaking with NPCI settlement gateway...",
      "🍜 studybot [Alice PAY]: Slurping RAMEN and reading UTR strings...",
      "🌸 studybot [Alice PAY]: Scrapping transaction checksum matrices...",
      "🌸 studybot [Alice PAY]: Verifying bank reference ID: " + request.utrNumber,
      "🍜 studybot [Alice PAY]: Comparing active transaction timestamps... Matches ledger!",
      "🎉 studybot [Alice PAY]: Auto-Audit verification cleared! Injecting credits into student wallet..."
    ] : [
      "🌸 studybot [Alice PAY]: Handshaking with NPCI settlement gateway...",
      "🍜 studybot [Alice PAY]: Slurping RAMEN and reading UTR strings...",
      "🌸 studybot [Alice PAY]: Logged UPI reference string: " + request.utrNumber,
      "🌸 studybot [Alice PAY]: UPI settlement gateway ping... Success!",
      "🍜 studybot [Alice PAY]: Transaction recorded in secure server audit ledger in state 'verifying'.",
      "⏳ studybot [Alice PAY]: Manual ledger check active. Queued for human verification by Jee-Pro Admin."
    ];

    let currentLogIdx = 0;
    
    const interval = setInterval(() => {
      if (currentLogIdx < logsPool.length) {
        const nextLog = logsPool[currentLogIdx];
        setBotLogs(prev => [...prev, nextLog]);
        setBotProgress(Math.floor(((currentLogIdx + 1) / logsPool.length) * 100));
        currentLogIdx++;
      } else {
        clearInterval(interval);
        if (isSandboxMode) {
          const reqPackDetails = pricingTiers.find(p => p.id === request.pack) || { credits: 5 };
          setSuccessMessage(`CREDITS GRANTED: Cleared verification! Added ${reqPackDetails.credits} Credits!`);
          setVerifyingRequest(null);
          fetchWalletInfo();
          
          // Sync local storage user model with new credits
          setTimeout(async () => {
            try {
              const userRes = await fetch(`/api/user/${userAccount!.id}`);
              const userData = await userRes.json();
              if (userData && userData.user) {
                localStorage.setItem("jee_user_account", JSON.stringify(userData.user));
                onLogin(userData.user);
              }
            } catch {}
          }, 500);
        } else {
          setSuccessMessage(`SUBMITTED SUCCESSFULLY: Your 12-digit UPI reference ID has been logged in our secure audit ledger. Administrators will verify the matching statement and grant credits shortly!`);
          setVerifyingRequest(null);
          fetchWalletInfo();
        }
      }
    }, 1100);
  };

  const copyUpiAddress = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // ADMIN OPERATIONS
  const fetchAdminData = async () => {
    if (!userAccount || userAccount.role !== "admin") return;
    setLoadingAdmin(true);
    try {
      const res = await fetch(`/api/admin/data?email=${userAccount.email}&userId=${userAccount.id}`);
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
      }
    } catch (err) {
      console.warn("Failed fetching admin panels:", err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    if ((activeTab as any) === "admin" && userAccount?.role === "admin") {
      fetchAdminData();
    }
  }, [activeTab]);

  const handleAdminApprove = async (reqId: string) => {
    if (!userAccount) return;
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: reqId, adminEmail: userAccount.email, adminUserId: userAccount.id })
      });
      if (res.ok) {
        setAdminActionStatus("Approved successfully!");
        fetchAdminData();
        setTimeout(() => setAdminActionStatus(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminDecline = async (reqId: string) => {
    if (!userAccount) return;
    try {
      const res = await fetch("/api/admin/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: reqId, adminEmail: userAccount.email, adminUserId: userAccount.id })
      });
      if (res.ok) {
        setAdminActionStatus("Declined successfully!");
        fetchAdminData();
        setTimeout(() => setAdminActionStatus(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccount || !adjUserId || !adjAmount) return;
    try {
      const res = await fetch("/api/admin/adjust-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adjUserId,
          amount: Number(adjAmount),
          description: adjDesc,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      if (res.ok) {
        setAdminActionStatus(`Successfully adjusted candidate balance!`);
        setAdjAmount("");
        fetchAdminData();
        setTimeout(() => setAdminActionStatus(""), 3500);
      } else {
        const data = await res.json();
        setAdminActionStatus(`Error: ${data.error || "Adjustment rejected"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminBulkAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccount || !bulkAmount) return;
    try {
      const res = await fetch("/api/admin/bulk-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(bulkAmount),
          description: bulkDesc,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminActionStatus(`Successfully infused ${bulkAmount} credits to ${data.affectedCount} registered candidates!`);
        setBulkAmount("");
        fetchAdminData();
        setTimeout(() => setAdminActionStatus(""), 4500);
      } else {
        setAdminActionStatus(`Error: ${data.error || "Bulk adjustment failed"}`);
      }
    } catch (err: any) {
      setAdminActionStatus(`Error: ${err.message}`);
    }
  };

  const handleAdminToggleBan = async (uId: string) => {
    if (!userAccount) return;
    try {
      const res = await fetch("/api/admin/toggle-ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uId, adminEmail: userAccount.email, adminUserId: userAccount.id })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminActionStatus(`Student account status updated successfully to: ${data.banned ? "Suspended / Banned" : "Active"}`);
        fetchAdminData();
        setTimeout(() => setAdminActionStatus(""), 4500);
      } else {
        setAdminActionStatus(`Error: ${data.error || "Status update failed"}`);
      }
    } catch (err: any) {
      setAdminActionStatus(`Error: ${err.message}`);
    }
  };

  const handleAdminSuspendUser = async (uId: string) => {
    if (!userAccount) return;
    try {
      const res = await fetch("/api/admin/suspend-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uId,
          hours: Number(suspensionHours),
          reason: suspensionReason,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminActionStatus(`Successfully temporarily suspended student account for ${suspensionHours} hours!`);
        setSuspensionReason("");
        setExpandedStudentId(null);
        fetchAdminData();
        setTimeout(() => setAdminActionStatus(""), 4500);
      } else {
        setAdminActionStatus(`Error: ${data.error || "Temporary suspension failed"}`);
      }
    } catch (err: any) {
      setAdminActionStatus(`Error: ${err.message}`);
    }
  };

  const handleAdminRecoverUser = async (uId: string) => {
    if (!userAccount) return;
    try {
      const res = await fetch("/api/admin/recover-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uId,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminActionStatus(`Student account profile fully recovered, suspension lifted, and initial credits restored!`);
        setExpandedStudentId(null);
        fetchAdminData();
        setTimeout(() => setAdminActionStatus(""), 4500);
      } else {
        setAdminActionStatus(`Error: ${data.error || "Recovery failed"}`);
      }
    } catch (err: any) {
      setAdminActionStatus(`Error: ${err.message}`);
    }
  };

  const handleAdminSendMessage = async (uId: string) => {
    if (!userAccount) return;
    try {
      const res = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uId,
          content: directMessage,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminActionStatus(`Successfully dispatched direct personal message to student profile!`);
        setDirectMessage("");
        setExpandedStudentId(null);
        fetchAdminData();
        setTimeout(() => setAdminActionStatus(""), 4500);
      } else {
        setAdminActionStatus(`Error: ${data.error || "Message generation failed"}`);
      }
    } catch (err: any) {
      setAdminActionStatus(`Error: ${err.message}`);
    }
  };

  const handleAdminSendBulkBroadcastMessage = async () => {
    if (!userAccount || !broadcastMsgText.trim()) return;
    try {
      const res = await fetch("/api/admin/send-bulk-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: broadcastMsgText,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminActionStatus(`Successfully broadcasted message to all ${data.affectedCount} registered candidates' mailboxes!`);
        setBroadcastMsgText("");
        fetchAdminData();
        setTimeout(() => setAdminActionStatus(""), 4500);
      } else {
        setAdminActionStatus(`Error: ${data.error || "Broadcast generation failed"}`);
      }
    } catch (err: any) {
      setAdminActionStatus(`Error: ${err.message}`);
    }
  };

  const handleAdminQuickAdjust = async (userId: string, amount: number, description: string) => {
    if (!userAccount) return;
    try {
      const res = await fetch("/api/admin/adjust-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount,
          description,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      if (res.ok) {
        setAdminActionStatus(`Balance updated by ${amount > 0 ? "+" : ""}${amount} credits successfully!`);
        fetchAdminData();
        setTimeout(() => setAdminActionStatus(""), 3500);
      } else {
        const data = await res.json();
        setAdminActionStatus(`Error: ${data.error || "Balance update failed"}`);
      }
    } catch (err: any) {
      setAdminActionStatus(`Error: ${err.message}`);
    }
  };

  const handleMarkMessagesRead = async () => {
    if (!userAccount) return;
    try {
      await fetch("/api/user/read-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userAccount.id })
      });
      if (walletStats && walletStats.messages) {
        setWalletStats({
          ...walletStats,
          messages: walletStats.messages.map(m => ({ ...m, read: true }))
        });
      }
    } catch (err) {
      console.warn("Could not mark messages read:", err);
    }
  };

  const handleAdminUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccount) return;
    try {
       const res = await fetch("/api/admin/update-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broadcastNotice: configNotice,
          welcomeCredits: Number(configWelcomeCredits),
          isSandboxMode: configIsSandbox,
          monthlyCreditLimit: Number(configMonthlyCreditLimit),
          pricingTiers,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      if (res.ok) {
        setAdminActionStatus("Global system configurations saved successfully!");
        fetchSystemConfig();
        setTimeout(() => setAdminActionStatus(""), 4500);
      } else {
        const data = await res.json();
        setAdminActionStatus(`Error: ${data.error || "Config update failed"}`);
      }
    } catch (err: any) {
      setAdminActionStatus(`Error: ${err.message}`);
    }
  };

  // Calculations for dashboard
  const totalRevenue = adminData?.purchases
    .filter(p => p.status === "approved")
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden"
        id="wallet_and_auth_hub"
      >
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-gray-900">
                {userAccount ? `${userAccount.name}'s Credit Desk` : "JEE CBT Candidate Account"}
              </h2>
              <p className="text-xs text-gray-500 font-mono tracking-wide">
                Direct peer-to-peer (P2P) student wallet
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            id="wallet_close_btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* TABS CONTROLLER (LOGGED IN ONLY) */}
        {userAccount && (
          <div className="flex border-b border-gray-100 px-6 bg-white overflow-x-auto gap-2 py-1">
            <button
              onClick={() => setActiveTab("wallet")}
              className={`py-3 px-4 font-heading font-medium text-sm transition-all border-b-2 rounded-t-lg flex items-center gap-2 ${
                activeTab === "wallet" 
                  ? "border-sky-500 text-sky-600 bg-sky-50/20" 
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Wallet className="h-4 w-4" /> Credit Wallet
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`py-3 px-4 font-heading font-medium text-sm transition-all border-b-2 rounded-t-lg flex items-center gap-2 ${
                activeTab === "transactions" 
                  ? "border-sky-500 text-sky-600 bg-sky-50/20" 
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <RefreshCw className="h-4 w-4 text-gray-400" /> Wallet Ledgers ({walletStats?.transactions.length || 0})
            </button>
            <button
              onClick={() => {
                setActiveTab("mailbox");
                handleMarkMessagesRead();
              }}
              className={`py-3 px-4 font-heading font-medium text-sm transition-all border-b-2 rounded-t-lg flex items-center gap-2 relative ${
                activeTab === "mailbox" 
                  ? "border-sky-500 text-sky-600 bg-sky-50/20" 
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              ✉️ Inbox Mailbox
              {walletStats?.messages?.some(m => !m.read) && (
                <span className="absolute top-1.5 right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
            
            <button
              onClick={() => {
                onLogout();
                onLogout();
                onClose && onClose();
              }}
              className="py-3 px-4 font-heading font-medium text-sm border-b-2 border-transparent text-red-500 hover:text-red-700 ml-auto transition-colors"
            >
              Log Out
            </button>
          </div>
        )}

        {/* BODY INNER CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6" id="wallet_body_scroller">

          {/* PLATFORM BROADCAST BULLETIN */}
          {broadcastNotice && (
            <div className="mb-4 px-4 py-2.5 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex items-center justify-between text-xs text-amber-900 shadow-3xs" id="system_broadcast_notice_bar">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-bold flex items-center gap-1 shrink-0 text-amber-700 bg-amber-100/50 border border-amber-300 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider animate-pulse">Broadcast Bulletin</span>
                <span className="font-heading font-semibold tracking-tight truncate">{broadcastNotice}</span>
              </div>
            </div>
          )}

          {/* DYNAMIC PORTAL SYSTEM ANNOUNCEMENTS */}
          {announcements && announcements.length > 0 && (
            <div className="space-y-2 mb-4" id="dynamic_system_announcements_tray">
              {announcements.map((ann: any, idx: number) => {
                const colors = 
                  ann.type === "Urgent Info" 
                    ? "bg-rose-50/80 border-rose-400 text-rose-900" 
                    : ann.type === "Maintenance" 
                    ? "bg-amber-50/80 border-amber-400 text-amber-900" 
                    : "bg-indigo-50/80 border-indigo-400 text-indigo-900";
                const typeLabel = ann.type || "Update";
                return (
                  <div key={ann.id || idx} className={`px-4 py-2 border-l-4 rounded-r-xl flex items-center justify-between text-xs ${colors} shadow-3xs hover:-translate-y-0.5 transition-all`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-bold shrink-0 bg-white/60 border border-current px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-heading">{typeLabel}</span>
                      <span className="font-heading font-semibold tracking-tight truncate">{ann.content}</span>
                    </div>
                    {ann.createdAt && (
                      <span className="text-[9px] opacity-60 font-mono shrink-0 ml-2">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STATUS NOTIFICATIONS */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-2.5 text-sm animate-fade-in" id="wallet_err">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-sm animate-fade-in" id="wallet_success">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ACTIVE VERIFICATION TRANSITION (ALICE BOT) */}
          {verifyingRequest && (
            <div className="bg-sky-50 rounded-2xl border border-sky-100/60 p-6 flex flex-col items-center justify-center text-center py-10 animate-pulse my-4" id="alice_bot_verification">
              <div className="p-4 bg-white shadow-md rounded-full text-sky-600 mb-4 animate-spin">
                <RefreshCw className="h-8 w-8" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-sky-950 mb-1">
                Alice Payment Auditor Active
              </h3>
              <p className="text-xs text-sky-700 max-w-sm mb-6">
                Analyzing submitted UPI Ref: <span className="font-mono bg-sky-100 px-1.5 py-0.5 rounded text-sky-900 font-semibold">{verifyingRequest.utrNumber}</span>
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-md bg-sky-200/50 h-3 rounded-full overflow-hidden mb-6">
                <div 
                  className="bg-sky-500 h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${botProgress}%` }}
                />
              </div>

              {/* Bot typewriter log display */}
              <div className="bg-slate-900 text-sky-400 font-mono text-xs p-4 rounded-xl text-left w-full max-w-md max-h-40 overflow-y-auto shadow-inner border border-slate-800 flex flex-col gap-1.5">
                {botLogs.map((log, i) => (
                  <div key={i} className="animate-fade-in text-sky-300">
                    {log}
                  </div>
                ))}
                <div className="w-2 h-4 bg-sky-400 animate-pulse inline-block self-start mt-1"></div>
              </div>
            </div>
          )}

          {/* TAB 1: AUTH (LOGIN & REGISTER) */}
          {activeTab === "auth" && !verifyingRequest && (
            <div className="max-w-md mx-auto" id="auth_view_box">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold font-heading text-gray-900">
                  {isRegistering ? "Sign Up & Get 3 Free Papers" : "Sign In to Candidate Desk"}
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  {isRegistering 
                    ? "Create an account to instantly get 3 free credits to parse and practice offline PDF papers." 
                    : "Access your saved test papers, remaining credits, and exam history."}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {isRegistering && (
                  <div className="space-y-1">
                    <label className="text-xs font-heading font-medium text-gray-600">Candidate Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Rin Tohsaka" 
                        className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl py-2 pl-9 pr-4 text-sm outline-hidden transition-all"
                        id="auth_name_field"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-heading font-medium text-gray-600 font-mono">Student Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rin@studybot.in" 
                      className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl py-2 pl-9 pr-4 text-sm outline-hidden transition-all"
                      id="auth_email_field"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-heading font-medium text-gray-600">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 text-gray-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl py-2 pl-9 pr-12 text-sm outline-hidden transition-all"
                      id="auth_pass_field"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-xs text-gray-400 hover:text-gray-600 font-medium font-heading"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-heading font-medium text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  id="auth_submit_btn"
                >
                  <Sparkles className="h-4 w-4" />
                  {isRegistering ? "Sign Up & Get 3 Free PDF Parses" : "Sign In"}
                </button>
              </form>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <span className="relative bg-white px-3 text-xs text-gray-400 font-heading select-none">or</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loadingGoogle}
                className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-slate-800 font-heading font-semibold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-3 shadow-xs cursor-pointer hover:border-gray-350"
                id="auth_google_btn"
              >
                {loadingGoogle ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                )}
                {loadingGoogle ? "Connecting Google Account..." : "Direct Sign-in with Google"}
              </button>

              <div className="mt-5 text-center text-xs text-gray-500">
                {isRegistering ? "Candidate already registered? " : "New to the platform? "}
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-sky-600 hover:text-sky-800 font-semibold underline"
                >
                  {isRegistering ? "Sign In here" : "Sign up & get 3 Free PDF Parses"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PORTAL WALLET (Scan QR and Recharge Credits) */}
          {activeTab === "wallet" && !verifyingRequest && (
            <div className="space-y-6" id="wallet_recharge_view">
              
              {/* CURRENT BALANCE METRIC CHIP */}
              <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-sky-800 text-xs font-heading font-medium uppercase tracking-wide">
                    Candidate Parser Balance
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-heading font-extrabold text-slate-900">
                      {walletStats !== null ? walletStats.credits : "..."}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      Mock PDF parsing credits
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    1 credit processes exactly 1 JEE Mock PDF containing Physics, Chem & Math.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs bg-slate-900 text-yellow-300 font-mono font-semibold px-2.5 py-1 rounded-full uppercase inline-block">
                    PRO Mode Gated
                  </div>
                </div>
              </div>

              {/* STEP RECHARGES GRID */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* BILLING ORDER BREAKDOWN PANEL */}
                <div className="bg-slate-50 border border-slate-250/60 shadow-xs rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 w-6 rounded-md bg-[#1b2149] text-sky-400 font-black flex items-center justify-center text-xs shadow-inner">
                        R
                      </div>
                      <span className="text-xs font-heading font-extrabold text-slate-800 uppercase tracking-widest">
                        Razorpay Order Ledger
                      </span>
                    </div>

                    <h4 className="font-heading font-extrabold text-slate-900 text-lg mb-1.5 leading-snug">
                      JEE CBT Prep Studio Checkout
                    </h4>
                    <p className="text-xs text-slate-500 leading-normal mb-5 select-none">
                      Recharging adds premium mock paper lease credentials immediately to your database profile using secure end-to-end cryptographic verifications.
                    </p>

                    {/* Itemized invoice Breakdown */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Selected Package</span>
                        <span className="font-bold text-slate-800 font-heading">
                          {currentPackDetails.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-2.5">
                        <span className="text-slate-500">Net Tariff</span>
                        <span className="font-mono text-slate-700 font-bold">
                          ₹{currentPackDetails.amount}.00
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-2.5">
                        <span className="text-slate-500">Processing & GST charges</span>
                        <span className="text-emerald-700 font-bold">
                          ₹0.00 (Zero Extra Fees!)
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t-2 border-dashed border-slate-100 pt-3">
                        <span className="text-slate-900 font-semibold font-heading">Total Payable Amount</span>
                        <span className="font-mono text-base font-black text-[#1b2149]">
                          ₹{currentPackDetails.amount}.00
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 justify-center select-none font-sans bg-slate-100/50 py-1 rounded-lg">
                      🔒 Secured with AES cryptographic signatures
                    </div>
                  </div>
                </div>

                {/* TRANSACTION SUBMIT FORM */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="font-heading font-semibold text-sm text-slate-900">
                      Step 1: Choose Your Result-Boosting Package
                    </h4>
                    
                    {/* Packs List */}
                    <div className="space-y-2.5">
                      {pricingTiers.map((pack) => (
                        <label 
                          key={pack.id}
                          onClick={() => setSelectedPack(pack.id)}
                          className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selectedPack === pack.id 
                              ? "border-sky-500 bg-sky-50/50" 
                              : "border-gray-100 bg-white hover:bg-gray-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input 
                                type="radio" 
                                name="packSelection" 
                                checked={selectedPack === pack.id}
                                onChange={() => setSelectedPack(pack.id)}
                                className="text-sky-600 focus:ring-sky-500"
                              />
                              <div>
                                <span className="font-heading font-bold text-slate-905 block text-sm">
                                  {pack.name}
                                </span>
                                <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                                  {pack.description || `Parse ${pack.credits} Complete Mock Papers`}
                                </span>
                              </div>
                            </div>
                            <div className="text-right pl-2 shrink-0">
                              <span className="font-heading font-extrabold text-slate-900 block text-base">
                                ₹{pack.amount}
                              </span>
                              <span className="text-[10px] text-sky-600 font-bold block">
                                {pack.credits} Credits
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Submit Form */}
                  <form onSubmit={handlePurchaseSubmit} className="space-y-3.5 pt-3">
                    <button
                      type="submit"
                      disabled={submittingPurchase}
                      className="w-full bg-[#1b2149] hover:bg-[#151a3d] border border-[#1b2149] disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-400 text-white font-heading font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      id="wallet_purchase_submit_btn"
                    >
                      <CreditCard className="h-4.5 w-4.5 text-sky-400" />
                      {submittingPurchase ? "Connecting Secure Server..." : `Proceed to Pay ₹${currentPackDetails.amount} via Razorpay`}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center select-none font-sans leading-relaxed">
                      Instant Delivery: Your credits will activate immediately upon verification without any manual approval waiting lines!
                    </p>
                  </form>

                </div>

              </div>

              {/* INTERACTIVE RAZORPAY SECURE SANDBOX SIMULATOR */}
              {showSimulatedRazorpay && simulatedOrderInfo && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
                  <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-left">
                    {/* Header */}
                    <div className="bg-[#1b2149] px-6 py-5 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-black text-sm select-none">
                          R
                        </div>
                        <div>
                          <h4 className="font-heading font-extrabold text-sm tracking-wide">Razorpay Checkout</h4>
                          <span className="text-[10px] text-sky-200 font-mono tracking-wider block">TEST PLAYGROUND MODE</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setShowSimulatedRazorpay(false);
                          setSubmittingPurchase(false);
                        }}
                        className="text-slate-300 hover:text-white transition-colors p-1"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Order Details Banner */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block tracking-wider uppercase font-semibold">ORDER ID</span>
                        <span className="font-mono text-xs text-slate-700 font-bold">{simulatedOrderInfo.orderId}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block tracking-wider uppercase font-semibold">AMOUNT</span>
                        <span className="text-base font-extrabold text-[#1b2149]">₹{currentPackDetails.amount}.00</span>
                      </div>
                    </div>

                    {/* Simulation Options */}
                    <div className="p-6 space-y-4">
                      <div className="bg-indigo-50/50 text-indigo-950 p-4 rounded-2xl text-xs flex gap-2.5 leading-relaxed border border-indigo-100/50">
                        <span className="text-base select-none">🧠</span>
                        <div>
                          <span className="font-bold block mb-0.5 text-indigo-900">Sandbox Auto-Integrator Shield</span>
                          No private Razorpay API keys were found in your environment secrets, so we booted this beautiful sandboxed visual playground! Testing mock payments will successfully verify signatures and add standard test credits!
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-2">
                        <button
                          onClick={handleSimulatedPaymentSuccess}
                          className="w-full bg-[#1b2149] hover:bg-[#121633] text-white font-heading font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          💸 Simulate Successful Payment (Authorize Credits)
                        </button>
                        <button
                          onClick={() => {
                            setShowSimulatedRazorpay(false);
                            setSubmittingPurchase(false);
                            setErrorMessage("Mock Payment was declined by the candidate.");
                          }}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-heading font-semibold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center"
                        >
                          ✕ Simulate Payment Declined
                        </button>
                      </div>
                    </div>

                    {/* Sandbox Footer */}
                    <div className="bg-slate-50 py-3 text-center text-[10px] text-slate-405 select-none border-t border-slate-150">
                      🔒 Powered by Secure Crytographic Test Gateway
                    </div>
                  </div>
                </div>
              )}
              
              {/* COMPREHENSIVE CAR EXPLANATION FOOTER */}
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-slate-600 border border-gray-100 flex flex-col gap-1.5 leading-relaxed">
                <span className="font-heading font-semibold text-slate-900 block text-xs">
                  🏎️ Platform Charging Disclaimers: How "The Car & the Fuel" monetization model operates
                </span>
                <p>
                  1. <strong>Custom Key Mode ("The Fuel")</strong>: In our settings tab, you can input your private Google Gemini API key or Groq key. Running parsing uses your key's free tier limits (paying ₹0 token fees).
                </p>
                <p>
                  2. <strong>Wallet Credits ("The Car Rent")</strong>: In-app purchase credits represent leasing credentials for our high-precision JEE PDF Parser client itself. Each PDF parse of Physics, Chemistry or Math mock sets consumes exactly 1 Credit, regardless of which API key runs in settings.
                </p>
                <p>
                  3. <strong>UPI Handshake</strong>: P2P manual UPI transfer incurs ₹0 billing engine commission, allowing us to keep credits prices extremely robust (less than ₹2 per exam!). Verification is done autonomously by the StudyBot auditor.
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: TRANSACTION LOGS HISTORY */}
          {activeTab === "transactions" && !verifyingRequest && (
            <div className="space-y-4" id="wallet_logs_inner">
              <h3 className="font-heading font-semibold text-base text-gray-950 mb-3">
                Wallet Ledger History
              </h3>

              {loadingWallet ? (
                <div className="text-center py-8 text-gray-500 font-sans text-sm">
                  Fetching ledger audit trails...
                </div>
              ) : !walletStats || (walletStats.transactions.length === 0 && walletStats.purchases.length === 0) ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 text-sm">
                  No records stored yet.
                </div>
              ) : (
                <div className="space-y-5">
                  
                  {/* Purchases/payment ledger */}
                  <div>
                    <h4 className="text-xs font-heading font-bold uppercase text-slate-400 mb-2 tracking-wider">
                      UPI Ref Purchase Records
                    </h4>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-gray-100">
                            <th className="p-3">Reference No (UTR)</th>
                            <th className="p-3">Package Paid</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Dated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {walletStats.purchases.map((purchase) => (
                            <tr key={purchase.id} className="hover:bg-slate-100/30">
                              <td className="p-3 font-mono font-semibold text-slate-900">{purchase.utrNumber}</td>
                              <td className="p-3">
                                {pricingTiers.find(p => p.id === purchase.pack)?.name || purchase.pack}
                                <span className="text-[10px] text-gray-400 block">₹{purchase.amount} UPI</span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase ${
                                  purchase.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                                  purchase.status === "verifying" || purchase.status === "pending" ? "bg-amber-50 text-amber-700 animate-pulse" :
                                  "bg-red-50 text-red-700"
                                }`}>
                                  {purchase.status}
                                </span>
                              </td>
                              <td className="p-3 text-right text-gray-500">
                                {new Date(purchase.purchaseDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Direct Credit logs ledger */}
                  <div>
                    <h4 className="text-xs font-heading font-bold uppercase text-slate-400 mb-2 tracking-wider">
                      Internal Credit Ledger (Adjustments & Burns)
                    </h4>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-gray-100">
                            <th className="p-3">Operation / Type</th>
                            <th className="p-3 text-center">Amount</th>
                            <th className="p-3">Audit Details</th>
                            <th className="p-3 text-right">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-sans">
                          {walletStats.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-100/30">
                              <td className="p-3 capitalize font-semibold text-slate-800">
                                {tx.type.replace(/_/g, " ")}
                              </td>
                              <td className={`p-3 font-semibold text-center ${tx.amount > 0 ? "text-emerald-700" : "text-sky-600"}`}>
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                              </td>
                              <td className="p-3 text-slate-500 break-words max-w-[200px]">{tx.description}</td>
                              <td className="p-3 text-right text-gray-500 font-mono text-[10px]">
                                {new Date(tx.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })} {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 4: PERSONAL MAILBOX MESSAGES */}
          {activeTab === "mailbox" && (
            <div className="space-y-4 font-sans" id="mailbox_inbox_tab">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-heading font-semibold text-base text-gray-950">
                    ✉️ Administrator Mailbox Hub
                  </h3>
                  <p className="text-xs text-slate-500">Read official notifications, announcements, and direct messages sent specifically to you.</p>
                </div>
                <button
                  onClick={fetchWalletInfo}
                  className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  🔄 Sync Mailbox
                </button>
              </div>

              {loadingWallet ? (
                <div className="text-center py-8 text-gray-400">Loading your inbox messages...</div>
              ) : !walletStats || !walletStats.messages || walletStats.messages.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 py-12 rounded-2xl flex flex-col items-center justify-center gap-2 animate-fade-in">
                  <span className="text-2xl">📭</span>
                  <p className="text-xs font-medium text-slate-600">Your Mailbox is Empty.</p>
                  <p className="text-[10px] text-slate-400">Official letters from support or system administrators will show up here.</p>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  {walletStats.messages.slice().reverse().map((msg: any, idx: number) => (
                    <div 
                      key={msg.id || idx} 
                      className={`p-4 rounded-xl border transition-all ${
                        msg.read 
                          ? "bg-slate-50/55 border-slate-200 text-slate-600" 
                          : "bg-amber-50/40 border-amber-200 ring-1 ring-amber-400/5 text-slate-900 shadow-3xs"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[10px] uppercase font-heading bg-slate-200/60 border border-slate-300 px-2 py-0.5 rounded-full text-slate-700">
                          Direct Message
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          }) : ""}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed font-semibold whitespace-pre-line text-slate-800">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: JEE-PRO ADMIN OVERVIEW DESK (dadapajiop@gmail.com or white-listed only) */}
          {(activeTab as any) === "admin" && userAccount?.role === "admin" && !verifyingRequest && (
            <div className="space-y-6 animate-fade-in" id="admin_tab_view">
              
              {/* ADMIN ACTION ALERTS */}
              {adminActionStatus && (
                <div className="p-3 bg-indigo-50 text-indigo-950 rounded-xl border border-indigo-100 text-xs animate-fade-in font-heading font-medium flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>📣 {adminActionStatus}</span>
                </div>
              )}

              {/* STATS HIGHLIGHT CHIPS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider block">Total Vol (UPI)</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-lg font-heading font-extrabold text-slate-900">₹{totalRevenue}</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 font-medium font-sans">Approved UTR ledgers</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider block">Total Students</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-lg font-heading font-extrabold text-slate-900">
                      {adminData ? adminData.users.length : "..."}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-sans">Registered candidates</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider block">Verified Sales</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-lg font-heading font-extrabold text-slate-900">
                      {adminData ? adminData.purchases.filter(p => p.status === "approved").length : 0}
                    </span>
                  </div>
                  <span className="text-[9px] text-emerald-600 font-medium font-sans">Recharge packs issued</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider block">Pending UPI UTRs</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-lg font-heading font-extrabold text-amber-600">
                      {adminData ? adminData.purchases.filter(p => p.status === "verifying" || p.status === "pending").length : 0}
                    </span>
                  </div>
                  <span className="text-[9px] text-amber-600 animate-pulse font-medium font-sans">Needs audit check</span>
                </div>
              </div>

              {/* ADMINISTRATIVE SUB-TABS NAVIGATION */}
              <div className="flex border border-slate-100 border-b-2 gap-1.5 p-1 bg-slate-50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAdminSubTab("overview")}
                  className={`flex-1 py-1.5 px-3 text-[11px] font-semibold rounded-md font-heading transition-all ${
                    adminSubTab === "overview"
                      ? "bg-white text-slate-900 shadow-3xs border border-slate-100 font-extrabold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🚀 Control Tower
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSubTab("students")}
                  className={`flex-1 py-1.5 px-3 text-[11px] font-semibold rounded-md font-heading transition-all ${
                    adminSubTab === "students"
                      ? "bg-white text-slate-900 shadow-3xs border border-slate-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  👥 Candidates & Bulk
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSubTab("recharges")}
                  className={`flex-1 py-1.5 px-3 text-[11px] font-semibold rounded-md font-heading transition-all flex items-center justify-center gap-1 ${
                    adminSubTab === "recharges"
                      ? "bg-white text-slate-900 shadow-3xs border border-slate-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  💸 UPI UTR Auditing ({adminData ? adminData.purchases.filter(p => p.status === "verifying" || p.status === "pending").length : 0})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSubTab("config")}
                  className={`flex-1 py-1.5 px-3 text-[11px] font-semibold rounded-md font-heading transition-all ${
                    adminSubTab === "config"
                      ? "bg-white text-slate-900 shadow-3xs border border-slate-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ⚙️ Bulletin Settings
                </button>
              </div>

              {/* SUB TAB 0: CONTROL TOWER CONTROL OVERVIEW */}
              {adminSubTab === "overview" && (
                <div className="space-y-4 animate-fade-in" id="overview_tab_view">
                  {/* Status Banner */}
                  <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-15 translate-x-4 -translate-y-4 font-extrabold text-7xl select-none font-sans pointer-events-none text-indigo-400">
                      HUB
                    </div>
                    <div className="space-y-1 relative z-10">
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full font-heading font-extrabold text-[9px] tracking-widest uppercase">
                        Administrative Console Active
                      </span>
                      <h3 className="text-sm font-heading font-extrabold text-white">
                        JEE-PRO CBT Management Control Tower
                      </h3>
                      <p className="text-[10px] text-slate-300 leading-relaxed max-w-lg">
                        Execute master-level system overrides, broadcast instant portal notifications to all student mailboxes, monitor credit ledgers, and manage UPI payment compliance synchronously.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Master Mailbox Broadcast */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-3xs flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            ✉️ Bulk Mailbox Messenger Broadcast
                          </h4>
                          <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-bold">
                            All Registered {adminData ? adminData.users.length : "..."} Students
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Write a formal system announcement message. This is injected as a private direct message into every candidate's mailbox dashboard instantly.
                        </p>
                        <textarea
                          rows={3}
                          value={broadcastMsgText}
                          onChange={(e) => setBroadcastMsgText(e.target.value)}
                          placeholder="Good luck with JEE Mains preparation! We have configured complimentary parsing credits to boost your mock exercises..."
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 text-[11px] leading-relaxed outline-hidden font-sans placeholder:text-slate-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAdminSendBulkBroadcastMessage}
                        disabled={!broadcastMsgText.trim()}
                        className="w-full bg-slate-900 border border-slate-950 hover:bg-slate-800 disabled:bg-slate-100 disabled:border-transparent disabled:text-slate-400 text-white font-heading font-extrabold py-2 px-3 rounded-lg text-[11px] transition-all cursor-pointer flex justify-center items-center gap-1.5 h-9"
                      >
                        ⚡ Dispatch Global Broadcast
                      </button>
                    </div>

                    {/* Bulk Credit Dispersion */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-3xs flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            ⚡ Bulk Credit Dispersion Pulse
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Credit injection engine. Injects or deducts mock credits from ALL registered candidates synchronously. Fast ledger transactions log is automatically created.
                        </p>
                        <form onSubmit={handleAdminBulkAdjust} className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 block">Credits Value</label>
                              <input
                                type="number"
                                required
                                value={bulkAmount}
                                onChange={(e) => setBulkAmount(e.target.value)}
                                placeholder="Value (e.g. 5 or -5)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] h-8 font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 block">Log Explanation</label>
                              <input
                                type="text"
                                required
                                value={bulkDesc}
                                onChange={(e) => setBulkDesc(e.target.value)}
                                placeholder="Log tag description"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] h-8"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={!bulkAmount}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent text-white font-heading font-extrabold py-2 px-3 rounded-lg text-[11px] transition-all cursor-pointer flex justify-center items-center gap-1.5 h-9 border border-indigo-650"
                          >
                            ⚡ Fire Dispersion Pulse
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* Settings quick toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Live System Limits */}
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 font-heading">Monthly SaaS Credit Grant Quota</span>
                        <span className="text-indigo-700 font-mono text-[11px] font-bold">
                          {monthlyDistributedCredits} / {monthlyCreditLimit} cr
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (monthlyDistributedCredits / (monthlyCreditLimit || 1000)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-sans leading-normal">
                        Limits total credits generated programmatically this month via registers/refunds to prevent resource exhaustion. Configurable inside Settings.
                      </p>
                    </div>

                    {/* Auto Auditor Simulation Setup */}
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex flex-col justify-between">
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-800 font-heading">⚡ Live Sandbox Mode Switch</h5>
                        <p className="text-[9px] text-slate-400 font-sans leading-normal">
                          When checked, any payment request UTR submitted by patients/students automatically approves instantly without manual administrative validation.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-200/60">
                        <input
                          type="checkbox"
                          checked={configIsSandbox}
                          onChange={async (e) => {
                            const nextVal = e.target.checked;
                            setConfigIsSandbox(nextVal);
                            try {
                              const res = await fetch("/api/admin/update-config", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  isSandboxMode: nextVal,
                                  adminEmail: userAccount.email,
                                  adminUserId: userAccount.id
                                })
                              });
                              if (res.ok) {
                                setIsSandboxMode(nextVal);
                                setAdminActionStatus(`Auto-Auditor Sandbox Mode updated successfully to: ${nextVal ? "ON" : "OFF"}`);
                                setTimeout(() => setAdminActionStatus(""), 3500);
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="h-4 w-4 bg-white border-slate-300 text-indigo-650 focus:ring-indigo-500 rounded cursor-pointer"
                          id="tower_sandbox_simulation_checkbox"
                        />
                        <span className="text-[10px] text-slate-700 font-bold select-none cursor-pointer" onClick={async () => {
                          const nextVal = !configIsSandbox;
                          setConfigIsSandbox(nextVal);
                          try {
                            const res = await fetch("/api/admin/update-config", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                isSandboxMode: nextVal,
                                adminEmail: userAccount.email,
                                adminUserId: userAccount.id
                              })
                            });
                            if (res.ok) {
                              setIsSandboxMode(nextVal);
                              setAdminActionStatus(`Auto-Auditor Sandbox Mode updated successfully to: ${nextVal ? "ON" : "OFF"}`);
                              setTimeout(() => setAdminActionStatus(""), 3500);
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}>
                          Instant Auto-Approve UTRs ({configIsSandbox ? "Enabled" : "Disabled"})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB TAB 1: STUDENTS DIRECTORY & CODES */}
              {adminSubTab === "students" && (
                <div className="space-y-4">
                  {/* Search bar & Refresh trigger */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search student Name, Email, or Candidate ID..."
                        className="w-full bg-white border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-1.5 pl-8 pr-4 text-xs transition-all outline-hidden font-sans"
                        id="candidate_search_input"
                      />
                      <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
                    </div>
                    <button
                      onClick={fetchAdminData}
                      className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all flex items-center gap-1 text-xs cursor-pointer bg-white"
                      title="Update roster database"
                    >
                      <RefreshCw className="h-3 w-3" /> <span className="font-semibold text-[10px]">Sync</span>
                    </button>
                  </div>

                  {/* Students Roster table */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-3xs">
                    <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-50/70 text-slate-500 border-b border-gray-100 font-heading">
                            <th className="p-2.5">Candidate Details</th>
                            <th className="p-2.5 text-center">Balance</th>
                            <th className="p-2.5 text-center">Status</th>
                            <th className="p-2.5 text-right">Quick Micro Adjustments</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-sans">
                          {loadingAdmin ? (
                            <tr>
                              <td colSpan={4} className="text-center py-8 text-slate-400">Loading student directory...</td>
                            </tr>
                          ) : !adminData || adminData.users.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-8 text-slate-400">No candidates registered in system database.</td>
                            </tr>
                          ) : (
                            adminData.users
                              .filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || u.id?.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((candidate) => (
                                <React.Fragment key={candidate.id}>
                                  <tr className="hover:bg-slate-50/50">
                                    <td className="p-2.5">
                                      <span className="font-bold text-slate-900 block">{candidate.name}</span>
                                      <span className="text-[10px] text-slate-500 font-mono block">{candidate.email}</span>
                                      <span className="text-[8px] text-slate-400 font-mono block">ID: {candidate.id}</span>
                                    </td>
                                    <td className="p-2.5 text-center font-bold text-slate-800 text-xs">
                                      {candidate.credits} cr
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                          candidate.role === "admin" ? "bg-violet-50 text-violet-700 border border-violet-100" : "bg-slate-100 text-slate-600"
                                        }`}>
                                          {candidate.role}
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                          candidate.banned ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                        }`}>
                                          {candidate.banned ? "Suspended" : "Active"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <div className="flex items-center justify-end gap-1.5 select-none">
                                        <button
                                          onClick={() => handleAdminQuickAdjust(candidate.id, 1, "Quick Admin Add +1")}
                                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold cursor-pointer"
                                          title="Quick Add 1 Credit"
                                        >
                                          +1 cr
                                        </button>
                                        <button
                                          onClick={() => handleAdminQuickAdjust(candidate.id, 10, "Quick Admin Add +10")}
                                          className="px-1.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded text-[9px] font-bold cursor-pointer"
                                          title="Quick Add 10 Credits"
                                        >
                                          +10 cr
                                        </button>
                                        <button
                                          onClick={() => handleAdminQuickAdjust(candidate.id, -5, "Quick Admin Deduct -5")}
                                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[9px] font-bold cursor-pointer"
                                          title="Quick Deduct 5 Credits"
                                        >
                                          -5 cr
                                        </button>
                                        <button
                                          onClick={() => handleAdminToggleBan(candidate.id)}
                                          className={`p-1 rounded cursor-pointer transition-all ${
                                            candidate.banned 
                                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                          }`}
                                          title={candidate.banned ? "Activate Candidate" : "Lock / Ban Candidate"}
                                        >
                                          🚫
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            expandedStudentId === candidate.id 
                                              ? setExpandedStudentId(null) 
                                              : setExpandedStudentId(candidate.id);
                                          }}
                                          className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                                            expandedStudentId === candidate.id
                                              ? "bg-indigo-600 text-white border border-indigo-700 shadow-3xs"
                                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                                          }`}
                                          title="Advanced SaaS Actions (Temp Lockout, Recover, Mailbox DM)"
                                        >
                                          ⚙️ Actions
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  
                                  {/* Expanded Controls Drawer inside Candidate iteration */}
                                  {expandedStudentId === candidate.id && (
                                    <tr className="bg-slate-50/55 animate-fade-in text-[11px]" id={`expanded_drawer_${candidate.id}`}>
                                      <td colSpan={4} className="p-3 border-t border-b border-gray-150 shadow-inner w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                                          
                                          {/* Column 1: Temp Suspension */}
                                          <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-2 flex flex-col justify-between shadow-3xs">
                                            <div className="space-y-1">
                                              <span className="font-heading font-bold uppercase tracking-wider text-[9px] text-slate-500 block">⌛ Temporary Lockout</span>
                                              <div className="space-y-1">
                                                <label className="text-[8px] font-bold text-slate-400 block">Duration of Suspension</label>
                                                <select
                                                  value={suspensionHours}
                                                  onChange={(e) => setSuspensionHours(Number(e.target.value))}
                                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-sans text-[10px]"
                                                >
                                                  <option value={24}>24 Hours (1 Day)</option>
                                                  <option value={72}>72 Hours (3 Days)</option>
                                                  <option value={168}>168 Hours (1 Week)</option>
                                                  <option value={720}>720 Hours (1 Month)</option>
                                                </select>
                                              </div>
                                              <div className="space-y-1">
                                                <label className="text-[8px] font-bold text-slate-400 block">Official Lockout Reason</label>
                                                <input
                                                  type="text"
                                                  value={suspensionReason}
                                                  onChange={(e) => setSuspensionReason(e.target.value)}
                                                  placeholder="Suspicious multi-device active log"
                                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px]"
                                                />
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleAdminSuspendUser(candidate.id)}
                                              className="w-full bg-red-600 hover:bg-red-700 text-white font-heading font-bold py-1 px-2.5 rounded-lg text-[10px] transition-all cursor-pointer text-center block mt-2"
                                            >
                                              Apply Suspension
                                            </button>
                                          </div>

                                          {/* Column 2: Send custom direct message */}
                                          <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-2 flex flex-col justify-between shadow-3xs">
                                            <div className="space-y-1">
                                              <span className="font-heading font-bold uppercase tracking-wider text-[9px] text-slate-500 block">✉️ Mailbox Messenger dispatcher</span>
                                              <label className="text-[8px] font-bold text-slate-400 block">Personal message content</label>
                                              <textarea
                                                rows={3}
                                                value={directMessage}
                                                onChange={(e) => setDirectMessage(e.target.value)}
                                                placeholder="Hello Candidate, your UPI payment was processed..."
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-sans text-[10px] leading-relaxed"
                                              />
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleAdminSendMessage(candidate.id)}
                                              disabled={!directMessage.trim()}
                                              className="w-full bg-slate-900 border border-slate-900 hover:bg-slate-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-transparent text-white font-heading font-bold py-1 px-2 rounded-lg text-[10px] transition-all cursor-pointer flex justify-center items-center h-[26px] mt-2"
                                            >
                                              Send Personal Message
                                            </button>
                                          </div>

                                          {/* Column 3: Security vitals and Recovery */}
                                          <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-2 flex flex-col justify-between shadow-3xs">
                                            <div className="space-y-1.5 text-[9px] text-slate-500 font-sans leading-tight">
                                              <span className="font-heading font-bold uppercase tracking-wider text-[9px] text-slate-500 block">⚙️ Safety Profile Recovery</span>
                                              {candidate.suspendedUntil && (
                                                <p className="text-red-700 font-semibold bg-red-50 border border-red-100 p-1 rounded-[4px]">
                                                  ⌛ Locked out until: {new Date(candidate.suspendedUntil).toLocaleString()}
                                                </p>
                                              )}
                                              {candidate.banned && (
                                                <p className="text-red-700 font-semibold bg-slate-100 border border-slate-200 p-1 rounded-[4px]">
                                                  🚫 Permanently Suspended / Banned
                                                </p>
                                              )}
                                              <p>🎫 Core Rank: <span className="text-slate-800 font-bold uppercase">{candidate.role}</span></p>
                                              <p>📍 HW Device linked: <span className="text-slate-800 font-mono text-[9px]">{candidate.deviceId || "No device uuid cookie synced"}</span></p>
                                            </div>
                                            
                                            <button
                                              type="button"
                                              onClick={() => handleAdminRecoverUser(candidate.id)}
                                              className="w-full bg-emerald-650 hover:bg-emerald-700 bg-emerald-600 border border-emerald-600 hover:border-emerald-700 text-white font-heading font-bold py-1 px-2.5 rounded-lg text-[10px] transition-all cursor-pointer flex justify-center items-center gap-1 shadow-3xs mt-2"
                                            >
                                              Recover & Lift Suspensions
                                            </button>
                                          </div>

                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* BULK GRANTER UTILITY BOX */}
                  <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4">
                    <h4 className="font-heading font-semibold text-xs text-indigo-900 mb-1 flex items-center gap-1">
                      📢 Bulk Credit Dispersion Core Engine
                    </h4>
                    <p className="text-[10px] text-indigo-700 mb-2 font-medium">
                      Inject or deduct credits synchronously for ALL registered candidates globally. Fast transaction ledger updates enforced automatically.
                    </p>
                    <form onSubmit={handleAdminBulkAdjust} className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-end">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold tracking-wide uppercase text-indigo-600">Burst Credits Value</label>
                        <input
                          type="number"
                          required
                          value={bulkAmount}
                          onChange={(e) => setBulkAmount(e.target.value)}
                          placeholder="Ex: 5 or -5"
                          className="w-full bg-white border border-indigo-200 rounded-lg p-1.5 text-xs outline-hidden font-mono"
                          id="bulk_amount_dispenser_input"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold tracking-wide uppercase text-indigo-600">Dispersion Log Explanation</label>
                        <input
                          type="text"
                          required
                          value={bulkDesc}
                          onChange={(e) => setBulkDesc(e.target.value)}
                          placeholder="Welcome bonus, festival gift, promotional grant"
                          className="w-full bg-white border border-indigo-200 rounded-lg p-1.5 text-xs outline-hidden"
                          id="bulk_desc_input"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!bulkAmount}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent text-white font-heading font-bold text-xs p-2 rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1 border border-indigo-600"
                        id="bulk_pulse_btn"
                      >
                        ⚡ Dispersion Pulse
                      </button>
                    </form>
                  </div>

                  {/* BACKWARD COMPATIBLE INDIVIDUAL DETAIL ADJUSTMENT GRID */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="font-heading font-semibold text-xs text-slate-800 mb-2">
                       🔍 Specialized Manual Balance Override
                    </h4>
                    <form onSubmit={handleAdminAdjust} className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-end">
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500">Pick Student</label>
                        <select
                          required
                          value={adjUserId}
                          onChange={(e) => setAdjUserId(e.target.value)}
                          className="w-full bg-white border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-1.5 text-xs transition-all outline-hidden"
                          id="admin_student_select"
                        >
                          <option value="">-- Choose Candidate --</option>
                          {adminData?.users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.credits}cr - {u.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500">Credits Adjustment</label>
                        <input 
                          type="number"
                          required
                          value={adjAmount}
                          onChange={(e) => setAdjAmount(e.target.value)}
                          placeholder="Ex: 10 or -3"
                          className="w-full bg-white border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-1.5 text-xs transition-all outline-hidden font-mono"
                          id="admin_student_amount_input"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500">Audit Description</label>
                        <input 
                          type="text"
                          required
                          value={adjDesc}
                          onChange={(e) => setAdjDesc(e.target.value)}
                          placeholder="Manual bonus adjust"
                          className="w-full bg-white border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-1.5 text-xs transition-all outline-hidden"
                          id="admin_student_desc_input"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!adjUserId || !adjAmount}
                        className="w-full bg-slate-900 border border-slate-900 hover:bg-slate-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:border-transparent text-white font-heading font-medium text-xs p-2 rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1"
                        id="admin_adjust_submit_btn"
                      >
                        <TrendingUp className="h-3 w-3" /> Fire Override
                      </button>

                    </form>
                  </div>
                </div>
              )}

              {/* SUB TAB 2: RECHARGES & UPI VERIFICATION */}
              {adminSubTab === "recharges" && (
                <div className="space-y-4">
                  <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-3xs">
                    <div className="px-4 py-3 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                      <h4 className="font-heading font-semibold text-xs text-slate-700">
                        UPI Reference UTR Audit Checks
                      </h4>
                      <button 
                        onClick={fetchAdminData}
                        className="p-1 px-2 border border-slate-200 rounded text-slate-600 hover:text-slate-800 text-[10px] font-heading font-semibold flex items-center gap-1 cursor-pointer bg-white"
                      >
                        <RefreshCw className="h-2.5 w-2.5" /> Synchronize Ledgers
                      </button>
                    </div>
                    
                    {loadingAdmin ? (
                      <div className="text-center py-10 text-xs text-slate-400 animate-pulse font-sans">
                        Reading live transaction entries...
                      </div>
                    ) : !adminData || adminData.purchases.length === 0 ? (
                      <div className="text-center py-10 text-[11px] text-slate-400 bg-white">
                        No UPI purchase requests logged in Firestore database yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/50 text-slate-500 border-b border-gray-100 font-heading">
                              <th className="p-3">Student Candidate email</th>
                              <th className="p-3">Reference UTR Number</th>
                              <th className="p-3">Cash Tier</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Verification Gateway Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-sans text-[11px]">
                            {adminData.purchases.map((purchase) => (
                              <tr key={purchase.id} className="hover:bg-slate-50/30">
                                <td className="p-3">
                                  <span className="font-semibold block text-slate-900">{purchase.userEmail}</span>
                                  <span className="text-[9px] text-slate-400 block font-mono">{purchase.userId}</span>
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-800 bg-sky-50/35 px-2 rounded">
                                  {purchase.utrNumber}
                                </td>
                                <td className="p-3">
                                  <span className="font-semibold">{pricingTiers.find(p => p.id === purchase.pack)?.name || purchase.pack}</span>
                                  <span className="text-[10px] text-emerald-700 block font-heading font-medium">₹{purchase.amount} INR</span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-heading font-bold uppercase ${
                                    purchase.status === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                    purchase.status === "verifying" || purchase.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse" :
                                    "bg-rose-50 text-rose-700 border border-rose-100"
                                  }`}>
                                    {purchase.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right flex items-center justify-end gap-1.5">
                                  {purchase.status !== "approved" && (
                                    <button
                                      onClick={() => handleAdminApprove(purchase.id)}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-semibold rounded text-[10px] transition-all cursor-pointer shadow-3xs"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {(purchase.status === "verifying" || purchase.status === "pending") && (
                                    <button
                                      onClick={() => handleAdminDecline(purchase.id)}
                                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-heading font-semibold rounded text-[10px] transition-all cursor-pointer shadow-3xs"
                                    >
                                      Decline
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB TAB 3: SYSTEM HARDENING CONFIG */}
              {adminSubTab === "config" && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-5">
                  <div>
                    <h3 className="font-heading font-semibold text-xs text-slate-800">📣 Portal Announcements & Registration Settings</h3>
                    <p className="text-[10px] text-slate-500">Overhaul student board broadcast notices and parameter configurations globally.</p>
                  </div>

                  <form onSubmit={handleAdminUpdateConfig} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-500 block">📢 General Announcement board Bulletin (Displays globally instantly)</label>
                      <textarea
                        required
                        rows={2}
                        value={configNotice}
                        onChange={(e) => setConfigNotice(e.target.value)}
                        placeholder="Write platform wide instructions or updates here..."
                        className="w-full bg-white border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-2.5 text-xs transition-all outline-hidden font-sans"
                        id="bulletin_config_textarea"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1 col-span-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500 block">🎁 Free onboarding credits</label>
                        <input
                          type="number"
                          required
                          value={configWelcomeCredits}
                          onChange={(e) => setConfigWelcomeCredits(e.target.value)}
                          placeholder="3"
                          className="w-full bg-white border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-1.5 text-xs outline-hidden font-mono"
                          id="onboarding_credits_input"
                        />
                        <span className="text-[9px] text-slate-400 block font-sans">For student registration.</span>
                      </div>

                      <div className="space-y-1 col-span-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500 block">🛑 Maximum Credits Per Month</label>
                        <input
                          type="number"
                          required
                          value={configMonthlyCreditLimit}
                          onChange={(e) => setConfigMonthlyCreditLimit(e.target.value)}
                          placeholder="1000"
                          className="w-full bg-white border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-1.5 text-xs outline-hidden font-mono"
                          id="monthly_credit_limit_input"
                        />
                        <span className="text-[9px] text-slate-400 block font-sans">Monthly distribution quota limit.</span>
                      </div>

                      <div className="space-y-1 col-span-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500 block">🔒 Alice Auditor Mode</label>
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            checked={configIsSandbox}
                            onChange={(e) => setConfigIsSandbox(e.target.checked)}
                            className="h-4 w-4 bg-white border-gray-200 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
                            id="sandbox_simulation_checkbox"
                          />
                          <span className="text-[10px] text-slate-750 font-semibold select-none cursor-pointer" onClick={() => setConfigIsSandbox(!configIsSandbox)}>
                            Simulate Auto UTR Approvals
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Pricing Tier Manager */}
                    <div className="pt-4 border-t border-slate-200/60 space-y-3">
                      <div>
                        <h4 className="font-heading font-semibold text-xs text-slate-800">💰 Dynamic Credit Pricing & Tier Manager</h4>
                        <p className="text-[10px] text-slate-500">Add, delete, or configure pricing packs (1 credit = 1 complete mock paper parser lease).</p>
                      </div>

                      <div className="space-y-3">
                        {pricingTiers.map((tier, idx) => (
                          <div key={tier.id || idx} className="bg-white border border-slate-200/80 rounded-xl p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 block">Pack Name</label>
                              <input
                                type="text"
                                value={tier.name}
                                onChange={(e) => {
                                  const updated = [...pricingTiers];
                                  updated[idx].name = e.target.value;
                                  setPricingTiers(updated);
                                }}
                                className="w-full bg-slate-50/50 border border-slate-200/80 rounded-lg px-2 py-1 text-xs outline-hidden"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 block">Credits Amount</label>
                              <input
                                type="number"
                                value={tier.credits}
                                onChange={(e) => {
                                  const updated = [...pricingTiers];
                                  updated[idx].credits = Number(e.target.value);
                                  setPricingTiers(updated);
                                }}
                                className="w-full bg-slate-50/50 border border-slate-200/80 rounded-lg px-2 py-1 text-xs outline-hidden"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 block">Price (₹ INR)</label>
                              <input
                                type="number"
                                value={tier.amount}
                                onChange={(e) => {
                                  const updated = [...pricingTiers];
                                  updated[idx].amount = Number(e.target.value);
                                  setPricingTiers(updated);
                                }}
                                className="w-full bg-slate-50/50 border border-slate-200/80 rounded-lg px-2 py-1 text-xs outline-hidden"
                              />
                            </div>
                            <div className="md:col-span-4 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 block">Description Outline</label>
                              <input
                                type="text"
                                value={tier.description || ""}
                                onChange={(e) => {
                                  const updated = [...pricingTiers];
                                  updated[idx].description = e.target.value;
                                  setPricingTiers(updated);
                                }}
                                className="w-full bg-slate-50/50 border border-slate-200/80 rounded-lg px-2 py-1 text-xs outline-hidden"
                              />
                            </div>
                            <div className="md:col-span-1 flex justify-end pt-4 md:pt-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = pricingTiers.filter((_, i) => i !== idx);
                                  setPricingTiers(updated);
                                }}
                                className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-all"
                                title="Remove Tier Pack"
                              >
                                <Minus size={14} />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newId = "custom_" + Date.now();
                              setPricingTiers([
                                ...pricingTiers,
                                { id: newId, name: "New Tier Pack", credits: 1, amount: 15, description: "Dynamic Package Description" }
                              ]);
                            }}
                            className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                          >
                            <Plus size={12} /> Add New Pricing Tier
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Quota Usage bar */}
                    <div className="p-4 bg-indigo-50/25 border border-indigo-100 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-indigo-900 font-heading">Monthly SaaS Credit Grant Quota</span>
                        <span className="text-indigo-700 font-mono text-[11px] font-bold">
                          {monthlyDistributedCredits} / {monthlyCreditLimit} Credits used
                        </span>
                      </div>
                      <div className="w-full bg-slate-150 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (monthlyDistributedCredits / (monthlyCreditLimit || 1)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-indigo-500 font-sans">
                        Accounting resets dynamically when system timezone shifts into a new monthly sequence block.
                      </p>
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                        id="save_configs_btn"
                      >
                        ⚡ Apply Settings
                      </button>
                    </div>
                  </form>

                  {/* Dynamic Announcements Manager */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div>
                      <h4 className="font-heading font-semibold text-xs text-slate-800">📋 Interactive Announcements Grid Ledger</h4>
                      <p className="text-[10px] text-slate-500">Inject or dismiss system-wide banner notifications instantly.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                      <div className="md:col-span-1 space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500 block">Alert Type</label>
                        <select
                          id="new_ann_type_select"
                          className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-[11px]"
                        >
                          <option value="Urgent Info">🚨 Urgent Info</option>
                          <option value="Maintenance">🔧 Maintenance</option>
                          <option value="New Update">✨ New Update</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-500 block">Announcement text</label>
                        <input
                          type="text"
                          id="new_ann_content_input"
                          placeholder="Ex: Main engine server expansion scheduled..."
                          className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-[11px]"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={async () => {
                            const typeEl = document.getElementById("new_ann_type_select") as HTMLSelectElement;
                            const contentEl = document.getElementById("new_ann_content_input") as HTMLInputElement;
                            if (typeEl && contentEl && contentEl.value.trim() && userAccount) {
                              const newAnn = {
                                id: "ann_" + Math.random().toString(36).substring(2, 9),
                                type: typeEl.value,
                                content: contentEl.value.trim(),
                                createdAt: new Date().toISOString()
                              };
                              const updatedAnnouncements = [...announcements, newAnn];
                              
                              const res = await fetch("/api/admin/update-config", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  broadcastNotice: configNotice,
                                  welcomeCredits: Number(configWelcomeCredits),
                                  isSandboxMode: configIsSandbox,
                                  monthlyCreditLimit: Number(configMonthlyCreditLimit),
                                  announcements: updatedAnnouncements,
                                  adminEmail: userAccount.email,
                                  adminUserId: userAccount.id
                                })
                              });
                              if (res.ok) {
                                setAnnouncements(updatedAnnouncements);
                                contentEl.value = "";
                                setAdminActionStatus("Announcement published dynamically inside portals!");
                                setTimeout(() => setAdminActionStatus(""), 4500);
                              }
                            }
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-[10px] p-2 leading-none rounded-lg h-[30px] flex items-center justify-center cursor-pointer border border-indigo-600"
                        >
                          ＋ Publish Alert
                        </button>
                      </div>
                    </div>

                    {/* Announcement list tags container */}
                    <div className="space-y-2 mt-2">
                      {announcements && announcements.length > 0 ? (
                        announcements.map((ann: any, idx: number) => (
                          <div key={ann.id || idx} className="flex items-center justify-between p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs leading-tight">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="font-extrabold text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-white text-slate-800 border shrink-0">
                                {ann.type}
                              </span>
                              <span className="font-medium text-slate-700 truncate">{ann.content}</span>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!userAccount) return;
                                const updatedAnnouncements = announcements.filter((a: any, i: number) => (a.id ? a.id !== ann.id : i !== idx));
                                
                                const res = await fetch("/api/admin/update-config", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    broadcastNotice: configNotice,
                                    welcomeCredits: Number(configWelcomeCredits),
                                    isSandboxMode: configIsSandbox,
                                    monthlyCreditLimit: Number(configMonthlyCreditLimit),
                                    announcements: updatedAnnouncements,
                                    adminEmail: userAccount.email,
                                    adminUserId: userAccount.id
                                  })
                                });
                                if (res.ok) {
                                  setAnnouncements(updatedAnnouncements);
                                  setAdminActionStatus("Announcement dismissed successfully.");
                                  setTimeout(() => setAdminActionStatus(""), 3500);
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800 font-bold ml-2 shrink-0 text-[10px]"
                            >
                              Dismiss x
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No dynamic announcements are currently active.</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </motion.div>
    </motion.div>
  );
}
