import React from "react";
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
      <div className="text-center py-12 text-slate-400 text-xs">
        Loading transaction ledger...
      </div>
    );
  }

  const hasPurchases = purchases && purchases.length > 0;
  const hasTransactions = transactions && transactions.length > 0;

  if (!hasPurchases && !hasTransactions) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 py-12 rounded-2xl flex flex-col items-center justify-center gap-2">
        <span className="text-2xl">📜</span>
        <p className="text-xs font-semibold text-slate-600">No Transactions Yet</p>
        <p className="text-[11px] text-slate-400">
          When you parse mock papers or recharge credits, your history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credit Usage Ledger */}
      {hasTransactions && (
        <div>
          <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">
            Credit Ledger (Activity & Burns)
          </h4>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-3 font-semibold">Activity</th>
                  <th className="p-3 text-center font-semibold">Credits</th>
                  <th className="p-3 font-semibold">Details</th>
                  <th className="p-3 text-right font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="p-3 capitalize font-semibold text-slate-800">
                      {tx.type.replace(/_/g, " ")}
                    </td>
                    <td
                      className={`p-3 font-bold text-center ${
                        tx.amount > 0 ? "text-emerald-600" : "text-slate-600"
                      }`}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                    <td className="p-3 text-slate-500 max-w-[200px] truncate">
                      {tx.description}
                    </td>
                    <td className="p-3 text-right text-slate-400 font-mono text-[10px]">
                      {new Date(tx.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Orders */}
      {hasPurchases && (
        <div>
          <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">
            Payment Orders
          </h4>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-3 font-semibold">Order / Pack</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 text-center font-semibold">Status</th>
                  <th className="p-3 text-right font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((purchase) => {
                  const statusColors: Record<string, string> = {
                    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    pending: "bg-amber-50 text-amber-700 border-amber-200",
                    declined: "bg-red-50 text-red-700 border-red-200"
                  };
                  return (
                    <tr key={purchase.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{purchase.pack}</td>
                      <td className="p-3 font-bold text-slate-800">₹{purchase.amount}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            statusColors[purchase.status] || "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {purchase.status}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-400 font-mono text-[10px]">
                        {purchase.purchaseDate
                          ? new Date(purchase.purchaseDate).toLocaleDateString([], {
                              month: "short",
                              day: "numeric"
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
