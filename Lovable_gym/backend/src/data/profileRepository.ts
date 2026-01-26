import sql from 'mssql';
import { runQuery } from './sqlHelpers.js';
import { getPool, isSqlDisabled } from '../config/database.js';

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

  // Skip if SQL is disabled
  if (isSqlDisabled()) {
    tableInitialized = true;
    return;
  }

  try {
    const pool = getPool();
    if (!pool) {
      console.warn('⚠️  Database pool not available, skipping table setup');
      tableInitialized = true;
      return;
    }
    const request = pool.request();
    
    // Check if table exists
    const tableCheck = await request.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Profile' AND TABLE_SCHEMA = 'dbo'
    `);
    
    const tableExists = tableCheck.recordset.length > 0;
    
    if (!tableExists) {
      // Create table if it doesn't exist
      await request.query(`
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
      `);
      console.log('✅ Profile table created');
    } else {
      // Table exists, check for ALL required columns and add missing ones
      const columnCheck = await request.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Profile' 
          AND TABLE_SCHEMA = 'dbo'
      `);
      
      const existingColumns = columnCheck.recordset.map((row: any) => row.COLUMN_NAME.toUpperCase());
      
      // Define all required columns with their definitions
      const requiredColumns = [
        { name: 'Id', definition: 'UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY' },
        { name: 'GymName', definition: 'NVARCHAR(200) NOT NULL' },
        { name: 'GymAddress', definition: 'NVARCHAR(MAX) NOT NULL' },
        { name: 'OwnerName', definition: 'NVARCHAR(150) NOT NULL' },
        { name: 'OwnerPhone', definition: 'NVARCHAR(50) NOT NULL' },
        { name: 'AdditionalContact', definition: 'NVARCHAR(50) NULL' },
        { name: 'Photo', definition: 'NVARCHAR(500) NULL' },
        { name: 'PasswordHash', definition: 'NVARCHAR(255) NOT NULL' },
        { name: 'Email', definition: 'NVARCHAR(255) NULL' },
        { name: 'GymEmail', definition: 'NVARCHAR(255) NULL' },
        { name: 'GymPhone', definition: 'NVARCHAR(50) NULL' },
        { name: 'Phone', definition: 'NVARCHAR(50) NULL' },
        { name: 'CreatedAt', definition: 'DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()' },
        { name: 'UpdatedAt', definition: 'DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()' },
      ];
      
      // Check for columns that might be NOT NULL and make them nullable
      const columnsToCheck = ['Email', 'GymEmail', 'GymPhone', 'Phone'];
      for (const columnName of columnsToCheck) {
        const columnCheck = await request.query(`
          SELECT COLUMN_NAME, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'Profile' 
            AND TABLE_SCHEMA = 'dbo' 
            AND COLUMN_NAME = '${columnName}'
        `);
        
        if (columnCheck.recordset.length > 0) {
          const column = columnCheck.recordset[0];
          if (column.IS_NULLABLE === 'NO') {
            console.log(`📝 Making ${columnName} column nullable in Profile table...`);
            try {
              const dataType = (columnName === 'Phone' || columnName === 'GymPhone') ? 'NVARCHAR(50)' : 'NVARCHAR(255)';
              await request.query(`
                ALTER TABLE dbo.Profile
                ALTER COLUMN ${columnName} ${dataType} NULL;
              `);
              console.log(`✅ ${columnName} column is now nullable`);
            } catch (alterError: any) {
              console.warn(`⚠️  Could not alter ${columnName} column:`, alterError.message);
            }
          }
        }
      }
      
      const columnsToAdd = requiredColumns.filter(col => !existingColumns.includes(col.name.toUpperCase()));
      
      if (columnsToAdd.length > 0) {
        console.log(`📝 Adding ${columnsToAdd.length} missing column(s) to Profile table: ${columnsToAdd.map(c => c.name).join(', ')}...`);
        
        // Add all missing columns in a single transaction
        for (const column of columnsToAdd) {
          try {
            await request.query(`
              ALTER TABLE dbo.Profile
              ADD ${column.name} ${column.definition};
            `);
            console.log(`✅ ${column.name} column added to Profile table`);
          } catch (addError: any) {
            // If column already exists (race condition), just log and continue
            if (addError.message?.includes('already exists') || addError.message?.includes('duplicate column')) {
              console.log(`ℹ️  ${column.name} column already exists, skipping`);
            } else {
              console.error(`❌ Error adding ${column.name} column:`, addError.message);
              throw addError;
            }
          }
        }
        
        // Create index if CreatedAt column was added
        if (columnsToAdd.some(c => c.name === 'CreatedAt')) {
          try {
            const indexCheck = await request.query(`
              SELECT name FROM sys.indexes 
              WHERE object_id = OBJECT_ID('dbo.Profile') 
                AND name = 'IX_Profile_CreatedAt'
            `);
            
            if (indexCheck.recordset.length === 0) {
              await request.query(`
                CREATE INDEX IX_Profile_CreatedAt ON dbo.Profile(CreatedAt);
              `);
              console.log('✅ Created index IX_Profile_CreatedAt');
            }
          } catch (indexError: any) {
            console.warn('⚠️  Could not create index:', indexError.message);
          }
        }
      } else {
        console.log('✅ All required columns exist in Profile table');
      }
    }
  } catch (error: any) {
    // If SQL is disabled or connection fails, just log and continue
    if (error.message?.includes('SQL_DISABLED') || error.message?.includes('Database not connected') || error.message?.includes('not available')) {
      console.log('⚠️  Skipping Profile table setup (SQL disabled or not connected)');
    } else {
      console.error('❌ Error ensuring Profile table:', error.message);
      // Don't throw - allow the app to continue and return default profile
      console.warn('⚠️  Continuing without table setup - will use default profile data');
    }
  }

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
  try {
  await ensureTable();
  } catch (error: any) {
    console.error('❌ Error ensuring table in getProfile:', error.message);
    // Continue even if table setup fails - might be a column issue
  }
  
  try {
  const row = await getPrimaryProfileRow();
  return row ? mapProfile(row) : null;
  } catch (error: any) {
    console.error('❌ Error fetching profile row:', error.message);
    // If it's a column error, return null so a new profile can be created
    if (error.message?.includes('Invalid column name') || error.message?.includes('column')) {
      return null;
    }
    throw error;
  }
};

