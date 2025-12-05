import sql from 'mssql';
import { getPool } from '../config/database.js';

export const toGuid = (id: string) => {
  if (!id) {
    return null;
  }
  return id;
};

export const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const stringifyJson = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }
  return JSON.stringify(value);
};

export const runQuery = async <T = any>(builder: (request: sql.Request) => sql.IResult<T> | Promise<sql.IResult<T>>) => {
  // Check if SQL is disabled
  if (process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true') {
    throw new Error('SQL_DISABLED: Database operations are disabled. Use API endpoints instead.');
  }

  try {
    const pool = getPool();
    const request = pool.request();
    return builder(request);
  } catch (error: any) {
    if (error.message?.includes('not connected') || error.message?.includes('Database not connected')) {
      throw new Error('SQL_DISABLED: Database operations are disabled. Use API endpoints instead.');
    }
    throw error;
  }
};

export const mapPagination = (page?: number, limit?: number) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(limit) || 50));
  const offset = (pageNumber - 1) * pageSize;
  return { pageNumber, pageSize, offset };
};



