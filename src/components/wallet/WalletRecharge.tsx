import React, { useState } from "react";
import { CreditCard, AlertCircle, CheckCircle2, ShieldCheck, Zap, Lock, Sparkles } from "lucide-react";
import { UserAccount } from "../../types";

export interface PricingTier {
  id: string;
  name: string;
  credits: number;
  amount: number;
  description?: string;
}

interface WalletRechargeProps {
  userAccount: UserAccount;
  currentCredits: number;
  pricingTiers: PricingTier[];
  onRechargeSuccess: (updatedUser: UserAccount) => void;
  initialPackId?: string;
}

export function WalletRecharge({
  userAccount,
  currentCredits,
  pricingTiers,
  onRechargeSuccess,
  initialPackId
}: WalletRechargeProps) {
  const fallbackTiers: PricingTier[] = [
    { id: "2_credits", name: "2 Credits Pack", credits: 2, amount: 29, description: "Parse 2 Complete Mock Papers" },
    { id: "5_credits", name: "5 Credits Pack", credits: 5, amount: 59, description: "Parse 5 Complete Mock Papers" },
    { id: "10_credits", name: "10 Credits Pack", credits: 10, amount: 99, description: "Parse 10 Complete Mock Papers" },
    { id: "all_access_pass", name: "All-Access Pass", credits: 0, amount: 199, description: "Unlock all 60 shifts (2024-2026)" }
  ];

  const tiers = pricingTiers && pricingTiers.length > 0 ? pricingTiers : fallbackTiers;

  const [selectedPackId, setSelectedPackId] = useState<string>(() => {
    if (initialPackId && tiers.some(t => t.id === initialPackId)) {
      return initialPackId;
    }
    return tiers[1]?.id || tiers[0]?.id || "5_credits";
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const currentPack =
    tiers.find((p) => p.id === selectedPackId) || tiers[0] || fallbackTiers[1];

  const loadRazorpayScript = (): Promise<boolean> => {
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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/payment/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userAccount.id,
          pack: selectedPackId
        })
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || "Failed to initialize payment gateway order.");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load secure payment gateway. Please check your internet connection.");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "JEE MockLab",
        description: currentPack.name,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            setSubmitting(true);
            setSuccessMessage("Verifying cryptographic payment signature...");

            const verifyRes = await fetch("/api/payment/razorpay-verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: userAccount.id,
                pack: selectedPackId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment signature verification failed.");
            }

            setSuccessMessage(`Payment Successful! Added ${currentPack.credits} credits to your account.`);
            if (verifyData.user) {
              onRechargeSuccess(verifyData.user);
            }
          } catch (err: any) {
            setErrorMessage(err.message || "Failed verifying transaction.");
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: userAccount.name || "Aspirant",
          email: userAccount.email || "student@jeemocklab.in",
          contact: (userAccount as any).phone || ""
        },
        theme: {
          color: "#1a3a5f"
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setErrorMessage(response.error?.description || "Payment cancelled or interrupted.");
        setSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || "Could not complete checkout.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Current Balance Ribbon */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-blue-900 block">
            Current Parsing Balance
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-black text-slate-900 font-mono tabular-nums">{currentCredits}</span>
            <span className="text-xs font-semibold text-slate-600">Credits Available</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            1 credit converts 1 full-length mock paper PDF (75 questions) into an active NTA CBT exam.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-white border border-blue-200/80 px-3 py-1.5 rounded-full text-xs font-bold text-blue-900 shadow-2xs">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span>Instant Activation</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200/80 flex items-start gap-2.5 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200/80 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <span className="leading-relaxed">{successMessage}</span>
        </div>
      )}

      {/* Pricing Packs Grid */}
      <form onSubmit={handleCheckout} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Select Credit Pack
            </label>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              Standard NTA Scheme (+4 / -1)
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tiers.map((pack) => {
              const isSelected = selectedPackId === pack.id;
              const isPass = pack.id === "all_access_pass";
              const costPerPaper = isPass ? "3.3" : pack.credits > 0 ? (pack.amount / pack.credits).toFixed(1) : "0";

              return (
                <div
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.03)] ring-1 ring-blue-600/30"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-800">{pack.name}</span>
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">₹{pack.amount}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {pack.description || (isPass ? "60 Official Shifts (2024-2026)" : `${pack.credits} Full Mock Papers`)}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-blue-700 font-mono tabular-nums">
                      {isPass ? "60 Shifts" : `${pack.credits} Credits`}
                    </span>
                    <span className="text-slate-500 font-mono tabular-nums text-[10px]">
                      ₹{costPerPaper}/{isPass ? "shift" : "test"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown & Single Gateway Checkout Button */}
        <div className="space-y-3 pt-1">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <span className="font-medium">Total payable for {currentPack.name}:</span>
            <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">₹{currentPack.amount}</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1a3a5f] hover:bg-[#132a45] disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.99]"
          >
            <CreditCard className="h-4 w-4 text-blue-200" />
            {submitting ? "Connecting to Gateway..." : `Pay ₹${currentPack.amount} (UPI, Cards, Netbanking)`}
          </button>

          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Encrypted 256-bit checkout via Razorpay • Instant automated crediting</span>
          </div>
        </div>
      </form>
    </div>
  );
}
