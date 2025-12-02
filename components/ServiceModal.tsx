
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, Smartphone, Fingerprint, Plane, CreditCard, Clock, Map, Camera, Palmtree, ShoppingBag, Tent, Ship, Plus, ChevronLeft, Building2, Users, Film, Ticket, Info, Train, Bus, Hotel, User, Briefcase, Zap, ShieldCheck, Globe, FileText, Tv, Lightbulb, Flame, Wifi, Car, Landmark, PlayCircle, Popcorn, Moon, Sun, Search, Calendar, ArrowUpCircle, ArrowDownCircle, Utensils, Luggage, Database } from 'lucide-react';
import { ServiceItem, Movie } from '../types';
import { ref, runTransaction, get, child } from 'firebase/database';
import { db } from '../firebaseConfig';

interface ServiceModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  userUid: string;
  currentBalance: number;
}

const SERVICE_CHARGE_PERCENT = 0.02; // 2%

// --- CONSTANTS ---
const OPERATORS = {
  mobile: ['Jio', 'Airtel', 'Vi', 'BSNL'],
  dth: ['Tata Play', 'Dish TV', 'Videocon d2h', 'Sun Direct'],
  banks: ['State Bank of India (SBI)', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank', 'Bank of Baroda', 'Kotak Mahindra', 'IndusInd']
};

const ELECTRICITY_STATES = {
    'Maharashtra': ['MSEDCL', 'Adani Electricity', 'Tata Power Mumbai'],
    'Delhi': ['BSES Rajdhani', 'BSES Yamuna', 'Tata Power DDL'],
    'Uttar Pradesh': ['UPPCL (Urban)', 'UPPCL (Rural)', 'KESCO', 'NPCL'],
    'Karnataka': ['BESCOM', 'HESCOM', 'GESCOM'],
    'Gujarat': ['DGVCL', 'MGVCL', 'PGVCL', 'UGVCL'],
    'Rajasthan': ['JVVNL', 'AVVNL', 'JdVVNL'],
    'Madhya Pradesh': ['MPMKVVCL', 'MPPKVVCL', 'MPEZ']
};

const CC_PROVIDERS = ['HDFC Bank', 'SBI Card', 'ICICI Bank', 'Axis Bank', 'Citibank', 'American Express', 'RBL Bank', 'Kotak Bank'];

const BILLER_DATA: Record<string, any> = {
  'GAS': { options: ['Indane Gas', 'HP Gas', 'Bharat Gas', 'Mahanagar Gas'] },
  'BROADBAND': { options: ['Airtel Xstream', 'JioFiber', 'ACT Fibernet', 'Tata Play Fiber', 'Hathway'] },
  'FASTAG': { options: ['Paytm Payments Bank', 'ICICI Fastag', 'HDFC Fastag', 'SBI Fastag', 'Airtel Payments Bank'] },
  'LOAN': { options: ['Bajaj Finserv', 'Home Credit', 'Muthoot Finance', 'HDB Financial', 'L&T Finance'] },
  'INSURANCE': { options: ['LIC of India', 'HDFC Life', 'SBI Life', 'Max Life', 'ICICI Prudential'] },
  'WATER': { options: ['Delhi Jal Board', 'MCGM', 'Bangalore Water Supply'] }
};

const VISA_COUNTRIES = [
    { id: 'FRANCE', name: 'France', types: [{ name: 'Schengen Tourist', price: 9500 }, { name: 'Business', price: 10500 }] },
    { id: 'USA', name: 'USA', types: [{ name: 'B1/B2 Tourist', price: 16000 }] },
    { id: 'UAE', name: 'UAE', types: [{ name: '30 Days Tourist', price: 6500 }, { name: '90 Days', price: 14500 }] },
    { id: 'THAILAND', name: 'Thailand', types: [{ name: 'Tourist E-Visa', price: 3500 }] },
    { id: 'UK', name: 'UK', types: [{ name: 'Standard Visitor', price: 12000 }] },
];

const MOCK_MOVIES_DEFAULT: Movie[] = [
    { id: 'm1', title: 'Action Hero', language: 'Hindi', format: '3D', poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400' },
    { id: 'm2', title: 'Romance Special', language: 'English', format: '2D', poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400' }
];

const MOCK_PLANS = [
    { price: 239, validity: '28 Days', data: '1.5GB/Day', desc: 'Unlimited Calls + 100 SMS/Day' },
    { price: 299, validity: '28 Days', data: '2GB/Day', desc: 'Unlimited Calls + 100 SMS/Day' },
    { price: 666, validity: '84 Days', data: '1.5GB/Day', desc: 'Unlimited Calls + 100 SMS/Day' },
    { price: 2999, validity: '365 Days', data: '2.5GB/Day', desc: 'Unlimited Calls + 100 SMS/Day' },
];

// --- HELPER COMPONENTS ---

const PaymentSummary = ({ amount, label = "Amount" }: { amount: number, label?: string }) => {
    const charge = amount * SERVICE_CHARGE_PERCENT;
    const total = amount + charge;
    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-sm mb-4">
            <div className="flex justify-between text-gray-600"><span>{label}</span><span>₹{amount.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Service Charge (2%)</span><span>₹{charge.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-900 font-bold border-t pt-2"><span>Total Payable</span><span className="text-blue-700">₹{total.toFixed(2)}</span></div>
        </div>
    );
};

const Receipt = ({ data, onDownload }: { data: any, onDownload: () => void }) => (
  <div className="text-center py-8 animate-in fade-in zoom-in">
    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
    <h3 className="text-2xl font-bold text-gray-800 mb-2">Transaction Successful</h3>
    <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto text-left space-y-2 mb-6 border border-gray-200">
      {Object.entries(data).map(([key, value]: any) => (
        <div key={key} className="flex justify-between text-sm"><span className="text-gray-500 capitalize">{key}:</span><span className="font-semibold text-gray-900">{value}</span></div>
      ))}
    </div>
    <button onClick={onDownload} className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 font-bold">Download Receipt</button>
  </div>
);

// --- 1. BANKING FLOWS ---

const AepsFlow = ({ onSuccess, processPayment }: any) => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ aadhaar: '', bank: '', mobile: '', amount: '' });
    const [scanning, setScanning] = useState(false);

    const handleScan = () => {
        setScanning(true);
        setTimeout(() => { setScanning(false); setStep(2); }, 2000);
    };

    const handleWithdraw = async () => {
        const success = await processPayment(parseFloat(form.amount), 'CREDIT');
        if (success) onSuccess({ Service: 'AEPS Withdrawal', Aadhaar: form.aadhaar, Amount: `₹${form.amount}`, Status: 'Success' });
    };

    return (
        <div className="space-y-4">
            {step === 1 && (
                <>
                    <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3 border border-blue-100">
                        <Fingerprint className="text-blue-600" size={32} />
                        <div><h4 className="font-bold text-blue-900">Connect Biometric Device</h4><p className="text-xs text-blue-600">Ensure device is ready</p></div>
                    </div>
                    <select className="h-10 w-full border rounded px-3 text-sm bg-white" onChange={e=>setForm({...form, bank: e.target.value})}>
                        <option>Select Customer Bank</option>{OPERATORS.banks.map(b=><option key={b}>{b}</option>)}
                    </select>
                    <input className="h-10 w-full border rounded px-3 text-sm" placeholder="Aadhaar Number" maxLength={12} onChange={e=>setForm({...form, aadhaar: e.target.value})}/>
                    <input className="h-10 w-full border rounded px-3 text-sm" placeholder="Customer Mobile" maxLength={10} onChange={e=>setForm({...form, mobile: e.target.value})}/>
                    <input className="h-10 w-full border rounded px-3 text-sm" placeholder="Amount" type="number" onChange={e=>setForm({...form, amount: e.target.value})}/>
                    <button onClick={handleScan} disabled={!form.aadhaar || !form.amount || scanning} className="w-full bg-blue-600 text-white h-10 rounded font-bold flex items-center justify-center gap-2">
                        {scanning ? <Loader2 className="animate-spin"/> : <><Fingerprint size={18}/> Scan Fingerprint</>}
                    </button>
                </>
            )}
            {step === 2 && (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center"><CheckCircle size={32}/></div>
                    <h3 className="font-bold text-lg">Biometric Verified</h3>
                    <div className="bg-gray-50 p-4 rounded text-left text-sm space-y-2">
                        <div className="flex justify-between"><span>Bank</span><span className="font-bold">{form.bank}</span></div>
                        <div className="flex justify-between"><span>Aadhaar</span><span className="font-bold">XXXX-XXXX-{form.aadhaar.slice(-4)}</span></div>
                        <div className="flex justify-between"><span>Amount</span><span className="font-bold text-blue-600">₹{form.amount}</span></div>
                    </div>
                    <button onClick={handleWithdraw} className="w-full bg-blue-600 text-white h-10 rounded font-bold">Confirm Withdrawal</button>
                </div>
            )}
        </div>
    );
};

const MicroAtmFlow = ({ onSuccess, processPayment }: any) => {
    const [mode, setMode] = useState<'CASH' | 'TRANSFER' | null>(null);
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleProcess = async () => {
        setLoading(true);
        const val = parseFloat(amount);
        const success = await processPayment(val, mode === 'CASH' ? 'CREDIT' : 'DEBIT');
        if(success) onSuccess({ Service: `Micro ATM - ${mode}`, Amount: amount, Status: 'Success' });
        setLoading(false);
    };

    if (!mode) return (
        <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setMode('CASH')} className="bg-green-50 border-2 border-green-200 p-6 rounded-xl flex flex-col items-center gap-2 hover:bg-green-100"><Briefcase size={32} className="text-green-700"/><span className="font-bold text-green-800">Cash Withdrawal</span></button>
            <button onClick={() => setMode('TRANSFER')} className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl flex flex-col items-center gap-2 hover:bg-blue-100"><Zap size={32} className="text-blue-700"/><span className="font-bold text-blue-800">Money Transfer</span></button>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4"><button onClick={()=>setMode(null)}><ChevronLeft/></button><h3 className="font-bold">{mode === 'CASH' ? 'Cash Withdrawal' : 'Money Transfer'}</h3></div>
            {step === 1 && (
                <div className="bg-gradient-to-r from-gray-800 to-gray-600 p-6 rounded-xl text-white shadow-lg mb-4">
                    <div className="flex justify-between mb-6"><div className="text-sm opacity-75">Insert Card</div><Wifi size={20} className="opacity-50"/></div>
                    <div className="text-xl tracking-widest font-mono mb-4">XXXX XXXX XXXX 1234</div>
                    <div className="flex justify-between text-xs opacity-75"><span>VALID THRU 12/28</span><span>CVV ***</span></div>
                </div>
            )}
            {step === 1 && <div className="space-y-3">
                <input type="text" placeholder="Card Number" className="w-full h-10 border rounded px-3 bg-white" maxLength={16}/>
                <div className="flex gap-3"><input type="text" placeholder="MM/YY" className="w-1/2 h-10 border rounded px-3 bg-white"/><input type="password" placeholder="CVV" className="w-1/2 h-10 border rounded px-3 bg-white"/></div>
                <button onClick={()=>setStep(2)} className="w-full bg-blue-600 text-white h-10 rounded font-bold">Next</button>
            </div>}
            {step === 2 && <div className="space-y-3">
                {mode === 'TRANSFER' && <input type="text" placeholder="Recipient Mobile" className="w-full h-10 border rounded px-3 bg-white"/>}
                <input type="number" placeholder="Amount" className="w-full h-10 border rounded px-3 font-bold text-lg bg-white" value={amount} onChange={e=>setAmount(e.target.value)}/>
                {mode === 'TRANSFER' && <PaymentSummary amount={parseFloat(amount||'0')}/>}
                <button onClick={handleProcess} disabled={loading} className="w-full bg-blue-600 text-white h-10 rounded font-bold">{loading?<Loader2 className="animate-spin mx-auto"/> : 'Process Transaction'}</button>
            </div>}
        </div>
    );
};

