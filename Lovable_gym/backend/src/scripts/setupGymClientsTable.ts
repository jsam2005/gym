import sql from 'mssql';
import { getPool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fallback method to create table without foreign key constraint
 */
async function createTableWithoutFK(pool: any): Promise<void> {
  try {
    // Create table without foreign key first
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GymClients]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[GymClients] (
          [Id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
          [EmployeeId] INT NOT NULL,
          [EmployeeCodeInDevice] NVARCHAR(50) NOT NULL,
          [BloodGroup] NVARCHAR(10) NULL,
          [Months] INT NULL,
          [Trainer] NVARCHAR(100) NULL,
          [PackageType] NVARCHAR(50) NULL,
          [TotalAmount] DECIMAL(10, 2) NULL,
          [AmountPaid] DECIMAL(10, 2) NULL,
          [PendingAmount] DECIMAL(10, 2) NULL,
          [RemainingDate] DATETIME NULL,
          [PreferredTimings] NVARCHAR(50) NULL,
          [PaymentMode] NVARCHAR(50) NULL,
          [BillingDate] DATETIME2 NULL,
          [IsTrainer] BIT NOT NULL DEFAULT (0),
          [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
          [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE()
        );
        PRINT 'GymClients table created (without foreign key)';
      END
    `);
    
    // Try to add foreign key constraint (optional - table works without it)
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_GymClients_Employees')
        BEGIN
          ALTER TABLE [dbo].[GymClients]
          ADD CONSTRAINT [FK_GymClients_Employees] FOREIGN KEY ([EmployeeId]) REFERENCES [dbo].[Employees]([EmployeeId]);
          PRINT 'Foreign key constraint added';
        END
      `);
    } catch (fkError: any) {
      console.warn('⚠️  Foreign key constraint not added (table will work without it):', fkError.message);
    }
    
    // Create indexes
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GymClients_EmployeeId' AND object_id = OBJECT_ID('dbo.GymClients'))
        BEGIN
          CREATE INDEX [IX_GymClients_EmployeeId] ON [dbo].[GymClients]([EmployeeId]);
        END
      `);
      
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GymClients_EmployeeCodeInDevice' AND object_id = OBJECT_ID('dbo.GymClients'))
        BEGIN
          CREATE INDEX [IX_GymClients_EmployeeCodeInDevice] ON [dbo].[GymClients]([EmployeeCodeInDevice]);
        END
      `);
    } catch (indexError: any) {
      console.warn('⚠️  Some indexes could not be created:', indexError.message);
    }
    
    console.log('✅ GymClients table created successfully (fallback method)');
  } catch (error: any) {
    throw error;
  }
}

/**
 * Setup GymClients table in SQL Server
 * Run this script to create the table if it doesn't exist
 */
export const setupGymClientsTable = async (): Promise<void> => {
  try {
    const pool = getPool();
    
    if (!pool) {
      console.warn('⚠️  Database pool not available, skipping GymClients table setup');
      return;
    }
    
    // Check if table exists
    const checkResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'GymClients' AND TABLE_SCHEMA = 'dbo'
    `);
    
    if (checkResult.recordset.length > 0) {
      console.log('✅ GymClients table already exists');
      // Run lightweight migrations for existing installations
      try {
        // Add BillingDate column if missing (explicit billing start date)
        await pool.request().query(`
          IF COL_LENGTH('dbo.GymClients', 'BillingDate') IS NULL
          BEGIN
            ALTER TABLE [dbo].[GymClients] ADD [BillingDate] DATETIME2 NULL;
            PRINT 'Added BillingDate column to GymClients';
          END
        `);

        // Add IsTrainer column if missing (some installs already have it)
        await pool.request().query(`
          IF COL_LENGTH('dbo.GymClients', 'IsTrainer') IS NULL
          BEGIN
            ALTER TABLE [dbo].[GymClients]
              ADD [IsTrainer] BIT NOT NULL CONSTRAINT [DF_GymClients_IsTrainer] DEFAULT (0);
            PRINT 'Added IsTrainer column to GymClients';
          END
        `);

        // Helpful index for latest-row lookup (safe even if duplicates exist)
        await pool.request().query(`
          IF NOT EXISTS (
            SELECT * FROM sys.indexes 
            WHERE name = 'IX_GymClients_EmployeeId_BillingDate' 
              AND object_id = OBJECT_ID('dbo.GymClients')
          )
          BEGIN
            CREATE INDEX [IX_GymClients_EmployeeId_BillingDate]
              ON [dbo].[GymClients]([EmployeeId], [BillingDate], [UpdatedAt]);
          END
        `);
      } catch (migrationError: any) {
        console.warn('⚠️  GymClients migrations skipped:', migrationError.message);
      }
      return;
    }
    
    console.log('📝 Creating GymClients table...');
    
    // Read and execute SQL script
    const sqlScriptPath = path.join(__dirname, 'createGymClientsTable.sql');
    
    if (!fs.existsSync(sqlScriptPath)) {
      console.error(`❌ SQL script not found: ${sqlScriptPath}`);
      // Try fallback creation
      await createTableWithoutFK(pool);
      return;
    }
    
    try {
      const sqlScript = fs.readFileSync(sqlScriptPath, 'utf-8');
      // Execute the SQL script
      await pool.request().query(sqlScript);
      console.log('✅ GymClients table created successfully');
      // Ensure latest schema additions are present even if the SQL script is outdated
      try {
        await pool.request().query(`
          IF COL_LENGTH('dbo.GymClients', 'BillingDate') IS NULL
          BEGIN
            ALTER TABLE [dbo].[GymClients] ADD [BillingDate] DATETIME2 NULL;
          END
          IF COL_LENGTH('dbo.GymClients', 'IsTrainer') IS NULL
          BEGIN
            ALTER TABLE [dbo].[GymClients]
              ADD [IsTrainer] BIT NOT NULL CONSTRAINT [DF_GymClients_IsTrainer] DEFAULT (0);
          END
        `);
      } catch (migrationError: any) {
        console.warn('⚠️  Post-create migrations skipped:', migrationError.message);
      }
    } catch (scriptError: any) {
      console.warn('⚠️  SQL script execution failed, trying fallback method:', scriptError.message);
      // Try fallback creation
      await createTableWithoutFK(pool);
    }
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('GymClients')) {
      console.log('✅ GymClients table already exists');
    } else if (error.message?.includes('Invalid object name')) {
      // Table doesn't exist, try to create it with fallback method
      try {
        const pool = getPool();
        if (pool) {
          await createTableWithoutFK(pool);
        }
      } catch (fallbackError: any) {
        console.error('❌ Error creating GymClients table:', fallbackError.message);
        console.warn('⚠️  Continuing without GymClients table. The system will work fine without it.');
        console.warn('ℹ️  GymClients table is optional - it only stores additional website-specific info.');
      }
    } else {
      console.error('❌ Error setting up GymClients table:', error.message);
      console.warn('⚠️  Continuing without GymClients table. You can create it manually using the SQL script.');
    }
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupGymClientsTable()
    .then(() => {
      console.log('✅ Setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

