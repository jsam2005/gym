import sql from 'mssql';
import { getPool } from '../config/database.js';
import { updateClient as updateClientRecord } from '../data/clientRepository.js';
import { mapClientToPayload, deriveUserId } from '../integrations/etimetrack/mapper.js';
import {
  EtimetrackLogRecord,
  EtimetrackMemberPayload,
  EtimetrackStatus,
} from '../integrations/etimetrack/types.js';
import { ClientEntity } from '../types/domain.js';

type ColumnMap = {
  userId: string;
  badge?: string;
  name?: string;
  card?: string;
  gender?: string;
  dept?: string;
  hireDate?: string;
  expiryDate?: string;
  phone?: string;
  email?: string;
  status?: string;
  notes?: string;
};

type AttendanceMetadata = {
  table: string;
  userField: string;
  timeField: string;
  typeField?: string;
  deviceField?: string;
};

const USER_TABLE_CANDIDATES = ['USERINFO', 'UserInfo', 'EMPLOYEE', 'Employees', 'Personnel'];
const ATTENDANCE_TABLE_CANDIDATES = [
  'CHECKINOUT',
  'CheckInOut',
  'iclock_transaction',
  'TransactionLog',
  'AttLog',
  'AttendanceLog',
  'AttTransaction',
];

class EtimetrackSyncService {
  private enabled: boolean;
  private userTable?: string;
  private attendanceMeta?: AttendanceMetadata;
  private columnCache: Record<string, ColumnMap> = {};
  private lastSyncTs?: Date;
  private notes: string[] = [];

