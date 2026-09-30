import React, { useState } from "react";
import { CreditCard, AlertCircle, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
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
}

export function WalletRecharge({
  userAccount,
  currentCredits,
  pricingTiers,
  onRechargeSuccess
}: WalletRechargeProps) {
  const [selectedPackId, setSelectedPackId] = useState<string>(
    pricingTiers[0]?.id || "5_credits"
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const currentPack =
    pricingTiers.find((p) => p.id === selectedPackId) || pricingTiers[0] || {
      id: "5_credits",
      name: "5 Credits Pack",
      credits: 5,
      amount: 59
    };

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
      // Step 1: Create order on backend
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
        throw new Error(orderData.error || "Failed to create payment order.");
      }

      // Step 2: Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load payment gateway. Please check your internet connection.");
      }

      // Step 3: Launch Razorpay standard checkout
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
            setSuccessMessage("Verifying payment confirmation...");

            const verifyRes = await fetch("/api/payment/razorpay-verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: userAccount.id,
                pack: selectedPackId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                isSandbox: false
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment signature verification failed.");
            }

            setSuccessMessage(`Payment Successful! Added ${currentPack.credits} credits to your account.`);
            onRechargeSuccess(verifyData.user);
          } catch (err: any) {
            setErrorMessage(err.message || "Failed verifying transaction.");
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: userAccount.name,
          email: userAccount.email
        },
        theme: {
          color: "#1a3a5f"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setErrorMessage(response.error?.description || "Payment failed or was cancelled.");
        setSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || "Could not complete checkout.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Balance Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <span className="text-blue-900 text-xs font-bold uppercase tracking-wider block">
            Current Mock Balance
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{currentCredits}</span>
            <span className="text-xs font-semibold text-slate-500">Credits Available</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            1 credit converts 1 full-length mock paper PDF into an active NTA CBT exam.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-white/80 border border-blue-200/60 px-3 py-1.5 rounded-full text-xs font-bold text-blue-900 shadow-2xs">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span>Instant Top-up</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-2.5 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Pricing Packs Grid */}
      <form onSubmit={handleCheckout} className="space-y-4">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Choose a Recharge Pack
        </label>

        <div className="grid sm:grid-cols-3 gap-3">
          {pricingTiers.map((pack) => {
            const isSelected = selectedPackId === pack.id;
            return (
              <div
                key={pack.id}
                onClick={() => setSelectedPackId(pack.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/40 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">{pack.name}</span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-black text-slate-900">₹{pack.amount}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {pack.description || `${pack.credits} Full Mock Tests`}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blue-700">
                  <span>{pack.credits} Credits</span>
                  <span className="text-slate-400 font-normal">₹{(pack.amount / pack.credits).toFixed(1)}/test</span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 bg-[#1a3a5f] hover:bg-[#132a45] disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <CreditCard className="h-4 w-4 text-blue-200" />
          {submitting ? "Connecting to Gateway..." : `Pay ₹${currentPack.amount} via Secure Checkout`}
        </button>

        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Encrypted 256-bit payment processing with zero hidden fees</span>
        </div>
      </form>
    </div>
  );
}
