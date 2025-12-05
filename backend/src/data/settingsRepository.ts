import sql from 'mssql';
import { runQuery, parseJson, stringifyJson } from './sqlHelpers.js';
import { GymSettingsEntity, UserEntity } from '../types/domain.js';

let tablesInitialized = false;
const ensureTables = async () => {
  if (tablesInitialized) {
    return;
  }

  await runQuery((request) =>
    request.query(`
      IF OBJECT_ID('dbo.Users', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.Users (
          Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
          Name NVARCHAR(150) NOT NULL,
          Email NVARCHAR(200) NOT NULL UNIQUE,
          Phone NVARCHAR(50) NOT NULL,
          PasswordHash NVARCHAR(255) NOT NULL,
          Role NVARCHAR(20) NOT NULL DEFAULT 'admin',
          ProfilePhoto NVARCHAR(500) NULL,
          NotificationsJson NVARCHAR(MAX) NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
      END;

      IF OBJECT_ID('dbo.GymSettings', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.GymSettings (
          Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
          GymName NVARCHAR(200) NOT NULL,
          GymEmail NVARCHAR(200) NOT NULL,
          GymPhone NVARCHAR(50) NOT NULL,
          GymAddress NVARCHAR(MAX) NOT NULL,
          GymLogo NVARCHAR(500) NULL,
          OpeningHoursJson NVARCHAR(MAX) NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
      END;
    `)
  );

  tablesInitialized = true;
};

const mapUser = (row: any): UserEntity => ({
  id: row.Id ? row.Id.toString() : '',
  name: row.Name,
  email: row.Email,
  phone: row.Phone,
  passwordHash: row.PasswordHash,
  role: row.Role || 'admin',
  profilePhoto: row.ProfilePhoto || null,
  notifications: parseJson(row.NotificationsJson, {
    newMemberSignUps: true,
    classCancellations: false,
  }),
  createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
  updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : new Date().toISOString(),
});

const mapGymSettings = (row: any): GymSettingsEntity => {
  const openingHours = parseJson<Record<string, { open: string; close: string }>>(row.OpeningHoursJson, {});
  return {
    id: row.Id ? row.Id.toString() : '',
    gymName: row.GymName,
    gymEmail: row.GymEmail,
    gymPhone: row.GymPhone,
    gymAddress: row.GymAddress,
    gymLogo: row.GymLogo || null,
    openingHours: Object.keys(openingHours).length ? openingHours : undefined,
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
    updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : new Date().toISOString(),
  };
};

const getPrimaryUserRow = async () => {
  const result = await runQuery((request) =>
    request.query(`
      SELECT TOP 1 *
      FROM Users
      ORDER BY CreatedAt ASC
    `)
  );
  return result.recordset[0] || null;
};

export const getUser = async (): Promise<UserEntity | null> => {
  await ensureTables();
  const row = await getPrimaryUserRow();
  return row ? mapUser(row) : null;
};

export const createUser = async (data: {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role?: string;
  notifications?: UserEntity['notifications'];
}): Promise<UserEntity> => {
  await ensureTables();
  const result = await runQuery((request) => {
    request.input('Name', sql.NVarChar(150), data.name);
    request.input('Email', sql.NVarChar(200), data.email);
    request.input('Phone', sql.NVarChar(50), data.phone);
    request.input('PasswordHash', sql.NVarChar(255), data.passwordHash);
    request.input('Role', sql.NVarChar(20), data.role || 'admin');
    request.input('ProfilePhoto', sql.NVarChar(500), null);
    request.input('NotificationsJson', sql.NVarChar(sql.MAX), stringifyJson(data.notifications || {
      newMemberSignUps: true,
      classCancellations: false,
    }));

    return request.query(`
      INSERT INTO Users (
        Id, Name, Email, Phone, PasswordHash, Role, ProfilePhoto, NotificationsJson, CreatedAt, UpdatedAt
      )
      OUTPUT INSERTED.*
      VALUES (
        NEWID(),
        @Name,
        @Email,
        @Phone,
        @PasswordHash,
        @Role,
        @ProfilePhoto,
        @NotificationsJson,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
      )
    `);
  });

  return mapUser(result.recordset[0]);
};

export const updateUserProfile = async (
  updates: Pick<UserEntity, 'name' | 'email' | 'phone'>
): Promise<UserEntity | null> => {
  await ensureTables();
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await runQuery((request) => {
    request.input('Id', sql.UniqueIdentifier, user.id);
    request.input('Name', sql.NVarChar(150), updates.name);
    request.input('Email', sql.NVarChar(200), updates.email);
    request.input('Phone', sql.NVarChar(50), updates.phone);

    return request.query(`
      UPDATE Users
      SET
        Name = @Name,
        Email = @Email,
        Phone = @Phone,
        UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @Id;
      SELECT * FROM Users WHERE Id = @Id;
    `);
  });

  return result.recordset[0] ? mapUser(result.recordset[0]) : null;
};