  constructor() {
    this.enabled = (process.env.ETIMETRACK_ENABLED ?? 'true').toLowerCase() === 'true';
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public async initialize(): Promise<void> {
    if (!this.enabled) {
      this.notes.push('Integration disabled via ETIMETRACK_ENABLED');
      return;
    }

    try {
      await this.detectUserTable();
      await this.detectAttendanceMetadata();
      if (this.userTable) {
        console.log(`🔗 eTimeTrack: detected user table ${this.userTable}`);
      }
      if (this.attendanceMeta) {
        console.log(
          `🔗 eTimeTrack: detected attendance table ${this.attendanceMeta.table} (${this.attendanceMeta.timeField})`
        );
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize eTimeTrack integration:', error.message);
      this.notes.push(`Initialization error: ${error.message}`);
    }
  }

  public async syncClient(client: ClientEntity): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const pool = this.getPool();
    const userTable = await this.detectUserTable();
    if (!pool || !userTable) {
      return;
    }

    if (!client.esslUserId) {
      const derivedId = deriveUserId(client);
      await updateClientRecord(client.id, { esslUserId: derivedId });
      client = { ...client, esslUserId: derivedId };
    }

    const payload = mapClientToPayload(client);
    await this.upsertMember(userTable, payload);
  }

  public async disableClient(esslUserId?: string | null): Promise<void> {
    if (!esslUserId || !this.enabled) {
      return;
    }

    const pool = this.getPool();
    const userTable = await this.detectUserTable();
    if (!pool || !userTable) {
      return;
    }

    const columns = await this.getColumnMap(userTable);
    if (!columns.status) {
      this.notes.push('No status/inactive column detected for user table');
      return;
    }

    await pool
      .request()
      .input('userId', sql.NVarChar, esslUserId)
      .input('inactive', sql.Int, 1)
      .query(`UPDATE ${userTable} SET ${columns.status} = @inactive WHERE ${columns.userId} = @userId`);
  }

  public async fetchAttendanceSince(since: Date, limit = 500): Promise<EtimetrackLogRecord[]> {
    if (!this.enabled) {
      return [];
    }

    const pool = this.getPool();
    const metadata = await this.detectAttendanceMetadata();
    if (!pool || !metadata) {
      return [];
    }

    const request = pool.request();
    request.input('since', sql.DateTime, since);
    request.input('limit', sql.Int, limit);

    const query = `
      SELECT TOP (@limit)
        ${metadata.userField} AS userId,
        ${metadata.timeField} AS checkTime
        ${metadata.typeField ? `, ${metadata.typeField} AS punchType` : ''}
        ${metadata.deviceField ? `, ${metadata.deviceField} AS deviceId` : ''}
      FROM ${metadata.table}
      WHERE ${metadata.timeField} > @since
      ORDER BY ${metadata.timeField} ASC
    `;

    const result = await request.query(query);
    const rows = result.recordset || [];
    if (rows.length > 0) {
      const last = rows[rows.length - 1];
      const ts = last.checkTime instanceof Date ? last.checkTime : new Date(last.checkTime);
      this.lastSyncTs = ts;
    }

    return rows.map((row: any) => ({
      userId: row.userId !== undefined && row.userId !== null ? row.userId.toString().trim() : null,
      timestamp: row.checkTime instanceof Date ? row.checkTime : new Date(row.checkTime),
      punchType: row.punchType !== undefined && row.punchType !== null ? row.punchType.toString() : null,
      deviceId: row.deviceId !== undefined && row.deviceId !== null ? row.deviceId.toString() : null,
    }));
  }

  public getStatus(): EtimetrackStatus {
    return {
      enabled: this.enabled,
      userTable: this.userTable,
      attendanceTable: this.attendanceMeta?.table,
      lastSync: this.lastSyncTs,
      notes: this.notes.slice(-5),
    };
  }

  public async testConnection(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const pool = this.getPool();
    if (!pool) {
      return false;
    }

    try {
      const result = await pool.request().query('SELECT 1 AS ok');
      return result.recordset.length > 0;
    } catch (error: any) {
      this.notes.push(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  private getPool(): sql.ConnectionPool | null {
    if (!this.enabled) {
      return null;
    }
    try {
      return getPool();
    } catch (error: any) {
      this.notes.push(`SQL pool unavailable: ${error.message}`);
      return null;
    }
  }

  private async detectUserTable(): Promise<string | null> {
    if (this.userTable) {
      return this.userTable;
    }

    const pool = this.getPool();
    if (!pool) {
      return null;
    }

    for (const table of USER_TABLE_CANDIDATES) {
      try {
        await pool.request().query(`SELECT TOP 1 * FROM ${table}`);
        this.userTable = table;
        return table;
      } catch {
        continue;
      }
    }

    this.notes.push('Unable to detect eTimeTrack user table');
    return null;
  }

  private async detectAttendanceMetadata(): Promise<AttendanceMetadata | null> {
    if (this.attendanceMeta) {
      return this.attendanceMeta;
    }

    const pool = this.getPool();
    if (!pool) {
      return null;
    }

    for (const table of ATTENDANCE_TABLE_CANDIDATES) {
      try {
        const result = await pool.request().query(`SELECT TOP 1 * FROM ${table}`);
        const columns =
          result.recordset.length > 0 ? Object.keys(result.recordset[0]) : await this.getColumnList(table);

        const userField = this.pickColumn(columns, ['USERID', 'PIN', 'BADGENUMBER', 'USERCODE', 'EnrollNumber']);
        const timeField = this.pickColumn(columns, [
          'CHECKTIME',
          'CHECKTIME1',
          'CHECKINOUTTIME',
          'TIMESTAMP',
          'LOGDATE',
          'PUNCHTIME',
          'DATETIME',
          'TIME',
        ]);

        if (userField && timeField) {
          this.attendanceMeta = {
            table,
            userField,
            timeField,
            typeField: this.pickColumn(columns, ['CHECKTYPE', 'TYPE', 'DIRECTION', 'INOUTMODE']),
            deviceField: this.pickColumn(columns, ['MACHINEID', 'DEVICEID', 'SN', 'TERMINALSN']),
          };
          return this.attendanceMeta;
        }
      } catch {
        continue;
      }
    }

    this.notes.push('Unable to detect eTimeTrack attendance table');
    return null;
  }

  private async upsertMember(table: string, payload: EtimetrackMemberPayload): Promise<void> {
    const pool = this.getPool();
    if (!pool) {
      return;
    }

    const columns = await this.getColumnMap(table);
    const request = pool.request();

    request.input('userId', sql.NVarChar, payload.userId);

    const updateParts: string[] = [];
    const insertColumns: string[] = [columns.userId];
    const insertValues: string[] = ['@userId'];

    const addField = (
      columnName: string | undefined,
      paramName: string,
      value: unknown,
      type: sql.ISqlTypeFactory | sql.ISqlTypeFactoryWithNoParams | sql.ISqlTypeFactoryWithLength = sql.NVarChar,
      transform?: (val: unknown) => unknown
    ) => {
      if (!columnName || value === undefined || value === null) {
        return;
      }
      const normalizedValue = transform ? transform(value) : value;
      updateParts.push(`${columnName} = @${paramName}`);
      insertColumns.push(columnName);
      insertValues.push(`@${paramName}`);
      request.input(paramName, type as sql.ISqlType, normalizedValue as any);
    };

    addField(columns.name, 'name', payload.name, sql.NVarChar);
    addField(columns.badge, 'badge', payload.badgeNumber, sql.NVarChar);
    addField(columns.card, 'card', payload.cardNumber, sql.NVarChar);
    addField(columns.gender, 'gender', payload.gender, sql.NVarChar);
    addField(columns.dept, 'dept', payload.departmentId || 1, sql.Int);
    addField(columns.hireDate, 'doj', payload.hireDate, sql.DateTime);
    addField(columns.expiryDate, 'doe', payload.expiryDate, sql.DateTime);
    addField(columns.phone, 'phone', payload.phone, sql.NVarChar);
    addField(columns.email, 'email', payload.email, sql.NVarChar);
    addField(
      columns.status,
      'status',
      payload.status === 'active' ? 0 : 1,
      sql.Int,
      (val) => (typeof val === 'string' ? (val === 'active' ? 0 : 1) : val)
    );
    addField(columns.notes, 'notes', payload.scheduleSummary, sql.NVarChar);

    if (updateParts.length === 0) {
      updateParts.push(`${columns.userId} = ${columns.userId}`);
    }

    const query = `
      MERGE ${table} AS target
      USING (SELECT @userId AS UserKey) AS source
      ON target.${columns.userId} = source.UserKey
      WHEN MATCHED THEN
        UPDATE SET ${updateParts.join(', ')}
      WHEN NOT MATCHED THEN
        INSERT (${insertColumns.join(', ')})
        VALUES (${insertValues.join(', ')});
    `;

    await request.query(query);
  }

  private async getColumnMap(table: string): Promise<ColumnMap> {
    if (this.columnCache[table]) {
      return this.columnCache[table];
    }

    const columns = await this.getColumnList(table);
    const pick = (candidates: string[]) => this.pickColumn(columns, candidates);

    const map: ColumnMap = {
      userId: pick(['USERID', 'USER_ID', 'EMPLOYEEID', 'PERSONID', 'PIN']) as string,
      badge: pick(['BADGENUMBER', 'BADGENO', 'BADGE_NUMBER', 'BADGENO']),
      name: pick(['NAME', 'FULLNAME', 'EMPLOYEENAME']),
      card: pick(['CARDNO', 'CARDNUMBER', 'CARD_NUM']),
      gender: pick(['GENDER', 'SEX']),
      dept: pick(['DEFAULTDEPTID', 'DEPTID', 'DEPARTMENTID']),
      hireDate: pick(['HIREDDAY', 'DOJ', 'JOININGDATE', 'DATEOFJOINING']),
      expiryDate: pick(['TERMINATEDATE', 'DOLE', 'DOC', 'DATEOFLEAVING']),
      phone: pick(['MOBILE', 'PHONE', 'PHONENUMBER', 'CONTACTNO']),
      email: pick(['EMAIL', 'EMAILID']),
      status: pick(['INACTIVE', 'ACTIVE', 'STATUS']),
      notes: pick(['NOTE', 'REMARK', 'DESCRIPTION', 'UserInfo']),
    };

    if (!map.userId) {
      throw new Error(`Unable to detect USERID column for table ${table}`);
    }

    this.columnCache[table] = map;
    return map;
  }

  private async getColumnList(table: string): Promise<string[]> {
    const pool = this.getPool();
    if (!pool) {
      return [];
    }

    try {
      const result = await pool
        .request()
        .input('tableName', sql.NVarChar, table)
        .query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tableName ORDER BY ORDINAL_POSITION`
        );
      return result.recordset.map((row: any) => row.COLUMN_NAME);
    } catch {
      return [];
    }
  }

  private pickColumn(columnNames: string[], candidates: string[]): string | undefined {
    const upper = columnNames.reduce<Record<string, string>>((acc, name) => {
      acc[name.toUpperCase()] = name;
      return acc;
    }, {});

    for (const candidate of candidates) {
      const match = upper[candidate.toUpperCase()];
      if (match) {
        return match;
      }
    }

    return undefined;
  }
}

const etimetrackSyncService = new EtimetrackSyncService();
export default etimetrackSyncService;

