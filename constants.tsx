import { 
  CreditCard, Banknote, Fingerprint, Smartphone, 
  Tv, Lightbulb, Flame, Wifi, 
  Car, Landmark, Shield, Train, Plane, Bus, Hotel, 
  Briefcase, PlayCircle, Palmtree
} from "lucide-react";
import { ServiceItem } from "./types";

export const SERVICES: ServiceItem[] = [
  // Banking
  { id: 'cc', title: 'CREDIT CARD PAY', icon: CreditCard, color: 'bg-purple-100 text-purple-600', category: 'BANKING' },
  { id: 'dmt', title: 'MONEY TRANSFER', icon: Banknote, color: 'bg-green-100 text-green-600', category: 'BANKING' },
  { id: 'aeps', title: 'AEPS PAYMENT', icon: Fingerprint, color: 'bg-blue-100 text-blue-600', category: 'BANKING' },
  { id: 'matm', title: 'MICRO ATM', icon: Briefcase, color: 'bg-teal-100 text-teal-600', category: 'BANKING' },

  // BBPS
  { id: 'mob', title: 'MOBILE RECHARGE', icon: Smartphone, color: 'bg-purple-100 text-purple-600', category: 'BBPS' },
  { id: 'dth', title: 'DTH', icon: Tv, color: 'bg-pink-100 text-pink-600', category: 'BBPS' },
  { id: 'elec', title: 'ELECTRICITY BILL', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600', category: 'BBPS' },
  { id: 'gas', title: 'GAS CYLINDER', icon: Flame, color: 'bg-orange-100 text-orange-600', category: 'BBPS' },
  { id: 'broadband', title: 'BROADBAND', icon: Wifi, color: 'bg-indigo-100 text-indigo-600', category: 'BBPS' },
  { id: 'fastag', title: 'FASTAG', icon: Car, color: 'bg-gray-200 text-gray-700', category: 'BBPS' },
  { id: 'loan', title: 'LOAN EMI', icon: Landmark, color: 'bg-green-100 text-green-700', category: 'BBPS' },
  { id: 'ins', title: 'INSURANCE', icon: Shield, color: 'bg-red-100 text-red-600', category: 'BBPS' },
  { id: 'subscription', title: 'OTT SUBSCRIPTION', icon: PlayCircle, color: 'bg-red-50 text-red-600', category: 'BBPS' },

  // Travel
  { id: 'flight', title: 'FLIGHT', icon: Plane, color: 'bg-blue-100 text-blue-500', category: 'TRAVEL' },
  { id: 'train', title: 'TRAIN', icon: Train, color: 'bg-orange-100 text-orange-600', category: 'TRAVEL' },
  { id: 'bus', title: 'BUS', icon: Bus, color: 'bg-red-100 text-red-500', category: 'TRAVEL' },
  { id: 'hotel', title: 'HOTEL', icon: Hotel, color: 'bg-purple-100 text-purple-500', category: 'TRAVEL' },
  { id: 'holiday', title: 'HOLIDAY PACKAGES', icon: Palmtree, color: 'bg-teal-100 text-teal-600', category: 'TRAVEL' },
];