import sql from 'mssql';
import { getPool } from '../config/database.js';
import realtimeConfig from '../config/etimetrackRealtime.js';

export interface RealtimeLog {
  deviceLogId?: string;
  userId?: string;
  employeeName?: string;
  logDate: string;
  downloadDate?: string | null;
  deviceId?: string | null;
  verifyMode?: string | null;
  direction?: string | null;
  workCode?: string | null;
  location?: string | null;
  bodyTemperature?: number | null;
  isMaskOn?: boolean | null;
}

interface FetchLogParams {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  userId?: string;
}

const MAX_LIMIT = 2000;

class EtimetrackRealtimeService {
  public async fetchLogs(params: FetchLogParams = {}): Promise<RealtimeLog[]> {
    // Return empty array if SQL is disabled
    if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
      return [];
    }

    const pool = getPool();
    const tableName = realtimeConfig.table;

    if (!tableName) {
      throw new Error('Realtime log table is not configured (ETIME_SQL_RT_TABLE).');
    }
    const columns = realtimeConfig.columns;
    if (!columns.userId || !columns.logDate) {
      throw new Error('Realtime log column configuration is incomplete.');
    }

    const {
      startDate,
      endDate,
      limit = 100,
      userId,
    } = params;

    const effectiveLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
    const request = pool.request();
    request.input('limit', sql.Int, effectiveLimit);

    const logAlias = 'L';
    const employeeAlias = 'E';
    const selectParts: string[] = [];
    const filters: string[] = [];

    const addColumnSelect = (columnName?: string, alias?: string, tableAlias = logAlias) => {
      if (!columnName) {
        return;
      }
      selectParts.push(`${tableAlias}.${columnName} AS ${alias || columnName}`);
    };

    addColumnSelect(columns.deviceLogId, 'deviceLogId');
    addColumnSelect(columns.userId, 'userId');
    addColumnSelect(columns.logDate, 'logDate');
    addColumnSelect(columns.downloadDate, 'downloadDate');
    addColumnSelect(columns.deviceId, 'deviceId');
    addColumnSelect(columns.verifyMode, 'verifyMode');
    addColumnSelect(columns.direction, 'direction');
    addColumnSelect(columns.workCode, 'workCode');
    addColumnSelect(columns.location, 'location');
    addColumnSelect(columns.temperature, 'bodyTemperature');
    addColumnSelect(columns.mask, 'isMaskOn');

    let joinClause = '';
    const employeeTable = realtimeConfig.employee.table?.trim();
    if (employeeTable) {
      const employeeIdColumn = realtimeConfig.employee.idColumn;
      const employeeNameColumn = realtimeConfig.employee.nameColumn;
      addColumnSelect(employeeNameColumn, 'employeeName', employeeAlias);
      joinClause = `LEFT JOIN ${employeeTable} AS ${employeeAlias} ON ${employeeAlias}.${employeeIdColumn} = ${logAlias}.${columns.userId}`;
    }

    if (startDate) {
      filters.push(`${logAlias}.${columns.logDate} >= @startDate`);
      request.input('startDate', sql.DateTime, startDate);
    }

    if (endDate) {
      filters.push(`${logAlias}.${columns.logDate} <= @endDate`);
      request.input('endDate', sql.DateTime, endDate);
    }

    if (userId) {
      filters.push(`${logAlias}.${columns.userId} = @userId`);
      request.input('userId', sql.NVarChar, userId);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const query = `
      SELECT TOP (@limit)
        ${selectParts.join(',\n        ')}
      FROM ${tableName} AS ${logAlias}
      ${joinClause}
      ${whereClause}
      ORDER BY ${logAlias}.${columns.logDate} DESC
    `;

    const result = await request.query(query);
    const rows = result.recordset || [];
    return rows.map((row: Record<string, unknown>) => this.mapRowToRealtimeLog(row));
  }

  private mapRowToRealtimeLog(row: Record<string, unknown>): RealtimeLog {
    return {
      deviceLogId: this.valueToString(row.deviceLogId),
      userId: this.valueToString(row.userId),
      employeeName: this.valueToString(row.employeeName),
      logDate: this.valueToIso(row.logDate) ?? new Date().toISOString(),
      downloadDate: this.valueToIso(row.downloadDate),
      deviceId: this.valueToString(row.deviceId),
      verifyMode: this.valueToString(row.verifyMode),
      direction: this.valueToString(row.direction),
      workCode: this.valueToString(row.workCode),
      location: this.valueToString(row.location),
      bodyTemperature: this.valueToNumber(row.bodyTemperature),
      isMaskOn: this.valueToBoolean(row.isMaskOn),
    };
  }

  private valueToIso(value: unknown): string | null {
    if (!value) {
      return null;
    }
    const date = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  }

  private valueToString(value: unknown): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    return value.toString();
  }

  private valueToNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }

  private valueToBoolean(value: unknown): boolean | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    const normalized = value.toString().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false;
    }
    return null;
  }
}

export default new EtimetrackRealtimeService();