export const updateUserPassword = async (passwordHash: string): Promise<void> => {
  await ensureTables();
  const user = await getUser();
  if (!user) {
    return;
  }

  await runQuery((request) => {
    request.input('Id', sql.UniqueIdentifier, user.id);
    request.input('PasswordHash', sql.NVarChar(255), passwordHash);
    return request.query(`
      UPDATE Users
      SET PasswordHash = @PasswordHash, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @Id
    `);
  });
};

export const updateUserNotifications = async (
  notifications: UserEntity['notifications']
): Promise<UserEntity | null> => {
  await ensureTables();
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await runQuery((request) => {
    request.input('Id', sql.UniqueIdentifier, user.id);
    request.input('NotificationsJson', sql.NVarChar(sql.MAX), stringifyJson(notifications));
    return request.query(`
      UPDATE Users
      SET NotificationsJson = @NotificationsJson, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @Id;
      SELECT * FROM Users WHERE Id = @Id;
    `);
  });

  return result.recordset[0] ? mapUser(result.recordset[0]) : null;
};

const getGymSettingsRow = async () => {
  const result = await runQuery((request) =>
    request.query(`
      SELECT TOP 1 *
      FROM GymSettings
      ORDER BY CreatedAt ASC
    `)
  );
  return result.recordset[0] || null;
};

export const getGymSettings = async (): Promise<GymSettingsEntity | null> => {
  await ensureTables();
  const row = await getGymSettingsRow();
  return row ? mapGymSettings(row) : null;
};

export const createGymSettings = async (data: {
  gymName: string;
  gymEmail: string;
  gymPhone: string;
  gymAddress: string;
  gymLogo?: string | null;
  openingHours?: GymSettingsEntity['openingHours'];
}): Promise<GymSettingsEntity> => {
  await ensureTables();
  const result = await runQuery((request) => {
    request.input('GymName', sql.NVarChar(200), data.gymName);
    request.input('GymEmail', sql.NVarChar(200), data.gymEmail);
    request.input('GymPhone', sql.NVarChar(50), data.gymPhone);
    request.input('GymAddress', sql.NVarChar(sql.MAX), data.gymAddress);
    request.input('GymLogo', sql.NVarChar(500), data.gymLogo || null);
    request.input('OpeningHoursJson', sql.NVarChar(sql.MAX), stringifyJson(data.openingHours));

    return request.query(`
      INSERT INTO GymSettings (
        Id, GymName, GymEmail, GymPhone, GymAddress, GymLogo, OpeningHoursJson, CreatedAt, UpdatedAt
      )
      OUTPUT INSERTED.*
      VALUES (
        NEWID(),
        @GymName,
        @GymEmail,
        @GymPhone,
        @GymAddress,
        @GymLogo,
        @OpeningHoursJson,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
      )
    `);
  });

  return mapGymSettings(result.recordset[0]);
};

export const updateGymSettings = async (
  updates: Pick<GymSettingsEntity, 'gymName' | 'gymEmail' | 'gymPhone' | 'gymAddress' | 'gymLogo' | 'openingHours'>
): Promise<GymSettingsEntity | null> => {
  await ensureTables();
  const existing = await getGymSettings();
  if (!existing) {
    return createGymSettings(updates);
  }

  const result = await runQuery((request) => {
    request.input('Id', sql.UniqueIdentifier, existing.id);
    request.input('GymName', sql.NVarChar(200), updates.gymName);
    request.input('GymEmail', sql.NVarChar(200), updates.gymEmail);
    request.input('GymPhone', sql.NVarChar(50), updates.gymPhone);
    request.input('GymAddress', sql.NVarChar(sql.MAX), updates.gymAddress);
    request.input('GymLogo', sql.NVarChar(500), updates.gymLogo || null);
    request.input('OpeningHoursJson', sql.NVarChar(sql.MAX), stringifyJson(updates.openingHours));

    return request.query(`
      UPDATE GymSettings
      SET
        GymName = @GymName,
        GymEmail = @GymEmail,
        GymPhone = @GymPhone,
        GymAddress = @GymAddress,
        GymLogo = @GymLogo,
        OpeningHoursJson = @OpeningHoursJson,
        UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @Id;
      SELECT * FROM GymSettings WHERE Id = @Id;
    `);
  });

  return result.recordset[0] ? mapGymSettings(result.recordset[0]) : null;
};

