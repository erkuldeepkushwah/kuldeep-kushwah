import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, Smartphone, Fingerprint, Plane, CreditCard, Search, Calendar, User, MapPin, Download, Wallet, Landmark, QrCode, AlertTriangle, PlayCircle, Info, Train, Bus, Hotel, Bed, Clock, Armchair, Phone, Mail, Map, CircleUser, Luggage, Utensils, Coffee, Moon, Minus, Plus, ChevronLeft, ArrowRight, Palmtree, Camera, Ship, ShoppingBag, Tent, Star, Cpu } from 'lucide-react';
import { ServiceItem } from '../types';
import { ref, runTransaction } from 'firebase/database';
import { db } from '../firebaseConfig';

interface ServiceModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  userUid: string;
  currentBalance: number;
}

const SERVICE_CHARGE_PERCENT = 0.02; // 2%

// --- MOCK DATA ---
const OPERATORS = {
  mobile: ['Jio', 'Airtel', 'Vi', 'BSNL'],
  dth: ['Tata Play', 'Dish TV', 'Videocon d2h', 'Sun Direct'],
  banks: ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank']
};

const CC_PROVIDERS = [
  'HDFC Bank', 'SBI Card', 'ICICI Bank', 'Axis Bank', 
  'Kotak Mahindra', 'AU Small Finance', 'RBL Bank', 'Yes Bank', 
  'IndusInd Bank', 'American Express'
];

const BILLER_DATA: Record<string, any> = {
  'GAS': {
    type: 'simple',
    options: ['Indane Gas', 'HP Gas', 'Bharat Gas']
  },
  'ELEC': {
    type: 'grouped',
    groups: {
      'Madhya Pradesh': ['MPMKVVCL', 'MPCZ', 'MPPKVVCL', 'MPWZ', 'MPEZ'],
      'Uttar Pradesh': ['PUVVNL', 'PVVNL', 'MVVNL', 'DVVNL', 'KESCO', 'NPCL'],
      'Maharashtra': ['MSEDCL', 'Mahadiscom', 'Adani Electricity Mumbai', 'BEST', 'Tata Power'],
      'Gujarat': ['DGVCL', 'MGVCL', 'PGVCL', 'UGVCL', 'Torrent Power'],
      'Chhattisgarh': ['CSPDCL'],
      'Rajasthan': ['JVVNL', 'AVVNL', 'JdVVNL']
    }
  },
  'BROADBAND': {
    type: 'simple',
    options: ['Airtel Fibre', 'BSNL Fiber', 'Jio Fiber', 'Tata Play Fiber']
  },
  'FASTAG': {
    type: 'simple',
    options: ['HDFC Bank', 'ICICI Bank', 'State Bank of India (SBI)', 'Axis Bank', 'Airtel Payments Bank']
  },
  'LOAN': {
    type: 'simple',
    options: [
      'State Bank of India (SBI)',
      'HDFC Bank',
      'Axis Bank',
      'ICICI Bank',
      'Punjab National Bank (PNB)',
      'Bank of Baroda',
      'Union Bank of India',
      'Kotak Mahindra Bank',
      'IDBI Bank'
    ]
  }
};

const SUBSCRIPTION_PLANS: Record<string, any[]> = {
  'Netflix': [
    { name: 'Mobile', price: 149, desc: '480p (SD) on 1 mobile or tablet device' },
    { name: 'Basic', price: 199, desc: '720p (HD) on 1 device (all types)' },
    { name: 'Standard', price: 499, desc: '1080p (Full HD) on 2 simultaneous devices' },
    { name: 'Premium', price: 649, desc: '4K HDR, Spatial Audio on 4 simultaneous devices' }
  ],
  'Amazon Prime Video': [
    { name: 'Monthly', price: 299, desc: 'Full HD, all Prime benefits (shipping, music)' },
    { name: 'Quarterly', price: 599, desc: 'Full HD, all Prime benefits for 3 months' },
    { name: 'Annual', price: 1499, desc: 'Full HD, all Prime benefits for 1 year' },
    { name: 'Prime Lite Annual', price: 799, desc: 'HD (with ads), limited benefits' }
  ],
  'JioHotstar': [
    { name: 'Mobile (3 Months)', price: 149, desc: '720p (HD) on 1 mobile device, ad-supported' },
    { name: 'Mobile (Yearly)', price: 499, desc: '720p (HD) on 1 mobile device, ad-supported' },
    { name: 'Super', price: 899, desc: 'Full HD on 2 devices (mobile, TV, web), ad-supported' },
    { name: 'Premium Monthly', price: 299, desc: '4K on 4 devices, ad-free' },
    { name: 'Premium Yearly', price: 1499, desc: '4K on 4 devices, ad-free' }
  ],
  'Apple TV+': [
    { name: 'Monthly', price: 99, desc: '4K HDR, ad-free, Family Sharing up to 5 members' }
  ],
  'SonyLIV': [
    { name: 'Premium Annual', price: 999, desc: 'Full HD on 2 devices, live sports access' }
  ],
  'ZEE5': [
    { name: 'Premium Annual', price: 599, desc: 'Varies by package, offers content in 12 languages' },
    { name: 'Premium 4K', price: 849, desc: '4K content support' }
  ],
  'YouTube Premium': [
    { name: 'Monthly', price: 129, desc: 'Ad-free viewing, background play, downloads' }
  ]
};

const MOCK_PLANS = [
  { price: 239, val: '28 Days', data: '1.5GB/Day', desc: 'Unlimited Calls + 100 SMS/day' },
  { price: 299, val: '28 Days', data: '2GB/Day', desc: 'Unlimited Calls + JioHotstar' },
  { price: 666, val: '84 Days', data: '1.5GB/Day', desc: 'Unlimited Calls + 100 SMS/day' },
  { price: 2999, val: '365 Days', data: '2.5GB/Day', desc: 'Long term validity special' },
];

// --- TRAVEL MOCK DATA ---
const MOCK_FLIGHTS = [
  { id: 1, provider: 'IndiGo', desc: '10:00 AM - 12:30 PM', price: 4500, type: 'Economy', code: '6E-554' },
  { id: 2, provider: 'Air India', desc: '02:00 PM - 05:15 PM', price: 5200, type: 'Economy', code: 'AI-889' },
  { id: 3, provider: 'Vistara', desc: '06:00 PM - 08:30 PM', price: 6100, type: 'Premium Economy', code: 'UK-990' },
];

const MOCK_BUSES = [
  { id: 1, provider: 'VRL Travels', desc: '09:00 PM - 06:00 AM', price: 1200, type: 'AC Sleeper' },
  { id: 2, provider: 'SRS Travels', desc: '10:00 PM - 07:00 AM', price: 800, type: 'Non-AC Seater' },
  { id: 3, provider: 'Orange Tours', desc: '08:30 PM - 05:00 AM', price: 1500, type: 'Volvo Multi-Axle AC' },
];

const MOCK_TRAINS = [
  { id: 1, provider: 'Rajdhani Exp (12951)', desc: '04:30 PM - 08:30 AM', price: 2500, type: '3A' },
  { id: 2, provider: 'Shatabdi Exp (12002)', desc: '06:00 AM - 12:00 PM', price: 1200, type: 'CC' },
  { id: 3, provider: 'Duronto Exp (12290)', desc: '08:00 PM - 11:00 AM', price: 900, type: 'SL' },
];

const MOCK_HOTELS = [
  { id: 1, provider: 'Hotel Taj Palace', desc: 'Mumbai Central', price: 8500, type: '5 Star' },
  { id: 2, provider: 'Lemon Tree Premier', desc: 'Andheri East', price: 4200, type: '4 Star' },
  { id: 3, provider: 'Ginger Hotel', desc: 'Dadar', price: 2500, type: '3 Star' },
];

const HOLIDAY_NAMES = {
  2: [
    "Weekend Escape Package",
    "2-Day Quick Gateway",
    "Short Holiday Retreat",
    "Mini Vacation Trip",
    "Express Travel Package",
    "Weekend Refresh Tour"
  ],
  5: [
    "5-Day Explorer Package",
    "Classic Holiday Tour",
    "Family Adventure Package",
    "Complete Getaway Tour",
    "Signature 5-Day Trip",
    "Holiday Delight Package"
  ],
  7: [
    "7-Day Grand Holiday Tour",
    "Premium Week Vacation",
    "Complete Week Explorer",
    "Luxury Travel Package",
    "Full Destination Experience",
    "Ultimate 7-Day Holiday"
  ]
};

const ACTIVITIES = [
    { id: 'tour', label: 'City Tour', icon: Map, cost: 1500 },
    { id: 'sight', label: 'Sightseeing', icon: Camera, cost: 1000 },
    { id: 'beach', label: 'Beach Visit', icon: Palmtree, cost: 500 },
    { id: 'shop', label: 'Shopping', icon: ShoppingBag, cost: 0 },
    { id: 'adv', label: 'Adventure', icon: Tent, cost: 2500 },
    { id: 'cruise', label: 'Cruise/Boat', icon: Ship, cost: 2000 },
];

// --- SUB-COMPONENTS ---

