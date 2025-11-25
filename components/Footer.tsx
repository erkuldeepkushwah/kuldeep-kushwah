import React from 'react';
import { Phone, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div>
            <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-blue-600 p-1 rounded text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </span>
              SparkPe
            </h3>
            <p className="text-sm leading-relaxed text-gray-400">
              India's leading B2B portal for retailers. Best margins on Recharge, DMT, AEPS, Credit Card and Travel Booking.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400">Mobile Recharge</a></li>
              <li><a href="#" className="hover:text-blue-400">Money Transfer</a></li>
              <li><a href="#" className="hover:text-blue-400">Train Booking</a></li>
              <li><a href="#" className="hover:text-blue-400">Credit Card Pay</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400">Generate Ticket</a></li>
              <li><a href="#" className="hover:text-blue-400">Contact Us</a></li>
              <li><a href="#" className="hover:text-blue-400">KYC Help</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> +91 7898-692133
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> support@sparkpe.in
              </li>
            </ul>
          </div>

        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} SparkPe. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;