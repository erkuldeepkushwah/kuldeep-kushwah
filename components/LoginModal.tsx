import React, { useState } from 'react';
import { X, User, Lock, Loader2, Phone, UserPlus, LogIn } from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onAdminLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [userInput, setUserInput] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Helper to create a fake email from mobile number for Firebase Auth
  const getEmail = (mob: string) => `${mob}@sparkpe.in`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- ADMIN CHECK ---
    if (userInput === 'Admin' && password === '125607') {
        setTimeout(async () => {
            // Ensure any previous user is signed out so we are in clean "Admin" state
            // Note: Admin actions rely on open DB rules in this prototype
            await signOut(auth);
            setLoading(false);
            onAdminLogin();
            onClose();
        }, 1000);
        return;
    }
    // -------------------

    if (userInput.length < 10 && userInput !== 'Admin') {
      setError("Please enter a valid User ID.");
      setLoading(false);
      return;
    }

    try {
      const email = getEmail(userInput);

      if (isSignUp) {
        if (!name) {
            setError("Please enter your name.");
            setLoading(false);
            return;
        }
        // 1. Create User in Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Update Auth Profile
        await updateProfile(user, {
            displayName: name
        });

        // 3. Create User Entry in RTDB
        await set(ref(db, 'users/' + user.uid), {
            uid: user.uid,
            displayName: name,
            mobile: userInput,
            email: email,
            balance: 0.00,
            commission: 0.00,
            createdAt: new Date().toISOString()
        });

      } else {
        // Login Logic
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // CHECK IF USER EXISTS IN DB (If deleted by Admin, snapshot will be null)
        const userRef = ref(db, 'users/' + userCredential.user.uid);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists()) {
            await signOut(auth);
            setError("This account has been deactivated or deleted by the Admin.");
            setLoading(false);
            return;
        }
      }
      
      // Reset & Close
      setName('');
      setUserInput('');
      setPassword('');
      onClose();
    } catch (err: any) {
      console.error("Auth Error", err);
      if (err.code === 'auth/email-already-in-use') {
         setError("This User ID/Number is already registered. Please Login.");
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
         setError("Invalid User ID or Password.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
      setIsSignUp(!isSignUp);
      setError('');
      setName('');
      setUserInput('');
      setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-blue-700 p-6 text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
                <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white">
                {isSignUp ? 'Partner Sign Up' : 'Welcome Back'}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
                {isSignUp ? 'Join SparkPe and start your business' : 'Login to access your retailer dashboard'}
            </p>
        </div>

        {/* Form */}
        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}
                
                {isSignUp && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none text-gray-900"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">User ID or Number</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text" 
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none text-gray-900"
                            placeholder="Enter User ID (e.g. Mobile No)"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none text-gray-900"
                            placeholder="••••••"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-800 text-white font-bold py-3.5 px-4 rounded-lg hover:bg-blue-900 focus:ring-4 focus:ring-blue-300 transition flex justify-center items-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        isSignUp ? <><UserPlus size={20} /> Register</> : <><LogIn size={20} /> Secure Login</>
                    )}
                </button>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"} {' '}
                        <button 
                            type="button"
                            onClick={toggleMode}
                            className="text-blue-700 font-bold hover:underline focus:outline-none"
                        >
                            {isSignUp ? 'Login Here' : 'Partner Sign Up'}
                        </button>
                    </p>
                </div>
            </form>
        </div>

      </div>
    </div>
  );
};

export default LoginModal;