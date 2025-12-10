const realtimeConfig = {
  table: process.env.ETIME_SQL_RT_TABLE || 'DeviceLogs',
  columns: {
    deviceLogId: process.env.ETIME_SQL_RT_DEVICELOGID_COLUMN || 'DeviceLogId',
    userId: process.env.ETIME_SQL_RT_USER_COLUMN || 'UserId',
    logDate: process.env.ETIME_SQL_RT_LOG_COLUMN || 'LogDate',
    downloadDate: process.env.ETIME_SQL_RT_DOWNLOAD_COLUMN || 'DownloadDate',
    deviceId: process.env.ETIME_SQL_RT_DEVICE_COLUMN || 'DeviceId',
    verifyMode: process.env.ETIME_SQL_RT_VERIFY_COLUMN || '',
    direction: process.env.ETIME_SQL_RT_DIRECTION_COLUMN || 'Direction',
    workCode: process.env.ETIME_SQL_RT_WORKCODE_COLUMN || 'WorkCode',
    location: process.env.ETIME_SQL_RT_LOCATION_COLUMN || 'LocationAddress',
    temperature: process.env.ETIME_SQL_RT_TEMP_COLUMN || 'BodyTemperature',
    mask: process.env.ETIME_SQL_RT_MASK_COLUMN || 'IsMaskOn',
  },
  employee: {
    table: process.env.ETIME_SQL_EMPLOYEE_TABLE || 'Employees', // Default to Employees table
    idColumn:
      process.env.ETIME_SQL_EMPLOYEE_ID_COLUMN ||
      process.env.ETIME_SQL_RT_USER_COLUMN ||
      'EmployeeCodeInDevice', // Matches UserId in DeviceLogs
    nameColumn: process.env.ETIME_SQL_EMPLOYEE_NAME_COLUMN || 'EmployeeName',
  },
};

export default realtimeConfig;