const MoneyTransferFlow = ({ onSuccess, processPayment }: any) => {
    const [type, setType] = useState<'MOBILE' | 'BANK'>('MOBILE');
    const [form, setForm] = useState({ mobile: '', acc: '', ifsc: '', amount: '' });
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        setLoading(true);
        const success = await processPayment(parseFloat(form.amount), 'DEBIT');
        if(success) onSuccess({ Service: 'DMT', Type: type, Amount: form.amount, Status: 'Success' });
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex bg-gray-100 rounded p-1"><button onClick={()=>setType('MOBILE')} className={`flex-1 py-1.5 rounded text-sm font-bold ${type==='MOBILE'?'bg-white shadow':''}`}>To Mobile</button><button onClick={()=>setType('BANK')} className={`flex-1 py-1.5 rounded text-sm font-bold ${type==='BANK'?'bg-white shadow':''}`}>To Bank</button></div>
            {type === 'MOBILE' ? <input type="text" placeholder="Mobile Number" className="w-full h-10 border rounded px-3 bg-white" onChange={e=>setForm({...form, mobile: e.target.value})}/> : <><input type="text" placeholder="Account Number" className="w-full h-10 border rounded px-3 bg-white" onChange={e=>setForm({...form, acc: e.target.value})}/><input type="text" placeholder="IFSC Code" className="w-full h-10 border rounded px-3 uppercase bg-white" onChange={e=>setForm({...form, ifsc: e.target.value})}/></>}
            <input type="number" placeholder="Amount" className="w-full h-10 border rounded px-3 bg-white" onChange={e=>setForm({...form, amount: e.target.value})}/>
            <PaymentSummary amount={parseFloat(form.amount||'0')}/>
            <button onClick={handlePay} disabled={loading} className="w-full bg-blue-600 text-white h-10 rounded font-bold">Transfer Now</button>
        </div>
    );
};

