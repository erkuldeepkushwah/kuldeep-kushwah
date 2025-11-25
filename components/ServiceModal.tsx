import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, Smartphone, Fingerprint, Plane, CreditCard, Search, Calendar, User, MapPin, Download, Wallet, Landmark, QrCode, AlertTriangle, PlayCircle, Info } from 'lucide-react';
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

const MOCK_FLIGHTS = [
  { id: 1, airline: 'IndiGo', time: '10:00 AM - 12:30 PM', price: 4500 },
  { id: 2, airline: 'Air India', time: '02:00 PM - 05:15 PM', price: 5200 },
  { id: 3, airline: 'Vistara', time: '06:00 PM - 08:30 PM', price: 6100 },
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
            <select required className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setOperator(e.target.value)}>
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
              className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
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

// AEPS is slightly different as it usually credits money or is non-transactional in terms of deduction, so we keep it simulated for now but without cost deduction
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

const BillPaymentFlow = ({ category, onSuccess, processPayment }: { category: string } & FlowProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState({ consumerId: '', amount: '850.00', billerName: '' });
  const [selectedState, setSelectedState] = useState('');

  const handleFetchBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.billerName) {
        alert("Please select a biller");
        return;
    }
    setLoading(true);
    // Simulate Fetching
    setTimeout(() => { setLoading(false); setStep(2); }, 1500);
  };

  const handlePay = async () => {
    setLoading(true);
    const amountNum = parseFloat(details.amount);
    const charge = amountNum * SERVICE_CHARGE_PERCENT;
    const total = amountNum + charge;

    const success = await processPayment(total);
    if (success) {
        onSuccess({
            Service: category,
            Biller: details.billerName,
            ConsumerID: details.consumerId,
            BaseAmount: `₹${details.amount}`,
            ServiceCharge: `₹${charge.toFixed(2)}`,
            TotalPaid: `₹${total.toFixed(2)}`,
            Status: 'Paid'
        });
    }
    setLoading(false);
  };

  const billerConfig = BILLER_DATA[category];
  const isGrouped = billerConfig?.type === 'grouped';

  return (
    <div>
        {step === 1 ? (
            <form onSubmit={handleFetchBill} className="space-y-4">
                {isGrouped && (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select State</label>
                      <select 
                          className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => {
                              setSelectedState(e.target.value);
                              setDetails({...details, billerName: ''});
                          }}
                          value={selectedState}
                          required
                      >
                         <option value="">-- Select State --</option>
                         {Object.keys(billerConfig.groups).map(state => (
                             <option key={state} value={state}>{state}</option>
                         ))}
                      </select>
                  </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Biller</label>
                    <select 
                        className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setDetails({...details, billerName: e.target.value})}
                        value={details.billerName}
                        required
                        disabled={isGrouped && !selectedState}
                    >
                       <option value="">-- Select Biller --</option>
                       {isGrouped && selectedState ? (
                           billerConfig.groups[selectedState].map((opt: string) => (
                               <option key={opt} value={opt}>{opt}</option>
                           ))
                       ) : !isGrouped && billerConfig?.type === 'simple' ? (
                           billerConfig.options.map((opt: string) => (
                               <option key={opt} value={opt}>{opt}</option>
                           ))
                       ) : !isGrouped && !billerConfig ? (
                           <>
                              <option value="Provider A">Provider A</option>
                              <option value="Provider B">Provider B</option>
                              <option value="Provider C">Provider C</option>
                           </>
                       ) : null}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {category === 'FASTAG' ? 'Vehicle Number' : 'Consumer Number / CA Number'}
                    </label>
                    <input 
                        required
                        type="text" 
                        placeholder={category === 'FASTAG' ? 'MH01AB1234' : 'Enter Consumer Number'}
                        className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={e => setDetails({...details, consumerId: e.target.value})}
                    />
                </div>
                <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex justify-center">
                    {loading ? <Loader2 className="animate-spin" /> : 'Fetch Bill Details'}
                </button>
            </form>
        ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Bill Details Found</p>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Biller</span>
                        <span className="font-semibold">{details.billerName}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Name</span>
                        <span className="font-semibold">Rajesh Kumar</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Bill Date</span>
                        <span className="font-semibold">01 Oct 2023</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                        <span className="text-gray-800 font-bold">Bill Amount</span>
                        <span className="text-xl font-bold text-blue-700">₹{details.amount}</span>
                    </div>
                 </div>
                 
                 <PaymentSummary amount={parseFloat(details.amount)} />

                 <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold">Back</button>
                    <button onClick={handlePay} disabled={loading} className="flex-[2] bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : 'Confirm & Pay'}
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
    
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => { setLoading(false); setStep(2); }, 1500);
    };

    const initiateBook = (item: any) => {
        setSelectedItem(item);
        setStep(3);
    };

    const handleBook = async () => {
        if (!selectedItem) return;
        setLoading(true);
        const charge = selectedItem.price * SERVICE_CHARGE_PERCENT;
        const total = selectedItem.price + charge;

        const success = await processPayment(total);
        if (success) {
            onSuccess({
                Service: `${type} Booking`,
                Provider: selectedItem.airline,
                Route: 'DEL - BOM',
                Time: selectedItem.time,
                BaseAmount: `₹${selectedItem.price}`,
                ServiceCharge: `₹${charge.toFixed(2)}`,
                TotalPaid: `₹${total.toFixed(2)}`,
                PNR: 'PNR' + Math.floor(1000 + Math.random() * 9000)
            });
        }
        setLoading(false);
    };

    return (
        <div>
            {step === 1 && (
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">FROM</label>
                            <div className="flex items-center border rounded-lg p-3">
                                <MapPin size={16} className="mr-2 text-gray-400"/>
                                <input type="text" placeholder="Delhi" className="w-full outline-none" defaultValue="Delhi" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">TO</label>
                            <div className="flex items-center border rounded-lg p-3">
                                <MapPin size={16} className="mr-2 text-gray-400"/>
                                <input type="text" placeholder="Mumbai" className="w-full outline-none" defaultValue="Mumbai" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">DATE</label>
                        <div className="flex items-center border rounded-lg p-3">
                            <Calendar size={16} className="mr-2 text-gray-400"/>
                            <input type="date" className="w-full outline-none" />
                        </div>
                    </div>
                    <button disabled={loading} className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 flex justify-center">
                         {loading ? <Loader2 className="animate-spin"/> : 'Search Available Options'}
                    </button>
                </form>
            )}

            {step === 2 && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">Results for <span className="font-bold">Delhi to Mumbai</span></p>
                        <button onClick={() => setStep(1)} className="text-xs text-blue-600 hover:underline">Change</button>
                    </div>
                    {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-orange-600"/> Booking Ticket...</div> : (
                        MOCK_FLIGHTS.map(f => (
                            <div key={f.id} className="border p-4 rounded-lg flex justify-between items-center shadow-sm hover:shadow-md transition">
                                <div>
                                    <div className="font-bold text-gray-800">{f.airline}</div>
                                    <div className="text-xs text-gray-500">{f.time}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-blue-900">₹{f.price}</div>
                                    <button onClick={() => initiateBook(f)} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded mt-1 font-semibold hover:bg-orange-200">
                                        Book
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {step === 3 && selectedItem && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                    <h3 className="font-bold text-gray-800">Confirm Booking</h3>
                    <div className="bg-orange-50 p-3 rounded border border-orange-100 mb-4">
                        <p className="text-sm text-gray-700">Airline: <strong>{selectedItem.airline}</strong></p>
                        <p className="text-sm text-gray-700">Route: <strong>DEL - BOM</strong></p>
                        <p className="text-sm text-gray-700">Time: <strong>{selectedItem.time}</strong></p>
                    </div>

                    <PaymentSummary amount={selectedItem.price} />

                    <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold">Back</button>
                        <button onClick={handleBook} disabled={loading} className="flex-[2] bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : 'Confirm Booking'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DMTFlow = ({ onSuccess, processPayment }: FlowProps) => {
    const [step, setStep] = useState(0); // 0: Select Type, 1: Details, 2: Amount/Pay
    const [transferType, setTransferType] = useState<'BANK' | 'MOBILE' | 'UPI'>('BANK');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        accountNo: '',
        ifsc: '',
        mobile: '',
        upiId: '',
        amount: ''
    });
    const [verifiedName, setVerifiedName] = useState('');

    const handleTypeSelect = (type: 'BANK' | 'MOBILE' | 'UPI') => {
        setTransferType(type);
        setStep(1);
        setFormData(prev => ({ ...prev, name: '', accountNo: '', ifsc: '', mobile: '', upiId: '', amount: '' }));
        setVerifiedName('');
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate verification delay
        setTimeout(() => {
            setLoading(false);
            setVerifiedName(formData.name || 'Rahul Sharma'); // Use entered name or mock name
            setStep(2);
        }, 1500);
    };

    const handlePay = async () => {
        setLoading(true);
        const amountNum = parseFloat(formData.amount);
        const charge = amountNum * SERVICE_CHARGE_PERCENT;
        const total = amountNum + charge;

        const success = await processPayment(total);
        
        if (success) {
            const commonData = {
                Service: 'Money Transfer',
                Type: transferType === 'BANK' ? 'Bank Transfer' : (transferType === 'MOBILE' ? 'Mobile Transfer' : 'UPI Transfer'),
                Amount: `₹${parseFloat(formData.amount).toFixed(2)}`,
                ServiceCharge: `₹${charge.toFixed(2)}`,
                TotalPaid: `₹${total.toFixed(2)}`,
                PaymentMode: 'Wallet',
                Status: 'Success',
            };

            let specificData = {};
            if (transferType === 'BANK') {
                specificData = {
                    Beneficiary: verifiedName,
                    Account: `XXXX${formData.accountNo.slice(-4)}`,
                    IFSC: formData.ifsc,
                    BankRefNo: 'REF' + Math.floor(Math.random() * 100000000)
                };
            } else if (transferType === 'MOBILE') {
                specificData = {
                    Mobile: formData.mobile,
                    Beneficiary: verifiedName,
                    UPIRefID: 'UPI' + Math.floor(Math.random() * 100000000)
                };
            } else {
                specificData = {
                    UPI_ID: formData.upiId,
                    Beneficiary: verifiedName,
                    UPIRefID: 'UPI' + Math.floor(Math.random() * 100000000)
                };
            }

            onSuccess({ ...commonData, ...specificData });
        }
        setLoading(false);
    };

    return (
        <div>
            {/* Step 0: Select Type */}
            {step === 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 text-center mb-4">Select Transfer Method</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <button 
                            onClick={() => handleTypeSelect('BANK')}
                            className="flex items-center p-4 border rounded-xl hover:bg-blue-50 hover:border-blue-500 transition group"
                        >
                            <div className="bg-blue-100 p-3 rounded-full mr-4 group-hover:bg-blue-200">
                                <Landmark className="text-blue-600" size={24} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-gray-800">Bank Account Transfer</div>
                                <div className="text-xs text-gray-500">Send to any Bank Account via IMPS/NEFT</div>
                            </div>
                        </button>

                        <button 
                            onClick={() => handleTypeSelect('MOBILE')}
                            className="flex items-center p-4 border rounded-xl hover:bg-purple-50 hover:border-purple-500 transition group"
                        >
                            <div className="bg-purple-100 p-3 rounded-full mr-4 group-hover:bg-purple-200">
                                <Smartphone className="text-purple-600" size={24} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-gray-800">Mobile Number Transfer</div>
                                <div className="text-xs text-gray-500">Send using 10-digit Mobile Number</div>
                            </div>
                        </button>

                        <button 
                            onClick={() => handleTypeSelect('UPI')}
                            className="flex items-center p-4 border rounded-xl hover:bg-green-50 hover:border-green-500 transition group"
                        >
                            <div className="bg-green-100 p-3 rounded-full mr-4 group-hover:bg-green-200">
                                <QrCode className="text-green-600" size={24} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-gray-800">UPI ID Transfer</div>
                                <div className="text-xs text-gray-500">Send to any VPA / UPI ID</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 1: Input Details */}
            {step === 1 && (
                <form onSubmit={handleVerify} className="space-y-4 animate-in slide-in-from-right-4">
                    <div className="flex items-center mb-4 text-gray-500 text-sm">
                        <button type="button" onClick={() => setStep(0)} className="flex items-center hover:text-gray-800">
                            <X size={16} className="mr-1 rotate-45" /> Change Method
                        </button>
                        <span className="mx-2">|</span>
                        <span className="font-bold text-blue-600">
                            {transferType === 'BANK' ? 'Bank Transfer' : transferType === 'MOBILE' ? 'Mobile Transfer' : 'UPI Transfer'}
                        </span>
                    </div>

                    {transferType === 'BANK' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="Enter Name"
                                    className="w-full border rounded-lg p-3"
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="Enter Account Number"
                                    className="w-full border rounded-lg p-3"
                                    onChange={e => setFormData({...formData, accountNo: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="SBIN0001234"
                                    className="w-full border rounded-lg p-3 uppercase"
                                    onChange={e => setFormData({...formData, ifsc: e.target.value.toUpperCase()})}
                                />
                            </div>
                        </>
                    )}

                    {transferType === 'MOBILE' && (
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                             <input 
                                required
                                type="text" 
                                maxLength={10}
                                placeholder="9876543210"
                                className="w-full border rounded-lg p-3"
                                onChange={e => setFormData({...formData, mobile: e.target.value})}
                             />
                             <p className="text-xs text-gray-500 mt-1">We will check for linked UPI/Bank accounts.</p>
                        </div>
                    )}

                    {transferType === 'UPI' && (
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                             <input 
                                required
                                type="text" 
                                placeholder="user@upi"
                                className="w-full border rounded-lg p-3"
                                onChange={e => setFormData({...formData, upiId: e.target.value})}
                             />
                        </div>
                    )}

                    <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex justify-center">
                        {loading ? <Loader2 className="animate-spin" /> : 'Verify & Continue'}
                    </button>
                </form>
            )}

            {/* Step 2: Amount & Pay */}
            {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                    <div className="bg-green-50 p-3 rounded border border-green-100 text-sm text-green-800">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="font-bold">Beneficiary Verified</span>
                        </div>
                        <div className="pl-6">
                            <p>Name: <strong>{verifiedName}</strong></p>
                            {transferType === 'BANK' && <p className="text-xs">A/c: XXXX{formData.accountNo.slice(-4)} | IFSC: {formData.ifsc}</p>}
                            {transferType === 'MOBILE' && <p className="text-xs">Mob: {formData.mobile}</p>}
                            {transferType === 'UPI' && <p className="text-xs">UPI: {formData.upiId}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Amount</label>
                        <div className="relative">
                             <span className="absolute left-3 top-3 text-gray-500">₹</span>
                             <input 
                                autoFocus
                                type="number" 
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                                className="w-full border rounded-lg p-3 pl-8 text-lg font-semibold" 
                                placeholder="0.00"
                             />
                        </div>
                    </div>

                    {formData.amount && parseFloat(formData.amount) > 0 && (
                         <PaymentSummary amount={parseFloat(formData.amount)} />
                    )}

                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200"
                        >
                            Back
                        </button>
                        <button 
                            onClick={handlePay}
                            disabled={loading || !formData.amount || parseFloat(formData.amount) <= 0} 
                            className="flex-[2] bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin"/> : 'Confirm & Pay'}
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
    const [formData, setFormData] = useState({ 
        provider: '', 
        number: '', 
        amount: '', 
        name: 'Rajesh Kumar', // Simulated
        billAmount: '12,450.00',
        minDue: '850.00',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')
    });
  
    const handleFetch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.provider || formData.number.length < 16) {
          // Basic validation
          return; 
      }
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
          setLoading(false);
          setStep(2);
          setFormData(prev => ({ ...prev, amount: prev.billAmount.replace(/,/g, '') }));
      }, 1500);
    };
  
    const handlePay = async () => {
        setLoading(true);
        const amountNum = parseFloat(formData.amount);
        const charge = amountNum * SERVICE_CHARGE_PERCENT;
        const total = amountNum + charge;

        const success = await processPayment(total);
        
        if (success) {
            onSuccess({
                Service: 'Credit Card Bill Payment',
                Provider: formData.provider,
                CardNumber: `XXXX-XXXX-XXXX-${formData.number.slice(-4)}`,
                Name: formData.name,
                BaseAmount: `₹${parseFloat(formData.amount).toFixed(2)}`,
                ServiceCharge: `₹${charge.toFixed(2)}`,
                TotalPaid: `₹${total.toFixed(2)}`,
                PaymentMode: 'Wallet',
                Status: 'Success',
                TransactionID: 'CC' + Math.floor(Math.random() * 10000000)
            });
        }
        setLoading(false);
    };
  
    return (
      <div>
          {step === 1 && (
              <form onSubmit={handleFetch} className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank / Card Provider</label>
                      <select 
                          required 
                          className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={e => setFormData({...formData, provider: e.target.value})}
                      >
                          <option value="">-- Select Bank --</option>
                          {CC_PROVIDERS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credit Card Number</label>
                      <div className="relative">
                          <CreditCard className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input 
                              required 
                              type="text" 
                              maxLength={16}
                              placeholder="XXXX XXXX XXXX XXXX"
                              className="w-full border rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={e => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setFormData({...formData, number: val});
                              }}
                              value={formData.number}
                          />
                      </div>
                  </div>
                  <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex justify-center">
                      {loading ? <Loader2 className="animate-spin" /> : 'Fetch Bill'}
                  </button>
              </form>
          )}
  
          {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-bottom-4">
                   {/* Bill Details Card */}
                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 mb-3 text-blue-800 border-b border-blue-200 pb-2">
                           <CheckCircle size={16} /> <span className="font-bold text-sm">Bill Fetched Successfully</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="text-gray-500">Card Holder</div>
                          <div className="font-semibold text-gray-900 text-right">{formData.name}</div>
                          
                          <div className="text-gray-500">Due Date</div>
                          <div className="font-semibold text-red-600 text-right">{formData.dueDate}</div>
  
                          <div className="text-gray-500">Min Amount Due</div>
                          <div className="font-semibold text-gray-900 text-right">₹{formData.minDue}</div>
                      </div>
                      
                      <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                          <span className="text-gray-800 font-bold">Total Amount Due</span>
                          <span className="text-xl font-bold text-blue-700">₹{formData.billAmount}</span>
                      </div>
                   </div>
  
                   {/* Payment Input */}
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enter Payment Amount</label>
                      <div className="relative">
                           <span className="absolute left-3 top-3 text-gray-500">₹</span>
                           <input 
                              type="number" 
                              value={formData.amount}
                              onChange={e => setFormData({...formData, amount: e.target.value})}
                              className="w-full border rounded-lg p-3 pl-8 font-bold text-lg" 
                           />
                      </div>
                      <div className="flex gap-2 mt-2">
                          <button type="button" onClick={() => setFormData({...formData, amount: formData.billAmount.replace(/,/g, '')})} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Pay Total</button>
                          <button type="button" onClick={() => setFormData({...formData, amount: formData.minDue.replace(/,/g, '')})} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Pay Minimum</button>
                      </div>
                   </div>
  
                   {formData.amount && parseFloat(formData.amount) > 0 && (
                       <PaymentSummary amount={parseFloat(formData.amount)} />
                   )}

                   <button 
                      onClick={handlePay}
                      disabled={loading || !formData.amount} 
                      className="w-full bg-blue-800 text-white py-3 rounded-lg font-bold hover:bg-blue-900 flex justify-center items-center gap-2"
                  >
                      {loading ? <Loader2 className="animate-spin"/> : `Pay Now`}
                  </button>
              </div>
          )}
      </div>
    );
};

// --- MAIN COMPONENT ---

const ServiceModal: React.FC<ServiceModalProps> = ({ service, onClose, userUid, currentBalance }) => {
  const [successData, setSuccessData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setSuccessData(null);
    setError('');
  }, [service]);

  if (!service) return null;

  const processWalletDeduction = async (amount: number): Promise<boolean> => {
    setError('');
    if (currentBalance < amount) {
        setError(`Insufficient Wallet Balance. Required: ₹${amount.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}`);
        return false;
    }

    try {
        const balanceRef = ref(db, `users/${userUid}/balance`);
        await runTransaction(balanceRef, (current) => {
            if (current === null) return current; 
            if (current < amount) return; 
            return current - amount;
        });
        return true;
    } catch (e) {
        console.error("Transaction failed", e);
        setError("Transaction failed. Please try again.");
        return false;
    }
  };

  const renderContent = () => {
    if (successData) {
      return <Receipt data={successData} onDownload={() => alert("Receipt Downloaded!")} />;
    }

    // Categories Logic
    if (service.id === 'mob' || service.id === 'dth') {
        return <MobileDthRecharge type={service.id === 'mob' ? 'mobile' : 'dth'} onSuccess={setSuccessData} processPayment={processWalletDeduction} />;
    }
    if (service.id === 'aeps' || service.id === 'matm') {
        return <AepsFlow onSuccess={setSuccessData} />;
    }
    if (service.id === 'dmt') {
        return <DMTFlow onSuccess={setSuccessData} processPayment={processWalletDeduction} />;
    }
    if (service.id === 'cc') {
        return <CreditCardFlow onSuccess={setSuccessData} processPayment={processWalletDeduction} />;
    }
    if (service.id === 'subscription') {
        return <SubscriptionFlow onSuccess={setSuccessData} processPayment={processWalletDeduction} />;
    }
    if (service.category === 'TRAVEL') {
        return <TravelFlow type={service.title.split(' ')[0]} onSuccess={setSuccessData} processPayment={processWalletDeduction} />;
    }
    // Fallback for all BBPS
    return <BillPaymentFlow category={service.id.toUpperCase()} onSuccess={setSuccessData} processPayment={processWalletDeduction} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center sticky top-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${service.color.split(' ')[0]}`}>
                <service.icon className={`w-6 h-6 ${service.color.split(' ')[1]}`} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{service.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                  <AlertTriangle size={20} />
                  <span className="text-sm font-medium">{error}</span>
              </div>
          )}
          {renderContent()}
        </div>

        {/* Footer */}
        {!successData && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <Wallet size={16} className="text-blue-600"/>
                    Bal: ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> 
                    Secure
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ServiceModal;