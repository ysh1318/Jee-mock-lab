import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Wallet, ShieldCheck, Mail, LogOut, ArrowRight } from "lucide-react";
import { UserAccount, PurchaseRequest, CreditTransaction, UserMessage } from "../types";
import { AuthModal } from "./auth/AuthModal";
import { WalletRecharge, PricingTier } from "./wallet/WalletRecharge";
import { TransactionHistory } from "./wallet/TransactionHistory";

interface WalletAndAuthProps {
  userAccount: UserAccount | null;
  onLogin: (account: UserAccount) => void;
  onLogout: () => void;
  onClose?: () => void;
  initialTab?: "auth" | "wallet" | "transactions" | "mailbox";
}

export function WalletAndAuth({
  userAccount,
  onLogin,
  onLogout,
  onClose,
  initialTab
}: WalletAndAuthProps) {
  const [activeTab, setActiveTab] = useState<"auth" | "wallet" | "transactions" | "mailbox">(
    userAccount ? (initialTab || "wallet") : "auth"
  );

  const [walletStats, setWalletStats] = useState<{
    credits: number;
    messages?: UserMessage[];
    transactions: CreditTransaction[];
    purchases: PurchaseRequest[];
  } | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    { id: "2_credits", name: "2 Credits Pack", credits: 2, amount: 29, description: "Parse 2 Complete Mock Papers" },
    { id: "5_credits", name: "5 Credits Pack", credits: 5, amount: 59, description: "Parse 5 Complete Mock Papers" },
    { id: "10_credits", name: "10 Credits Pack", credits: 10, amount: 99, description: "Parse 10 Complete Mock Papers" }
  ]);

  const fetchWalletInfo = async () => {
    if (!userAccount?.id) return;
    setLoadingWallet(true);
    try {
      const res = await fetch(`/api/user/${userAccount.id}/wallet`);
      if (res.ok) {
        const data = await res.json();
        setWalletStats(data);
        if (data.credits !== undefined && data.credits !== userAccount.credits) {
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

  const fetchSystemConfig = async () => {
    try {
      const res = await fetch("/api/system-config");
      if (res.ok) {
        const data = await res.json();
        if (data.pricingTiers && data.pricingTiers.length > 0) {
          setPricingTiers(data.pricingTiers);
        }
      }
    } catch (err) {
      console.warn("Could not fetch pricing configuration:", err);
    }
  };

  useEffect(() => {
    fetchSystemConfig();
    if (userAccount) {
      fetchWalletInfo();
      if (initialTab && initialTab !== "auth") {
        setActiveTab(initialTab);
      } else {
        setActiveTab("wallet");
      }
    } else {
      setActiveTab("auth");
    }
  }, [userAccount, initialTab]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 my-auto text-left"
      >
        {/* Header */}
        <div className="bg-[#1a3a5f] text-white px-5 py-4 flex items-center justify-between border-b border-slate-700/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200">
              <Wallet size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">
                {userAccount ? "Candidate Portal & Wallet" : "Candidate Access Desk"}
              </h2>
              <p className="text-[11px] text-blue-200/80">
                {userAccount ? userAccount.email : "Sign in to manage test papers & credits"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userAccount && (
              <button
                onClick={onLogout}
                className="px-2.5 py-1 text-rose-200 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 rounded-md text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                title="Sign out of account"
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (if logged in) */}
        {userAccount && (
          <div className="flex items-center border-b border-slate-200 px-4 bg-slate-50 gap-2">
            <button
              onClick={() => setActiveTab("wallet")}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "wallet"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Wallet size={14} />
              <span>Wallet & Recharges</span>
            </button>

            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "transactions"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Activity & Receipts</span>
            </button>

            <button
              onClick={() => setActiveTab("mailbox")}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "mailbox"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Mail size={14} />
              <span>Notifications</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {!userAccount || activeTab === "auth" ? (
            <AuthModal
              onSuccess={(user) => {
                onLogin(user);
                setActiveTab("wallet");
              }}
              onClose={onClose}
            />
          ) : activeTab === "wallet" ? (
            <WalletRecharge
              userAccount={userAccount}
              currentCredits={walletStats?.credits ?? userAccount.credits}
              pricingTiers={pricingTiers}
              onRechargeSuccess={(updatedUser) => {
                onLogin(updatedUser);
                fetchWalletInfo();
              }}
            />
          ) : activeTab === "transactions" ? (
            <TransactionHistory
              transactions={walletStats?.transactions || []}
              purchases={walletStats?.purchases || []}
              loading={loadingWallet}
            />
          ) : activeTab === "mailbox" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Candidate Notifications
                </h4>
                <button
                  onClick={fetchWalletInfo}
                  className="text-[11px] text-blue-600 hover:underline font-bold"
                >
                  Refresh
                </button>
              </div>

              {!walletStats?.messages || walletStats.messages.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No notifications yet. Official announcements and test updates will appear here.
                </div>
              ) : (
                <div className="space-y-2">
                  {walletStats.messages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-slate-600">{msg.sender || "System"}</span>
                        <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-medium">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