const BankServiceFlow = ({ onSuccess, processPayment }: any) => {
    const [mode, setMode] = useState<'DEPOSIT' | 'WITHDRAW' | null>(null);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ bank: '', acc: '', ifsc: '', amount: '', mobile: '' });
    const [verifiedName, setVerifiedName] = useState('');
    const [loading, setLoading] = useState(false);

    const verify = () => {
        setLoading(true);
        setTimeout(() => { setVerifiedName("RAJESH KUMAR"); setLoading(false); }, 1000);
    };

    const process = async () => {
        setLoading(true);
        const success = await processPayment(parseFloat(form.amount), mode === 'DEPOSIT' ? 'DEBIT' : 'CREDIT');
        if(success) onSuccess({ Service: `Bank ${mode}`, Account: form.acc, Amount: form.amount, Status: 'Success' });
        setLoading(false);
    };

    if(!mode) return (
        <div className="grid grid-cols-2 gap-4">
            <button onClick={()=>setMode('DEPOSIT')} className="p-6 border-2 border-blue-200 bg-blue-50 rounded-xl font-bold text-blue-800 flex flex-col items-center gap-2 hover:bg-blue-100"><ArrowUpCircle size={32}/> Cash Deposit</button>
            <button onClick={()=>setMode('WITHDRAW')} className="p-6 border-2 border-green-200 bg-green-50 rounded-xl font-bold text-green-800 flex flex-col items-center gap-2 hover:bg-green-100"><ArrowDownCircle size={32}/> Cash Withdrawal</button>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2"><button onClick={()=>setMode(null)}><ChevronLeft/></button><h3 className="font-bold">{mode === 'DEPOSIT' ? 'Cash Deposit' : 'Cash Withdrawal'}</h3></div>
            {step === 1 && (
                <div className="space-y-3">
                    <select className="h-10 w-full border rounded px-3 bg-white" onChange={e=>setForm({...form, bank: e.target.value})}><option>Select Bank</option>{OPERATORS.banks.map(b=><option key={b}>{b}</option>)}</select>
                    <input className="h-10 w-full border rounded px-3 bg-white" placeholder="Account Number" onChange={e=>setForm({...form, acc: e.target.value})}/>
                    <div className="flex gap-2">
                        <input className="h-10 flex-1 border rounded px-3 uppercase bg-white" placeholder="IFSC Code" onChange={e=>setForm({...form, ifsc: e.target.value})}/>
                        <button onClick={verify} className="bg-blue-600 text-white px-4 rounded font-bold h-10">{loading ? <Loader2 className="animate-spin"/> : 'Verify'}</button>
                    </div>
                    {verifiedName && <div className="bg-green-50 text-green-700 p-2 rounded text-sm font-bold text-center">Verified: {verifiedName}</div>}
                    <button disabled={!verifiedName} onClick={()=>setStep(2)} className="w-full bg-blue-600 text-white h-10 rounded font-bold disabled:opacity-50">Next</button>
                </div>
            )}
            {step === 2 && (
                <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded text-sm">
                        <div><span className="text-gray-500">Bank:</span> {form.bank}</div>
                        <div><span className="text-gray-500">Account:</span> {form.acc}</div>
                        <div><span className="text-gray-500">Name:</span> {verifiedName}</div>
                    </div>
                    <input type="number" className="h-10 w-full border rounded px-3 bg-white" placeholder="Amount" onChange={e=>setForm({...form, amount: e.target.value})}/>
                    <input type="number" className="h-10 w-full border rounded px-3 bg-white" placeholder="Customer Mobile" onChange={e=>setForm({...form, mobile: e.target.value})}/>
                    {mode === 'DEPOSIT' && <PaymentSummary amount={parseFloat(form.amount||'0')}/>}
                    <button onClick={process} disabled={loading} className="w-full bg-blue-600 text-white h-10 rounded font-bold">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'Confirm Transaction'}</button>
                </div>
            )}
        </div>
    );
};

