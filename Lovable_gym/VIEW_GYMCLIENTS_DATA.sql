-- ============================================
-- View All Data from GymClients Table
-- ============================================
-- Run this script in SQL Server Management Studio
-- or your SQL client connected to your database

-- Basic query to view all data
SELECT * FROM GymClients;

-- ============================================
-- More Detailed Queries (Optional)
-- ============================================

-- View all data with Employee names (JOIN with Employees table)
SELECT 
    gc.Id,
    gc.EmployeeId,
    e.EmployeeName,
    e.ContactNo,
    e.Email,
    gc.EmployeeCodeInDevice,
    gc.BloodGroup,
    gc.Months,
    gc.Trainer,
    gc.PackageType,
    gc.TotalAmount,
    gc.AmountPaid,
    gc.PendingAmount,
    gc.RemainingDate,
    gc.BillingDate,
    gc.PreferredTimings,
    gc.PaymentMode,
    gc.CreatedAt,
    gc.UpdatedAt
FROM GymClients gc
LEFT JOIN Employees e ON gc.EmployeeId = e.EmployeeId
ORDER BY gc.CreatedAt DESC;

-- Count total records
SELECT COUNT(*) AS TotalRecords FROM GymClients;

-- View summary statistics
SELECT 
    COUNT(*) AS TotalClients,
    COUNT(DISTINCT PackageType) AS UniquePackages,
    SUM(TotalAmount) AS TotalRevenue,
    SUM(AmountPaid) AS TotalPaid,
    SUM(PendingAmount) AS TotalPending,
    AVG(Months) AS AvgDuration
FROM GymClients
WHERE TotalAmount IS NOT NULL;

-- View clients with billing dates
SELECT 
    EmployeeId,
    EmployeeCodeInDevice,
    BillingDate,
    PackageType,
    TotalAmount,
    AmountPaid,
    PendingAmount
FROM GymClients
WHERE BillingDate IS NOT NULL
ORDER BY BillingDate DESC;



