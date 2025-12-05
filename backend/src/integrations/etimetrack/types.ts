export interface EtimetrackMemberPayload {
  userId: string;
  badgeNumber: string;
  name: string;
  cardNumber?: string;
  gender?: string;
  departmentId?: number;
  hireDate?: Date;
  expiryDate?: Date;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
  scheduleSummary?: string;
}

export interface EtimetrackLogRecord {
  userId: string | null;
  timestamp: Date;
  punchType?: string | null;
  deviceId?: string | null;
}

export interface EtimetrackStatus {
  enabled: boolean;
  userTable?: string;
  attendanceTable?: string;
  lastSync?: Date;
  notes?: string[];
}

export type ScheduleWindow = {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
};

