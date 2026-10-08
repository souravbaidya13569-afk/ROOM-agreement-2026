import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AgreementHistory,
  ExpenseBreakdown,
  ExpenseData,
  Member,
  PaymentLog,
  PaymentStatus,
  UserRole
} from '../types';

export const MAX_MEMBERS = 23;
export const AGREEMENT_PERIOD = 'Oct - Dec 2026';

const AVATAR_COLORS = [
  '#4F46E5', '#7C3AED', '#2563EB', '#0D9488',
  '#059669', '#D97706', '#DC2626', '#DB2777',
  '#4338CA', '#0284C7', '#16A34A', '#CA8A04'
];

export function getRandomColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/**
 * Calculates per-person expense breakdown based on bill payers counts
 */
export function calculateBreakdown(expense: ExpenseData, members: Member[]): ExpenseBreakdown {
  const rentTotal = Number(expense?.rent) || 0;
  const currentTotal = Number(expense?.currentBill) || 0;
  const wifiTotal = Number(expense?.wifi) || 0;
  const otherTotal = Number(expense?.other) || 0;
  const totalExpense = rentTotal + currentTotal + wifiTotal + otherTotal;

  const rentPayersCount = members.filter(m => m.paysRent).length;
  const currentPayersCount = members.filter(m => m.paysCurrent).length;
  const wifiPayersCount = members.filter(m => m.paysWifi).length;
  const otherPayersCount = members.filter(m => m.paysOther).length;

  const rentPerPerson = rentPayersCount > 0 ? Math.round((rentTotal / rentPayersCount) * 100) / 100 : 0;
  const currentPerPerson = currentPayersCount > 0 ? Math.round((currentTotal / currentPayersCount) * 100) / 100 : 0;
  const wifiPerPerson = wifiPayersCount > 0 ? Math.round((wifiTotal / wifiPayersCount) * 100) / 100 : 0;
  const otherPerPerson = otherPayersCount > 0 ? Math.round((otherTotal / otherPayersCount) * 100) / 100 : 0;

  return {
    rentTotal,
    currentTotal,
    wifiTotal,
    otherTotal,
    totalExpense,
    rentPayersCount,
    currentPayersCount,
    wifiPayersCount,
    otherPayersCount,
    rentPerPerson,
    currentPerPerson,
    wifiPerPerson,
    otherPerPerson,
  };
}

/**
 * Calculates individual member's due based on assigned bills
 */
export function calculateMemberDue(member: Member, breakdown: ExpenseBreakdown): number {
  let due = 0;
  if (member.paysRent) due += breakdown.rentPerPerson;
  if (member.paysCurrent) due += breakdown.currentPerPerson;
  if (member.paysWifi) due += breakdown.wifiPerPerson;
  if (member.paysOther) due += breakdown.otherPerPerson;
  return Math.round(due * 100) / 100;
}

/**
 * Determines payment status: Paid (green), Partial (yellow), Unpaid (red)
 */
export function getPaymentStatus(due: number, paid: number): PaymentStatus {
  if (due <= 0) return 'Paid';
  if (paid >= due - 0.5) return 'Paid';
  if (paid > 0) return 'Partial';
  return 'Unpaid';
}

/**
 * Subscribes to the "members" collection in real time
 */
export function subscribeToMembers(
  onUpdate: (members: Member[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'members';
  const q = query(collection(db, path), orderBy('memberOrder', 'asc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Member[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || 'Member',
          mobile: data.mobile || '',
          password: data.password || '',
          role: data.role || 'Member',
          memberOrder: Number(data.memberOrder) || 1,
          paysRent: data.paysRent !== false,
          paysWifi: data.paysWifi !== false,
          paysCurrent: data.paysCurrent !== false,
          paysOther: data.paysOther !== false,
          paidAmount: Number(data.paidAmount) || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          avatarColor: data.avatarColor || getRandomColor(data.memberOrder || 0),
        });
      });
      onUpdate(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Subscribes to the "expense/current" document in real time
 */
export function subscribeToCurrentExpense(
  onUpdate: (expense: ExpenseData) => void,
  onError?: (err: Error) => void
) {
  const path = 'expense/current';
  const docRef = doc(db, 'expense', 'current');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          period: data.period || AGREEMENT_PERIOD,
          rent: Number(data.rent) || 0,
          currentBill: Number(data.currentBill) || 0,
          wifi: Number(data.wifi) || 0,
          other: Number(data.other) || 0,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
        });
      } else {
        // Initialize default expense document if not yet present
        const defaultData: ExpenseData = {
          period: AGREEMENT_PERIOD,
          rent: 24000,
          currentBill: 3600,
          wifi: 1500,
          other: 900,
          updatedAt: new Date().toISOString(),
          updatedBy: 'System Initializer',
        };
        setDoc(docRef, defaultData).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, path);
        });
        onUpdate(defaultData);
      }
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Subscribes to payment transactions
 */
