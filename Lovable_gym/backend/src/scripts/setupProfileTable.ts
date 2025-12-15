import sql from 'mssql';
import { getPool, isSqlDisabled } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup Profile table in SQL Server
 * Run this script to create the table if it doesn't exist
 */
export const setupProfileTable = async (): Promise<void> => {
  try {
    // Skip if SQL is disabled
    if (isSqlDisabled()) {
      console.log('⚠️  SQL Server is disabled, skipping Profile table setup');
      return;
    }

    const pool = getPool();
    
    if (!pool) {
      console.warn('⚠️  Database pool not available, skipping Profile table setup');
      return;
    }
    
    // Check if table exists
    const checkResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Profile' AND TABLE_SCHEMA = 'dbo'
    `);
    
    const tableExists = checkResult.recordset.length > 0;
    
    if (tableExists) {
      console.log('✅ Profile table already exists, running migration...');
      // Run migration to update table structure
      const migrationScriptPath = path.join(__dirname, 'migrateProfileTable.sql');
      if (fs.existsSync(migrationScriptPath)) {
        try {
          const migrationScript = fs.readFileSync(migrationScriptPath, 'utf-8');
          await pool.request().query(migrationScript);
          console.log('✅ Profile table migration completed');
        } catch (migrationError: any) {
          console.warn('⚠️  Migration script execution failed:', migrationError.message);
        }
      }
      return;
    }
    
    console.log('📝 Creating Profile table...');
    
    // Read and execute SQL script
    const sqlScriptPath = path.join(__dirname, 'createProfileTable.sql');
    
    if (!fs.existsSync(sqlScriptPath)) {
      console.error(`❌ SQL script not found: ${sqlScriptPath}`);
      // Try inline creation
      await createTableInline(pool);
      return;
    }
    
    try {
      const sqlScript = fs.readFileSync(sqlScriptPath, 'utf-8');
      // Execute the SQL script
      await pool.request().query(sqlScript);
      console.log('✅ Profile table created successfully');
    } catch (scriptError: any) {
      console.warn('⚠️  SQL script execution failed, trying inline method:', scriptError.message);
      // Try inline creation
      await createTableInline(pool);
    }
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('Profile')) {
      console.log('✅ Profile table already exists');
    } else {
      console.error('❌ Error setting up Profile table:', error.message);
      console.warn('⚠️  Continuing without Profile table. You can create it manually using the SQL script.');
    }
  }
};

/**
 * Fallback method to create table inline
 */
async function createTableInline(pool: sql.ConnectionPool): Promise<void> {
  try {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Profile]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[Profile] (
          [Id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
          [GymName] NVARCHAR(200) NOT NULL,
          [GymAddress] NVARCHAR(MAX) NOT NULL,
          [OwnerName] NVARCHAR(150) NOT NULL,
          [OwnerPhone] NVARCHAR(50) NOT NULL,
          [AdditionalContact] NVARCHAR(50) NULL,
          [Photo] NVARCHAR(500) NULL,
          [PasswordHash] NVARCHAR(255) NOT NULL,
          [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
          [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE()
        );
        
        CREATE INDEX [IX_Profile_CreatedAt] ON [dbo].[Profile]([CreatedAt]);
        
        PRINT 'Profile table created successfully (inline method)';
      END
    `);
    
    console.log('✅ Profile table created successfully (inline method)');
  } catch (error: any) {
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupProfileTable()
    .then(() => {
      console.log('✅ Setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