export const createProfile = async (data: {
  gymName: string;
  gymAddress: string;
  ownerName: string;
  ownerPhone: string;
  additionalContact?: string | null;
  photo?: string | null;
  passwordHash: string;
  email?: string | null;
}): Promise<ProfileEntity> => {
  try {
  await ensureTable();
  } catch (error: any) {
    console.error('❌ Error ensuring table in createProfile:', error.message);
    // Continue - table might already exist
  }
  
  try {
    // Check which optional columns exist and their nullability
    const pool = getPool();
    const checkRequest = pool.request();
    const columnsCheck = await checkRequest.query(`
      SELECT COLUMN_NAME, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Profile' 
        AND TABLE_SCHEMA = 'dbo' 
        AND COLUMN_NAME IN ('Email', 'GymEmail', 'GymPhone', 'Phone')
    `);
    
    const columnInfo: { [key: string]: { exists: boolean; nullable: boolean } } = {};
    columnsCheck.recordset.forEach((row: any) => {
      columnInfo[row.COLUMN_NAME] = {
        exists: true,
        nullable: row.IS_NULLABLE === 'YES'
      };
    });
    
    const hasEmailColumn = columnInfo['Email']?.exists || false;
    const emailIsNullable = columnInfo['Email']?.nullable || false;
    const hasGymEmailColumn = columnInfo['GymEmail']?.exists || false;
    const gymEmailIsNullable = columnInfo['GymEmail']?.nullable || false;
    const hasGymPhoneColumn = columnInfo['GymPhone']?.exists || false;
    const gymPhoneIsNullable = columnInfo['GymPhone']?.nullable || false;
    const hasPhoneColumn = columnInfo['Phone']?.exists || false;
    const phoneIsNullable = columnInfo['Phone']?.nullable || false;
    
    const result = await runQuery((request) => {
      request.input('GymName', sql.NVarChar(200), data.gymName);
      request.input('GymAddress', sql.NVarChar(sql.MAX), data.gymAddress);
      request.input('OwnerName', sql.NVarChar(150), data.ownerName);
      request.input('OwnerPhone', sql.NVarChar(50), data.ownerPhone);
      request.input('AdditionalContact', sql.NVarChar(50), data.additionalContact || null);
      request.input('Photo', sql.NVarChar(500), data.photo || null);
      request.input('PasswordHash', sql.NVarChar(255), data.passwordHash);
      
      // Build column list and values dynamically based on what exists
      const columns = ['Id', 'GymName', 'GymAddress', 'OwnerName', 'OwnerPhone', 'AdditionalContact', 'Photo', 'PasswordHash'];
      const values = ['NEWID()', '@GymName', '@GymAddress', '@OwnerName', '@OwnerPhone', '@AdditionalContact', '@Photo', '@PasswordHash'];
      
      if (hasEmailColumn) {
        request.input('Email', sql.NVarChar(255), data.email || null);
        columns.push('Email');
        values.push(emailIsNullable ? '@Email' : 'ISNULL(@Email, \'\')');
      }
      
      if (hasGymEmailColumn) {
        // Use email value or empty string if NOT NULL, or null if nullable
        const gymEmailValue = data.email || (gymEmailIsNullable ? null : '');
        request.input('GymEmail', sql.NVarChar(255), gymEmailValue);
        columns.push('GymEmail');
        values.push(gymEmailIsNullable ? '@GymEmail' : 'ISNULL(@GymEmail, \'\')');
      }
      
      if (hasGymPhoneColumn) {
        // Use OwnerPhone as GymPhone value if GymPhone column exists
        const gymPhoneValue = data.ownerPhone || (gymPhoneIsNullable ? null : '');
        request.input('GymPhone', sql.NVarChar(50), gymPhoneValue);
        columns.push('GymPhone');
        values.push(gymPhoneIsNullable ? '@GymPhone' : 'ISNULL(@GymPhone, \'\')');
      }
      
      if (hasPhoneColumn) {
        // Use OwnerPhone as Phone value if Phone column exists
        request.input('Phone', sql.NVarChar(50), data.ownerPhone || '');
        columns.push('Phone');
        values.push(phoneIsNullable ? '@Phone' : 'ISNULL(@Phone, \'\')');
      }
      
      columns.push('CreatedAt', 'UpdatedAt');
      values.push('SYSUTCDATETIME()', 'SYSUTCDATETIME()');
      
      return request.query(`
        INSERT INTO Profile (${columns.join(', ')})
        OUTPUT INSERTED.*
        VALUES (${values.join(', ')})
      `);
    });

    return mapProfile(result.recordset[0]);
  } catch (error: any) {
    console.error('❌ Error creating profile:', error.message);
    // If it's a column error, try with minimal columns only
    if (error.message?.includes('Invalid column name') || error.message?.includes('column') || error.message?.includes('NULL')) {
      console.log('⚠️  Retrying profile creation with minimal columns...');
      try {
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
      } catch (retryError: any) {
        console.error('❌ Retry also failed:', retryError.message);
        throw retryError;
      }
    }
    throw error;
  }
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
