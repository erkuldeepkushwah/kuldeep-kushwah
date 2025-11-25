import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { Loader2, CheckCircle2, Users, ShieldCheck } from 'lucide-react';
import Hero from './components/Hero';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import LoginModal from './components/LoginModal';
import AiAssistant from './components/AiAssistant';
import { SERVICES } from './constants';
import { ServiceItem } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // --- ADMIN VIEW ---
  if (isAdminLoggedIn) {
      return <AdminDashboard onLogout={() => setIsAdminLoggedIn(false)} />;
  }

  // --- USER VIEW ---
  return (
    <>
      {user ? (
        <Dashboard user={user} />
      ) : (
        <div className="min-h-screen flex flex-col">
          {/* Landing Page Header */}
          <nav className="bg-white py-4 px-6 shadow-sm flex justify-between items-center sticky top-0 z-50 h-[80px]">
            <div 
              className="flex items-center gap-2 text-blue-900 cursor-pointer group" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
               <span className="bg-blue-800 p-1.5 rounded text-white group-hover:bg-blue-700 transition">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </span>
              <span className="text-2xl font-bold tracking-tight">SparkPe</span>
            </div>
            <div className="hidden md:flex gap-[50px]">
              <a href="#home" className="text-lg font-bold text-gray-700 hover:text-blue-800 transition-colors">Home</a>
              <a href="#services" className="text-lg font-bold text-gray-700 hover:text-blue-800 transition-colors">Services</a>
              <a href="#about" className="text-lg font-bold text-gray-700 hover:text-blue-800 transition-colors">About Us</a>
              <a href="#contact" className="text-lg font-bold text-gray-700 hover:text-blue-800 transition-colors">Contact</a>
            </div>
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-blue-800 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-blue-900 transition shadow-lg shadow-blue-200 hover:-translate-y-0.5 transform"
            >
              Login
            </button>
          </nav>

          <main className="flex-grow">
            {/* Home / Hero Section */}
            <div id="home" className="scroll-mt-20">
              <Hero onLoginClick={() => setIsLoginModalOpen(true)} />
            </div>
            
            {/* Services Preview Section */}
            <div id="services" className="py-20 bg-white scroll-mt-32">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 animate-in slide-in-from-bottom-10 duration-700">
                  <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
                  <div className="w-20 h-1 bg-blue-600 mx-auto mt-4"></div>
                  <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                    We provide a wide range of digital services to help you grow your business and serve your customers better.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Preview Cards */}
                  {[
                    { title: 'Banking', desc: 'Credit Card, DMT, AEPS, Micro ATM', icon: SERVICES.find(s => s.id === 'aeps')?.icon, color: 'text-blue-600' },
                    { title: 'Bill Payments (BBPS)', desc: 'Recharge, DTH, Electricity, Water, Gas', icon: SERVICES.find(s => s.id === 'elec')?.icon, color: 'text-green-600' },
                    { title: 'Travel', desc: 'Flights, Trains, Buses, Hotels', icon: SERVICES.find(s => s.id === 'flight')?.icon, color: 'text-orange-600' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-xl transition duration-300 border border-gray-100 group">
                      <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        {item.icon && <item.icon className={`w-10 h-10 ${item.color}`} />}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                      <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* About Us Section */}
            <div id="about" className="py-20 bg-gray-50 scroll-mt-32 border-t border-gray-200">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-16 animate-in slide-in-from-bottom-10 duration-700">
                    <h2 className="text-3xl font-bold text-gray-900">About SparkPe</h2>
                    <div className="w-20 h-1 bg-blue-600 mx-auto mt-4"></div>
                    <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        SparkPe is India's fastest-growing B2B Fintech platform, empowering retailers and merchants to provide digital banking and financial services to their customers.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                      <div className="relative">
                          <div className="absolute -inset-4 bg-blue-600/10 rounded-2xl transform rotate-3"></div>
                          <img 
                            src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80" 
                            alt="Team meeting" 
                            className="relative rounded-2xl shadow-xl w-full hover:scale-[1.02] transition duration-500"
                          />
                      </div>
                      <div className="space-y-8">
                          <div>
                             <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h3>
                             <p className="text-gray-600 leading-relaxed">
                                  To bridge the digital divide in India by enabling every local retailer to become a 'Digital Pradhan' and provide essential financial services to the last mile. We believe in simplifying technology for everyone.
                             </p>
                          </div>
                          
                          <div className="space-y-4">
                              <div className="flex items-start gap-4">
                                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-1">
                                    <Users size={20} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-gray-900">10,000+ Active Retailers</h4>
                                      <p className="text-sm text-gray-500">Trusted by thousands of businesses across India.</p>
                                  </div>
                              </div>
                              <div className="flex items-start gap-4">
                                  <div className="bg-green-100 p-2 rounded-lg text-green-600 mt-1">
                                    <CheckCircle2 size={20} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-gray-900">Best Commission Rates</h4>
                                      <p className="text-sm text-gray-500">Maximize your earnings with our industry-leading margins.</p>
                                  </div>
                              </div>
                              <div className="flex items-start gap-4">
                                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mt-1">
                                    <ShieldCheck size={20} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-gray-900">Secure & Reliable</h4>
                                      <p className="text-sm text-gray-500">99.9% success rate with 24/7 customer support.</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
               </div>
            </div>

            {/* CTA Section */}
            <div className="bg-blue-800 py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Start Your Journey Today</h2>
                    <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                        Join the digital revolution. Sign up now and start earning more with SparkPe's comprehensive suite of B2B services.
                    </p>
                    <button 
                        onClick={() => setIsLoginModalOpen(true)}
                        className="bg-white text-blue-900 font-bold py-4 px-12 rounded-full hover:bg-blue-50 transition shadow-xl transform hover:-translate-y-1"
                    >
                        Join Now
                    </button>
                </div>
            </div>
          </main>

          <div id="contact" className="scroll-mt-24">
            <Footer />
          </div>
          
          <LoginModal 
            isOpen={isLoginModalOpen} 
            onClose={() => setIsLoginModalOpen(false)} 
            onAdminLogin={() => setIsAdminLoggedIn(true)}
          />
        </div>
      )}
      <AiAssistant />
    </>
  );
};

export default App;