// --- 2. BBPS FLOWS ---

const MobileRechargeFlow = ({ type, onSuccess, processPayment }: any) => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ mobile: '', operator: '', circle: '', amount: '' });
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPlans = () => {
        setLoading(true);
        setTimeout(() => {
            setPlans(MOCK_PLANS);
            setLoading(false);
        }, 1000);
    };

    const handleRecharge = async () => {
        setLoading(true);
        const success = await processPayment(parseFloat(form.amount), 'DEBIT');
        if(success) onSuccess({ Service: type === 'MOB' ? 'Mobile Recharge' : 'DTH Recharge', Number: form.mobile, Amount: `₹${form.amount}`, Status: 'Success' });
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <input className="h-10 w-full border rounded px-3 bg-white" placeholder={type === 'MOB' ? 'Mobile Number' : 'Subscriber ID'} onChange={e=>setForm({...form, mobile: e.target.value})}/>
            <div className="flex gap-2">
                <select className="h-10 flex-1 border rounded px-3 bg-white" onChange={e=>setForm({...form, operator: e.target.value})}><option>Operator</option>{(type==='MOB'?OPERATORS.mobile:OPERATORS.dth).map(o=><option key={o}>{o}</option>)}</select>
                {type==='MOB' && <select className="h-10 flex-1 border rounded px-3 bg-white" onChange={e=>setForm({...form, circle: e.target.value})}><option>Circle</option><option>Mumbai</option><option>Delhi</option><option>UP East</option></select>}
            </div>
            
            {/* Plans */}
            <div>
                <button onClick={fetchPlans} className="text-blue-600 text-sm font-bold mb-2 hover:underline">Browse Plans</button>
                {plans.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
                        {plans.map(p => (
                            <div key={p.price} onClick={()=>setForm({...form, amount: p.price})} className="border p-2 rounded cursor-pointer hover:border-blue-500 bg-gray-50">
                                <div className="font-bold">₹{p.price}</div>
                                <div className="text-[10px] text-gray-500">{p.validity} | {p.data}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <input className="h-10 w-full border rounded px-3 font-bold text-lg bg-white" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})}/>
            <PaymentSummary amount={parseFloat(form.amount||'0')} />
            <button onClick={handleRecharge} disabled={!form.amount || loading} className="w-full bg-blue-600 text-white h-10 rounded font-bold">{loading?<Loader2 className="animate-spin mx-auto"/>:'Recharge'}</button>
        </div>
    );
};

const BillPaymentFlow = ({ category, onSuccess, processPayment }: any) => {
    const [step, setStep] = useState(1);
    const [state, setState] = useState('');
    const [biller, setBiller] = useState('');
    const [consumerNum, setConsumerNum] = useState('');
    const [billDetails, setBillDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchBill = () => {
        setLoading(true);
        setTimeout(() => {
            setBillDetails({ name: 'Rahul Sharma', amount: 850.00, dueDate: '25 Oct 2024' });
            setLoading(false);
            setStep(2);
        }, 1500);
    };

    const payBill = async () => {
        setLoading(true);
        const success = await processPayment(billDetails.amount, 'DEBIT');
        if(success) onSuccess({ Service: category, Biller: biller, Amount: `₹${billDetails.amount}`, Status: 'Success' });
        setLoading(false);
    };

    const renderBillerSelect = () => {
        if (category === 'ELEC') {
            return (
                <>
                    <label className="text-xs font-bold text-gray-500">SELECT STATE</label>
                    <select className="h-10 w-full border rounded px-3 bg-white mb-3" onChange={(e) => setState(e.target.value)}>
                        <option value="">Select State</option>
                        {Object.keys(ELECTRICITY_STATES).map(st => <option key={st}>{st}</option>)}
                    </select>
                    {state && (
                        <>
                            <label className="text-xs font-bold text-gray-500">SELECT BOARD</label>
                            <select className="h-10 w-full border rounded px-3 bg-white" onChange={(e) => setBiller(e.target.value)}>
                                <option value="">Select Board</option>
                                {ELECTRICITY_STATES[state as keyof typeof ELECTRICITY_STATES].map((b: string) => <option key={b}>{b}</option>)}
                            </select>
                        </>
                    )}
                </>
            );
        }
        return (
            <>
                <label className="text-xs font-bold text-gray-500">SELECT BILLER</label>
                <select className="h-10 w-full border rounded px-3 bg-white" onChange={(e) => setBiller(e.target.value)}>
                    <option>Select Provider</option>
                    {(BILLER_DATA[category]?.options || []).map((opt: string) => <option key={opt}>{opt}</option>)}
                </select>
            </>
        );
    };

    return (
        <div className="space-y-4">
            {step === 1 && (
                <>
                    {renderBillerSelect()}
                    <label className="text-xs font-bold text-gray-500 mt-2 block">CONSUMER NUMBER</label>
                    <input className="h-10 w-full border rounded px-3 bg-white" placeholder="Enter Consumer ID / Number" onChange={(e) => setConsumerNum(e.target.value)} />
                    <button onClick={fetchBill} disabled={!biller || !consumerNum || loading} className="w-full bg-blue-600 text-white h-10 rounded font-bold mt-4 flex justify-center items-center">
                        {loading ? <Loader2 className="animate-spin"/> : 'Fetch Bill'}
                    </button>
                </>
            )}
            {step === 2 && billDetails && (
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Name</span><span className="font-bold">{billDetails.name}</span></div>
                        <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Due Date</span><span className="font-bold">{billDetails.dueDate}</span></div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Bill Amount</span><span className="text-blue-600">₹{billDetails.amount}</span></div>
                    </div>
                    <PaymentSummary amount={billDetails.amount} />
                    <button onClick={payBill} disabled={loading} className="w-full bg-blue-600 text-white h-10 rounded font-bold">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'Pay Bill'}</button>
                </div>
            )}
        </div>
    );
};

