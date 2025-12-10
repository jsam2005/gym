# Database Tables for Website User Information

## Overview
The website uses a combination of existing middleware tables and new website-specific tables to store user/client information.

---

## 1. Employees Table (Existing - eSSL Middleware)
**Purpose:** Stores basic client/employee information (managed by eSSL middleware)

**Key Columns:**
- `EmployeeId` (INT, Primary Key)
- `EmployeeName` (NVARCHAR) - Full name
- `EmployeeCode` (NVARCHAR)
- `EmployeeCodeInDevice` (NVARCHAR) - Device user ID
- `ContactNo` (NVARCHAR) - Phone number
- `Email` (NVARCHAR)
- `Gender` (NVARCHAR)
- `ResidentialAddress` (NVARCHAR)
- `Status` (NVARCHAR) - active/inactive/suspended
- `DOJ` (DATETIME) - Date of Joining
- `DOR` (DATETIME) - Date of Resignation
- `EmployeePhoto` (NVARCHAR)
- And other middleware-specific fields...

**Note:** This table is managed by the eSSL middleware software. The website reads from it but doesn't create records directly (clients are added via the device).

---

## 2. GymClients Table (Created for Website)
**Purpose:** Stores additional website-specific gym information

**Table Name:** `GymClients`

**SQL Script:** `backend/src/scripts/createGymClientsTable.sql`

**Structure:**
```sql
CREATE TABLE [dbo].[GymClients] (
    [Id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    [EmployeeId] INT NOT NULL,  -- Foreign Key to Employees.EmployeeId
    [EmployeeCodeInDevice] NVARCHAR(50) NOT NULL,
    [BloodGroup] NVARCHAR(10) NULL,
    [Months] INT NULL,  -- Package duration in months
    [Trainer] NVARCHAR(100) NULL,
    [PackageType] NVARCHAR(50) NULL,
    [TotalAmount] DECIMAL(10, 2) NULL,  -- Total package amount
    [AmountPaid] DECIMAL(10, 2) NULL,  -- Amount paid so far
    [PendingAmount] DECIMAL(10, 2) NULL,  -- Remaining amount
    [RemainingDate] DATETIME NULL,  -- Package end date
    [BillingDate] DATETIME NULL,  -- Billing/start date (recently added)
    [PreferredTimings] NVARCHAR(50) NULL,  -- e.g., "06:00 AM - 10:00 PM"
    [PaymentMode] NVARCHAR(50) NULL,  -- Cash/Card/UPI/etc.
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [FK_GymClients_Employees] FOREIGN KEY ([EmployeeId]) 
        REFERENCES [dbo].[Employees]([EmployeeId])
);
```

**Indexes:**
- `IX_GymClients_EmployeeId` - On EmployeeId
- `IX_GymClients_EmployeeCodeInDevice` - On EmployeeCodeInDevice

**Relationship:**
- One-to-One relationship with Employees table
- Linked via `EmployeeId` foreign key
- Each employee can have one GymClients record

**Usage:**
- Stores gym-specific data not in the Employees table
- Used for billing, packages, timings, etc.
- Created/updated when editing clients through the website

---

## 3. Users Table (For Website Admin Users)
**Purpose:** Stores website admin/login users (not clients)

**Structure:**
```sql
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
```

**Note:** This is for website administrators, not gym clients.

---

## Data Flow

1. **Client Creation:**
   - Clients are added via the ESSL device/middleware → Stored in `Employees` table
   - Website can add additional info → Stored in `GymClients` table

2. **Client Updates:**
   - Basic info (name, contact, email) → Updated in `Employees` table
   - Gym-specific info (package, billing, timings) → Updated in `GymClients` table

3. **Client Retrieval:**
   - Website queries `Employees` table (JOIN with `GymClients` if exists)
   - Merges data from both tables for display

---

## Important Notes

- **Employees table** is the primary source of truth for client data
- **GymClients table** is optional - stores additional website-specific data
- If `GymClients` table doesn't exist, the website still works (uses defaults)
- The `BillingDate` column was recently added to `GymClients` table
- All tables use proper foreign key relationships for data integrity

