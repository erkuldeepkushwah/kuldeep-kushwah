import React, { useEffect, useState } from 'react';
import { LogOut, Wallet, TrendingUp, PlusCircle, History } from 'lucide-react';
import { SERVICES } from '../constants';
import { ServiceItem } from '../types';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import ServiceModal from './ServiceModal';
import AddMoneyModal from './AddMoneyModal';
import CommissionModal from './CommissionModal';

interface DashboardProps {
  user: any; // Firebase User
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [balance, setBalance] = useState<number>(0);
  const [userName, setUserName] = useState<string>(user.displayName || 'Retailer');
  const [activeService, setActiveService] = useState<ServiceItem | null>(null);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [commissionBalance, setCommissionBalance] = useState(420.00);
  
  // Realtime Database listener for user data
  useEffect(() => {
    if (user?.uid) {
      // Listen for the entire user node to check existence
      const userRef = ref(db, 'users/' + user.uid);
      const unsub = onValue(userRef, (snapshot) => {
        if (!snapshot.exists()) {
          // User has been deleted by Admin
          signOut(auth);
          return;
        }

        const data = snapshot.val();
        if (data) {
          if (data.balance !== undefined) setBalance(Number(data.balance));
          if (data.displayName) setUserName(data.displayName);
        }
      });

      return () => {
        unsub();
      }
    }
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
  };

  const renderServiceCard = (item: ServiceItem) => (
    <div 
      key={item.id} 
      onClick={() => setActiveService(item)}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center group active:scale-95 duration-150"
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${item.color} group-hover:scale-110 transition-transform`}>
        <item.icon size={24} />
      </div>
      <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide group-hover:text-blue-600 transition-colors">{item.title}</h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-800">
            <span className="bg-blue-700 p-1.5 rounded text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </span>
            <span className="text-2xl font-bold">SparkPe</span>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Wallet Balance Card (Minimal Version) */}
            <div 
              onClick={() => setIsAddMoneyOpen(true)}
              className="hidden md:flex items-center bg-blue-50 border border-blue-100 rounded-full p-1.5 pr-4 cursor-pointer hover:bg-blue-100 transition-colors group shadow-sm"
              title="Click to Add Money"
            >
              <div className="bg-blue-600 text-white p-2 rounded-full group-hover:scale-105 transition-transform">
                <Wallet size={20} />
              </div>
              <div className="ml-3">
                <div className="text-lg font-bold text-blue-800 leading-none tracking-tight">₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4 pl-4 md:border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-800 capitalize">{userName}</div>
                <div className="text-xs text-gray-500">ID: {user.uid.substring(0, 6).toUpperCase()}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-red-50 text-red-600 p-2 rounded-full hover:bg-red-100 transition"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500">Welcome back, <span className="font-semibold">{userName}</span></p>
            
            {/* Commission Section - Clickable */}
            <button 
                onClick={() => setIsCommissionOpen(true)}
                className="mt-4 bg-white border border-blue-100 p-4 rounded-lg flex items-center text-blue-700 text-sm font-medium w-fit hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer group"
            >
                <div className="bg-blue-100 p-2 rounded-full mr-3 group-hover:bg-blue-200 transition">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <div className="text-xs text-gray-500">Commission Earned Today</div>
                    <div className="text-lg font-bold">₹{commissionBalance.toFixed(2)}</div>
                </div>
                <div className="ml-4 text-blue-400">
                    <History size={16} />
                </div>
            </button>
        </div>

        {/* Mobile Wallet Card (Visible only on small screens) */}
        <div 
          onClick={() => setIsAddMoneyOpen(true)}
          className="md:hidden bg-blue-600 text-white p-4 rounded-xl shadow-lg flex justify-between items-center cursor-pointer active:scale-95 transition-transform"
        >
           <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-full">
                <Wallet size={24} />
             </div>
             <div>
                <div className="text-blue-100 text-xs font-medium mb-1 uppercase">Wallet Balance</div>
                <div className="text-2xl font-bold">₹ {balance.toLocaleString('en-IN')}</div>
             </div>
           </div>
        </div>

        {/* Section: Banking */}
        <section>
            <div className="flex items-center gap-2 mb-4 border-l-4 border-blue-600 pl-3">
                <h2 className="text-lg font-bold text-gray-800">Banking & Financial Services</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {SERVICES.filter(s => s.category === 'BANKING').map(renderServiceCard)}
            </div>
        </section>

        {/* Section: BBPS */}
        <section>
            <div className="flex items-center gap-2 mb-4 border-l-4 border-yellow-500 pl-3">
                <h2 className="text-lg font-bold text-gray-800">Bill Payments (BBPS)</h2>
                <span className="bg-gray-200 text-xs px-2 py-0.5 rounded text-gray-600 font-bold">Bharat BillPay</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {SERVICES.filter(s => s.category === 'BBPS').map(renderServiceCard)}
            </div>
        </section>

        {/* Section: Travel */}
        <section>
            <div className="flex items-center gap-2 mb-4 border-l-4 border-orange-500 pl-3">
                <h2 className="text-lg font-bold text-gray-800">Travel Booking</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {SERVICES.filter(s => s.category === 'TRAVEL').map(renderServiceCard)}
            </div>
        </section>

      </main>

      {/* Service Modal */}
      <ServiceModal 
        service={activeService} 
        onClose={() => setActiveService(null)} 
        userUid={user.uid}
        currentBalance={balance}
      />

      {/* Add Money Modal */}
      <AddMoneyModal 
        isOpen={isAddMoneyOpen} 
        onClose={() => setIsAddMoneyOpen(false)} 
        userUid={user.uid}
      />

      {/* Commission Modal */}
      <CommissionModal
        isOpen={isCommissionOpen}
        onClose={() => setIsCommissionOpen(false)}
        userUid={user.uid}
        commissionBalance={commissionBalance}
        onRedeemSuccess={() => setCommissionBalance(0)}
      />
    </div>
  );
};

export default Dashboard;