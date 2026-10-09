import React from "react";
import { Receipt, CheckCircle2, Clock, XCircle, Flame, PlusCircle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { CreditTransaction, PurchaseRequest } from "../../types";

interface TransactionHistoryProps {
  transactions: CreditTransaction[];
  purchases: PurchaseRequest[];
  loading?: boolean;
}

export function TransactionHistory({
  transactions,
  purchases,
  loading = false
}: TransactionHistoryProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400 text-xs font-mono">
        Loading transaction ledger...
      </div>
    );
  }

  const hasPurchases = purchases && purchases.length > 0;
  const hasTransactions = transactions && transactions.length > 0;

  if (!hasPurchases && !hasTransactions) {
    return (
      <div className="bg-slate-50/80 border border-dashed border-slate-200 text-center text-slate-400 py-12 rounded-2xl flex flex-col items-center justify-center gap-2.5">
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400">
          <Receipt size={22} strokeWidth={1.5} />
        </div>
        <p className="text-xs font-bold text-slate-700">No Transactions Yet</p>
        <p className="text-[11px] text-slate-500 max-w-xs">
          When you parse mock papers or recharge credits, your full audit history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credit Usage Ledger */}
      {hasTransactions && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              Credit Ledger (Activity & Burns)
            </h4>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              {transactions.length} record{transactions.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.03)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3 text-center">Credits</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          {isPositive ? (
                            <ArrowUpRight size={13} className="text-emerald-600 shrink-0" strokeWidth={2.5} />
                          ) : (
                            <ArrowDownRight size={13} className="text-rose-500 shrink-0" strokeWidth={2.5} />
                          )}
                          <span className="capitalize">{tx.type.replace(/_/g, " ")}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold tabular-nums">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            isPositive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-slate-100 text-slate-700 border border-slate-200/60"
                          }`}
                        >
                          {isPositive ? `+${tx.amount}` : tx.amount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate text-[11px]">
                        {tx.description}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[10px] tabular-nums whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Orders */}
      {hasPurchases && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              Payment Orders
            </h4>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              {purchases.length} order{purchases.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.03)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Order / Pack</th>
                  <th className="py-2.5 px-3 font-semibold">Amount</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Status</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((purchase) => {
                  const isApproved = purchase.status === "approved";
                  const isPending = purchase.status === "pending" || purchase.status === "verifying";
                  const isDeclined = purchase.status === "declined";

                  return (
                    <tr key={purchase.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        <span className="capitalize">{purchase.pack.replace(/_/g, " ")}</span>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">
                          {purchase.utrNumber?.startsWith("RZP:")
                            ? `Payment: ${purchase.utrNumber.replace("RZP:", "")}`
                            : `Order: ${purchase.id}`}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 tabular-nums">
                        ₹{purchase.amount}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : isPending
                              ? "bg-amber-50 text-amber-700 border-amber-200/80"
                              : "bg-rose-50 text-rose-700 border-rose-200/80"
                          }`}
                        >
                          {isApproved && <CheckCircle2 size={10} className="text-emerald-600" />}
                          {isPending && <Clock size={10} className="text-amber-600" />}
                          {isDeclined && <XCircle size={10} className="text-rose-600" />}
                          <span>{purchase.status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[10px] tabular-nums whitespace-nowrap">
                        {purchase.purchaseDate
                          ? new Date(purchase.purchaseDate).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
