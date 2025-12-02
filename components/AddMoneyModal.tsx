
import React, { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, Smartphone, ShieldCheck, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { ref, push, set } from 'firebase/database';
import { db } from '../firebaseConfig';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({ isOpen, onClose, userUid }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(300); 

  useEffect(() => {
    let timer: any;
    if (isOpen && step === 2 && method === 'UPI') {
        setTimeLeft(300);
        timer = setInterval(() => setTimeLeft(p => p > 0 ? p - 1 : 0), 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, step, method]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleReset = () => {
      setStep(1); setAmount(''); setMethod(''); setSuccessData(null); onClose();
  };

  const handleRequest = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500)); // Simulate network
    
    try {
        const reqRef = push(ref(db, 'requests'));
        const txnId = 'REQ' + Math.floor(Math.random() * 10000000);
        await set(reqRef, {
            id: reqRef.key,
            userUid,
            amount: parseFloat(amount),
            method: method === 'UPI' ? 'UPI QR' : 'Payment Gateway',
            status: 'PENDING',
            date: new Date().toLocaleString(),
            txnId
        });
        setSuccessData({ txnId, amount, date: new Date().toLocaleString() });
        setStep(3);
    } catch (e) { alert("Request Failed"); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-blue-700 text-white flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2"><Wallet size={20} /> Add Balance</h2>
            <button onClick={handleReset}><X size={20}/></button>
        </div>

        <div className="p-6">
            {/* Step 1: Amount */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Enter Amount</label>
                        <div className="text-4xl font-bold text-gray-800 my-4 flex justify-center items-center">
                            <span className="text-gray-400 mr-2">₹</span>
                            <input autoFocus type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="outline-none w-40 border-b-2 border-gray-200 text-center focus:border-blue-500 placeholder-gray-200" placeholder="0"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {QUICK_AMOUNTS.map(amt => <button key={amt} onClick={()=>setAmount(amt.toString())} className="bg-blue-50 text-blue-700 py-2 rounded-lg border border-blue-100 text-xs font-bold hover:bg-blue-100 transition">+ {amt}</button>)}
                    </div>
                    <button disabled={!amount} onClick={()=>setStep(2)} className="w-full bg-blue-700 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-blue-200 hover:bg-blue-800 transition">Proceed to Pay</button>
                </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="text-center pb-4 border-b border-gray-100">
                        <div className="text-gray-500 text-xs">PAYING</div>
                        <div className="text-2xl font-bold text-gray-800">₹{parseFloat(amount).toLocaleString('en-IN')}</div>
                    </div>
                    
                    <div className="space-y-3">
                        <div onClick={()=>setMethod('UPI')} className={`border p-4 rounded-xl flex items-center gap-4 cursor-pointer transition ${method==='UPI'?'border-blue-600 bg-blue-50 ring-1 ring-blue-600':'hover:border-gray-300'}`}>
                            <div className="bg-white p-2 rounded-full shadow-sm"><Smartphone size={20} className="text-purple-600"/></div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-800">UPI QR Code</div>
                                <div className="text-xs text-gray-500">Scan & Pay Instantly</div>
                            </div>
                            {method==='UPI' && <div className="w-4 h-4 bg-blue-600 rounded-full"></div>}
                        </div>

                        {method === 'UPI' && (
                            <div className="text-center bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300 animate-in slide-in-from-top-2">
                                <img src="https://uploads.onecompiler.io/43b6sbecd/43yzrj8se/1000050744.jpg" className="w-48 h-48 mx-auto mix-blend-multiply object-contain mb-3"/>
                                <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
                                    <Clock size={12} className="animate-pulse"/> Expires in {formatTime(timeLeft)}
                                </div>
                            </div>
                        )}

                        <div onClick={()=>setMethod('CARD')} className={`border p-4 rounded-xl flex items-center gap-4 cursor-pointer transition ${method==='CARD'?'border-blue-600 bg-blue-50 ring-1 ring-blue-600':'hover:border-gray-300'}`}>
                            <div className="bg-white p-2 rounded-full shadow-sm"><CreditCard size={20} className="text-orange-600"/></div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-800">Card / NetBanking</div>
                                <div className="text-xs text-gray-500">All Banks Supported</div>
                            </div>
                            {method==='CARD' && <div className="w-4 h-4 bg-blue-600 rounded-full"></div>}
                        </div>
                    </div>

                    <button disabled={!method} onClick={handleRequest} className="w-full bg-blue-700 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 mt-4">
                        {loading ? <Loader2 className="animate-spin mx-auto"/> : (method === 'UPI' ? 'I Have Scanned & Paid' : 'Proceed Securely')}
                    </button>
                </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <div className="text-center py-8 animate-in zoom-in">
                    <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><Clock size={40}/></div>
                    <h3 className="text-2xl font-bold text-gray-800">Request Pending</h3>
                    <p className="text-gray-500 text-sm mb-8 px-4">Your balance request has been submitted. Amount will be credited after admin approval.</p>
                    
                    <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-3 mb-8 border border-gray-100 text-left mx-2">
                        <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Amount</span><span className="font-bold text-lg">₹{successData.amount}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Ref ID</span><span className="font-mono text-gray-800">{successData.txnId}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="text-gray-800">{successData.date}</span></div>
                    </div>
                    
                    <button onClick={handleReset} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition">Close</button>
                </div>
            )}
        </div>
        
        {/* Footer */}
        {step < 3 && (
            <div className="bg-gray-50 p-3 text-center text-xs text-gray-400 border-t border-gray-100 flex items-center justify-center gap-1">
                <ShieldCheck size={14}/> 100% Secure & Encrypted
            </div>
        )}
      </div>
    </div>
  );
};

export default AddMoneyModal;
