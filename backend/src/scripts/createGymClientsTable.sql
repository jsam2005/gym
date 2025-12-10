-- Create GymClients table for website-specific additional information
-- This table stores gym-specific data (package, trainer, payment, etc.)
-- Linked to Employees table via EmployeeId

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GymClients]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[GymClients] (
        [Id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        [EmployeeId] INT NOT NULL,  -- Reference to Employees.EmployeeId
        [EmployeeCodeInDevice] NVARCHAR(50) NOT NULL,  -- User ID for device (matches Employees.EmployeeCodeInDevice)
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
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_GymClients_Employees] FOREIGN KEY ([EmployeeId]) REFERENCES [dbo].[Employees]([EmployeeId])
    );

    -- Create indexes for better performance
    CREATE INDEX [IX_GymClients_EmployeeId] ON [dbo].[GymClients]([EmployeeId]);
    CREATE INDEX [IX_GymClients_EmployeeCodeInDevice] ON [dbo].[GymClients]([EmployeeCodeInDevice]);
    
    PRINT 'GymClients table created successfully';
END
ELSE
BEGIN
    PRINT 'GymClients table already exists';
END


-- This table stores gym-specific data (package, trainer, payment, etc.)
-- Linked to Employees table via EmployeeId

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GymClients]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[GymClients] (
        [Id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        [EmployeeId] INT NOT NULL,  -- Reference to Employees.EmployeeId
        [EmployeeCodeInDevice] NVARCHAR(50) NOT NULL,  -- User ID for device (matches Employees.EmployeeCodeInDevice)
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
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_GymClients_Employees] FOREIGN KEY ([EmployeeId]) REFERENCES [dbo].[Employees]([EmployeeId])
    );

    -- Create indexes for better performance
    CREATE INDEX [IX_GymClients_EmployeeId] ON [dbo].[GymClients]([EmployeeId]);
    CREATE INDEX [IX_GymClients_EmployeeCodeInDevice] ON [dbo].[GymClients]([EmployeeCodeInDevice]);
    
    PRINT 'GymClients table created successfully';
END
ELSE
BEGIN
    PRINT 'GymClients table already exists';
END






