-- ============================================
-- Add BillingDate Column to GymClients Table
-- ============================================
-- Run this script in SQL Server Management Studio
-- or your SQL client connected to your database

-- Check if BillingDate column exists, if not add it
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[GymClients]') 
    AND name = 'BillingDate'
)
BEGIN
    ALTER TABLE [dbo].[GymClients]
    ADD [BillingDate] DATETIME NULL;
    
    PRINT '✅ BillingDate column added to GymClients table successfully';
END
ELSE
BEGIN
    PRINT 'ℹ️ BillingDate column already exists in GymClients table';
END
GO

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'GymClients' 
AND COLUMN_NAME = 'BillingDate';
GO



