import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLogin: () => void;
  initialState?: 'LOGIN' | 'SIGNUP';
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onAdminLogin, initialState = 'LOGIN' }) => {
  const [isSignUp, setIsSignUp] = useState(initialState === 'SIGNUP');
  const [name, setName] = useState('');
  const [userInput, setUserInput] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync state when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
        setIsSignUp(initialState === 'SIGNUP');
        setError('');
        setName('');
        setUserInput('');
        setPassword('');
    }
  }, [isOpen, initialState]);

  if (!isOpen) return null;

  // Helper to create a fake email from mobile number for Firebase Auth
  const getEmail = (mob: string) => `${mob}@sparkpe.in`;

  const createUserEntry = async (user: any, userName: string, mobile: string, email: string) => {
    await updateProfile(user, { displayName: userName });
    await set(ref(db, 'users/' + user.uid), {
        uid: user.uid,
        displayName: userName,
        mobile: mobile,
        email: email,
        balance: 0.00,
        commission: 0.00,
        createdAt: new Date().toISOString()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- ADMIN CHECK ---
    if (userInput === 'Admin' && password === '125607') {
        setTimeout(async () => {
            // Ensure any previous user is signed out so we are in clean "Admin" state
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

        try {
            // 1. Try to Create User in Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // 2. Create User Entry in RTDB
            await createUserEntry(userCredential.user, name, userInput, email);
        } catch (authError: any) {
            // HANDLE DELETED USER CASE:
            // If email exists in Auth but NOT in DB (Admin deleted them), allow re-registration.
            if (authError.code === 'auth/email-already-in-use') {
                try {
                    // Try to login to verify ownership
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    const userRef = ref(db, 'users/' + userCredential.user.uid);
                    const snapshot = await get(userRef);

                    if (!snapshot.exists()) {
                        // User was deleted from DB. Re-create DB entry.
                        await createUserEntry(userCredential.user, name, userInput, email);
                    } else {
                        throw authError; // Real duplicate
                    }
                } catch (recoveryError) {
                    // If login failed (wrong password) or other error, throw original "Already in use"
                    throw authError;
                }
            } else {
                throw authError;
            }
        }

      } else {
        // Login Logic
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // CHECK IF USER EXISTS IN DB (If deleted by Admin, snapshot will be null)
        const userRef = ref(db, 'users/' + userCredential.user.uid);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists()) {
            await signOut(auth);
            setError("This account has been deactivated. Please Sign Up again to reactivate.");
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
         setError("This Number is already registered. Please Login.");
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url('https://uploads.onecompiler.io/43b6sbecd/445m548rb/c9a2740e-ec1f-451d-a0b4-5e7bd7ff9f34.png')" }}
    >
      {/* Dark Overlay for better focus */}
      <div className="absolute inset-0 bg-blue-900/70 backdrop-blur-[2px]"></div>

      <div className="bg-white shadow-2xl w-full max-w-[400px] overflow-hidden relative animate-in zoom-in duration-200 z-10">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black z-10">
            <X size={24} />
        </button>

        <div className="px-8 py-10">
            {/* Logo Section */}
            <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="bg-blue-700 p-1.5 text-white">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="0"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    </span>
                    <span className="text-3xl font-bold text-blue-700 tracking-tight font-sans" style={{ fontFamily: 'sans-serif' }}>SparkPe</span>
                </div>
                <h2 className="text-blue-700 font-bold text-lg uppercase tracking-wide">
                    {isSignUp ? 'REGISTER as Partner' : 'LOGIN as Partner'}
                </h2>
                <div className="h-0.5 w-full bg-gray-200 mt-4"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 text-red-600 p-2 text-sm font-bold text-center border border-red-100">
                        {error}
                    </div>
                )}
                
                {isSignUp && (
                    <div>
                        <label className="block text-sm font-bold text-black mb-1 ml-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full px-4 py-3 bg-blue-50 border-2 border-blue-100 text-black font-bold placeholder:font-normal focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-base placeholder:text-gray-500"
                            placeholder="Enter your Name"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-black mb-1 ml-1">User ID</label>
                    <input
                        type="text" 
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="block w-full px-4 py-3 bg-blue-50 border-2 border-blue-100 text-black font-bold placeholder:font-normal focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-base placeholder:text-gray-500"
                        placeholder="Mobile Number"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-black mb-1 ml-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full px-4 py-3 bg-blue-50 border-2 border-blue-100 text-black font-bold placeholder:font-normal focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition text-base tracking-widest placeholder:text-gray-500"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-6 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition text-lg uppercase shadow-lg mt-4"
                >
                    {loading ? (
                        <Loader2 className="animate-spin mx-auto" size={24} />
                    ) : (
                        isSignUp ? 'Sign Up' : 'LOGIN'
                    )}
                </button>

                <div className="mt-4 flex justify-center items-center">
                     <button 
                        type="button"
                        onClick={toggleMode}
                        className="text-black font-bold text-base hover:underline"
                    >
                        {isSignUp ? 'Login Here' : 'New User? Sign Up'}
                    </button>
                </div>
            </form>
        </div>

      </div>
    </div>
  );
};

export default LoginModal;