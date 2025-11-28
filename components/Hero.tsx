import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onLoginClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onLoginClick }) => {
  return (
    <div 
      className="relative w-full h-[600px] lg:h-[700px] flex items-center bg-cover bg-center" 
      style={{ backgroundImage: "url('https://uploads.onecompiler.io/43b6sbecd/445m548rb/c9a2740e-ec1f-451d-a0b4-5e7bd7ff9f34.png')" }}
    >
      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-blue-900/80"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 w-full">
        <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 animate-in slide-in-from-bottom-5 duration-700">
              Grow Your Business with <span className="text-yellow-400">SparkPe</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl animate-in slide-in-from-bottom-5 duration-700 delay-150">
              All-in-one B2B platform: Recharge, BBPS, DMT, AEPS, Credit Card & Travel Booking. 
              Join India's leading B2B portal for retailers.
            </p>
            
            <div className="flex flex-wrap gap-4 animate-in slide-in-from-bottom-5 duration-700 delay-300">
              <button 
                onClick={onLoginClick}
                className="bg-white text-blue-900 font-bold py-4 px-10 rounded-full hover:bg-blue-50 transition flex items-center gap-2 shadow-lg shadow-blue-900/20 text-lg transform hover:-translate-y-1"
              >
                Partner Login <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-transparent border-2 border-blue-300 text-white font-bold py-4 px-10 rounded-full hover:bg-white/10 transition text-lg transform hover:-translate-y-1"
              >
                Contact Sales
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;