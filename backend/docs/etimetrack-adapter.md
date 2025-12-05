# eTimeTrack Adapter Blueprint

This document describes how to extend the gym backend so it can push member profiles, schedules, and access decisions into the legacy `iclock` deployment through the new bridge API.

## Folder Structure

```
backend/
  src/
    integrations/
      etimetrack/
        client.ts        // HTTP wrapper around bridge API
        mapper.ts        // Converts gym models to eTimeTrack payloads
        sync.service.ts  // High-level orchestrator used by controllers/jobs
```

## Client (`client.ts`)

```ts
// Pseudocode
const http = axios.create({
  baseURL: process.env.ETIMETRACK_BRIDGE_URL,
  headers: { 'X-API-Key': process.env.ETIMETRACK_BRIDGE_KEY }
})

export async function upsertMember(payload: EtimetrackMemberPayload) {
  return http.post('/api/etimetrack/members', payload)
}

export async function updateSchedule(code: string, payload: EtimetrackSchedulePayload) {
  return http.put(`/api/etimetrack/members/${code}/schedule`, payload)
}

export async function fetchPunches(since: string) {
  return http.get('/api/etimetrack/punches', { params: { since } })
}
```

## Mapping Rules (`mapper.ts`)

- **Member identity**  
  - `employeeCode` ← `client.memberCode` (unique, numeric where possible)  
  - `deviceCode` ← `client.deviceId` (ESSL internal ID)  
  - `cardNumber` ← fallback to `client.rfid` or generated slug  
  - `employeeName` ← `client.fullName`  
  - Org hierarchy fields map to gym attributes (e.g., `Department = client.packageType`, `Location = gym.branch`)
- **Schedule**  
  - Convert gym package windows to an array of `{ day, startTime, endTime }`.  
  - Collapse contiguous days with identical windows to minimize rows.  
  - For “off” days, emit `enabled: false` so the bridge can disable shifts.

## Sync Service (`sync.service.ts`)

Responsibilities:

1. **Member onboarding**  
   - Called from `POST /api/clients`.  
   - Builds payload via `mapper.toMemberPayload(client)` and calls `upsertMember`.  
   - Stores returned `employeeCode` + device status on the client document.

2. **Schedule updates**  
   - Invoked when package dates/time slots change.  
   - Calculates upcoming validity windows and calls `updateSchedule`.

3. **Punch ingestion**  
   - A cron job runs every minute:  
     - Calls `fetchPunches(lastCursor)` from the bridge.  
     - Inserts the punches into `AccessLog` collection and triggers WebSocket updates.  
     - Updates `lastCursor` (persisted in Redis or Mongo).

4. **Failure handling**  
   - Retries transient bridge errors with exponential backoff.  
   - Raises an alert when the bridge has been unreachable for >5 minutes.

## API Payloads

```ts
type EtimetrackMemberPayload = {
  employeeCode: string
  employeeName: string
  deviceCode: string
  cardNumber: string
  company?: string
  department?: string
  location?: string
  category?: string
  employmentType?: 'Member' | 'Staff'
  gender?: 'M' | 'F' | 'Other'
  doj?: string // YYYY-MM-DD
  doc?: string // Contract end date, optional
  status: 'Active' | 'Inactive'
}

type EtimetrackSchedulePayload = {
  timezone: string
  windows: Array<{
    day: number // 1 (Monday) ... 7 (Sunday)
    startTime: string // '06:00'
    endTime: string   // '22:00'
    enabled: boolean
  }>
  validFrom: string
  validTo: string
}
```

## Integration Points

- **Controller hooks**: Extend the client controller/service to call `syncMember` whenever members/packages change.
- **Jobs**: Reuse existing background jobs (`start_background_monitor.bat`) to bootstrap the punch-ingest cron.
- **Testing**: Use the provided scripts (`test_essl_connection.js`, `simulate_checkins.js`) to trigger devices and ensure the adapter processes responses end-to-end.

## Environment Variables

```
ETIMETRACK_BRIDGE_URL=https://<your-bridge-host>
ETIMETRACK_BRIDGE_KEY=super-secret-token
ETIMETRACK_DEFAULT_COMPANY=StrengthScape
ETIMETRACK_DEFAULT_LOCATION=Main Gym
```

## Rollout Checklist

- [ ] Bridge deployed and reachable from the gym backend network.  
- [ ] Adapter env vars configured in each deployment target.  
- [ ] Initial member sync completed (use `import_gym_members_flexible.js` as fallback).  
- [ ] Punch ingestion job enabled and dashboards verified.  
- [ ] Run `test_frontend_api.js` and `test_realtime_updates.js` to confirm the frontend reflects device data.