const PaymentSummary = ({ amount }: { amount: number }) => {
    const charge = amount * SERVICE_CHARGE_PERCENT;
    const total = amount + charge;

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-sm mb-4">
            <div className="flex justify-between text-gray-600">
                <span>Amount</span>
                <span>₹{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-1">Service Charge <Info size={12} className="text-gray-400"/></span>
                <span>₹{charge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-2 mt-1">
                <span>Total Payable</span>
                <span className="text-blue-700">₹{total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 italic text-right">Includes 2% platform fee</p>
        </div>
    );
};

const Receipt = ({ data, onDownload }: { data: any, onDownload: () => void }) => (
  <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
      <CheckCircle size={32} />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-2">Transaction Successful</h3>
    <p className="text-gray-500 mb-6">Transaction ID: {Math.floor(Math.random() * 1000000000)}</p>
    
    <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto text-left space-y-2 mb-6 border border-gray-200">
      {Object.entries(data).map(([key, value]: any) => (
        <div key={key} className="flex justify-between text-sm">
          <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
          <span className="font-semibold text-gray-900">{value}</span>
        </div>
      ))}
      <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
        <span className="text-gray-500">Date:</span>
        <span className="font-semibold text-gray-900">{new Date().toLocaleString()}</span>
      </div>
    </div>

    <button 
      onClick={onDownload}
      className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 flex items-center gap-2 mx-auto"
    >
      <Download size={18} /> Download Receipt
    </button>
  </div>
);

interface FlowProps {
    onSuccess: (data: any) => void;
    processPayment: (amount: number) => Promise<boolean>;
}

const MicroAtmFlow = ({ onSuccess, processPayment, userUid }: { userUid: string } & FlowProps) => {
    const [step, setStep] = useState(1);
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [mode, setMode] = useState<'CASH' | 'TRANSFER'>('CASH');
    const [amount, setAmount] = useState('');
    const [transferMobile, setTransferMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSaveCard = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(2);
        }, 1000);
    };

    const handleProcess = async () => {
        if (!amount) return;
        setLoading(true);
        
        const txnAmount = parseFloat(amount);

        if (mode === 'TRANSFER') {
            // TRANSFER FLOW (Debit from Wallet)
            // Need OTP verification
            if (step === 2) {
                // Send OTP simulation
                setLoading(false);
                setStep(3); // Go to OTP
                return;
            }
            if (step === 3) {
                // Verify OTP & Cut Amount
                const charge = txnAmount * SERVICE_CHARGE_PERCENT;
                const total = txnAmount + charge;
                
                const success = await processPayment(total);
                if (success) {
                    onSuccess({
                        Service: 'Micro ATM Transfer',
                        CardNumber: `XXXX-XXXX-XXXX-${cardData.number.slice(-4)}`,
                        Beneficiary: transferMobile,
                        Amount: `₹${txnAmount.toFixed(2)}`,
                        ServiceCharge: `₹${charge.toFixed(2)}`,
                        TotalDeducted: `₹${total.toFixed(2)}`,
                        Status: 'Success'
                    });
                }
                setLoading(false);
            }
        } else {
            // CASH WITHDRAWAL FLOW (Credit to Wallet)
            // Retailer gives Cash -> Gets Money in Wallet
            try {
                // Simulate Card Processing
                await new Promise(r => setTimeout(r, 2000));

                const balanceRef = ref(db, `users/${userUid}/balance`);
                await runTransaction(balanceRef, (current) => {
                    return (current || 0) + txnAmount;
                });

                // Add Commission
                const commRef = ref(db, `users/${userUid}/commission`);
                await runTransaction(commRef, (current) => {
                    return (current || 0) + (txnAmount * 0.002); // 0.2% commission for Withdrawal
                });

                onSuccess({
                    Service: 'Micro ATM Withdrawal',
                    CardNumber: `XXXX-XXXX-XXXX-${cardData.number.slice(-4)}`,
                    CardHolder: cardData.name,
                    Amount: `₹${txnAmount.toFixed(2)}`,
                    Commission: `₹${(txnAmount * 0.002).toFixed(2)}`,
                    Status: 'Success'
                });
            } catch (error) {
                alert("Transaction Failed");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4">
            
            {step === 1 && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                        <div className="flex justify-between items-start mb-8">
                            <Cpu size={32} className="text-yellow-400" />
                            <span className="font-bold tracking-widest text-lg">Micro ATM</span>
                        </div>
                        <div className="mb-4">
                            <p className="text-sm opacity-80 mb-1">Card Number</p>
                            <div className="text-2xl font-mono tracking-wider">{cardData.number || 'XXXX XXXX XXXX XXXX'}</div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs opacity-80 mb-1">Card Holder</p>
                                <div className="font-bold uppercase">{cardData.name || 'YOUR NAME'}</div>
                            </div>
                            <div>
                                <p className="text-xs opacity-80 mb-1">Expiry</p>
                                <div className="font-bold">{cardData.expiry || 'MM/YY'}</div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSaveCard} className="space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <CreditCard size={18} className="text-blue-600"/> Give your Debit/Credit Card
                        </h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Card Number (16 Digit)</label>
                            <input required type="text" maxLength={16} placeholder="0000 0000 0000 0000" className="w-full h-10 px-3 border border-gray-300 rounded text-sm outline-none focus:border-blue-500" value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value.replace(/\D/g,'')})} />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Valid Thru</label>
                                <input required type="text" maxLength={5} placeholder="MM/YY" className="w-full h-10 px-3 border border-gray-300 rounded text-sm outline-none focus:border-blue-500" value={cardData.expiry} onChange={e => setCardData({...cardData, expiry: e.target.value})} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">CVV</label>
                                <input required type="password" maxLength={3} placeholder="123" className="w-full h-10 px-3 border border-gray-300 rounded text-sm outline-none focus:border-blue-500" value={cardData.cvv} onChange={e => setCardData({...cardData, cvv: e.target.value.replace(/\D/g,'')})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Card Holder Name</label>
                            <input required type="text" placeholder="Name on Card" className="w-full h-10 px-3 border border-gray-300 rounded text-sm outline-none focus:border-blue-500" value={cardData.name} onChange={e => setCardData({...cardData, name: e.target.value})} />
                        </div>
                        <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">
                            {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Save & Continue'}
                        </button>
                    </form>
                </div>
            )}

            {(step === 2 || step === 3) && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setStep(1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
                        <h3 className="font-bold text-gray-800">Select Transaction Type</h3>
                    </div>

                    {/* Mode Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setMode('CASH')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${mode === 'CASH' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <div className={`p-2 rounded-full ${mode === 'CASH' ? 'bg-green-200' : 'bg-gray-100'}`}><Wallet size={24}/></div>
                            <span className="font-bold text-sm">Cash Withdrawal</span>
                        </button>
                        <button 
                            onClick={() => setMode('TRANSFER')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${mode === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <div className={`p-2 rounded-full ${mode === 'TRANSFER' ? 'bg-blue-200' : 'bg-gray-100'}`}><Smartphone size={24}/></div>
                            <span className="font-bold text-sm">Transfer</span>
                        </button>
                    </div>

                    <div className="bg-white p-4 border border-gray-200 rounded-xl space-y-4">
                        {step === 2 && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Enter Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                                        <input 
                                            type="number" 
                                            autoFocus
                                            placeholder="0" 
                                            className="w-full h-10 pl-8 pr-3 border border-gray-300 rounded text-lg font-bold text-gray-800 outline-none focus:border-blue-500" 
                                            value={amount} 
                                            onChange={e => setAmount(e.target.value)} 
                                        />
                                    </div>
                                </div>

                                {mode === 'TRANSFER' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mobile Number</label>
                                        <input 
                                            type="text" 
                                            maxLength={10} 
                                            placeholder="Enter 10-digit number" 
                                            className="w-full h-10 px-3 border border-gray-300 rounded text-sm outline-none focus:border-blue-500" 
                                            value={transferMobile} 
                                            onChange={e => setTransferMobile(e.target.value.replace(/\D/g,''))} 
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {step === 3 && mode === 'TRANSFER' && (
                            <div className="space-y-4">
                                <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-sm">
                                    OTP Sent to <strong>{transferMobile}</strong>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Enter OTP</label>
                                    <input 
                                        type="text" 
                                        placeholder="XXXX" 
                                        className="w-full h-10 px-3 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 tracking-widest text-center font-bold" 
                                        value={otp} 
                                        onChange={e => setOtp(e.target.value)} 
                                    />
                                </div>
                            </div>
                        )}

                        <button 
                            disabled={loading || !amount || (mode === 'TRANSFER' && !transferMobile)}
                            onClick={handleProcess} 
                            className={`w-full text-white py-3 rounded-lg font-bold shadow-md flex justify-center items-center gap-2 ${mode === 'CASH' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {loading ? <Loader2 className="animate-spin"/> : (
                                step === 3 ? 'Verify & Pay' : (mode === 'TRANSFER' ? 'Send OTP' : 'Withdraw Cash')
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const CreditCardFlow = ({ onSuccess, processPayment }: FlowProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState({ provider: '', number: '', name: '', amount: '' });
  const [billDetails, setBillDetails] = useState<any>(null);

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        setBillDetails({
            due: 15400.50,
            minDue: 2500.00,
            date: '15 Oct 2023',
            name: 'KULDEEP KUSHWAH'
        });
        setLoading(false);
        setStep(2);
    }, 1500);
  };

  const handlePay = async () => {
      setLoading(true);
      const amount = parseFloat(details.amount);
      const charge = amount * SERVICE_CHARGE_PERCENT;
      const total = amount + charge;

      const success = await processPayment(total);
      if (success) {
          onSuccess({
              Service: 'Credit Card Bill',
              Provider: details.provider,
              CardNumber: `XXXX-XXXX-XXXX-${details.number.slice(-4)}`,
              BillAmount: `₹${amount.toFixed(2)}`,
              ServiceCharge: `₹${charge.toFixed(2)}`,
              TotalPaid: `₹${total.toFixed(2)}`,
              Status: 'Success'
          });
      }
      setLoading(false);
  };

  return (
      <div className="space-y-4">
          {step === 1 && (
              <form onSubmit={handleFetch} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
                      <select required className="w-full border rounded-lg p-3" onChange={e => setDetails({...details, provider: e.target.value})}>
                          <option value="">-- Select --</option>
                          {CC_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input required type="text" maxLength={16} className="w-full border rounded-lg p-3" placeholder="Enter 16-digit card number" onChange={e => setDetails({...details, number: e.target.value})} />
                  </div>
                  <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex justify-center">
                      {loading ? <Loader2 className="animate-spin"/> : 'Fetch Bill'}
                  </button>
              </form>
          )}

          {step === 2 && billDetails && (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between"><span>Name</span><span className="font-bold">{billDetails.name}</span></div>
                      <div className="flex justify-between"><span>Total Due</span><span className="font-bold text-red-600">₹{billDetails.due}</span></div>
                      <div className="flex justify-between"><span>Min Due</span><span className="font-bold">₹{billDetails.minDue}</span></div>
                      <div className="flex justify-between"><span>Due Date</span><span className="font-bold">{billDetails.date}</span></div>
                  </div>
                  
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Payment Amount</label>
                      <input type="number" className="w-full border rounded-lg p-3 font-bold" placeholder="Enter Amount" value={details.amount} onChange={e => setDetails({...details, amount: e.target.value})} />
                  </div>

                  {details.amount && <PaymentSummary amount={parseFloat(details.amount)} />}

                  <button onClick={handlePay} disabled={!details.amount || loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex justify-center">
                      {loading ? <Loader2 className="animate-spin"/> : 'Pay Bill'}
                  </button>
              </div>
          )}
      </div>
  );
};

const BillPaymentFlow = ({ service, onSuccess, processPayment }: { service: ServiceItem } & FlowProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [biller, setBiller] = useState('');
    const [consumerId, setConsumerId] = useState('');
    const [amount, setAmount] = useState('');
    const [billData, setBillData] = useState<any>(null);
    const [selectedState, setSelectedState] = useState('');

    const specificData = BILLER_DATA[service.id.toUpperCase().substring(0, 4)] || BILLER_DATA[service.id.toUpperCase()]; 
    // Handle 'elec' -> 'ELEC', 'gas' -> 'GAS' etc.

    const handleFetchBill = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setBillData({
                name: 'KULDEEP KUSHWAH',
                amount: Math.floor(Math.random() * 2000) + 500,
                dueDate: '25 Oct 2023',
                billDate: '01 Oct 2023'
            });
            setLoading(false);
            setStep(2);
        }, 1500);
    };

    const handlePay = async () => {
        const payAmount = billData ? billData.amount : parseFloat(amount);
        setLoading(true);
        const charge = payAmount * SERVICE_CHARGE_PERCENT;
        const total = payAmount + charge;

        const success = await processPayment(total);
        if (success) {
            onSuccess({
                Service: service.title,
                Biller: biller,
                ConsumerID: consumerId,
                BillAmount: `₹${payAmount.toFixed(2)}`,
                ServiceCharge: `₹${charge.toFixed(2)}`,
                TotalPaid: `₹${total.toFixed(2)}`,
                TransactionID: 'BBPS' + Math.floor(Math.random()*1000000)
            });
        }
        setLoading(false);
    }

    return (
        <div className="space-y-4">
            {step === 1 && (
                <form onSubmit={handleFetchBill} className="space-y-4">
                    {specificData?.type === 'grouped' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select State</label>
                            <select className="w-full border rounded-lg p-3" onChange={e => { setSelectedState(e.target.value); setBiller(''); }}>
                                <option value="">-- Select State --</option>
                                {Object.keys(specificData.groups).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Biller</label>
                        <select required className="w-full border rounded-lg p-3" value={biller} onChange={e => setBiller(e.target.value)}>
                            <option value="">-- Select Biller --</option>
                            {specificData?.type === 'grouped' && selectedState 
                                ? specificData.groups[selectedState]?.map((b: string) => <option key={b} value={b}>{b}</option>)
                                : specificData?.options?.map((b: string) => <option key={b} value={b}>{b}</option>)
                            }
                            {!specificData && <option value="Generic Biller">Generic Biller</option>}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Consumer Number / ID</label>
                        <input required type="text" className="w-full border rounded-lg p-3" placeholder="Enter Consumer ID" value={consumerId} onChange={e => setConsumerId(e.target.value)} />
                    </div>

                    <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex justify-center">
                        {loading ? <Loader2 className="animate-spin"/> : 'Fetch Bill'}
                    </button>
                </form>
            )}

            {step === 2 && billData && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between"><span>Name</span><span className="font-bold">{billData.name}</span></div>
                        <div className="flex justify-between"><span>Bill Amount</span><span className="font-bold text-blue-700">₹{billData.amount}</span></div>
                        <div className="flex justify-between text-xs text-gray-500"><span>Due Date</span><span>{billData.dueDate}</span></div>
                    </div>

                    <PaymentSummary amount={billData.amount} />

                    <button onClick={handlePay} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex justify-center">
                        {loading ? <Loader2 className="animate-spin"/> : 'Confirm Payment'}
                    </button>
                </div>
            )}
        </div>
    );
};

const MoneyTransferFlow = ({ onSuccess, processPayment }: FlowProps) => {
  const [mode, setMode] = useState<'PHONE' | 'BANK' | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    accName: '',
    accNo: '',
    ifsc: '',
    transferType: 'IMPS', // IMPS or NEFT
    amount: ''
  });

  const handlePay = async () => {
    setLoading(true);
    const amt = parseFloat(formData.amount);
    const charge = amt * SERVICE_CHARGE_PERCENT;
    const total = amt + charge;

    const success = await processPayment(total);
    if (success) {
       onSuccess({
         Service: 'Money Transfer',
         Type: mode === 'PHONE' ? 'Mobile Transfer' : 'Bank Transfer',
         Beneficiary: mode === 'PHONE' ? formData.phone : `${formData.accName} (${formData.accNo})`,
         Mode: mode === 'BANK' ? formData.transferType : 'UPI',
         Amount: `₹${amt.toFixed(2)}`,
         ServiceCharge: `₹${charge.toFixed(2)}`,
         TotalPaid: `₹${total.toFixed(2)}`,
         Status: 'Success'
       });
    }
    setLoading(false);
  };

  // Step 0: Select Mode
  if (!mode) {
      return (
          <div className="space-y-4 animate-in slide-in-from-right-4">
              <h3 className="font-bold text-gray-800 mb-4">Select Transfer Method</h3>
              <button 
                onClick={() => { setMode('PHONE'); setStep(1); }}
                className="w-full bg-white border-2 border-blue-100 p-4 rounded-xl flex items-center gap-4 hover:border-blue-600 hover:bg-blue-50 transition group text-left"
              >
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                      <Smartphone size={24} />
                  </div>
                  <div>
                      <div className="font-bold text-gray-800">Transfer Using Phone Number</div>
                      <div className="text-xs text-gray-500">Instant transfer to linked UPI/Mobile</div>
                  </div>
              </button>

              <button 
                onClick={() => { setMode('BANK'); setStep(1); }}
                className="w-full bg-white border-2 border-green-100 p-4 rounded-xl flex items-center gap-4 hover:border-green-600 hover:bg-green-50 transition group text-left"
              >
                  <div className="bg-green-100 p-3 rounded-full text-green-600 group-hover:bg-green-600 group-hover:text-white transition">
                      <Landmark size={24} />
                  </div>
                  <div>
                      <div className="font-bold text-gray-800">Transfer Using Account Number</div>
                      <div className="text-xs text-gray-500">Send via IMPS or NEFT using IFSC</div>
                  </div>
              </button>
          </div>
      )
  }

  // PHONE FLOW
  if (mode === 'PHONE') {
      return (
          <div className="space-y-5 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-2">
                 <button onClick={() => setMode(null)} className="text-gray-400 hover:text-gray-800"><ChevronLeft size={20}/></button>
                 <h3 className="font-bold text-gray-800">Phone Number Transfer</h3>
              </div>

              {step === 1 && (
                  <>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Enter Phone Number</label>
                        <input 
                            type="text" maxLength={10} placeholder="10-digit mobile number"
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                    <button disabled={formData.phone.length < 10} onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Continue</button>
                  </>
              )}

              {step === 2 && (
                  <>
                    <div className="bg-blue-50 p-3 rounded text-sm text-gray-700">Sending to: <strong>{formData.phone}</strong></div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Enter Amount</label>
                        <input 
                            type="number" placeholder="₹ Amount"
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                            value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                        />
                    </div>
                    <button disabled={!formData.amount} onClick={() => setStep(3)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Proceed</button>
                  </>
              )}

              {step === 3 && (
                  <>
                     <h4 className="font-bold text-gray-800">Confirm Transfer</h4>
                     <PaymentSummary amount={parseFloat(formData.amount)} />
                     <button onClick={handlePay} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : 'Pay Now'}
                     </button>
                  </>
              )}
          </div>
      );
  }

  // BANK FLOW
  if (mode === 'BANK') {
      return (
          <div className="space-y-5 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-2">
                 <button onClick={() => setMode(null)} className="text-gray-400 hover:text-gray-800"><ChevronLeft size={20}/></button>
                 <h3 className="font-bold text-gray-800">Bank Transfer</h3>
              </div>

              {step === 1 && (
                  <>
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-2">Add Beneficiary Details</h4>
                    <div className="space-y-3">
                        <input type="text" placeholder="Account Holder Name" className="w-full border rounded-lg p-3" value={formData.accName} onChange={e => setFormData({...formData, accName: e.target.value})} />
                        <input type="text" placeholder="Account Number" className="w-full border rounded-lg p-3" value={formData.accNo} onChange={e => setFormData({...formData, accNo: e.target.value})} />
                        <input type="text" placeholder="IFSC Code" className="w-full border rounded-lg p-3 uppercase" value={formData.ifsc} onChange={e => setFormData({...formData, ifsc: e.target.value})} />
                    </div>
                    <button disabled={!formData.accNo || !formData.ifsc} onClick={() => setStep(2)} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold mt-2">Add Beneficiary & Continue</button>
                  </>
              )}

              {step === 2 && (
                  <>
                    <div className="bg-green-50 p-3 rounded text-sm text-gray-700 space-y-1">
                        <div>Beneficiary: <strong>{formData.accName}</strong></div>
                        <div>Ac/No: <strong>{formData.accNo}</strong></div>
                        <div>IFSC: <strong>{formData.ifsc}</strong></div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Transfer Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-gray-50">
                                <input type="radio" name="type" value="IMPS" checked={formData.transferType === 'IMPS'} onChange={() => setFormData({...formData, transferType: 'IMPS'})} />
                                <span className="font-bold">IMPS</span>
                                <span className="text-xs text-gray-500">(Instant)</span>
                            </label>
                            <label className="flex items-center gap-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-gray-50">
                                <input type="radio" name="type" value="NEFT" checked={formData.transferType === 'NEFT'} onChange={() => setFormData({...formData, transferType: 'NEFT'})} />
                                <span className="font-bold">NEFT</span>
                                <span className="text-xs text-gray-500">(2-4 hrs)</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Enter Amount</label>
                        <input 
                            type="number" placeholder="₹ Amount"
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold"
                            value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                        />
                    </div>
                    <button disabled={!formData.amount} onClick={() => setStep(3)} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Proceed to Review</button>
                  </>
              )}

              {step === 3 && (
                   <>
                     <h4 className="font-bold text-gray-800">Confirm Transaction</h4>
                     <PaymentSummary amount={parseFloat(formData.amount)} />
                     <button onClick={handlePay} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : 'Transfer Now'}
                     </button>
                   </>
              )}
          </div>
      );
  }

  return null;
}

const MobileDthRecharge = ({ type, onSuccess, processPayment }: { type: 'mobile' | 'dth' } & FlowProps) => {
  const [step, setStep] = useState(1);
  const [operator, setOperator] = useState('');
  const [number, setNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFetchPlans = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 1000);
  };

  const initiatePay = (plan: any) => {
      setSelectedPlan(plan);
      setStep(3);
  };

  const handlePay = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    const charge = selectedPlan.price * SERVICE_CHARGE_PERCENT;
    const total = selectedPlan.price + charge;

    const success = await processPayment(total);
    if (success) {
        onSuccess({
            Service: type === 'mobile' ? 'Mobile Recharge' : 'DTH Booking',
            Operator: operator,
            Number: number,
            PlanPrice: `₹${selectedPlan.price}`,
            ServiceCharge: `₹${charge.toFixed(2)}`,
            TotalPaid: `₹${total.toFixed(2)}`,
            Validity: selectedPlan.val
        });
    }
    setLoading(false);
  };

  return (
    <div>
      {step === 1 && (
        <form onSubmit={handleFetchPlans} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Operator</label>
            <select required className="w-full border rounded-lg p-3" onChange={e => setOperator(e.target.value)}>
              <option value="">-- Select --</option>
              {type === 'mobile' ? OPERATORS.mobile.map(o => <option key={o} value={o}>{o}</option>) 
                               : OPERATORS.dth.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{type === 'mobile' ? 'Mobile Number' : 'Subscriber ID'}</label>
            <input 
              required 
              type="text" 
              maxLength={type === 'mobile' ? 10 : 15}
              placeholder={type === 'mobile' ? 'Enter 10-digit number' : 'Enter Subscriber ID'}
              className="w-full border rounded-lg p-3"
              value={number}
              onChange={e => setNumber(e.target.value)}
            />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : `View ${type === 'mobile' ? 'Plans' : 'Offers'}`}
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">Plans for <span className="font-bold text-gray-800">{operator} - {number}</span></p>
            <button onClick={() => setStep(1)} className="text-xs text-blue-600 hover:underline">Change</button>
          </div>
          
          <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
              {MOCK_PLANS.map((plan, idx) => (
                <div key={idx} className="border p-4 rounded-lg flex justify-between items-center hover:border-blue-500 cursor-pointer group" onClick={() => initiatePay(plan)}>
                  <div>
                    <div className="font-bold text-lg">₹{plan.price}</div>
                    <div className="text-xs text-gray-500 font-semibold">Val: {plan.val} | Data: {plan.data}</div>
                    <div className="text-xs text-gray-400 mt-1">{plan.desc}</div>
                  </div>
                  <button className="bg-white border border-blue-600 text-blue-600 px-4 py-1 rounded-full text-sm group-hover:bg-blue-600 group-hover:text-white transition">
                    Select
                  </button>
                </div>
              ))}
            </div>
        </div>
      )}

      {step === 3 && selectedPlan && (
           <div className="space-y-4 animate-in slide-in-from-right-4">
               <h3 className="font-bold text-gray-800">Confirm Recharge</h3>
               <div className="bg-blue-50 p-3 rounded border border-blue-100 mb-4">
                   <p className="text-sm text-gray-700">Operator: <strong>{operator}</strong></p>
                   <p className="text-sm text-gray-700">Number: <strong>{number}</strong></p>
                   <p className="text-sm text-gray-700">Plan: <strong>{selectedPlan.desc}</strong></p>
               </div>

               <PaymentSummary amount={selectedPlan.price} />

               <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold">Back</button>
                    <button onClick={handlePay} disabled={loading} className="flex-[2] bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : 'Confirm & Pay'}
                    </button>
               </div>
           </div>
      )}
    </div>
  );
};

// AEPS Flow
const AepsFlow = ({ onSuccess }: { onSuccess: (data: any) => void }) => {
  const [scanning, setScanning] = useState(false);
  const [formData, setFormData] = useState({ bank: '', aadhaar: '', type: 'Withdrawal', amount: '' });

  const handleScan = () => {
    if(!formData.bank || formData.aadhaar.length < 12) return alert("Please fill all details");
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onSuccess({
        Service: 'AEPS',
        Transaction: formData.type,
        Bank: formData.bank,
        Aadhaar: `XXXX-XXXX-${formData.aadhaar.slice(-4)}`,
        Amount: formData.amount || 'N/A',
        Status: 'Success'
      });
    }, 3000);
  };

  if (scanning) {
    return (
      <div className="text-center py-12">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <Fingerprint className="w-full h-full text-gray-300" />
          <div className="absolute inset-0 w-full h-2 bg-blue-500/50 blur-sm animate-[scan_2s_ease-in-out_infinite]" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 animate-pulse">Scanning Fingerprint...</h3>
        <p className="text-sm text-gray-500 mt-2">Please keep your finger on the device</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
       <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
          <select className="w-full border rounded-lg p-3" onChange={e => setFormData({...formData, bank: e.target.value})}>
            <option value="">-- Select Bank --</option>
            {OPERATORS.banks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
       </div>
       <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
          <input 
            type="text" 
            maxLength={12}
            className="w-full border rounded-lg p-3" 
            placeholder="12 Digit Aadhaar Number"
            onChange={e => setFormData({...formData, aadhaar: e.target.value})}
          />
       </div>
       <div className="grid grid-cols-2 gap-4">
         <button 
           onClick={() => setFormData({...formData, type: 'Withdrawal'})}
           className={`p-3 rounded-lg border text-sm font-medium ${formData.type === 'Withdrawal' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
         >
           Cash Withdrawal
         </button>
         <button 
           onClick={() => setFormData({...formData, type: 'Balance Info'})}
           className={`p-3 rounded-lg border text-sm font-medium ${formData.type === 'Balance Info' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
         >
           Balance Inquiry
         </button>
       </div>
       
       {formData.type === 'Withdrawal' && (
         <input 
          type="number" 
          placeholder="Enter Amount" 
          className="w-full border rounded-lg p-3"
          onChange={e => setFormData({...formData, amount: e.target.value})}
         />
       )}

       <button onClick={handleScan} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
         <Fingerprint size={20} /> Scan Fingerprint
       </button>
    </div>
  );
};

const SubscriptionFlow = ({ onSuccess, processPayment }: FlowProps) => {
    const [step, setStep] = useState(1);
    const [platform, setPlatform] = useState('');
    const [userId, setUserId] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleFetchPlans = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => { setLoading(false); setStep(2); }, 1000);
    };

    const initiateBuy = (plan: any) => {
        setSelectedPlan(plan);
        setStep(3);
    };

    const handleBuy = async () => {
        if (!selectedPlan) return;
        setLoading(true);
        const charge = selectedPlan.price * SERVICE_CHARGE_PERCENT;
        const total = selectedPlan.price + charge;

        const success = await processPayment(total);
        if (success) {
            onSuccess({
                Service: 'Subscription',
                Platform: platform,
                AccountID: userId,
                PlanName: selectedPlan.name,
                BasePrice: `₹${selectedPlan.price}`,
                ServiceCharge: `₹${charge.toFixed(2)}`,
                TotalPaid: `₹${total.toFixed(2)}`,
                Status: 'Active'
            });
        }
        setLoading(false);
    };

    return (
        <div>
            {step === 1 && (
                <form onSubmit={handleFetchPlans} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Platform</label>
                        <select 
                            required 
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" 
                            onChange={e => setPlatform(e.target.value)}
                            value={platform}
                        >
                            <option value="">-- Select Platform --</option>
                            {Object.keys(SUBSCRIPTION_PLANS).map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registered Mobile / Email</label>
                        <input 
                            required 
                            type="text" 
                            placeholder="Enter Mobile or Email ID"
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                            value={userId}
                            onChange={e => setUserId(e.target.value)}
                        />
                    </div>
                    <button disabled={loading || !platform} type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 flex justify-center">
                        {loading ? <Loader2 className="animate-spin" /> : 'View Plans'}
                    </button>
                </form>
            )}

            {step === 2 && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">Plans for <span className="font-bold text-gray-800">{platform}</span></p>
                        <button onClick={() => setStep(1)} className="text-xs text-blue-600 hover:underline">Change</button>
                    </div>
                    
                    <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-2">
                            {SUBSCRIPTION_PLANS[platform]?.map((plan, idx) => (
                                <div key={idx} className="border p-4 rounded-lg hover:border-red-500 cursor-pointer group shadow-sm" onClick={() => initiateBuy(plan)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-lg text-gray-800">{plan.name}</div>
                                        <div className="font-bold text-xl text-red-600">₹{plan.price}</div>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-3">{plan.desc}</div>
                                    <button className="w-full bg-red-50 text-red-700 py-2 rounded-lg text-sm font-semibold group-hover:bg-red-600 group-hover:text-white transition">
                                        Select Plan
                                    </button>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {step === 3 && selectedPlan && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                    <h3 className="font-bold text-gray-800">Confirm Subscription</h3>
                    <div className="bg-red-50 p-3 rounded border border-red-100 mb-4">
                        <p className="text-sm text-gray-700">Platform: <strong>{platform}</strong></p>
                        <p className="text-sm text-gray-700">ID: <strong>{userId}</strong></p>
                        <p className="text-sm text-gray-700">Plan: <strong>{selectedPlan.name}</strong></p>
                    </div>

                    <PaymentSummary amount={selectedPlan.price} />

                    <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold">Back</button>
                        <button onClick={handleBuy} disabled={loading} className="flex-[2] bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : 'Buy Subscription'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const TravelFlow = ({ type, onSuccess, processPayment }: { type: string } & FlowProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [searchParams, setSearchParams] = useState({ 
        from: 'Delhi', 
        to: 'Mumbai', 
        city: 'Mumbai', 
        guests: '1', 
        date: '',
        rooms: '1',
        returnDate: '',
        tripType: 'ONEWAY',
        class: 'SL',
        quota: 'GENERAL'
    });
    
    // SPECIFIC STATES
    const [subStep, setSubStep] = useState(0); 
    // Flight Logic: 1 (Details) -> 2 (Seats) -> 3 (Addons) -> 4 (Payment)
    // Bus Logic: 1 (Seats) -> 2 (Details) -> 3 (Payment)
    // Train/Hotel: 1 (Details) -> 2 (Payment)
    // Holiday: 1 (Customize) -> 2 (Details) -> 3 (Payment)

    const [passengers, setPassengers] = useState<any[]>([]);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]); // For Bus & Flight
    const [contactInfo, setContactInfo] = useState({ mobile: '', email: '' });
    
    // Updated Add-ons State for Flight
    const [addOns, setAddOns] = useState<{
        meal: 'Veg' | 'Non-Veg' | null;
        baggage: 0 | 5 | 10 | 15;
        insurance: boolean;
    }>({ meal: null, baggage: 0, insurance: false });

    // Holiday Specific State
    const [holidayParams, setHolidayParams] = useState<{
        activities: string[];
        transport: string[];
        hotelType: string;
        mealPlan: string;
    }>({ activities: [], transport: ['Flight'], hotelType: '3 Star', mealPlan: 'Breakfast' });

    // Holiday Custom Price State
    const [customHolidayPrice, setCustomHolidayPrice] = useState<number | null>(null);

    // Constants for modes
    const isHotel = type === 'HOTEL';
    const isBus = type === 'BUS';
    const isTrain = type === 'TRAIN';
    const isFlight = type === 'FLIGHT';
    const isHoliday = type === 'HOLIDAY';

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => { setLoading(false); setStep(2); }, 1500);
    };

    const getHolidayCalculatedPrice = () => {
        if (!selectedItem) return 0;
        let base = selectedItem.price * passengers.length;
        
        // Transport
        if (holidayParams.transport.includes('Flight')) base += (5000 * passengers.length);
        if (holidayParams.transport.includes('Train')) base += (1500 * passengers.length);
        if (holidayParams.transport.includes('Bus')) base += (1000 * passengers.length);
        if (holidayParams.transport.includes('Cab')) base += (8000); 

        // Activity
        holidayParams.activities.forEach(actId => {
            const act = ACTIVITIES.find(a => a.id === actId);
            if(act) base += (act.cost * passengers.length);
        });

        // Hotel
        if(holidayParams.hotelType === '4 Star') base += (2500 * passengers.length);
        if(holidayParams.hotelType === '5 Star') base += (5000 * passengers.length);

        // Meal
        if(holidayParams.mealPlan === 'Breakfast + Lunch') base += (800 * passengers.length);
        if(holidayParams.mealPlan === 'Breakfast + Dinner') base += (1000 * passengers.length);
        if(holidayParams.mealPlan === 'All Meals') base += (1500 * passengers.length);

        return base;
    }

    // Effect to auto-fill custom price with calculated price when reaching confirmation step
    useEffect(() => {
        if (isHoliday && step === 3 && subStep === 3 && customHolidayPrice === null) {
            setCustomHolidayPrice(getHolidayCalculatedPrice());
        }
    }, [isHoliday, step, subStep]);

    const initiateBook = (item: any) => {
        setSelectedItem(item);
        setStep(3);
        setSelectedSeats([]);
        setCustomHolidayPrice(null); // Reset custom price
        
        // Init passengers based on mode
        let initialPassengers: any[] = [];
        if (isFlight || isTrain || isHoliday) {
            const count = parseInt(searchParams.guests) || 1;
            // Use DOB instead of age. Split name to first/last, Added Title
            initialPassengers = Array(count).fill({ title: 'Mr', firstName: '', lastName: '', type: 'Adult', gender: 'Male', idProof: '', dob: '' });
        } else if (isHotel) {
            initialPassengers = [{ title: 'Mr', firstName: '', lastName: '', mobile: '', email: '', idProof: '' }]; // Primary Guest
        }
        setPassengers(initialPassengers);

        // SubStep Initialization
        if (isBus) setSubStep(1); // Seats first for Bus
        else if (isHoliday) {
            // Intelligent Defaults based on Package Type
            let defaultTransport = ['Flight'];
            let defaultMeal = 'Breakfast';
            let defaultHotel = '3 Star';

            if (item.type === 'Luxury' || item.desc.includes('7 Days')) {
                defaultTransport = ['Flight'];
                defaultMeal = 'All Meals';
                defaultHotel = '5 Star';
            } else if (item.type === 'Best Seller' || item.desc.includes('5 Days')) {
                defaultTransport = ['Train'];
                defaultMeal = 'Breakfast + Dinner';
                defaultHotel = '4 Star';
            } else { // Short Trip
                defaultTransport = ['Bus'];
                defaultMeal = 'Breakfast';
                defaultHotel = '3 Star';
            }
            
            setHolidayParams({
                activities: [],
                transport: defaultTransport,
                hotelType: defaultHotel,
                mealPlan: defaultMeal
            });
            setSubStep(1); // Customize first for Holiday
        }
        else setSubStep(1); // Details first for Flight/Train/Hotel
    };

    const updateGuests = (change: number) => {
        const current = parseInt(searchParams.guests) || 1;
        const newVal = Math.max(1, Math.min(9, current + change));
        setSearchParams({...searchParams, guests: newVal.toString()});
    };

    // --- SEAT SELECTION LOGIC ---
    const toggleSeat = (seatId: string, maxSeats: number = 6) => {
        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(prev => prev.filter(id => id !== seatId));
            if (isBus) setPassengers(prev => prev.filter((_, i) => i !== selectedSeats.indexOf(seatId)));
        } else {
            if (selectedSeats.length >= maxSeats) {
                alert(`Maximum ${maxSeats} seats allowed`);
                return;
            }
            setSelectedSeats(prev => [...prev, seatId]);
            if (isBus) setPassengers(prev => [...prev, { title: 'Mr', firstName: '', lastName: '', dob: '', gender: 'Male' }]);
        }
    };

    const calculateAge = (dobString: string) => {
        if (!dobString) return 0;
        const birthDate = new Date(dobString);
        const difference = Date.now() - birthDate.getTime();
        const ageDate = new Date(difference);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const validatePassenger = (p: any) => {
        if (!isHotel && p.dob) {
            const age = calculateAge(p.dob);
            if (p.type === 'Child' && age >= 12) return "Child must be < 12 years";
            if (p.type === 'Senior' && age < 60) return "Senior must be > 60 years";
            if (p.type === 'Adult' && age < 12) return "Adult must be ≥ 12 years";
        }
        return null;
    };

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Check validations
        for (const p of passengers) {
            const error = validatePassenger(p);
            if (error) {
                alert(`Error: ${error}`);
                return;
            }
        }
        
        // Navigation Logic
        if (isFlight) setSubStep(2); // Go to Seats
        else if (isBus) setSubStep(3); // Go to Payment (already did seats)
        else if (isHoliday) setSubStep(3); // Go to Payment
        else setSubStep(2); // Train/Hotel go to Payment
    };

    const handleFlightSeatsSubmit = () => {
        setSubStep(3); // Go to Addons
    };
    
    const handleFlightAddonsSubmit = () => {
        setSubStep(4); // Go to Payment
    };

    const handleHolidayCustomizeSubmit = () => {
        setSubStep(2); // Go to Details
    };

    const handleBook = async () => {
        if (!selectedItem) return;
        setLoading(true);
        
        let totalPrice = selectedItem.price;
        if (isBus && selectedSeats.length > 0) totalPrice = selectedItem.price * selectedSeats.length;
        if ((isFlight || isTrain || isHoliday) && passengers.length > 0) totalPrice = selectedItem.price * passengers.length;
        if (isHotel) totalPrice = selectedItem.price * parseInt(searchParams.rooms || '1'); // Simplified night calc

        // Add-ons cost for Flight
        if (isFlight) {
            if (addOns.meal === 'Veg') totalPrice += (399 * passengers.length);
            if (addOns.meal === 'Non-Veg') totalPrice += (499 * passengers.length);
            if (addOns.baggage > 0) {
                 const baggageCost = (addOns.baggage / 5) * 250;
                 totalPrice += (baggageCost * passengers.length);
            }
            // Flight Seat Charges - Updated for new layout
            selectedSeats.forEach(seat => {
                const match = seat.match(/^(\d+)/);
                const row = match ? parseInt(match[1]) : 0;
                
                if (row <= 7) totalPrice += 500; // Premium
                else if (row >= 10 && row <= 26) totalPrice += 250; // Standard
                // Rows 30+ Free
            });
        }

        // Holiday Costs
        if (isHoliday) {
            if (customHolidayPrice !== null && !isNaN(customHolidayPrice)) {
                totalPrice = customHolidayPrice;
            } else {
                totalPrice = getHolidayCalculatedPrice();
            }
        }

        const charge = totalPrice * SERVICE_CHARGE_PERCENT;
        const total = totalPrice + charge;

        const success = await processPayment(total);
        if (success) {
            const resultData: any = {
                Service: `${type} Booking`,
                Provider: selectedItem.provider,
                BaseAmount: `₹${totalPrice}`,
                ServiceCharge: `₹${charge.toFixed(2)}`,
                TotalPaid: `₹${total.toFixed(2)}`,
                BookingID: (isFlight ? 'FL' : isTrain ? 'PNR' : 'BK') + Math.floor(1000 + Math.random() * 9000),
                Status: 'Confirmed'
            };

            if (isHotel) {
                resultData.Location = selectedItem.desc;
                resultData.Rooms = searchParams.rooms;
                resultData.Guest = `${passengers[0]?.title} ${passengers[0]?.firstName} ${passengers[0]?.lastName}`;
            } else if (isBus || isFlight) {
                resultData.Route = `${searchParams.from} - ${searchParams.to}`;
                resultData.Seats = selectedSeats.join(', ');
                if(isBus) resultData.Boarding = contactInfo.mobile;
                if(isFlight) resultData.FlightNo = selectedItem.code;
            } else if (isHoliday) {
                resultData.Package = selectedItem.provider;
                resultData.Duration = selectedItem.desc;
                resultData.Guests = passengers.length;
                resultData.Hotel = holidayParams.hotelType;
            } else {
                resultData.Route = `${searchParams.from} - ${searchParams.to}`;
                resultData.Passengers = passengers.length;
                resultData.Class = isTrain ? searchParams.class : selectedItem.type;
            }

            onSuccess(resultData);
        }
        setLoading(false);
    };

    const getData = () => {
        if (isBus) return MOCK_BUSES;
        if (isTrain) return MOCK_TRAINS;
        if (isHotel) return MOCK_HOTELS;
        if (isHoliday) {
             const dest = searchParams.to || "Dream Destination";
             return [
                { 
                    id: 1, 
                    provider: `${dest} ${HOLIDAY_NAMES[2][0]}`, 
                    desc: '2 Days / 1 Night', 
                    price: 5999, 
                    type: 'Short Trip',
                    benefits: ['Hotel', 'Sightseeing']
                },
                { 
                    id: 2, 
                    provider: `${dest} ${HOLIDAY_NAMES[5][1]}`, // Family Adventure
                    desc: '5 Days / 4 Nights', 
                    price: 14999, 
                    type: 'Best Seller',
                    benefits: ['Hotel', 'Meals', 'Tours', 'Transfer'] 
                },
                { 
                    id: 3, 
                    provider: `${dest} ${HOLIDAY_NAMES[7][0]}`, 
                    desc: '7 Days / 6 Nights', 
                    price: 24999, 
                    type: 'Luxury',
                    benefits: ['All Inclusive', 'Flights', '5 Star Hotel']
                },
             ];
        }
        return MOCK_FLIGHTS;
    };

    // --- RENDERERS ---

    const renderBusSeats = () => (
        <div className="space-y-4 animate-in slide-in-from-right-4">
            <h3 className="font-bold text-gray-800">Select Bus Seats</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-center">
                <div className="grid grid-cols-4 gap-3 p-4 border rounded-xl bg-white max-w-[200px]">
                    <div className="col-span-4 text-right mb-4"><div className="w-8 h-8 rounded-full border border-gray-300 ml-auto flex items-center justify-center text-[10px] text-gray-400">Driver</div></div>
                    {Array.from({ length: 20 }).map((_, i) => {
                        const seatNum = `L${i + 1}`;
                        const isSelected = selectedSeats.includes(seatNum);
                        return (
                            <button key={i} onClick={() => toggleSeat(seatNum)} className={`w-8 h-8 rounded border flex items-center justify-center text-[10px] transition ${isSelected ? 'bg-blue-500 text-white border-blue-600' : 'bg-white border-gray-300 hover:border-blue-400 text-gray-600'}`}>
                                {i+1}
                            </button>
                        );
                    })}
                </div>
            </div>
            <button disabled={selectedSeats.length === 0} onClick={() => setSubStep(2)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
                Continue ({selectedSeats.length} Seats)
            </button>
        </div>
    );

    const renderFlightSeats = () => {
        const reqSeats = parseInt(searchParams.guests);
        
        // Helper to generate seat rows
        const renderRow = (rowNum: number, isPremium: boolean, isWing: boolean) => {
             const colorClass = isPremium 
                ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' 
                : isWing 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' // Standard
                    : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'; // Standard

             return (
                 <div key={rowNum} className="flex items-center gap-4 sm:gap-8 justify-center relative">
                     {/* Left Side ABC */}
                     <div className="flex gap-1">
                         {['A','B','C'].map(col => {
                             const seatId = `${rowNum}${col}`;
                             const isSelected = selectedSeats.includes(seatId);
                             return (
                                 <button 
                                    key={seatId} 
                                    onClick={() => toggleSeat(seatId, reqSeats)}
                                    className={`w-8 h-8 sm:w-10 sm:h-10 text-xs font-bold rounded-md border flex items-center justify-center transition shadow-sm ${isSelected ? 'bg-green-600 text-white border-green-700 ring-2 ring-green-200' : colorClass}`}
                                    title={`Seat ${seatId} - ${isPremium ? '₹500' : '₹250'}`}
                                 >
                                     {col}
                                 </button>
                             );
                         })}
                     </div>

                     {/* Aisle */}
                     <div className="w-6 text-center text-xs text-gray-400 font-mono flex flex-col justify-center items-center">
                        <span>{rowNum}</span>
                     </div>

                      {/* Right Side DEF */}
                     <div className="flex gap-1">
                         {['D','E','F'].map(col => {
                             const seatId = `${rowNum}${col}`;
                             const isSelected = selectedSeats.includes(seatId);
                             return (
                                 <button 
                                    key={seatId} 
                                    onClick={() => toggleSeat(seatId, reqSeats)}
                                    className={`w-8 h-8 sm:w-10 sm:h-10 text-xs font-bold rounded-md border flex items-center justify-center transition shadow-sm ${isSelected ? 'bg-green-600 text-white border-green-700 ring-2 ring-green-200' : colorClass}`}
                                    title={`Seat ${seatId} - ${isPremium ? '₹500' : '₹250'}`}
                                 >
                                     {col}
                                 </button>
                             );
                         })}
                     </div>
                 </div>
             )
        };

        return (
            <div className="space-y-4 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2 border-b">
                    <div>
                        <h3 className="font-bold text-gray-800">Select Seats</h3>
                        <p className="text-xs text-gray-500">Front (Premium) • Mid (Standard) • Rear (Free)</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold shadow-sm border border-blue-200">
                        Selected: {selectedSeats.length}/{reqSeats}
                    </span>
                </div>
                
                <div className="flex justify-center bg-gray-100 rounded-xl p-4 sm:p-8 overflow-hidden border border-gray-200">
                    <div className="bg-white rounded-[40px] px-4 sm:px-8 py-12 border-2 border-gray-300 shadow-2xl relative min-w-[320px] sm:min-w-[400px]">
                         
                         {/* Nose Cone / Cockpit Area */}
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-gray-200 rounded-b-full opacity-20"></div>
                         <div className="text-center mb-8 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">Cockpit</div>

                         {/* Front Service Area */}
                         <div className="flex justify-between mb-6 px-2">
                            <div className="flex gap-2">
                                <div className="w-8 h-8 border-2 border-gray-300 rounded flex items-center justify-center font-bold text-gray-400 bg-gray-50" title="Galley">G</div>
                                <div className="w-8 h-8 border-2 border-gray-300 rounded flex items-center justify-center font-bold text-gray-400 bg-gray-50" title="Lavatory">L</div>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 border-2 border-gray-300 rounded flex items-center justify-center font-bold text-gray-400 bg-gray-50" title="Galley">G</div>
                            </div>
                         </div>

                         {/* SEAT GRID */}
                         <div className="space-y-3">
                             {/* Rows 1-7 (Premium) */}
                             {Array.from({length: 7}).map((_, i) => renderRow(i + 1, true, false))}
                             
                             {/* Exit Row Gap */}
                             <div className="flex items-center justify-between px-4 py-4 text-gray-400 text-xs font-bold uppercase">
                                <span className="flex items-center gap-1"><ArrowRight size={14} className="rotate-[-45deg]"/> Exit</span>
                                <span className="flex items-center gap-1">Exit <ArrowRight size={14} className="rotate-[-135deg]"/></span>
                             </div>

                             {/* Rows 10-15 (Standard - Front Wing) */}
                             {Array.from({length: 6}).map((_, i) => renderRow(i + 10, false, true))}

                             {/* Wing Area Indicator */}
                             <div className="absolute left-0 right-0 h-48 bg-gray-100/30 -z-10 top-[450px] border-y border-dashed border-gray-300 pointer-events-none"></div>

                             {/* Rows 16-26 (Standard - Over Wing/Back) */}
                             {Array.from({length: 11}).map((_, i) => renderRow(i + 16, false, true))}

                             {/* Exit Row Gap */}
                             <div className="flex items-center justify-between px-4 py-4 text-gray-400 text-xs font-bold uppercase">
                                <span className="flex items-center gap-1"><ArrowRight size={14} className="rotate-[-45deg]"/> Exit</span>
                                <span className="flex items-center gap-1">Exit <ArrowRight size={14} className="rotate-[-135deg]"/></span>
                             </div>

                             {/* Rows 30-40 (Rear Economy Free) */}
                             {Array.from({length: 11}).map((_, i) => renderRow(i + 30, false, false))}
                         </div>

                         {/* Rear Service Area */}
                         <div className="flex justify-between mt-8 px-2">
                            <div className="w-8 h-8 border-2 border-gray-300 rounded flex items-center justify-center font-bold text-gray-400 bg-gray-50" title="Lavatory">L</div>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 border-2 border-gray-300 rounded flex items-center justify-center font-bold text-gray-400 bg-gray-50" title="Lavatory">L</div>
                                <div className="w-8 h-8 border-2 border-gray-300 rounded flex items-center justify-center font-bold text-gray-400 bg-gray-50" title="Galley">G</div>
                            </div>
                         </div>
                    </div>
                </div>

                <button disabled={selectedSeats.length !== reqSeats} onClick={handleFlightSeatsSubmit} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex justify-center gap-2 shadow-lg text-lg sticky bottom-0 z-20">
                    Confirm Selection {selectedSeats.length > 0 && `(${selectedSeats.join(', ')})`}
                </button>
            </div>
        );
    };

    const renderFlightAddons = () => (
        <div className="space-y-4 animate-in slide-in-from-right-4">
             <h3 className="font-bold text-gray-800">Add-ons</h3>
             <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Utensils size={14}/> Select Meals
                </h4>
                <div className="flex gap-2">
                    <button type="button" 
                        onClick={() => setAddOns({...addOns, meal: addOns.meal === 'Veg' ? null : 'Veg'})}
                        className={`flex-1 h-10 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 ${addOns.meal === 'Veg' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-600'}`}
                    >
                        <span className={`w-3 h-3 rounded-full border border-current ${addOns.meal === 'Veg' ? 'bg-green-600' : 'bg-transparent'}`}></span>
                        Veg (₹399)
                    </button>
                    <button type="button" 
                        onClick={() => setAddOns({...addOns, meal: addOns.meal === 'Non-Veg' ? null : 'Non-Veg'})}
                        className={`flex-1 h-10 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 ${addOns.meal === 'Non-Veg' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-600'}`}
                    >
                        <span className={`w-3 h-3 rounded-full border border-current ${addOns.meal === 'Non-Veg' ? 'bg-red-600' : 'bg-transparent'}`}></span>
                        Non-Veg (₹499)
                    </button>
                </div>

                <div className="border-t border-gray-200 my-2 pt-2">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                        <Luggage size={14}/> Extra Baggage (₹250 per 5kg)
                    </h4>
                    <select 
                        className="w-full border border-gray-300 rounded px-3 h-10 text-sm bg-white"
                        value={addOns.baggage} 
                        onChange={e => setAddOns({...addOns, baggage: Number(e.target.value) as 0|5|10|15})}
                    >
                        <option value={0}>No Extra Baggage</option>
                        <option value={5}>+ 5kg (₹250)</option>
                        <option value={10}>+ 10kg (₹500)</option>
                        <option value={15}>+ 15kg (₹750)</option>
                    </select>
                </div>
            </div>
            <button onClick={handleFlightAddonsSubmit} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
                Proceed to Payment
            </button>
        </div>
    );

    const renderHolidayCustomization = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4">
            <h3 className="font-bold text-gray-800">Customize Package</h3>
            
            {/* Itinerary & Inclusions Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1">
                    <Map size={14}/> Itinerary & Inclusions
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Package:</strong> {selectedItem?.provider}</p>
                    <p><strong>Duration:</strong> {selectedItem?.desc}</p>
                    <div className="pt-2 border-t border-blue-100">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Selected Experiences:</p>
                        {holidayParams.activities.length > 0 ? (
                            <ul className="list-disc pl-4 text-xs">
                                {holidayParams.activities.map(actId => (
                                    <li key={actId}>{ACTIVITIES.find(a => a.id === actId)?.label}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No extra activities selected.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Activities */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Day-wise Activities</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {ACTIVITIES.map(act => {
                        const selected = holidayParams.activities.length > 0 && holidayParams.activities.includes(act.id);
                        return (
                            <button key={act.id} 
                                onClick={() => {
                                    setHolidayParams(prev => ({
                                        ...prev,
                                        activities: selected ? prev.activities.filter(a => a !== act.id) : [...prev.activities, act.id]
                                    }))
                                }}
                                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold border transition ${selected ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                <act.icon size={14}/> 
                                <span className="flex-1 text-left">{act.label}</span>
                                {selected && <CheckCircle size={12} className="text-teal-600"/>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Transport */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Mode of Transport ({searchParams.from} ➝ {searchParams.to})</h4>
                <div className="flex gap-2">
                    {['Flight', 'Train', 'Bus', 'Cab'].map(mode => {
                        const isSelected = holidayParams.transport.includes(mode);
                        return (
                            <button key={mode}
                                onClick={() => {
                                    setHolidayParams(prev => ({
                                        ...prev,
                                        transport: isSelected 
                                            ? prev.transport.filter(t => t !== mode)
                                            : [...prev.transport, mode]
                                    }))
                                }}
                                className={`flex-1 py-2 text-xs font-bold rounded border ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                            >
                                {mode}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Hotel Selection */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Select Hotel Category</h4>
                <div className="flex gap-2">
                    {['3 Star', '4 Star', '5 Star'].map(star => {
                        const isSelected = holidayParams.hotelType === star;
                        return (
                            <button key={star}
                                onClick={() => setHolidayParams({...holidayParams, hotelType: star})}
                                className={`flex-1 py-2 text-xs font-bold rounded border flex items-center justify-center gap-1 ${isSelected ? 'bg-yellow-100 text-yellow-700 border-yellow-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                            >
                                {star} {isSelected && <Star size={12} fill="currentColor" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Meal Plan */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Meal Plan</h4>
                <select 
                    className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white"
                    value={holidayParams.mealPlan}
                    onChange={e => setHolidayParams({...holidayParams, mealPlan: e.target.value})}
                >
                    <option value="Breakfast">Breakfast Only</option>
                    <option value="Breakfast + Lunch">Breakfast + Lunch</option>
                    <option value="Breakfast + Dinner">Breakfast + Dinner</option>
                    <option value="All Meals">All Meals (Breakfast + Lunch + Dinner)</option>
                </select>
            </div>

            <button onClick={handleHolidayCustomizeSubmit} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
                Continue to Traveler Details
            </button>
        </div>
    );

    const renderDetailsForm = () => (
        <form onSubmit={handleDetailsSubmit} className="space-y-6 animate-in slide-in-from-right-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            
            {passengers.map((p, index) => {
                const validationError = validatePassenger(p);

                return (
                    <div key={index} className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-800">
                                {isHotel ? 'Guest Details' : `Passenger ${index + 1}`} 
                                {isBus && ` (Seat: ${selectedSeats[index]})`}
                            </h3>
                            
                            {/* Passenger Type Selector for Flight/Train/Holiday */}
                            {!isHotel && !isBus && (
                                <select 
                                    className="bg-white border rounded px-2 py-1 text-xs font-medium text-gray-700"
                                    value={p.type} 
                                    onChange={e => {
                                        const newP=[...passengers]; 
                                        newP[index].type=e.target.value; 
                                        setPassengers(newP)
                                    }}
                                >
                                    <option value="Adult">Adult</option>
                                    <option value="Child">Child</option>
                                    <option value="Senior">Senior</option>
                                </select>
                            )}
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            {/* Row 1: Title, First Name, Last Name */}
                            <div className="flex gap-4">
                                <div className="w-24">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Title</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                                        value={p.title || 'Mr'} 
                                        onChange={e => {const newP=[...passengers]; newP[index].title=e.target.value; setPassengers(newP)}}
                                    >
                                        <option value="Mr">Mr</option>
                                        <option value="Mrs">Mrs</option>
                                        <option value="Ms">Ms</option>
                                        <option value="Mstr">Mstr</option>
                                        <option value="Miss">Miss</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">First Name</label>
                                    <input 
                                        required 
                                        type="text"
                                        className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" 
                                        value={p.firstName} 
                                        onChange={e => {const newP=[...passengers]; newP[index].firstName=e.target.value; setPassengers(newP)}} 
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Last Name</label>
                                    <input 
                                        required 
                                        type="text"
                                        className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" 
                                        value={p.lastName} 
                                        onChange={e => {const newP=[...passengers]; newP[index].lastName=e.target.value; setPassengers(newP)}} 
                                    />
                                </div>
                            </div>
                            
                            {!isHotel && (
                                <div className="flex gap-4">
                                    {/* Date of Birth */}
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Date of Birth</label>
                                        <input 
                                            required 
                                            type="date" 
                                            className={`w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white ${validationError ? 'border-red-500 bg-red-50' : ''}`}
                                            value={p.dob || ''} 
                                            onChange={e => {const newP=[...passengers]; newP[index].dob=e.target.value; setPassengers(newP)}} 
                                        />
                                    </div>

                                    {/* Gender */}
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Gender</label>
                                        <select 
                                            className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" 
                                            value={p.gender} 
                                            onChange={e => {const newP=[...passengers]; newP[index].gender=e.target.value; setPassengers(newP)}}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            
                            {/* ID Proof - Full Width */}
                            {(isTrain || isFlight || isHotel || isHoliday) && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{isTrain ? "Aadhaar/PAN Number" : "ID Number"}</label>
                                    <input 
                                        className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" 
                                        value={p.idProof} 
                                        onChange={e => {const newP=[...passengers]; newP[index].idProof=e.target.value; setPassengers(newP)}} 
                                    />
                                </div>
                            )}
                            
                            {validationError && <p className="text-xs text-red-600 font-bold">{validationError}</p>}

                            {isTrain && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Berth Preference</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" 
                                        value={p.berth} 
                                        onChange={e => {const newP=[...passengers]; newP[index].berth=e.target.value; setPassengers(newP)}}
                                    >
                                        <option value="">No Preference</option>
                                        <option value="LB">Lower Berth</option>
                                        <option value="MB">Middle Berth</option>
                                        <option value="UB">Upper Berth</option>
                                        <option value="SL">Side Lower</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Contact Details Section */}
            <div className="space-y-2 mt-6">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1">Contact Details</h3>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mobile Number</label>
                        <input 
                            required 
                            type="text" 
                            maxLength={10} 
                            placeholder="Enter 10-digit number" 
                            className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                            value={contactInfo.mobile} 
                            onChange={e => setContactInfo({...contactInfo, mobile: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email ID</label>
                        <input 
                            required 
                            type="email" 
                            placeholder="Enter email address" 
                            className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                            value={contactInfo.email} 
                            onChange={e => setContactInfo({...contactInfo, email: e.target.value})} 
                        />
                    </div>
                </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 shadow-lg mt-4 text-base">
                {isFlight ? "Continue to Seat Selection" : "Proceed to Payment"}
            </button>
        </form>
    );

    return (
        <div>
            {step === 1 && (
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {isHotel ? (
                            <>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">CITY / HOTEL</label>
                                    <div className="flex items-center border border-gray-300 rounded px-3 h-10 bg-white">
                                        <MapPin size={16} className="mr-2 text-gray-400"/>
                                        <input type="text" placeholder="Mumbai" className="w-full outline-none text-sm text-gray-800" 
                                            value={searchParams.city} onChange={e => setSearchParams({...searchParams,city: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">CHECK-IN</label>
                                    <div className="flex items-center border border-gray-300 rounded px-3 h-10 bg-white">
                                        <Calendar size={16} className="mr-2 text-gray-400"/>
                                        <input type="date" className="w-full outline-none text-sm text-gray-800" 
                                            value={searchParams.date} onChange={e => setSearchParams({...searchParams, date: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">CHECK-OUT</label>
                                    <div className="flex items-center border border-gray-300 rounded px-3 h-10 bg-white">
                                        <Calendar size={16} className="mr-2 text-gray-400"/>
                                        <input type="date" className="w-full outline-none text-sm text-gray-800" 
                                            value={searchParams.returnDate} onChange={e => setSearchParams({...searchParams, returnDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">GUESTS</label>
                                    <input type="number" className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500" value={searchParams.guests} onChange={e => setSearchParams({...searchParams, guests: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">ROOMS</label>
                                    <input type="number" className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500" value={searchParams.rooms} onChange={e => setSearchParams({...searchParams, rooms: e.target.value})} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="col-span-2 flex gap-4 text-sm font-semibold text-gray-600 mb-1">
                                    {isFlight && (
                                        <>
                                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="trip" checked={searchParams.tripType==='ONEWAY'} onChange={()=>setSearchParams({...searchParams, tripType:'ONEWAY'})}/> One Way</label>
                                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="trip" checked={searchParams.tripType==='ROUND'} onChange={()=>setSearchParams({...searchParams, tripType:'ROUND'})}/> Round Trip</label>
                                        </>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">{isHoliday ? "FROM (City)" : "FROM"}</label>
                                    <div className="flex items-center border border-gray-300 rounded px-3 h-10 bg-white">
                                        <MapPin size={16} className="mr-2 text-gray-400"/>
                                        <input type="text" placeholder={isTrain ? "Station" : isFlight ? "Airport" : isHoliday ? "Departure City" : "City"} className="w-full outline-none text-sm text-gray-800" 
                                            value={searchParams.from} onChange={e => setSearchParams({...searchParams, from: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">{isHoliday ? "TO (Destination)" : "TO"}</label>
                                    <div className="flex items-center border border-gray-300 rounded px-3 h-10 bg-white">
                                        <MapPin size={16} className="mr-2 text-gray-400"/>
                                        <input type="text" placeholder={isTrain ? "Station" : isFlight ? "Airport" : isHoliday ? "Goa, Manali..." : "City"} className="w-full outline-none text-sm text-gray-800" 
                                            value={searchParams.to} onChange={e => setSearchParams({...searchParams, to: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">{isHoliday ? "TRAVEL DATE" : "DATE"}</label>
                                    <div className="flex items-center border border-gray-300 rounded px-3 h-10 bg-white">
                                        <Calendar size={16} className="mr-2 text-gray-400"/>
                                        <input type="date" className="w-full outline-none text-sm text-gray-800" value={searchParams.date} onChange={e => setSearchParams({...searchParams, date: e.target.value})}/>
                                    </div>
                                </div>
                                {isHoliday && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">RETURN DATE</label>
                                        <div className="flex items-center border border-gray-300 rounded px-3 h-10 bg-white">
                                            <Calendar size={16} className="mr-2 text-gray-400"/>
                                            <input type="date" className="w-full outline-none text-sm text-gray-800" value={searchParams.returnDate} onChange={e => setSearchParams({...searchParams, returnDate: e.target.value})}/>
                                        </div>
                                    </div>
                                )}
                                {isTrain && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">CLASS</label>
                                            <select className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500" value={searchParams.class} onChange={e=>setSearchParams({...searchParams, class:e.target.value})}>
                                                <option value="SL">Sleeper (SL)</option>
                                                <option value="3A">AC 3 Tier (3A)</option>
                                                <option value="2A">AC 2 Tier (2A)</option>
                                                <option value="1A">AC First (1A)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">QUOTA</label>
                                            <select className="w-full border border-gray-300 rounded px-3 h-10 text-sm text-gray-800 outline-none focus:border-blue-500" value={searchParams.quota} onChange={e=>setSearchParams({...searchParams, quota:e.target.value})}>
                                                <option value="GENERAL">General</option>
                                                <option value="TATKAL">Tatkal</option>
                                                <option value="LADIES">Ladies</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {(isFlight || isHoliday) && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">PASSENGERS</label>
                                        <div className="flex items-center justify-between border border-gray-300 rounded px-3 h-10 bg-white w-32">
                                            <button type="button" onClick={() => updateGuests(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-50" disabled={parseInt(searchParams.guests) <= 1}><Minus size={14}/></button>
                                            <span className="font-bold text-gray-800 text-sm">{searchParams.guests}</span>
                                            <button type="button" onClick={() => updateGuests(1)} className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-50" disabled={parseInt(searchParams.guests) >= 9}><Plus size={14}/></button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center">
                         {loading ? <Loader2 className="animate-spin"/> : `Search ${type}s`}
                    </button>
                </form>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">Results for <span className="font-bold">{isHotel ? searchParams.city : isHoliday ? searchParams.to : `${searchParams.from} to ${searchParams.to}`}</span></p>
                        <button onClick={() => setStep(1)} className="text-xs text-blue-600 hover:underline">Change</button>
                    </div>
                    {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600"/> Fetching Options...</div> : (
                        getData().map(item => (
                            <div key={item.id} className="bg-white border border-gray-200 p-6 flex flex-col md:flex-row gap-6 rounded-xl shadow-sm hover:shadow-md transition justify-between items-center group">
                                {isFlight ? (
                                    <>
                                        {/* Airline Info */}
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${item.provider === 'IndiGo' ? 'bg-blue-100 text-blue-700' : item.provider === 'Air India' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {item.provider.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900">{item.provider}</h4>
                                                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded font-medium">{(item as any).code}</span>
                                            </div>
                                        </div>

                                        {/* Timing */}
                                        <div className="text-center w-full md:w-auto flex-1 px-4">
                                            <div className="text-xl font-bold text-gray-800">{item.desc.split('-')[0].trim()}</div>
                                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 my-1">
                                                <div className="h-[1px] bg-gray-300 w-12"></div>
                                                <Plane size={14} className="text-gray-400 transform rotate-90 md:rotate-0" />
                                                <div className="h-[1px] bg-gray-300 w-12"></div>
                                            </div>
                                            <div className="text-xl font-bold text-gray-800">{item.desc.split('-')[1]?.trim()}</div>
                                            <div className="text-xs text-gray-500 mt-1 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded">{(item as any).type}</div>
                                        </div>
                                    </>
                                ) : (
                                    // Unified Professional Card for Bus, Train, Hotel, Holiday
                                    <>
                                        {/* Info Section */}
                                        <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${isBus ? 'bg-red-100 text-red-600' : isTrain ? 'bg-orange-100 text-orange-600' : isHoliday ? 'bg-teal-100 text-teal-600' : 'bg-purple-100 text-purple-600'}`}>
                                                {isBus ? <Bus size={20}/> : isTrain ? <Train size={20}/> : isHoliday ? <Palmtree size={20}/> : <Hotel size={20}/>}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900">{item.provider}</h4>
                                                {isTrain && <span className="bg-orange-50 text-orange-600 text-xs px-2 py-0.5 rounded font-medium">{(item as any).type}</span>}
                                                
                                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                                    {isHotel || isHoliday ? <MapPin size={14}/> : <Clock size={14}/>} 
                                                    <span className="font-medium">{item.desc}</span>
                                                </div>
                                                {isBus && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 mt-1 inline-block">{(item as any).type}</span>}
                                                {isHotel && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded ml-2 font-bold">{(item as any).type}</span>}
                                                {isHoliday && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded ml-2 font-bold">{(item as any).type}</span>}
                                                
                                                {/* Holiday Package Benefits Display */}
                                                {isHoliday && (item as any).benefits && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {(item as any).benefits.map((ben: string, i: number) => (
                                                            <span key={i} className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                                <CheckCircle size={8} /> {ben}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Price & Action */}
                                <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end gap-2 shrink-0">
                                    <div className="text-2xl font-bold text-blue-900">₹{item.price.toLocaleString()}</div>
                                    <button 
                                        onClick={() => initiateBook(item)} 
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        Book
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* BUS: Seats (1) */}
            {step === 3 && isBus && subStep === 1 && renderBusSeats()}

            {/* HOLIDAY: Customize (1) */}
            {step === 3 && isHoliday && subStep === 1 && renderHolidayCustomization()}

            {/* FLIGHT: Details (1) -> Seats (2) -> Addons (3) */}
            {step === 3 && isFlight && (
                <>
                    {subStep === 1 && renderDetailsForm()}
                    {subStep === 2 && renderFlightSeats()}
                    {subStep === 3 && renderFlightAddons()}
                </>
            )}

            {/* TRAIN/HOTEL: Details (1) */}
            {step === 3 && (isTrain || isHotel) && subStep === 1 && renderDetailsForm()}
            
            {/* BUS: Details (2) */}
            {step === 3 && isBus && subStep === 2 && renderDetailsForm()}

            {/* HOLIDAY: Details (2) */}
            {step === 3 && isHoliday && subStep === 2 && renderDetailsForm()}

            {/* FINAL CONFIRMATION */}
            {step === 3 && (
                (isFlight && subStep === 4) ||
                (isBus && subStep === 3) ||
                (isHoliday && subStep === 3) ||
                ((isTrain || isHotel) && subStep === 2)
            ) && selectedItem && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                    <h3 className="font-bold text-gray-800">Confirm Booking</h3>
                    <div className="bg-blue-50 p-3 rounded border border-blue-100 mb-4">
                        <p className="text-sm text-gray-700">{isHotel ? 'Hotel' : 'Operator'}: <strong>{selectedItem.provider}</strong></p>
                        {!isHotel && !isHoliday && <p className="text-sm text-gray-700">Route: <strong>{searchParams.from} - {searchParams.to}</strong></p>}
                        <p className="text-sm text-gray-700">{isHotel ? 'Location' : 'Time/Duration'}: <strong>{selectedItem.desc}</strong></p>
                        
                        {(isBus || isFlight) && <p className="text-sm text-gray-700">Seats: <strong>{selectedSeats.join(', ')}</strong></p>}
                        {isTrain && <p className="text-sm text-gray-700">Class: <strong>{searchParams.class}</strong> ({searchParams.quota})</p>}
                        {isFlight && <p className="text-sm text-gray-700">Flight: <strong>{selectedItem.code}</strong></p>}
                        {isHotel && <p className="text-sm text-gray-700">Rooms: <strong>{searchParams.rooms}</strong> | Guests: <strong>{searchParams.guests}</strong></p>}
                        
                        {/* Holiday Specifics */}
                        {isHoliday && (
                            <>
                                <p className="text-sm text-gray-700">Dates: <strong>{searchParams.date} to {searchParams.returnDate}</strong></p>
                                <p className="text-sm text-gray-700">Transport: <strong>{holidayParams.transport.join(', ')}</strong></p>
                                <p className="text-sm text-gray-700">Hotel Category: <strong>{holidayParams.hotelType}</strong></p>
                                <p className="text-sm text-gray-700">Meal Plan: <strong>{holidayParams.mealPlan}</strong></p>
                                {holidayParams.activities.length > 0 && <p className="text-sm text-gray-700">Activities: <strong>{holidayParams.activities.length} selected</strong></p>}
                            </>
                        )}

                        {passengers.length > 0 && <p className="text-sm text-gray-700 mt-2 border-t border-blue-200 pt-2">Passenger: <strong>{passengers[0].firstName} {passengers[0].lastName}</strong> ({passengers[0].type || 'Adult'}) {passengers.length > 1 && `+ ${passengers.length - 1} others`}</p>}
                        {isFlight && addOns.meal && <p className="text-sm text-gray-700">Meal: <strong>{addOns.meal}</strong></p>}
                        {isFlight && addOns.baggage > 0 && <p className="text-sm text-gray-700">Extra Baggage: <strong>+{addOns.baggage}kg</strong></p>}
                    </div>

                    {isHoliday && (
                        <div className="bg-white border-2 border-blue-100 p-4 rounded-xl mb-4 flex justify-between items-center shadow-sm">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Package Cost</label>
                                <p className="text-xs text-gray-400">Click amount to edit</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xl font-bold text-gray-600">₹</span>
                                <input 
                                    type="number" 
                                    value={customHolidayPrice !== null && !isNaN(customHolidayPrice) ? customHolidayPrice : ''}
                                    placeholder={getHolidayCalculatedPrice().toString()}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setCustomHolidayPrice(isNaN(val) ? NaN : val);
                                    }}
                                    className="w-32 text-2xl font-bold text-blue-700 text-right border-b-2 border-dashed border-blue-300 focus:border-blue-600 outline-none bg-transparent"
                                />
                            </div>
                        </div>
                    )}
                    
                    {!isHoliday && (
                        <PaymentSummary amount={
                            (isBus && selectedSeats.length > 0) ? selectedItem.price * selectedSeats.length : 
                            (isHotel ? selectedItem.price * parseInt(searchParams.rooms) : selectedItem.price * passengers.length) + 
                            (isFlight ? ( (addOns.meal==='Veg'?399:addOns.meal==='Non-Veg'?499:0) + ((addOns.baggage/5)*250) + (selectedSeats.reduce((acc, s) => {
                                const match = s.match(/^(\d+)/);
                                const row = match ? parseInt(match[1]) : 0;
                                return acc + (row <= 7 ? 500 : (row >= 10 && row <= 26) ? 250 : 0);
                            }, 0) / passengers.length) ) * passengers.length : 0)
                        } />
                    )}
                    
                    {isHoliday && (
                        <PaymentSummary amount={customHolidayPrice !== null && !isNaN(customHolidayPrice) ? customHolidayPrice : getHolidayCalculatedPrice()} />
                    )}

                    <div className="flex gap-3">
                        <button onClick={() => setSubStep(prev => prev - 1)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold">Back</button>
                        <button onClick={handleBook} disabled={loading} className="flex-[2] bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : 'Confirm & Pay'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ServiceModal: React.FC<ServiceModalProps> = ({ service, onClose, userUid, currentBalance }) => {
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    if (service) {
        setSuccessData(null);
    }
  }, [service]);

  if (!service) return null;

  const processPayment = async (amount: number): Promise<boolean> => {
    if (currentBalance < amount) {
        alert("Insufficient Wallet Balance! Please add money to wallet.");
        return false;
    }

    try {
        const balanceRef = ref(db, `users/${userUid}/balance`);
        await runTransaction(balanceRef, (current) => {
            if (current === null) return current;
            if (current < amount) throw new Error("Insufficient funds");
            return current - amount;
        });

        // 0.5% Commission Logic
        const commRef = ref(db, `users/${userUid}/commission`);
        await runTransaction(commRef, (current) => {
            return (current || 0) + (amount * 0.005);
        });

        return true;
    } catch (error: any) {
        console.error("Payment Failed", error);
        alert(error.message || "Transaction failed");
        return false;
    }
  };

  const handleSuccess = (data: any) => {
      setSuccessData(data);
  };

  const getHeaderColor = () => {
    return 'bg-blue-700'; // Updated to fixed Blue as requested previously
  };

  const renderContent = () => {
      if (successData) {
          return <Receipt data={successData} onDownload={() => alert("Receipt Downloaded!")} />;
      }

      switch (service.category) {
          case 'BANKING':
              if (service.id === 'cc') return <CreditCardFlow onSuccess={handleSuccess} processPayment={processPayment} />;
              if (service.id === 'dmt') return <MoneyTransferFlow onSuccess={handleSuccess} processPayment={processPayment} />;
              if (service.id === 'aeps') return <AepsFlow onSuccess={handleSuccess} />;
              if (service.id === 'matm') return <MicroAtmFlow onSuccess={handleSuccess} processPayment={processPayment} userUid={userUid} />;
              return <div className="p-8 text-center text-gray-500">Service Coming Soon</div>;
          
          case 'BBPS':
              if (service.id === 'mob') return <MobileDthRecharge type="mobile" onSuccess={handleSuccess} processPayment={processPayment} />;
              if (service.id === 'dth') return <MobileDthRecharge type="dth" onSuccess={handleSuccess} processPayment={processPayment} />;
              if (service.id === 'subscription') return <SubscriptionFlow onSuccess={handleSuccess} processPayment={processPayment} />;
              return <BillPaymentFlow service={service} onSuccess={handleSuccess} processPayment={processPayment} />;

          case 'TRAVEL':
              if (service.id === 'flight') return <TravelFlow type="FLIGHT" onSuccess={handleSuccess} processPayment={processPayment} />;
              if (service.id === 'bus') return <TravelFlow type="BUS" onSuccess={handleSuccess} processPayment={processPayment} />;
              if (service.id === 'train') return <TravelFlow type="TRAIN" onSuccess={handleSuccess} processPayment={processPayment} />;
              if (service.id === 'hotel') return <TravelFlow type="HOTEL" onSuccess={handleSuccess} processPayment={processPayment} />;
              if (service.id === 'holiday') return <TravelFlow type="HOLIDAY" onSuccess={handleSuccess} processPayment={processPayment} />;
              return <div className="p-8 text-center text-gray-500">Service Coming Soon</div>;

          default:
              return <div className="p-8 text-center text-gray-500">Service Coming Soon</div>;
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-white w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 ${service.category === 'TRAVEL' ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className={`px-6 py-4 flex justify-between items-center text-white ${getHeaderColor()}`}>
           <div className="flex items-center gap-3">
               <div className="bg-white/20 p-2 rounded-full">
                   <service.icon size={20} className="text-white" />
               </div>
               <h2 className="text-lg font-bold">{service.title}</h2>
           </div>
           <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
               <X size={24} />
           </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;