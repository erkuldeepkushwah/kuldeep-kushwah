import React, { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, Smartphone, Globe, CheckCircle, Loader2, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
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
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  
  // Payment Details State
  const [paymentDetails, setPaymentDetails] = useState({
    upiId: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
    selectedBank: ''
  });

  // Timer Logic for UPI QR
  useEffect(() => {
    let timer: any;
    if (isOpen && step === 2 && method === 'UPI') {
        setTimeLeft(300); // Reset to 5 mins
        timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, step, method]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setAmount('');
    setMethod('');
    setPaymentDetails({ upiId: '', cardNumber: '', expiry: '', cvv: '', cardName: '', selectedBank: '' });
    setSuccessData(null);
    setLoading(false);
    onClose();
  };

  const isPaymentValid = () => {
    if (!amount || parseFloat(amount) <= 0) return false;
    if (!method) return false;
    if (method === 'UPI') return true; 
    if (method === 'CARD') return paymentDetails.cardNumber.length === 16 && paymentDetails.cvv.length === 3 && paymentDetails.expiry.length > 0 && paymentDetails.cardName.length > 0;
    if (method === 'NETBANKING') return paymentDetails.selectedBank !== '';
    return false;
  };

  const handlePayment = async () => {
    setLoading(true);
    const addAmount = parseFloat(amount);

    // Simulate Payment Gateway Delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        // --- NEW LOGIC: Create Request for Admin ---
        const requestRef = push(ref(db, 'requests'));
        const txnId = 'REQ' + Math.floor(Math.random() * 10000000);
        
        await set(requestRef, {
            id: requestRef.key,
            userUid: userUid,
            amount: addAmount,
            method: method,
            status: 'PENDING',
            date: new Date().toLocaleString(),
            txnId: txnId
        });

        setSuccessData({
            txnId: txnId,
            amount: addAmount,
            date: new Date().toLocaleString(),
            method: method
        });
        setStep(3); // Success Step
    } catch (error) {
        console.error("Request Failed", error);
        alert("Transaction failed. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-blue-700 text-white flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <Wallet size={20} /> Add Money to Wallet
            </h2>
            <button onClick={handleReset} className="hover:bg-white/20 p-1 rounded-full transition">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
            {/* Step 1: Enter Amount */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <label className="block text-sm font-medium text-gray-600 mb-2">Enter Amount</label>
                        <div className="relative max-w-[200px] mx-auto">
                            <span className="absolute left-4 top-3 text-gray-400 text-2xl font-bold">₹</span>
                            <input 
                                type="number" 
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-3xl font-bold text-gray-800 border-b-2 border-gray-200 focus:border-blue-500 outline-none text-center"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {QUICK_AMOUNTS.map((amt) => (
                            <button 
                                key={amt}
                                onClick={() => setAmount(amt.toString())}
                                className="py-2 px-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition"
                            >
                                + ₹{amt}
                            </button>
                        ))}
                    </div>

                    <button 
                        disabled={!amount || parseFloat(amount) <= 0}
                        onClick={() => setStep(2)}
                        className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                    >
                        Proceed to Pay <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {/* Step 2: Select Method & Enter Details */}
            {step === 2 && (
                <div className="space-y-5">
                    <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-200">
                        <span className="text-gray-600 font-medium">Amount to Add</span>
                        <span className="text-xl font-bold text-gray-900">₹{amount}</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Select Payment Method</label>
                        <div className="space-y-3">
                            {/* UPI Option */}
                            <div className={`border rounded-xl transition overflow-hidden ${method === 'UPI' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <label className="flex items-center p-4 cursor-pointer">
                                    <input type="radio" name="method" value="UPI" className="hidden" onChange={(e) => setMethod(e.target.value)} checked={method === 'UPI'} />
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mr-3 text-purple-600">
                                        <Smartphone size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-800">UPI</div>
                                        <div className="text-xs text-gray-500">Scan QR Code</div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border ${method === 'UPI' ? 'border-4 border-blue-600' : 'border-gray-300'}`}></div>
                                </label>
                                {method === 'UPI' && (
                                    <div className="px-4 pb-4 pt-2 animate-in slide-in-from-top-2 flex flex-col items-center">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Scan to Pay ₹{amount}</p>
                                        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm">
                                            <img 
                                                src="https://uploads.onecompiler.io/43b6sbecd/43yzrj8se/1000050744.jpg" 
                                                alt="Payment QR" 
                                                className="w-48 h-48 object-contain"
                                            />
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full">
                                             <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"/>
                                             {formatTime(timeLeft)}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">QR expires in 5 minutes</p>
                                    </div>
                                )}
                            </div>

                            {/* Card Option */}
                            <div className={`border rounded-xl transition overflow-hidden ${method === 'CARD' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <label className="flex items-center p-4 cursor-pointer">
                                    <input type="radio" name="method" value="CARD" className="hidden" onChange={(e) => setMethod(e.target.value)} checked={method === 'CARD'} />
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mr-3 text-blue-600">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-800">Debit / Credit Card</div>
                                        <div className="text-xs text-gray-500">Visa, MasterCard, Rupay</div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border ${method === 'CARD' ? 'border-4 border-blue-600' : 'border-gray-300'}`}></div>
                                </label>
                                {method === 'CARD' && (
                                    <div className="px-4 pb-4 pt-0 space-y-3 animate-in slide-in-from-top-2">
                                        <input 
                                            type="text" 
                                            maxLength={16}
                                            placeholder="Card Number" 
                                            className="w-full border border-blue-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                            value={paymentDetails.cardNumber}
                                            onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value.replace(/\D/g, '')})}
                                        />
                                        <div className="flex gap-3">
                                            <input 
                                                type="text" 
                                                placeholder="MM/YY" 
                                                className="w-1/2 border border-blue-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                                value={paymentDetails.expiry}
                                                onChange={(e) => setPaymentDetails({...paymentDetails, expiry: e.target.value})}
                                            />
                                            <input 
                                                type="password" 
                                                maxLength={3}
                                                placeholder="CVV" 
                                                className="w-1/2 border border-blue-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                                value={paymentDetails.cvv}
                                                onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value.replace(/\D/g, '')})}
                                            />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Name on Card" 
                                            className="w-full border border-blue-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                            value={paymentDetails.cardName}
                                            onChange={(e) => setPaymentDetails({...paymentDetails, cardName: e.target.value})}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Netbanking Option */}
                            <div className={`border rounded-xl transition overflow-hidden ${method === 'NETBANKING' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <label className="flex items-center p-4 cursor-pointer">
                                    <input type="radio" name="method" value="NETBANKING" className="hidden" onChange={(e) => setMethod(e.target.value)} checked={method === 'NETBANKING'} />
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mr-3 text-orange-600">
                                        <Globe size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-800">Net Banking</div>
                                        <div className="text-xs text-gray-500">All Indian Banks supported</div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border ${method === 'NETBANKING' ? 'border-4 border-blue-600' : 'border-gray-300'}`}></div>
                                </label>
                                {method === 'NETBANKING' && (
                                    <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2">
                                        <select 
                                            className="w-full border border-blue-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                            value={paymentDetails.selectedBank}
                                            onChange={(e) => setPaymentDetails({...paymentDetails, selectedBank: e.target.value})}
                                        >
                                            <option value="">Select Bank</option>
                                            <option value="SBI">State Bank of India</option>
                                            <option value="HDFC">HDFC Bank</option>
                                            <option value="ICICI">ICICI Bank</option>
                                            <option value="AXIS">Axis Bank</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <button disabled className="w-full bg-blue-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" /> Processing...
                        </button>
                    ) : (
                        <button 
                            disabled={!isPaymentValid()}
                            onClick={handlePayment}
                            className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition"
                        >
                            {method === 'UPI' ? 'Verify Payment' : `Pay ₹${amount}`}
                        </button>
                    )}
                </div>
            )}

            {/* Step 3: Success Message (Now Request Sent) */}
            {step === 3 && successData && (
                <div className="text-center py-4 animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">Request Submitted</h3>
                    <p className="text-gray-500 text-sm mb-6">Admin approval pending. Balance will update shortly.</p>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-left space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Requested Amount</span>
                            <span className="font-bold text-blue-600 text-lg">₹{successData.amount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Request ID</span>
                            <span className="font-medium text-gray-900">{successData.txnId}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Status</span>
                            <span className="font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">PENDING</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium text-gray-900">{successData.date}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleReset}
                        className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>

        {/* Footer Secure Badge (Only Steps 1 & 2) */}
        {step < 3 && (
            <div className="bg-gray-50 p-3 text-center text-xs text-gray-500 border-t border-gray-100 flex items-center justify-center gap-1 shrink-0">
                <ShieldCheck size={14} className="text-blue-600"/> 100% Secure Payments via 256-bit Encryption
            </div>
        )}
      </div>
    </div>
  );
};

export default AddMoneyModal;