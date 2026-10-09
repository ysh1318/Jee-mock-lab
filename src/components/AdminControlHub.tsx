/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  X, ShieldCheck, Users, CreditCard, Sparkles, 
  Send, RefreshCw, AlertTriangle, Mail, Ban, UserCheck, 
  Plus, Minus, TrendingUp, DollarSign, Search, CheckCircle, 
  Settings, Megaphone, Check, Trash2, ArrowUpRight
} from "lucide-react";
import { UserAccount, PurchaseRequest, CreditTransaction, UserMessage } from "../types";

interface AdminControlHubProps {
  userAccount: UserAccount;
  onLogout: () => void;
  onClose: () => void;
}

export function AdminControlHub({ userAccount, onLogout, onClose }: AdminControlHubProps) {
  const [adminData, setAdminData] = useState<{ users: UserAccount[]; purchases: PurchaseRequest[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState("");
  const [systemConfig, setSystemConfig] = useState<any>(null);

  // Active Tab: "students" | "payments" | "broadcast" | "settings"
  const [activeTab, setActiveTab] = useState<"students" | "payments" | "broadcast" | "settings">("students");

  // Filters for Students
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");

  // Quick Action States
  const [selectedStudent, setSelectedStudent] = useState<UserAccount | null>(null);
  const [directMsg, setDirectMsg] = useState("");
  const [adjCredits, setAdjCredits] = useState<number>(5);
  const [broadcastText, setBroadcastText] = useState("");
  const [bulkCreditAmount, setBulkCreditAmount] = useState<string>("");
  const [newNoticeText, setNewNoticeText] = useState("");

  const triggerStatusMsg = (msg: string) => {
    setActionStatus(msg);
    setTimeout(() => setActionStatus(""), 4000);
  };

  const fetchHubData = async () => {
    setLoading(true);
    try {
      const [resData, resConfig] = await Promise.all([
        fetch(`/api/admin/data?email=${encodeURIComponent(userAccount.email)}`),
        fetch("/api/system-config")
      ]);

      if (resData.ok) {
        const d = await resData.json();
        setAdminData(d);
      }
      if (resConfig.ok) {
        const c = await resConfig.json();
        setSystemConfig(c);
      }
    } catch (err: any) {
      console.error("Failed fetching admin data:", err);
      triggerStatusMsg("Failed to synchronize with server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, [userAccount.email]);

  // Adjust Student Credits
  const handleAdjustCredits = async (userId: string, delta: number, reason: string = "Admin Adjustment") => {
    try {
      const res = await fetch("/api/admin/adjust-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: delta,
          description: reason,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      if (res.ok) {
        triggerStatusMsg(`Updated student credits by ${delta > 0 ? "+" : ""}${delta}`);
        fetchHubData();
      } else {
        const d = await res.json();
        triggerStatusMsg(`Error: ${d.error || "Adjustment failed"}`);
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  // Toggle Ban
  const handleToggleBan = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/toggle-ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, adminEmail: userAccount.email, adminUserId: userAccount.id })
      });
      const d = await res.json();
      if (res.ok) {
        triggerStatusMsg(`Student status updated: ${d.banned ? "Banned" : "Active"}`);
        fetchHubData();
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  // Send Direct Message to Student
  const handleSendDirectMessage = async () => {
    if (!selectedStudent || !directMsg.trim()) return;
    try {
      const res = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudent.id,
          content: directMsg,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      if (res.ok) {
        triggerStatusMsg(`Direct message dispatched to ${selectedStudent.name}`);
        setDirectMsg("");
        fetchHubData();
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  // Broadcast Message to All
  const handleBroadcast = async () => {
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
        triggerStatusMsg(`Broadcast sent to all ${d.affectedCount || "active"} students!`);
        setBroadcastText("");
        fetchHubData();
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  // Bulk Dispense Credits
  const handleBulkCredits = async () => {
    const amount = Number(bulkCreditAmount);
    if (!amount || isNaN(amount)) return;
    try {
      const res = await fetch("/api/admin/bulk-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          description: "Admin Platform Bonus",
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      const d = await res.json();
      if (res.ok) {
        triggerStatusMsg(`Granted ${amount} credits to ${d.affectedCount} students!`);
        setBulkCreditAmount("");
        fetchHubData();
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };



  // Update Config
  const handleSaveConfig = async (patch: any) => {
    try {
      const res = await fetch("/api/admin/update-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patch,
          adminEmail: userAccount.email,
          adminUserId: userAccount.id
        })
      });
      if (res.ok) {
        triggerStatusMsg("System configuration updated successfully.");
        fetchHubData();
      }
    } catch (err: any) {
      triggerStatusMsg(`Error: ${err.message}`);
    }
  };

  // Calculations
  const users = adminData?.users || [];
  const purchases = adminData?.purchases || [];
  const totalRevenue = purchases
    .filter(p => p.status === "approved")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalCreditsActive = users.reduce((sum, u) => sum + (u.credits || 0), 0);

  const filteredStudents = users.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(q) || 
                          s.email.toLowerCase().includes(q) || 
                          s.id.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (statusFilter === "banned") return s.banned;
    if (statusFilter === "active") return !s.banned;
    return true;
  });

  return (
    <div className="fixed inset-0 min-h-screen bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 z-[500] font-sans backdrop-blur-xs select-text overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
        
        {/* HEADER */}
        <div className="bg-[#1a3a5f] text-white p-4 sm:px-6 flex items-center justify-between shrink-0 border-b border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/15">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">JEE MockLab Admin Panel</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Logged in as <span className="font-semibold text-white">{userAccount.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHubData}
              disabled={loading}
              title="Refresh Data"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition cursor-pointer"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Students</span>
              <Users size={16} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{users.length}</div>
            <span className="text-[10px] text-slate-450">Registered candidates</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Active Credits</span>
              <Sparkles size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1 font-mono">{totalCreditsActive}</div>
            <span className="text-[10px] text-slate-450">Circulating in student wallets</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Recharge Revenue</span>
              <DollarSign size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">₹{totalRevenue}</div>
            <span className="text-[10px] text-slate-450">Total verified orders</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Transactions</span>
              <CreditCard size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{purchases.length}</div>
            <span className="text-[10px] text-slate-450">Order history entries</span>
          </div>
        </div>

        {/* STATUS FLASH BANNER */}
        {actionStatus && (
          <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-100 text-indigo-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle size={15} className="text-indigo-600" />
            <span>{actionStatus}</span>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-200 bg-white shrink-0 select-none text-xs font-bold">
          {[
            { id: "students", label: "Students Directory", icon: Users },
            { id: "payments", label: "Payment History", icon: CreditCard },
            { id: "broadcast", label: "Announcements & Broadcast", icon: Megaphone },
            { id: "settings", label: "System Config", icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? "bg-[#1a3a5f] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* BODY CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB 1: STUDENTS DIRECTORY */}
          {activeTab === "students" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search students by name, email, or user ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 font-medium cursor-pointer"
                  >
                    <option value="all">All Status ({users.length})</option>
                    <option value="active">Active Only</option>
                    <option value="banned">Banned Only</option>
                  </select>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-3">Credits</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Registered</th>
                        <th className="py-3 px-4 text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{s.name || "Aspirant"}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{s.email}</div>
                              <div className="text-[9px] text-slate-350 font-mono mt-0.5">ID: {s.id}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                {s.credits} cr
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {s.banned ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Banned
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-400 text-[11px]">
                              {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "Recent"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleAdjustCredits(s.id, 5, "Admin 5 Cr Top-Up")}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-bold text-[10px] cursor-pointer transition"
                                  title="Add +5 Credits"
                                >
                                  +5 Cr
                                </button>
                                <button
                                  onClick={() => handleAdjustCredits(s.id, -1, "Admin 1 Cr Deduction")}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded font-bold text-[10px] cursor-pointer transition"
                                  title="Deduct 1 Credit"
                                >
                                  -1 Cr
                                </button>
                                <button
                                  onClick={() => setSelectedStudent(s)}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-bold text-[10px] cursor-pointer transition"
                                  title="Direct Message"
                                >
                                  Msg
                                </button>
                                <button
                                  onClick={() => handleToggleBan(s.id)}
                                  className={`px-2 py-1 rounded font-bold text-[10px] cursor-pointer transition border ${
                                    s.banned
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                  }`}
                                >
                                  {s.banned ? "Unban" : "Ban"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No students match your search filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Direct Message Modal if selected */}
              {selectedStudent && (
                <div className="p-4 bg-white border border-blue-200 rounded-xl shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-900">
                      Send Direct Message to: <span className="text-blue-700">{selectedStudent.name}</span> ({selectedStudent.email})
                    </span>
                    <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type personal message to candidate..."
                      value={directMsg}
                      onChange={(e) => setDirectMsg(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
                    />
                    <button
                      onClick={handleSendDirectMessage}
                      className="px-4 py-2 bg-[#1a3a5f] hover:bg-[#132a45] text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Send size={13} />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAYMENTS & RECHARGES */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Recent Orders & Payments
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Total recorded: {purchases.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-3">Pack</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Payment Reference</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {purchases.length > 0 ? (
                        purchases.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{p.userEmail || p.userId}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{p.purchaseDate ? new Date(p.purchaseDate).toLocaleString() : ""}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {p.pack.replace("_", " ")}
                            </td>
                            <td className="py-3 px-3 font-bold font-mono text-emerald-700">
                              ₹{p.amount}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                              {p.utrNumber?.startsWith("RZP:") ? p.utrNumber.replace("RZP:", "") : (p.utrNumber || p.id)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {p.status === "approved" ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[10px]">
                                  Approved
                                </span>
                              ) : p.status === "pending" ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold text-[10px]">
                                  Pending
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-bold text-[10px]">
                                  Declined
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No payment records logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANNOUNCEMENTS & BROADCAST */}
          {activeTab === "broadcast" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Broadcast Notice to All */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Megaphone size={16} className="text-indigo-600" />
                    <span>Broadcast Notice to All Students</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Delivers a notification directly to the inboxes of all registered candidates.
                  </p>
                </div>

                <textarea
                  rows={4}
                  placeholder="e.g. Schedule Update: JEE Mains 2026 Shift Mock 3 is now live with updated KaTeX rendering."
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
                />

                <button
                  onClick={handleBroadcast}
                  className="w-full py-2.5 bg-[#1a3a5f] hover:bg-[#132a45] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Send size={13} />
                  <span>Send Broadcast to All Accounts</span>
                </button>
              </div>

              {/* Bulk Credit Dispenser */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    <span>Bulk Credit Grant to All Accounts</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Instantly awards bonus mock parsing credits to every student on the platform.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Credits to grant per student:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 2"
                    value={bulkCreditAmount}
                    onChange={(e) => setBulkCreditAmount(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600 font-mono font-bold"
                  />
                </div>

                <button
                  onClick={handleBulkCredits}
                  disabled={!bulkCreditAmount}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Plus size={14} />
                  <span>Dispense {bulkCreditAmount || "0"} Credits to All Students</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM CONFIG */}
          {activeTab === "settings" && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs max-w-2xl space-y-5">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Settings size={16} className="text-slate-700" />
                  <span>Platform System Configuration</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage initial onboarding balance, maintenance banner, and platform defaults.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Welcome Sign-up Free Credits
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    defaultValue={systemConfig?.welcomeCredits || 3}
                    onBlur={(e) => handleSaveConfig({ welcomeCredits: Number(e.target.value) || 3 })}
                    className="w-32 p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-450">
                    Default credits given to each newly signed-up aspirant.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Global Marquee / Ticker Announcement
                  </label>
                  <input
                    type="text"
                    defaultValue={systemConfig?.broadcastNotice || ""}
                    onBlur={(e) => handleSaveConfig({ broadcastNotice: e.target.value })}
                    placeholder="e.g. Notice: Admissions Open for JEE Advanced 2026 Batch"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <p className="text-[10px] text-slate-450">
                    Displayed at the top of the student dashboard. Leave blank to disable.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Maintenance Mode</span>
                    <span className="text-[10px] text-slate-500">Temporarily pauses new mock parsing for server upgrades</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={systemConfig?.isMaintenanceMode || false}
                    onChange={(e) => handleSaveConfig({ isMaintenanceMode: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-3.5 px-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400 shrink-0">
          <span>JEE MockLab Platform Operations Hub • v2.5</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold transition cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
export default AdminControlHub;