export function subscribeToPayments(
  onUpdate: (payments: PaymentLog[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'payments';
  const q = query(collection(db, path), orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: PaymentLog[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          memberId: data.memberId,
          memberName: data.memberName,
          amount: Number(data.amount) || 0,
          recordedBy: data.recordedBy,
          timestamp: data.timestamp,
          note: data.note,
        });
      });
      onUpdate(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Subscribes to agreement history
 */
export function subscribeToHistory(
  onUpdate: (history: AgreementHistory[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'history';
  const q = query(collection(db, path), orderBy('archivedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: AgreementHistory[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          period: data.period,
          totalExpense: Number(data.totalExpense) || 0,
          archivedAt: data.archivedAt,
          archivedBy: data.archivedBy,
          expenseSnapshot: data.expenseSnapshot,
          membersSummary: data.membersSummary,
          notes: data.notes,
        });
      });
      onUpdate(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Registers a new member:
 * Rule 1: 1st user is Admin, next 2 users are Editor, rest up to 23 are Member.
 * Max 23 members.
 */
export async function registerMember(
  name: string,
  mobile: string,
  password: string,
  currentMembers: Member[]
): Promise<Member> {
  const cleanMobile = mobile.trim();
  const cleanName = name.trim();

  if (!cleanName || !cleanMobile || !password) {
    throw new Error('Please provide Name, Mobile number, and Password.');
  }

  // Check if mobile already exists
  const exists = currentMembers.some(m => m.mobile.toLowerCase() === cleanMobile.toLowerCase());
  if (exists) {
    throw new Error('A member with this mobile number is already registered.');
  }

  if (currentMembers.length >= MAX_MEMBERS) {
    throw new Error(`Room agreement capacity is full (maximum ${MAX_MEMBERS} members allowed).`);
  }

  const memberOrder = currentMembers.length + 1;
  let role: UserRole = 'Member';
  if (memberOrder === 1) {
    role = 'Admin';
  } else if (memberOrder === 2 || memberOrder === 3) {
    role = 'Editor';
  }

  const memberId = `member_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newMember: Member = {
    id: memberId,
    name: cleanName,
    mobile: cleanMobile,
    password: password.trim(),
    role,
    memberOrder,
    paysRent: true,
    paysWifi: true,
    paysCurrent: true,
    paysOther: true,
    paidAmount: 0,
    createdAt: new Date().toISOString(),
    avatarColor: getRandomColor(memberOrder - 1),
  };

  const path = 'members';
  try {
    await setDoc(doc(db, path, memberId), newMember);
    return newMember;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${memberId}`);
  }
}

/**
 * Updates member bill assignments (Admin and Editor only)
 */
export async function updateMemberBills(
  memberId: string,
  bills: {
    paysRent?: boolean;
    paysWifi?: boolean;
    paysCurrent?: boolean;
    paysOther?: boolean;
  }
): Promise<void> {
  const path = `members/${memberId}`;
  try {
    const ref = doc(db, 'members', memberId);
    await updateDoc(ref, bills);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Adds payment for a member and logs the transaction
 */
export async function addPayment(
  memberId: string,
  memberName: string,
  amount: number,
  currentPaid: number,
  recordedBy: string,
  note?: string
): Promise<void> {
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const memberPath = `members/${memberId}`;
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const paymentsPath = `payments/${paymentId}`;

  const newTotalPaid = Math.round((currentPaid + amount) * 100) / 100;

  try {
    // 1. Update member document
    await updateDoc(doc(db, 'members', memberId), {
      paidAmount: newTotalPaid,
    });

    // 2. Add payment record log
    const log: PaymentLog = {
      id: paymentId,
      memberId,
      memberName,
      amount,
      recordedBy,
      timestamp: new Date().toISOString(),
      note: note?.trim() || `Added payment ₹${amount}`,
    };
    await setDoc(doc(db, 'payments', paymentId), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, memberPath);
  }
}

/**
 * Updates expense amounts (Admin and Editor only)
 */
export async function updateExpenses(
  expenseData: {
    rent: number;
    currentBill: number;
    wifi: number;
    other: number;
    period?: string;
  },
  updatedBy: string
): Promise<void> {
  const path = 'expense/current';
  try {
    const ref = doc(db, 'expense', 'current');
    await setDoc(
      ref,
      {
        rent: Number(expenseData.rent) || 0,
        currentBill: Number(expenseData.currentBill) || 0,
        wifi: Number(expenseData.wifi) || 0,
        other: Number(expenseData.other) || 0,
        period: expenseData.period || AGREEMENT_PERIOD,
        updatedAt: new Date().toISOString(),
        updatedBy,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Archives current agreement snapshot to history collection
 */
export async function archiveAgreement(
  expense: ExpenseData,
  members: Member[],
  breakdown: ExpenseBreakdown,
  archivedBy: string,
  customPeriod?: string,
  notes?: string
): Promise<void> {
  const period = customPeriod || expense.period || AGREEMENT_PERIOD;
  const historyId = `history_${Date.now()}`;
  const path = `history/${historyId}`;

  let totalCollected = 0;
  let totalDue = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;

  members.forEach((m) => {
    const due = calculateMemberDue(m, breakdown);
    totalDue += due;
    totalCollected += m.paidAmount;
    const status = getPaymentStatus(due, m.paidAmount);
    if (status === 'Paid') paidCount++;
    else if (status === 'Partial') partialCount++;
    else unpaidCount++;
  });

  const record: AgreementHistory = {
    id: historyId,
    period,
    totalExpense: breakdown.totalExpense,
    archivedAt: new Date().toISOString(),
    archivedBy,
    expenseSnapshot: { ...expense },
    membersSummary: {
      totalMembers: members.length,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100,
      paidCount,
      partialCount,
      unpaidCount,
    },
    notes: notes || `Archived agreement settlement for ${period}`,
  };

  try {
    await setDoc(doc(db, 'history', historyId), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Seed sample initial members if needed for demo/testing
 */
export async function seedDemoMembersIfEmpty(): Promise<void> {
  const membersSnap = await getDocs(collection(db, 'members'));
  if (!membersSnap.empty) return;

  // Let's create the 1st user (Admin), 2nd and 3rd users (Editors), plus 2 Members
  const sampleData = [
    { name: 'Rahul Sharma (Admin)', mobile: '9876543210', role: 'Admin' as UserRole, memberOrder: 1, paid: 1500 },
    { name: 'Amit Verma (Editor 1)', mobile: '9876543211', role: 'Editor' as UserRole, memberOrder: 2, paid: 1200 },
    { name: 'Priya Patel (Editor 2)', mobile: '9876543212', role: 'Editor' as UserRole, memberOrder: 3, paid: 500 },
    { name: 'Sourav Baidya', mobile: '9876543213', role: 'Member' as UserRole, memberOrder: 4, paid: 0 },
    { name: 'Karan Singh', mobile: '9876543214', role: 'Member' as UserRole, memberOrder: 5, paid: 800 },
  ];

  for (const s of sampleData) {
    const id = `member_demo_${s.memberOrder}`;
    await setDoc(doc(db, 'members', id), {
      id,
      name: s.name,
      mobile: s.mobile,
      password: 'password123',
      role: s.role,
      memberOrder: s.memberOrder,
      paysRent: true,
      paysWifi: true,
      paysCurrent: true,
      paysOther: true,
      paidAmount: s.paid,
      createdAt: new Date().toISOString(),
      avatarColor: getRandomColor(s.memberOrder - 1),
    });
  }
}
