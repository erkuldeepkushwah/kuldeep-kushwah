import React, { useState } from 'react';
import { X, Wallet, RefreshCw, CheckCircle, Loader2, TrendingUp, ChevronRight, ChevronLeft, Copy, Share2, Printer, Trash2 } from 'lucide-react';
import { ref, runTransaction } from 'firebase/database';
import { db } from '../firebaseConfig';

interface CommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string;
  commissionBalance: number;
  onRedeemSuccess: () => void;
}

// Initial Mock History Data
const INITIAL_HISTORY = [
  { 
    id: 1, 
    service: 'Mobile Recharge', 
    desc: 'Jio - 9876543210', 
    amount: '₹239.00', 
    comm: '+ ₹4.78', 
    date: 'Today, 10:23 AM',
    txnId: 'RCH88293922',
    status: 'Success',
    openingBal: '₹120.00',
    closingBal: '₹124.78'
  },
  { 
    id: 2, 
    service: 'DMT Transfer', 
    desc: 'HDFC Bank - IMPS', 
    amount: '₹5000.00', 
    comm: '+ ₹15.00', 
    date: 'Today, 09:15 AM',
    txnId: 'DMT77382910',
    status: 'Success',
    openingBal: '₹105.00',
    closingBal: '₹120.00'
  },
  { 
    id: 3, 
    service: 'Electricity Bill', 
    desc: 'MSEDCL - Consumer 123', 
    amount: '₹1250.00', 
    comm: '+ ₹2.50', 
    date: 'Yesterday, 04:45 PM',
    txnId: 'BBP99283744',
    status: 'Success',
    openingBal: '₹102.50',
    closingBal: '₹105.00'
  },
  { 
    id: 4, 
    service: 'AEPS Withdrawal', 
    desc: 'SBI - Aadhaar Pay', 
    amount: '₹2000.00', 
    comm: '+ ₹6.00', 
    date: 'Yesterday, 02:30 PM',
    txnId: 'AEP22334455',
    status: 'Success',
    openingBal: '₹96.50',
    closingBal: '₹102.50'
  },
];

const CommissionModal: React.FC<CommissionModalProps> = ({ isOpen, onClose, userUid, commissionBalance, onRedeemSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [txnHistory, setTxnHistory] = useState(INITIAL_HISTORY);

  if (!isOpen) return null;

  const handleRedeem = async () => {
    if (commissionBalance <= 0) return;
    setLoading(true);

    try {
      // 1. Update Main Wallet Balance in Firebase
      const balanceRef = ref(db, `users/${userUid}/balance`);
      await runTransaction(balanceRef, (currentBalance) => {
        return (currentBalance || 0) + commissionBalance;
      });

      // 2. Simulate Commission Reset
      setSuccess(true);
      setTimeout(() => {
          onRedeemSuccess(); // Reset parent state
          setSuccess(false);
          onClose();
      }, 2000);

    } catch (error) {
      console.error("Redeem failed", error);
      alert("Redemption failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
      if (confirm("Are you sure you want to clear your commission history?")) {
          setTxnHistory([]);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
                {selectedTxn ? (
                    <button onClick={() => setSelectedTxn(null)} className="mr-1 hover:bg-white/20 p-1 rounded-full">
                        <ChevronLeft size={20} />
                    </button>
                ) : (
                    <TrendingUp size={20} /> 
                )}
                {selectedTxn ? 'Transaction Details' : 'Commission & Earnings'}
            </h2>
            <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
            
            {selectedTxn ? (
                // --- DETAILED VIEW ---
                <div className="animate-in slide-in-from-right duration-300">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-green-600 font-bold text-lg">Commission Credited</h3>
                        <div className="text-3xl font-bold text-gray-800 mt-2">{selectedTxn.comm}</div>
                        <p className="text-xs text-gray-500 mt-1">{selectedTxn.date}</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                            <span className="text-gray-500 text-sm">Transaction ID</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-medium text-gray-800">{selectedTxn.txnId}</span>
                                <Copy size={14} className="text-gray-400 cursor-pointer hover:text-blue-600"/>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Service Type</span>
                            <span className="font-semibold text-gray-800">{selectedTxn.service}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Description</span>
                            <span className="font-medium text-gray-800 text-right">{selectedTxn.desc}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Transaction Amount</span>
                            <span className="font-semibold text-gray-800">{selectedTxn.amount}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-gray-600">Opening Balance</span>
                            <span className="font-medium text-gray-800">{selectedTxn.openingBal}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t border-blue-200 pt-2">
                            <span className="font-bold text-gray-800">Closing Balance</span>
                            <span className="font-bold text-blue-700">{selectedTxn.closingBal}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50">
                            <Printer size={16} /> Print
                        </button>
                        <button className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700">
                            <Share2 size={16} /> Share
                        </button>
                    </div>
                </div>
            ) : (
                // --- LIST VIEW ---
                <>
                    {/* Balance Card */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center mb-6">
                        <p className="text-gray-600 text-xs font-medium mb-1">Total Commission Earned</p>
                        <h3 className="text-2xl font-bold text-blue-800 mb-3">
                            ₹{commissionBalance.toFixed(2)}
                        </h3>

                        {success ? (
                            <div className="bg-green-100 text-green-700 py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-sm animate-in zoom-in">
                                <CheckCircle size={16} /> Redeemed!
                            </div>
                        ) : (
                            <button 
                                onClick={handleRedeem}
                                disabled={loading || commissionBalance <= 0}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-md transition transform active:scale-95 text-sm"
                            >
                                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (
                                    <>
                                        <RefreshCw size={16} /> Convert to Main Balance
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Transaction History Header with Clear Option */}
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                            Recent Commissions 
                            {txnHistory.length > 0 && (
                                <span className="text-[10px] font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Last {txnHistory.length}</span>
                            )}
                        </h4>
                        {txnHistory.length > 0 && (
                            <button 
                                onClick={handleClearHistory}
                                className="text-red-500 hover:text-red-600 text-[10px] flex items-center gap-1 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition"
                            >
                                <Trash2 size={12} /> Clear History
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {txnHistory.length > 0 ? (
                            txnHistory.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setSelectedTxn(item)}
                                    className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-200 transition bg-white cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-50 p-2 rounded-full text-green-600 group-hover:bg-green-100 transition">
                                            <TrendingUp size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 text-xs group-hover:text-blue-700 transition">{item.service}</div>
                                            <div className="text-[10px] text-gray-500">{item.desc}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-green-600 text-sm">{item.comm}</div>
                                        <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400">
                                            {item.date} <ChevronRight size={12} className="text-gray-300 group-hover:text-blue-500"/>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No recent history available.
                            </div>
                        )}
                    </div>
                </>
            )}

        </div>
      </div>
    </div>
  );
};

export default CommissionModal;