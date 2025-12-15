import sql from 'mssql';
import { runQuery } from './sqlHelpers.js';

export interface ProfileEntity {
  id: string;
  gymName: string;
  gymAddress: string;
  ownerName: string;
  ownerPhone: string;
  additionalContact: string | null;
  photo: string | null;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

let tableInitialized = false;

const ensureTable = async () => {
  if (tableInitialized) {
    return;
  }

  await runQuery((request) =>
    request.query(`
      IF OBJECT_ID('dbo.Profile', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.Profile (
          Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
          GymName NVARCHAR(200) NOT NULL,
          GymAddress NVARCHAR(MAX) NOT NULL,
          OwnerName NVARCHAR(150) NOT NULL,
          OwnerPhone NVARCHAR(50) NOT NULL,
          AdditionalContact NVARCHAR(50) NULL,
          Photo NVARCHAR(500) NULL,
          PasswordHash NVARCHAR(255) NOT NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
        
        CREATE INDEX IX_Profile_CreatedAt ON dbo.Profile(CreatedAt);
      END;
    `)
  );

  tableInitialized = true;
};

const mapProfile = (row: any): ProfileEntity => ({
  id: row.Id ? row.Id.toString() : '',
  gymName: row.GymName || '',
  gymAddress: row.GymAddress || '',
  ownerName: row.OwnerName || '',
  ownerPhone: row.OwnerPhone || '',
  additionalContact: row.AdditionalContact || null,
  photo: row.Photo || null,
  passwordHash: row.PasswordHash || '',
  createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
  updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : new Date().toISOString(),
});

const getPrimaryProfileRow = async () => {
  const result = await runQuery((request) =>
    request.query(`
      SELECT TOP 1 *
      FROM Profile
      ORDER BY CreatedAt ASC
    `)
  );
  return result.recordset[0] || null;
};

export const getProfile = async (): Promise<ProfileEntity | null> => {
  await ensureTable();
  const row = await getPrimaryProfileRow();
  return row ? mapProfile(row) : null;
};

export const createProfile = async (data: {
  gymName: string;
  gymAddress: string;
  ownerName: string;
  ownerPhone: string;
  additionalContact?: string | null;
  photo?: string | null;
  passwordHash: string;
}): Promise<ProfileEntity> => {
  await ensureTable();
  const result = await runQuery((request) => {
    request.input('GymName', sql.NVarChar(200), data.gymName);
    request.input('GymAddress', sql.NVarChar(sql.MAX), data.gymAddress);
    request.input('OwnerName', sql.NVarChar(150), data.ownerName);
    request.input('OwnerPhone', sql.NVarChar(50), data.ownerPhone);
    request.input('AdditionalContact', sql.NVarChar(50), data.additionalContact || null);
    request.input('Photo', sql.NVarChar(500), data.photo || null);
    request.input('PasswordHash', sql.NVarChar(255), data.passwordHash);

    return request.query(`
      INSERT INTO Profile (
        Id, GymName, GymAddress, OwnerName, OwnerPhone, AdditionalContact, Photo, PasswordHash, CreatedAt, UpdatedAt
      )
      OUTPUT INSERTED.*
      VALUES (
        NEWID(),
        @GymName,
        @GymAddress,
        @OwnerName,
        @OwnerPhone,
        @AdditionalContact,
        @Photo,
        @PasswordHash,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
      )
    `);
  });

  return mapProfile(result.recordset[0]);
};

export const updateProfile = async (
  updates: Partial<Pick<ProfileEntity, 'gymName' | 'gymAddress' | 'ownerName' | 'ownerPhone' | 'additionalContact' | 'photo'>>
): Promise<ProfileEntity | null> => {
  await ensureTable();
  const profile = await getProfile();
  if (!profile) {
    console.error('❌ Profile not found for update');
    return null;
  }

  // Build dynamic UPDATE query
  const updateFields: string[] = [];
  
  const result = await runQuery((request) => {
    request.input('Id', sql.UniqueIdentifier, profile.id);
    
    if (updates.gymName !== undefined) {
      request.input('GymName', sql.NVarChar(200), updates.gymName);
      updateFields.push('GymName = @GymName');
    }
    if (updates.gymAddress !== undefined) {
      request.input('GymAddress', sql.NVarChar(sql.MAX), updates.gymAddress);
      updateFields.push('GymAddress = @GymAddress');
    }
    if (updates.ownerName !== undefined) {
      request.input('OwnerName', sql.NVarChar(150), updates.ownerName);
      updateFields.push('OwnerName = @OwnerName');
    }
    if (updates.ownerPhone !== undefined) {
      request.input('OwnerPhone', sql.NVarChar(50), updates.ownerPhone);
      updateFields.push('OwnerPhone = @OwnerPhone');
    }
    if (updates.additionalContact !== undefined) {
      request.input('AdditionalContact', sql.NVarChar(50), updates.additionalContact);
      updateFields.push('AdditionalContact = @AdditionalContact');
    }
    if (updates.photo !== undefined) {
      request.input('Photo', sql.NVarChar(500), updates.photo);
      updateFields.push('Photo = @Photo');
    }
    
    if (updateFields.length === 0) {
      console.warn('⚠️  No fields to update');
      return request.query(`SELECT * FROM Profile WHERE Id = @Id`);
    }
    
    updateFields.push('UpdatedAt = SYSUTCDATETIME()');

    const query = `
      UPDATE Profile
      SET ${updateFields.join(', ')}
      WHERE Id = @Id;
      SELECT * FROM Profile WHERE Id = @Id;
    `;
    
    console.log('📝 Updating profile:', { id: profile.id, fields: updateFields });
    console.log('📝 SQL Query:', query);
    return request.query(query);
  });

  if (!result || !result.recordset || result.recordset.length === 0) {
    console.error('❌ No record returned after update');
    return null;
  }

  const updated = mapProfile(result.recordset[0]);
  console.log('✅ Profile update successful:', { id: updated.id, gymName: updated.gymName, ownerName: updated.ownerName });
  return updated;
};

export const updateProfilePassword = async (passwordHash: string): Promise<void> => {
  await ensureTable();
  const profile = await getProfile();
  if (!profile) {
    return;
  }

  await runQuery((request) => {
    request.input('Id', sql.UniqueIdentifier, profile.id);
    request.input('PasswordHash', sql.NVarChar(255), passwordHash);
    return request.query(`
      UPDATE Profile
      SET PasswordHash = @PasswordHash, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @Id
    `);
  });
};