const CreditCardFlow = ({ onSuccess, processPayment }: any) => {
    const [form, setForm] = useState({ bank: '', number: '', amount: '' });
    const [loading, setLoading] = useState(false);

    const pay = async () => {
        setLoading(true);
        const success = await processPayment(parseFloat(form.amount), 'DEBIT');
        if(success) onSuccess({ Service: 'Credit Card Pay', Card: `xxxx-${form.number.slice(-4)}`, Amount: `₹${form.amount}`, Status: 'Success' });
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <select className="h-10 w-full border rounded px-3 bg-white" onChange={e=>setForm({...form, bank: e.target.value})}>
                <option>Select Card Issuer</option>{CC_PROVIDERS.map(p=><option key={p}>{p}</option>)}
            </select>
            <input className="h-10 w-full border rounded px-3 bg-white" placeholder="Card Number" maxLength={16} onChange={e=>setForm({...form, number: e.target.value})}/>
            <input className="h-10 w-full border rounded px-3 bg-white" placeholder="Bill Amount" type="number" onChange={e=>setForm({...form, amount: e.target.value})}/>
            <PaymentSummary amount={parseFloat(form.amount||'0')} />
            <button onClick={pay} disabled={loading} className="w-full bg-blue-600 text-white h-10 rounded font-bold">{loading?<Loader2 className="animate-spin mx-auto"/>:'Pay Bill'}</button>
        </div>
    );
};

const VisaFlow = ({ onSuccess, processPayment }: any) => {
    const [step, setStep] = useState(1);
    const [country, setCountry] = useState<any>(null);
    const [type, setType] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const pay = async () => {
        setLoading(true);
        const success = await processPayment(type.price, 'DEBIT');
        if(success) onSuccess({ Service: 'Visa Application', Country: country.name, Type: type.name, Amount: `₹${type.price}`, Status: 'Submitted' });
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            {step === 1 && (
                <div className="grid grid-cols-2 gap-3">
                    {VISA_COUNTRIES.map(c => (
                        <div key={c.id} onClick={()=>{setCountry(c); setStep(2)}} className="p-4 border rounded-xl hover:border-blue-500 cursor-pointer text-center bg-gray-50 hover:bg-blue-50">
                            <span className="font-bold text-gray-800">{c.name}</span>
                        </div>
                    ))}
                </div>
            )}
            {step === 2 && (
                <div className="space-y-3">
                    <h3 className="font-bold text-center">Select Visa Type for {country.name}</h3>
                    {country.types.map((t: any) => (
                        <div key={t.name} onClick={()=>{setType(t); setStep(3)}} className="p-3 border rounded flex justify-between hover:bg-blue-50 cursor-pointer bg-white">
                            <span>{t.name}</span><span className="font-bold">₹{t.price}</span>
                        </div>
                    ))}
                </div>
            )}
            {step === 3 && (
                <div className="space-y-4">
                    <h3 className="font-bold">Document Checklist</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                        <li>Original Passport</li><li>2 Photos</li><li>Bank Statement</li>
                    </ul>
                    <PaymentSummary amount={type.price} />
                    <button onClick={pay} disabled={loading} className="w-full bg-blue-600 text-white h-10 rounded font-bold">{loading?<Loader2 className="animate-spin mx-auto"/>:'Pay Visa Fee'}</button>
                </div>
            )}
        </div>
    );
};

const MovieFlow = ({ onSuccess, processPayment }: any) => {
    const [step, setStep] = useState(1);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [seats, setSeats] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        get(ref(db, 'movies')).then(snap => {
            if(snap.exists()) setMovies(Object.values(snap.val()));
            else setMovies(MOCK_MOVIES_DEFAULT);
        });
    }, []);

    const book = async () => {
        setLoading(true);
        const amount = seats.length * 250;
        const success = await processPayment(amount, 'DEBIT');
        if(success) onSuccess({ Service: 'Movie Tickets', Movie: selected.title, Seats: seats.join(','), Amount: `₹${amount}`, Status: 'Booked' });
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            {step === 1 && (
                <div className="grid grid-cols-2 gap-4">
                    {movies.map(m => (
                        <div key={m.id} onClick={()=>{setSelected(m); setStep(2)}} className="cursor-pointer group">
                            <img src={m.poster} className="rounded-lg h-40 w-full object-cover mb-2 group-hover:opacity-90"/>
                            <div className="font-bold text-sm">{m.title}</div>
                            <div className="text-xs text-gray-500">{m.language} | {m.format}</div>
                        </div>
                    ))}
                </div>
            )}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="text-center font-bold">Select Seats</div>
                    <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto">
                        {[...Array(24)].map((_, i) => {
                            const seat = `A${i+1}`;
                            return <div key={i} onClick={()=>setSeats(s => s.includes(seat)?s.filter(x=>x!==seat):[...s, seat])} className={`h-8 rounded flex items-center justify-center text-xs cursor-pointer ${seats.includes(seat)?'bg-green-500 text-white':'bg-gray-200'}`}>{i+1}</div>
                        })}
                    </div>
                    {seats.length > 0 && <button onClick={book} disabled={loading} className="w-full bg-blue-600 text-white h-10 rounded font-bold">Pay ₹{seats.length*250}</button>}
                </div>
            )}
        </div>
    );
};

// --- 3. TRAVEL FLOWS (Advanced) ---

