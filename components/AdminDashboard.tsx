import React, { useState, useEffect } from 'react';
import { ref, onValue, update, runTransaction, remove } from 'firebase/database';
import { db } from '../firebaseConfig';
import { PaymentRequest } from '../types';
import { LogOut, Users, RefreshCw, CheckCircle, XCircle, Wallet, Trash2 } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    // Listen for Requests
    const reqRef = ref(db, 'requests');
    const reqUnsub = onValue(reqRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const list = Object.values(data) as PaymentRequest[];
            setRequests(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
            setRequests([]);
        }
    });

    // Listen for Users
    const userRef = ref(db, 'users');
    const userUnsub = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Safely map users ensuring uid is present
            const list = Object.entries(data).map(([key, value]: [string, any]) => ({
                ...value,
                uid: key // Ensure UID is taken from the key if missing in value
            }));
            setUsers(list);
        } else {
            setUsers([]);
        }
        setLoading(false);
    });

    return () => {
        reqUnsub();
        userUnsub();
    };
  }, []);

  const handleApprove = async (req: PaymentRequest) => {
    if (!confirm(`Approve ₹${req.amount} for User? A 1% service charge will be deducted.`)) return;

    try {
        const serviceCharge = req.amount * 0.01;
        const finalAmount = req.amount - serviceCharge;

        // 1. Update User Balance
        const balanceRef = ref(db, `users/${req.userUid}/balance`);
        await runTransaction(balanceRef, (current) => {
            return (current || 0) + finalAmount;
        });

        // 2. Update Request Status
        await update(ref(db, `requests/${req.id}`), {
            status: 'APPROVED'
        });

        alert("Request Approved. Balance Updated.");
    } catch (e) {
        console.error("Approval Error", e);
        alert("Failed to approve.");
    }
  };

  const handleReject = async (id: string) => {
      if (!confirm("Reject this request?")) return;
      try {
          await update(ref(db, `requests/${id}`), {
              status: 'REJECTED'
          });
      } catch (e) {
          alert("Failed to reject");
      }
  };

  const handleDeleteUser = async (e: React.MouseEvent, uid: string) => {
      e.stopPropagation(); // Prevent any parent click events
      if (!uid) {
          alert("Error: Invalid User ID");
          return;
      }
      
      if (!confirm("Are you sure you want to PERMANENTLY DELETE this user? They will lose access immediately.")) return;
      
      try {
          console.log(`Attempting to delete user: users/${uid}`);
          // Remove user data from Realtime Database
          const userRef = ref(db, `users/${uid}`);
          await remove(userRef);
          alert("User data deleted from Firebase. Access revoked.");
      } catch (error: any) {
          console.error("Delete Error", error);
          alert(`Failed to delete user: ${error.message}`);
      }
  };

  // Helper to get user name by UID
  const getUserName = (uid: string) => {
      const user = users.find(u => u.uid === uid);
      return user?.displayName || user?.mobile || 'Unknown User';
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
        {/* Admin Navbar */}
        <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <span className="bg-red-600 px-2 py-0.5 rounded text-sm uppercase">Admin</span>
                    SparkPe Panel
                </div>
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm transition"
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-semibold uppercase">Pending Requests</h3>
                        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full"><RefreshCw size={20} /></div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">
                        {requests.filter(r => r.status === 'PENDING').length}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-semibold uppercase">Total Users</h3>
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Users size={20} /></div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">
                        {users.length}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-semibold uppercase">Total Wallet Holding</h3>
                        <div className="p-2 bg-green-100 text-green-600 rounded-full"><Wallet size={20} /></div>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">
                        ₹{users.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-300">
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-4 font-semibold text-sm transition ${activeTab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Balance Requests
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 px-4 font-semibold text-sm transition ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    All Retailers
                </button>
            </div>

            {/* Tab Content: REQUESTS */}
            {activeTab === 'requests' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Retailer</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Method</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {requests.map(req => (
                                <tr key={req.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-gray-500">{req.date}</td>
                                    <td className="p-4 font-medium text-gray-800">
                                        {getUserName(req.userUid)}
                                        <div className="text-xs text-gray-400 font-mono">{req.userUid.slice(0,6)}...</div>
                                    </td>
                                    <td className="p-4 font-bold text-gray-800">₹{req.amount}</td>
                                    <td className="p-4 text-gray-600">{req.method}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {req.status === 'PENDING' && (
                                            <div className="flex gap-2 justify-end">
                                                <button 
                                                    onClick={() => handleReject(req.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                    title="Reject"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                                <button 
                                                    onClick={() => handleApprove(req)}
                                                    className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-1"
                                                >
                                                    <CheckCircle size={14} /> Approve
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">No requests found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tab Content: USERS */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Mobile / ID</th>
                                <th className="p-4">Wallet Balance</th>
                                <th className="p-4">Commission Bal</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {users.map(u => (
                                <tr key={u.uid} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{u.displayName || 'N/A'}</td>
                                    <td className="p-4 text-gray-600">{u.mobile || u.email}</td>
                                    <td className="p-4 font-bold text-blue-600">₹{Number(u.balance || 0).toFixed(2)}</td>
                                    <td className="p-4 font-bold text-green-600">₹{Number(u.commission || 0).toFixed(2)}</td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={(e) => handleDeleteUser(e, u.uid)}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-2 border border-red-200 ml-auto"
                                            title="Delete User"
                                        >
                                            <Trash2 size={16} /> <span className="text-xs font-bold">Delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                             {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminDashboard;