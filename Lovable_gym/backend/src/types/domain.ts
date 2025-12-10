export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface AccessScheduleEntry {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export interface ClientEntity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  emergencyContact: EmergencyContact;
  packageType: string;
  packageStartDate: string;
  packageEndDate: string;
  packageAmount: number;
  amountPaid: number;
  pendingAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  esslUserId?: string | null;
  fingerprintEnrolled: boolean;
  accessSchedule: AccessScheduleEntry[];
  isAccessActive: boolean;
  lastAccessTime?: string | null;
  accessAttempts: number;
  status: 'active' | 'inactive' | 'expired' | 'suspended';
  photo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccessLogEntity {
  id: string;
  clientId: string;
  esslUserId: string;
  timestamp: string;
  accessGranted: boolean;
  reason: string;
  biometricType: 'fingerprint' | 'face';
  deviceIp?: string | null;
  source: 'direct-device' | 'etimetrack';
  createdAt: string;
  client?: Pick<ClientEntity, 'firstName' | 'lastName' | 'email' | 'phone' | 'photo'>;
}

export interface PackageEntity {
  id: string;
  name: string;
  description: string;
  duration: number;
  amount: number;
  timingSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  accessSchedule: {
    startTime: string;
    endTime: string;
  };
  isActive: boolean;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'admin' | 'trainer' | 'staff';
  profilePhoto?: string | null;
  notifications: {
    newMemberSignUps: boolean;
    classCancellations: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GymSettingsEntity {
  id: string;
  gymName: string;
  gymEmail: string;
  gymPhone: string;
  gymAddress: string;
  gymLogo?: string | null;
  openingHours?: Record<string, { open: string; close: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListResult {
  clients: ClientEntity[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  expiredClients: number;
  suspendedClients: number;
  enrolledClients: number;
  accessActiveClients: number;
  enrollmentRate: number;
  revenue: {
    total: number;
    paid: number;
    pending: number;
  };
}

export interface DashboardStats {
  todayStats: {
    totalAttempts: number;
    granted: number;
    denied: number;
    successRate: number;
  };
  clientStats: {
    activeClients: number;
    enrolledClients: number;
    enrollmentRate: number;
  };
  recentAttempts: AccessLogEntity[];
  lastHourAttempts: number;
}



