import sql from 'mssql';
import { PackageEntity } from '../types/domain.js';
import { runQuery, parseJson, stringifyJson } from './sqlHelpers.js';

const baseSelect = `
SELECT
  CAST(Id AS NVARCHAR(36)) AS id,
  Name,
  Description,
  Duration,
  Amount,
  TimingSlot,
  AccessStartTime,
  AccessEndTime,
  IsActive,
  FeaturesJson,
  CreatedAt,
  UpdatedAt
FROM Packages
`;

const mapPackage = (row: any): PackageEntity => ({
  id: row.id,
  name: row.Name,
  description: row.Description,
  duration: Number(row.Duration || 0),
  amount: Number(row.Amount || 0),
  timingSlot: row.TimingSlot,
  accessSchedule: {
    startTime: row.AccessStartTime || '06:00',
    endTime: row.AccessEndTime || '22:00',
  },
  isActive: Boolean(row.IsActive),
  features: parseJson<string[]>(row.FeaturesJson, []),
  createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
  updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : new Date().toISOString(),
});

let tableInitialized = false;
const ensureTable = async () => {
  if (tableInitialized) {
    return;
  }

  await runQuery((request) =>
    request.query(`
      IF OBJECT_ID('dbo.Packages', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.Packages (
          Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
          Name NVARCHAR(150) NOT NULL UNIQUE,
          Description NVARCHAR(MAX) NOT NULL,
          Duration INT NOT NULL,
          Amount DECIMAL(18, 2) NOT NULL,
          TimingSlot NVARCHAR(20) NOT NULL,
          AccessStartTime NVARCHAR(5) NOT NULL,
          AccessEndTime NVARCHAR(5) NOT NULL,
          IsActive BIT NOT NULL DEFAULT 1,
          FeaturesJson NVARCHAR(MAX) NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
      END
    `)
  );

  tableInitialized = true;
};

export const getActivePackages = async (): Promise<PackageEntity[]> => {
  await ensureTable();
  const result = await runQuery((request) =>
    request.query(`
      ${baseSelect}
      WHERE IsActive = 1
      ORDER BY Amount ASC
    `)
  );
  return result.recordset.map(mapPackage);
};

export const getPackageById = async (id: string): Promise<PackageEntity | null> => {
  await ensureTable();
  const result = await runQuery((request) => {
    request.input('Id', sql.UniqueIdentifier, id);
    return request.query(`${baseSelect} WHERE Id = @Id`);
  });
  if (!result.recordset[0]) {
    return null;
  }
  return mapPackage(result.recordset[0]);
};

export const createPackage = async (data: Partial<PackageEntity>): Promise<PackageEntity> => {
  await ensureTable();
  const result = await runQuery((request) => {
    request.input('Name', sql.NVarChar(150), data.name);
    request.input('Description', sql.NVarChar(sql.MAX), data.description);
    request.input('Duration', sql.Int, data.duration ?? 1);
    request.input('Amount', sql.Decimal(18, 2), data.amount ?? 0);
    request.input('TimingSlot', sql.NVarChar(20), data.timingSlot || 'morning');
    request.input('AccessStartTime', sql.NVarChar(5), data.accessSchedule?.startTime || '06:00');
    request.input('AccessEndTime', sql.NVarChar(5), data.accessSchedule?.endTime || '22:00');
    request.input('IsActive', sql.Bit, data.isActive ?? true);
    request.input('FeaturesJson', sql.NVarChar(sql.MAX), stringifyJson(data.features || []));

    return request.query(`
      INSERT INTO Packages (
        Id,
        Name,
        Description,
        Duration,
        Amount,
        TimingSlot,
        AccessStartTime,
        AccessEndTime,
        IsActive,
        FeaturesJson,
        CreatedAt,
        UpdatedAt
      )
      OUTPUT INSERTED.*
      VALUES (
        NEWID(),
        @Name,
        @Description,
        @Duration,
        @Amount,
        @TimingSlot,
        @AccessStartTime,
        @AccessEndTime,
        @IsActive,
        @FeaturesJson,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
      );
    `);
  });

  return mapPackage(result.recordset[0]);
};

const applyPackageUpdateFields = (request: sql.Request, updates: Partial<PackageEntity>) => {
  const fields: string[] = [];
  const setField = (
    column: string,
    param: string,
    type: sql.ISqlTypeFactoryWithNoParams | sql.ISqlTypeFactoryWithLength | sql.ISqlTypeFactory,
    value: any
  ) => {
    if (value === undefined) return;
    fields.push(`${column} = @${param}`);
    request.input(param, type as sql.ISqlType, value);
  };

  setField('Name', 'Name', sql.NVarChar(150), updates.name);
  setField('Description', 'Description', sql.NVarChar(sql.MAX), updates.description);
  setField('Duration', 'Duration', sql.Int, updates.duration);
  setField('Amount', 'Amount', sql.Decimal(18, 2), updates.amount);
  setField('TimingSlot', 'TimingSlot', sql.NVarChar(20), updates.timingSlot);
  setField('AccessStartTime', 'AccessStartTime', sql.NVarChar(5), updates.accessSchedule?.startTime);
  setField('AccessEndTime', 'AccessEndTime', sql.NVarChar(5), updates.accessSchedule?.endTime);
  setField('IsActive', 'IsActive', sql.Bit, updates.isActive);
  setField('FeaturesJson', 'FeaturesJson', sql.NVarChar(sql.MAX), stringifyJson(updates.features));

  return fields;
};

export const updatePackage = async (id: string, updates: Partial<PackageEntity>): Promise<PackageEntity | null> => {
  await ensureTable();
  const request = (await import('../config/database.js')).getPool().request();
  request.input('Id', sql.UniqueIdentifier, id);
  const fields = applyPackageUpdateFields(request, updates);

  if (!fields.length) {
    return getPackageById(id);
  }

  const result = await request.query(`
    UPDATE Packages
    SET ${fields.join(', ')}, UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @Id;
    ${baseSelect} WHERE Id = @Id;
  `);

  if (!result.recordset[0]) {
    return null;
  }

  return mapPackage(result.recordset[0]);
};

export const deactivatePackage = async (id: string): Promise<boolean> => {
  await ensureTable();
  const result = await runQuery((request) => {
    request.input('Id', sql.UniqueIdentifier, id);
    return request.query(`
      UPDATE Packages
      SET IsActive = 0, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @Id
    `);
  });
  return result.rowsAffected[0] > 0;
};


