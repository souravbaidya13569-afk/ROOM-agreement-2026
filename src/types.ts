export type UserRole = 'Admin' | 'Editor' | 'Member';

export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface Member {
  id: string;
  name: string;
  mobile: string;
  password?: string;
  role: UserRole;
  memberOrder: number; // 1 to 23
  paysRent: boolean;
  paysWifi: boolean;
  paysCurrent: boolean;
  paysOther: boolean;
  paidAmount: number;
  createdAt: string;
  avatarColor?: string;
}

export interface ExpenseData {
  period: string; // e.g. "Oct - Dec 2026"
  rent: number;
  currentBill: number;
  wifi: number;
  other: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface PaymentLog {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  recordedBy: string;
  timestamp: string;
  note?: string;
}

export interface AgreementHistory {
  id: string;
  period: string;
  totalExpense: number;
  archivedAt: string;
  archivedBy: string;
  expenseSnapshot: ExpenseData;
  membersSummary: {
    totalMembers: number;
    totalCollected: number;
    totalDue: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
  };
  notes?: string;
}

export interface ExpenseBreakdown {
  rentTotal: number;
  currentTotal: number;
  wifiTotal: number;
  otherTotal: number;
  totalExpense: number;
  
  rentPayersCount: number;
  currentPayersCount: number;
  wifiPayersCount: number;
  otherPayersCount: number;
  
  rentPerPerson: number;
  currentPerPerson: number;
  wifiPerPerson: number;
  otherPerPerson: number;
}