const TravelFlow = ({ type, onSuccess, processPayment }: any) => {
    const [step, setStep] = useState(1);
    // Search State
    const [search, setSearch] = useState<any>({ from: '', to: '', date: '', passengers: 1, class: 'Economy', days: 2, nights: 1 });
    // Booking State
    const [selected, setSelected] = useState<any>(null);
    const [fareType, setFareType] = useState<any>(null); // For Flights
    const [seats, setSeats] = useState<string[]>([]);
    const [passengers, setPassengers] = useState<any[]>([]);
    const [addons, setAddons] = useState({ meal: 'None', baggage: 'None' });
    const [customHolidayPrice, setCustomHolidayPrice] = useState('');
    
    // Holiday State
    const [holidayParams, setHolidayParams] = useState<any>({ hotel: '3 Star', transport: ['Bus'], activities: [] });

    // Initial Passengers
    useEffect(() => {
        setPassengers(Array(search.passengers).fill({ title: 'Mr', first: '', last: '', age: '', gender: '' }));
    }, [search.passengers]);

    const handleSearch = () => {
        setStep(2);
    };

    const initiateBook = (item: any) => {
        setSelected(item);
        if (type === 'FLIGHT') setStep(3); // Go to Fare Select
        else if (type === 'BUS') setStep(3); // Go to Seat Select
        else if (type === 'HOLIDAY') {
            // Auto Select based on package
            const isLux = item.name.includes('Grand') || item.name.includes('Luxury');
            const isShort = item.name.includes('Weekend');
            setHolidayParams({
                hotel: isLux ? '5 Star' : '3 Star',
                transport: isLux ? ['Flight'] : isShort ? ['Bus'] : ['Train'],
                activities: ['Sightseeing']
            });
            setStep(3); // Go to Customize
        }
        else setStep(3); // Direct details
    };

    const getPrice = () => {
        let base = selected.price;
        if (fareType) base += fareType.extra; // Flight Fare
        let total = base * search.passengers;
        
        // Bus Seats
        if (type === 'BUS' && seats.length > 0) total = selected.price * seats.length;

        // Holiday Calculations
        if (type === 'HOLIDAY') {
            if (customHolidayPrice) return parseFloat(customHolidayPrice);
            let p = selected.price; // Base package per person
            if (holidayParams.hotel === '4 Star') p += 2000;
            if (holidayParams.hotel === '5 Star') p += 5000;
            if (holidayParams.transport.includes('Flight')) p += 4000;
            total = p * search.passengers;
        }

        // Addons
        if(addons.meal !== 'None') total += (addons.meal === 'Veg' ? 399 : 499) * search.passengers;
        if(addons.baggage !== 'None') total += (parseInt(addons.baggage) / 5) * 250 * search.passengers;
        
        // Seat Charges (Flight)
        if (type === 'FLIGHT') {
             seats.forEach(s => {
                 const row = parseInt(s); 
                 if(row <= 7) total += 500;
                 else if(row <= 26) total += 250;
             });
        }

        return total;
    };

    const handlePay = async () => {
        const total = getPrice();
        const success = await processPayment(total, 'DEBIT');
        if(success) onSuccess({ Service: `${type} Booking`, Details: selected.provider || selected.name, Amount: `₹${total}`, Status: 'Confirmed' });
    };

    // --- STEPS ---

    const SearchForm = () => (
        <div className="space-y-4">
            {type === 'HOLIDAY' ? (
                <>
                    <input className="h-10 w-full border border-gray-300 rounded px-3 text-sm bg-white" placeholder="Destination (e.g. Goa)" onChange={e=>setSearch({...search, to: e.target.value})}/>
                    <div className="flex gap-3">
                        <input className="h-10 flex-1 border border-gray-300 rounded px-3 text-sm bg-white" type="number" placeholder="Days" onChange={e=>setSearch({...search, days: parseInt(e.target.value)})}/>
                        <input className="h-10 flex-1 border border-gray-300 rounded px-3 text-sm bg-white" type="number" placeholder="Nights" onChange={e=>setSearch({...search, nights: parseInt(e.target.value)})}/>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <input className="h-10 border border-gray-300 rounded px-3 text-sm bg-white" placeholder="From City"/>
                    <input className="h-10 border border-gray-300 rounded px-3 text-sm bg-white" placeholder="To City"/>
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <input type="date" className="h-10 border border-gray-300 rounded px-3 text-sm bg-white"/>
                <div className="h-10 border border-gray-300 rounded px-3 flex items-center justify-between bg-white">
                    <button onClick={()=>setSearch({...search, passengers: Math.max(1, search.passengers-1)})}>-</button>
                    <span className="text-sm font-bold">{search.passengers} Pax</span>
                    <button onClick={()=>setSearch({...search, passengers: Math.min(9, search.passengers+1)})}>+</button>
                </div>
            </div>
            <button onClick={handleSearch} className="w-full bg-blue-600 text-white h-10 rounded font-bold">Search</button>
        </div>
    );

    const Results = () => {
        const list = type === 'FLIGHT' ? [
            { id: 1, provider: 'IndiGo', desc: '10:00 - 12:30', price: 4500 },
            { id: 2, provider: 'Air India', desc: '14:00 - 17:15', price: 5200 }
        ] : type === 'BUS' ? [
            { id: 1, provider: 'VRL Travels', desc: 'Sleeper AC', price: 1200 },
            { id: 2, provider: 'Orange', desc: 'Volvo AC', price: 1500 }
        ] : type === 'TRAIN' ? [
            { id: 1, provider: 'Rajdhani', desc: '3A', price: 2500 },
            { id: 2, provider: 'Shatabdi', desc: 'CC', price: 1200 }
        ] : type === 'HOLIDAY' ? [
            { id: 1, name: `${search.to} Weekend Escape`, desc: `2 Days / 1 Night`, price: 5000 },
            { id: 2, name: `${search.to} Grand Holiday`, desc: `5 Days / 4 Nights`, price: 15000 }
        ] : [
            { id: 1, provider: 'Taj Hotel', desc: '5 Star', price: 8500 }
        ];

        return (
            <div className="space-y-3">
                {list.map((item: any, i) => (
                    <div key={i} className="bg-white border rounded-xl p-4 shadow-sm flex justify-between items-center">
                        <div>
                            <div className="font-bold text-lg">{item.provider || item.name}</div>
                            <div className="text-sm text-gray-500">{item.desc}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-xl text-blue-700">₹{item.price}</div>
                            <button onClick={()=>initiateBook(item)} className="bg-blue-600 text-white px-6 py-1.5 rounded font-bold mt-1">Book</button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const FareSelect = () => (
        <div className="space-y-3">
            <h3 className="font-bold">Select Fare Type</h3>
            {[
                { name: 'Saver', price: 0, desc: 'Cabin Bag Only' },
                { name: 'Flexi', price: 500, desc: 'Free Date Change' },
                { name: 'Super', price: 1000, desc: 'Free Meal + Seat' }
            ].map(f => (
                <div key={f.name} onClick={()=>{setFareType({name: f.name, extra: f.price}); setStep(4)}} className="p-4 border rounded hover:border-blue-600 cursor-pointer bg-white">
                    <div className="flex justify-between font-bold"><span>{f.name}</span><span>+₹{f.price}</span></div>
                    <div className="text-xs text-gray-500">{f.desc}</div>
                </div>
            ))}
        </div>
    );

    const HolidayCustomize = () => (
        <div className="space-y-4">
            <h3 className="font-bold">Customize Package</h3>
            <div>
                <label className="text-xs font-bold text-gray-500">HOTEL CATEGORY</label>
                <div className="flex gap-2 mt-1">
                    {['3 Star', '4 Star', '5 Star'].map(h => (
                        <button key={h} onClick={()=>setHolidayParams({...holidayParams, hotel: h})} className={`flex-1 py-2 border rounded ${holidayParams.hotel===h?'bg-blue-600 text-white':'bg-white'}`}>{h}</button>
                    ))}
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500">TRANSPORT</label>
                <div className="flex gap-2 mt-1">
                    {['Bus', 'Train', 'Flight', 'Cab'].map(t => (
                        <button key={t} onClick={()=>{
                            const newT = holidayParams.transport.includes(t) ? holidayParams.transport.filter((x:any)=>x!==t) : [...holidayParams.transport, t];
                            setHolidayParams({...holidayParams, transport: newT});
                        }} className={`flex-1 py-2 border rounded ${holidayParams.transport.includes(t)?'bg-blue-600 text-white':'bg-white'}`}>{t}</button>
                    ))}
                </div>
            </div>
            <button onClick={()=>setStep(4)} className="w-full bg-blue-600 text-white h-10 rounded font-bold">Continue</button>
        </div>
    );

    const SeatMap = () => (
        <div className="space-y-4 text-center">
            <h3 className="font-bold">Select Seats</h3>
            {type === 'BUS' ? (
                <div className="flex justify-center gap-8">
                    <div className="border p-4 rounded bg-gray-50">
                        <div className="text-xs mb-2">LOWER (Seater)</div>
                        <div className="grid grid-cols-2 gap-2 w-20">
                            {[...Array(10)].map((_,i)=><div key={i} onClick={()=>setSeats([...seats, `L${i+1}`])} className={`h-8 border rounded cursor-pointer bg-white ${seats.includes(`L${i+1}`)?'bg-blue-600 text-white':''}`}>{i+1}</div>)}
                        </div>
                    </div>
                    <div className="border p-4 rounded bg-gray-50">
                        <div className="text-xs mb-2">UPPER (Sleeper)</div>
                        <div className="grid grid-cols-1 gap-2 w-12">
                            {[...Array(5)].map((_,i)=><div key={i} onClick={()=>setSeats([...seats, `U${i+1}`])} className={`h-12 border rounded cursor-pointer bg-white ${seats.includes(`U${i+1}`)?'bg-blue-600 text-white':''}`}>{i+1}</div>)}
                        </div>
                    </div>
                </div>
            ) : (
                // Flight Fuselage
                <div className="border-2 border-gray-300 rounded-full p-6 w-[240px] mx-auto bg-gray-50 relative">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400">COCKPIT</div>
                    <div className="space-y-1 mt-6">
                        {[...Array(20)].map((_,r) => {
                            const row = r + 1;
                            const isPremium = row <= 5;
                            return (
                                <div key={row} className="flex justify-between items-center text-[10px]">
                                    <div className="flex gap-1">{['A','B','C'].map(c=><div key={c} onClick={()=>setSeats([...seats, `${row}${c}`])} className={`w-6 h-6 border rounded flex items-center justify-center cursor-pointer ${seats.includes(`${row}${c}`)?'bg-blue-600 text-white': isPremium ? 'bg-purple-100 border-purple-300' : 'bg-white'}`}>{row}</div>)}</div>
                                    <div className="w-4 text-center text-gray-300">{row}</div>
                                    <div className="flex gap-1">{['D','E','F'].map(c=><div key={c} onClick={()=>setSeats([...seats, `${row}${c}`])} className={`w-6 h-6 border rounded flex items-center justify-center cursor-pointer ${seats.includes(`${row}${c}`)?'bg-blue-600 text-white': isPremium ? 'bg-purple-100 border-purple-300' : 'bg-white'}`}>{row}</div>)}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            <button onClick={()=>setStep(type==='FLIGHT'?5:4)} className="w-full bg-blue-600 text-white h-10 rounded font-bold">Continue</button>
        </div>
    );

    const PassengerForm = () => (
        <div className="space-y-4">
            <h3 className="font-bold">Passenger Details</h3>
            {passengers.map((_, i) => (
                <div key={i} className="p-2 border rounded bg-gray-50 space-y-2">
                    <div className="text-xs font-bold text-gray-400">PASSENGER {i+1}</div>
                    <div className="flex gap-2">
                        <select className="h-10 border rounded px-1 w-16 text-sm bg-white"><option>Mr</option><option>Mrs</option></select>
                        <input className="h-10 flex-1 border rounded px-3 text-sm bg-white" placeholder="First Name"/>
                        <input className="h-10 flex-1 border rounded px-3 text-sm bg-white" placeholder="Last Name"/>
                    </div>
                    <div className="flex gap-2">
                        <input className="h-10 flex-1 border rounded px-3 text-sm bg-white" placeholder="DOB (DD-MM-YYYY)"/>
                        <select className="h-10 flex-1 border rounded px-3 text-sm bg-white"><option>Male</option><option>Female</option></select>
                    </div>
                </div>
            ))}
            
            {type === 'FLIGHT' && (
                <div className="bg-white border rounded p-4 space-y-3">
                    <div className="font-bold text-sm">Add-ons</div>
                    <div className="flex gap-2">
                        <select className="flex-1 h-10 border rounded px-2 text-sm bg-white" onChange={e=>setAddons({...addons, meal: e.target.value})}>
                            <option value="None">No Meal</option>
                            <option value="Veg">Veg Meal (₹399)</option>
                            <option value="NonVeg">Non-Veg Meal (₹499)</option>
                        </select>
                        <select className="flex-1 h-10 border rounded px-2 text-sm bg-white" onChange={e=>setAddons({...addons, baggage: e.target.value})}>
                            <option value="None">No Extra Baggage</option>
                            <option value="5">5 KG (₹250)</option>
                            <option value="10">10 KG (₹500)</option>
                        </select>
                    </div>
                </div>
            )}

            {type === 'HOLIDAY' && (
                <div className="bg-white border rounded p-3">
                    <label className="text-xs font-bold text-gray-500">EDIT PACKAGE COST</label>
                    <input className="h-10 w-full border rounded px-3 font-bold text-lg" value={customHolidayPrice || getPrice()} onChange={e=>setCustomHolidayPrice(e.target.value)}/>
                </div>
            )}

            <PaymentSummary amount={getPrice()} />
            <button onClick={handlePay} className="w-full bg-blue-600 text-white h-10 rounded font-bold">Make Payment</button>
        </div>
    );

    // --- RENDER LOGIC ---
    if(step === 1) return <SearchForm/>;
    if(step === 2) return <Results/>;
    if(step === 3) {
        if(type === 'FLIGHT') return <FareSelect/>;
        if(type === 'BUS') return <SeatMap/>;
        if(type === 'HOLIDAY') return <HolidayCustomize/>;
        return <PassengerForm/>;
    }
    if(step === 4) {
        if(type === 'FLIGHT') return <SeatMap/>;
        if(type === 'HOLIDAY') return <PassengerForm/>;
        return <PassengerForm/>;
    }
    if(step === 5 && type === 'FLIGHT') return <PassengerForm/>;

    return null;
};

const ServiceModal: React.FC<ServiceModalProps> = ({ service, onClose, userUid, currentBalance }) => {
  const [success, setSuccess] = useState<any>(null);

  const processPayment = async (amount: number, type: 'DEBIT' | 'CREDIT') => {
    if (type === 'DEBIT' && currentBalance < amount) { alert("Insufficient Wallet Balance"); return false; }
    try {
        await runTransaction(ref(db, `users/${userUid}/balance`), (bal) => {
            return type === 'DEBIT' ? (bal || 0) - amount : (bal || 0) + amount;
        });
        if (type === 'DEBIT') {
            await runTransaction(ref(db, `users/${userUid}/commission`), (comm) => (comm || 0) + (amount * 0.005));
        }
        return true;
    } catch (e) { alert("Transaction Failed"); return false; }
  };

  const renderContent = () => {
      if (success) return <Receipt data={success} onDownload={() => alert("Downloaded")} />;
      if (!service) return null;

      if (service.category === 'TRAVEL') return <TravelFlow type={service.id === 'flight' ? 'FLIGHT' : service.id === 'bus' ? 'BUS' : service.id === 'train' ? 'TRAIN' : service.id === 'hotel' ? 'HOTEL' : 'HOLIDAY'} onSuccess={setSuccess} processPayment={processPayment} />;
      
      switch(service.id) {
          case 'aeps': return <AepsFlow onSuccess={setSuccess} processPayment={processPayment}/>;
          case 'matm': return <MicroAtmFlow onSuccess={setSuccess} processPayment={processPayment}/>;
          case 'dmt': return <MoneyTransferFlow onSuccess={setSuccess} processPayment={processPayment}/>;
          case 'bank': return <BankServiceFlow onSuccess={setSuccess} processPayment={processPayment}/>;
          case 'cc': return <CreditCardFlow onSuccess={setSuccess} processPayment={processPayment}/>;
          case 'visa': return <VisaFlow onSuccess={setSuccess} processPayment={processPayment}/>;
          case 'movie': return <MovieFlow onSuccess={setSuccess} processPayment={processPayment}/>;
          case 'mob': 
          case 'dth': return <MobileRechargeFlow type={service.id === 'mob' ? 'MOB' : 'DTH'} onSuccess={setSuccess} processPayment={processPayment} />;
          
          // All other BBPS services use generic Bill Payment Flow
          default: 
            if(service.category === 'BBPS') return <BillPaymentFlow category={service.id === 'elec' ? 'ELEC' : service.id.toUpperCase()} onSuccess={setSuccess} processPayment={processPayment} />;
            return <div className="p-8 text-center text-gray-500">Service Under Maintenance</div>;
      }
  };

  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className={`bg-white w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${service.category==='TRAVEL'?'max-w-3xl':'max-w-md'}`}>
        <div className="bg-blue-700 px-6 py-4 flex justify-between items-center text-white">
           <div className="flex items-center gap-3"><service.icon size={20}/> <h2 className="font-bold">{service.title}</h2></div>
           <button onClick={onClose}><X size={24}/></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{renderContent()}</div>
      </div>
    </div>
  );
};

export default ServiceModal;
