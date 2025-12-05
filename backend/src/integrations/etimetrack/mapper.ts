import type { ClientEntity } from '../../types/domain.js';
import { EtimetrackMemberPayload, ScheduleWindow } from './types.js';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const buildScheduleSummary = (schedule: ScheduleWindow[] = []): string => {
  if (!schedule || schedule.length === 0) {
    return 'No schedule configured';
  }

  const normalized = [...schedule].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  return normalized
    .map((s) => {
      if (!s.enabled) {
        return `${capitalize(s.day)}: disabled`;
      }
      return `${capitalize(s.day)} ${s.startTime}-${s.endTime}`;
    })
    .join(' | ');
};

export const deriveUserId = (client: ClientEntity): string => {
  if (client.esslUserId && client.esslUserId.trim().length > 0) {
    return client.esslUserId;
  }
  return `GYM${Date.now().toString().slice(-8)}`;
};

export const mapClientToPayload = (client: ClientEntity): EtimetrackMemberPayload => {
  const userId = deriveUserId(client);
  const toDate = (value?: string) => (value ? new Date(value) : undefined);

  return {
    userId,
    badgeNumber: userId,
    name: `${client.firstName} ${client.lastName}`.trim(),
    cardNumber: userId,
    gender: mapGender(client.gender),
    departmentId: 1,
    hireDate: toDate(client.packageStartDate),
    expiryDate: toDate(client.packageEndDate),
    phone: client.phone,
    email: client.email,
    status: client.isAccessActive && client.status === 'active' ? 'active' : 'inactive',
    scheduleSummary: buildScheduleSummary(client.accessSchedule as ScheduleWindow[]),
  };
};

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const mapGender = (gender: ClientEntity['gender']): string => {
  switch (gender) {
    case 'male':
      return 'M';
    case 'female':
      return 'F';
    default:
      return 'O';
  }
};



