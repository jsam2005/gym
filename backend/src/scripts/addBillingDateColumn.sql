-- Add BillingDate column to GymClients table if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[GymClients]') 
    AND name = 'BillingDate'
)
BEGIN
    ALTER TABLE [dbo].[GymClients]
    ADD [BillingDate] DATETIME NULL;
    
    PRINT 'BillingDate column added to GymClients table successfully';
END
ELSE
BEGIN
    PRINT 'BillingDate column already exists in GymClients table';
END

