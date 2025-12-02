import { LucideIcon } from "lucide-react";

export interface ServiceItem {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string; // Tailwind color class for icon background
  category: 'BANKING' | 'BBPS' | 'TRAVEL' | 'OTHER';
}

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  walletBalance: number;
}

export interface DashboardSectionProps {
  title: string;
  items: ServiceItem[];
}

export interface PaymentRequest {
  id: string;
  userUid: string;
  amount: number;
  method: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
  userName?: string; // Optional for display
}

export interface Enquiry {
  id: string;
  name: string;
  mobile: string;
  message: string;
  date: string;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  language: string;
  format: string; // 2D, 3D, IMAX
}