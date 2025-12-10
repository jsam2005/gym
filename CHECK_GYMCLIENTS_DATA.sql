-- ============================================
-- Check GymClients Table Data
-- ============================================

-- 1. Check if table exists and count records
SELECT 
    'GymClients' AS TableName,
    COUNT(*) AS RecordCount
FROM GymClients;

-- 2. View all records (if any exist)
SELECT * FROM GymClients;

-- 3. Check which Employees have GymClients records
SELECT 
    e.EmployeeId,
    e.EmployeeName,
    e.ContactNo,
    CASE 
        WHEN gc.EmployeeId IS NOT NULL THEN 'Has GymClients Record'
        ELSE 'No GymClients Record'
    END AS GymClientsStatus
FROM Employees e
LEFT JOIN GymClients gc ON e.EmployeeId = gc.EmployeeId
WHERE e.EmployeeName NOT LIKE 'del_%'
  AND LOWER(e.Status) NOT IN ('deleted', 'delete')
ORDER BY e.EmployeeId;

-- 4. Count Employees vs GymClients records
SELECT 
    (SELECT COUNT(*) FROM Employees 
     WHERE EmployeeName NOT LIKE 'del_%' 
     AND LOWER(Status) NOT IN ('deleted', 'delete')) AS TotalEmployees,
    (SELECT COUNT(*) FROM GymClients) AS TotalGymClientsRecords,
    (SELECT COUNT(*) FROM Employees 
     WHERE EmployeeName NOT LIKE 'del_%' 
     AND LOWER(Status) NOT IN ('deleted', 'delete')
     AND EmployeeId IN (SELECT EmployeeId FROM GymClients)) AS EmployeesWithGymClients;

-- 5. View sample Employees that don't have GymClients records yet
SELECT TOP 10
    e.EmployeeId,
    e.EmployeeName,
    e.ContactNo,
    e.Email,
    e.Status
FROM Employees e
LEFT JOIN GymClients gc ON e.EmployeeId = gc.EmployeeId
WHERE gc.EmployeeId IS NULL
  AND e.EmployeeName NOT LIKE 'del_%'
  AND LOWER(e.Status) NOT IN ('deleted', 'delete')
ORDER BY e.EmployeeId;

