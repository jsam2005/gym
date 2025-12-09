import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

type DatabaseConfig = sql.config & {
  pool: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
  };
};

/**
 * Get database configuration dynamically (reads from env at call time, not module load)
 */
const getDatabaseConfig = (): DatabaseConfig => {
const rawServer =
  process.env.ETIMETRACK_SQL_SERVER ||
  process.env.TRACKLIE_SQL_SERVER ||
  process.env.ETIME_SQL_SERVER ||
  'localhost';
  
  // Parse server name and instance
const [parsedServer, parsedInstance] = rawServer.split('\\');
const instanceName =
  process.env.ETIMETRACK_SQL_INSTANCE ||
  process.env.TRACKLIE_SQL_INSTANCE ||
  process.env.ETIME_SQL_INSTANCE ||
  parsedInstance;
  
  // For named instances, we need to use the server name directly with instance
  // mssql package handles instanceName in options
  const serverName = parsedInstance ? parsedServer : rawServer;
  
  return {
    server: serverName,
  database:
    process.env.ETIMETRACK_SQL_DATABASE ||
    process.env.TRACKLIE_SQL_DATABASE ||
    process.env.ETIME_SQL_DB ||
    'etimetracklite1',
  user:
    process.env.ETIMETRACK_SQL_USER ||
    process.env.TRACKLIE_SQL_USER ||
    process.env.ETIME_SQL_USER ||
    'essl',
  password:
    process.env.ETIMETRACK_SQL_PASSWORD ||
    process.env.TRACKLIE_SQL_PASSWORD ||
    process.env.ETIME_SQL_PASSWORD ||
    '',
  options: {
    // Enable encryption for Cloudflare Tunnel connections
    // If connecting via tunnel, set encrypt: true
    // For local connections, encrypt: false is fine
    encrypt: process.env.ETIME_SQL_SERVER?.includes('tunnel') || 
             process.env.ETIME_SQL_SERVER?.includes('cloudflare') ||
             process.env.ETIME_SQL_SERVER?.includes('.com') ||
             process.env.ETIME_SQL_SERVER?.includes('.net') ||
             process.env.ETIME_SQL_SERVER?.includes('.io') ? true : false,
    trustServerCertificate: true, // Set to true for local/trusted connections and tunnels
    enableArithAbort: true,
    instanceName: instanceName || undefined, // SQLEXPRESS for named instance
    // Increased timeouts for tunnel connections
    connectTimeout: process.env.ETIME_SQL_SERVER?.includes('tunnel') || 
                    process.env.ETIME_SQL_SERVER?.includes('cloudflare') ? 60000 : 30000,
    requestTimeout: process.env.ETIME_SQL_SERVER?.includes('tunnel') || 
                    process.env.ETIME_SQL_SERVER?.includes('cloudflare') ? 60000 : 30000,
    // Additional options for better connection
    enableImplicitTransactions: false,
    abortTransactionOnError: false,
    // Explicit port for tunnel connections (Cloudflare Tunnel uses standard SQL port)
    port: process.env.ETIME_SQL_PORT ? parseInt(process.env.ETIME_SQL_PORT) : undefined,
  } as sql.config['options'],
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  };
};

export const isSqlDisabled = (): boolean => {
  return process.env.SQL_DISABLED === 'true' || process.env.USE_API_ONLY === 'true';
};

const connectDB = async (): Promise<void> => {
  // Skip connection if SQL is disabled (using API instead)
  if (isSqlDisabled()) {
    console.log('⚠️  SQL Server connection skipped (using API mode)');
    console.log('💡 To enable SQL: Set SQL_DISABLED=false in .env file');
    return;
  }

  // Show what environment variables were actually read
  console.log('📋 SQL Configuration:');
  console.log(`   SQL_DISABLED: ${process.env.SQL_DISABLED || 'not set (default: false)'}`);
  console.log(`   ETIME_SQL_SERVER: ${process.env.ETIME_SQL_SERVER || 'not set (default: localhost)'}`);
  console.log(`   ETIME_SQL_DB: ${process.env.ETIME_SQL_DB || 'not set (default: etimetracklite1)'}`);
  console.log(`   ETIME_SQL_USER: ${process.env.ETIME_SQL_USER || 'not set (default: essl)'}`);
  
  if (!process.env.ETIME_SQL_SERVER || !process.env.ETIME_SQL_DB) {
    console.warn('⚠️  WARNING: Environment variables not found!');
    console.warn('💡 Make sure you have a .env file in Lovable_gym/backend/ with:');
    console.warn('   SQL_DISABLED=false');
    console.warn('   ETIME_SQL_SERVER=JSAM\\SQLEXPRESS');
    console.warn('   ETIME_SQL_DB=etimetracklite1');
    console.warn('   ETIME_SQL_USER=essl');
    console.warn('   ETIME_SQL_PASSWORD=essl');
  }

  try {
    if (!pool) {
      // Get config dynamically (reads env vars at connection time)
      const config = getDatabaseConfig();
      
      // Show what environment variables were actually read
      console.log('📋 SQL Configuration:');
      console.log(`   SQL_DISABLED: ${process.env.SQL_DISABLED || 'not set (default: false)'}`);
      console.log(`   ETIME_SQL_SERVER: ${process.env.ETIME_SQL_SERVER || 'not set (default: localhost)'}`);
      console.log(`   ETIME_SQL_DB: ${process.env.ETIME_SQL_DB || 'not set (default: etimetracklite1)'}`);
      console.log(`   ETIME_SQL_USER: ${process.env.ETIME_SQL_USER || 'not set (default: essl)'}`);
      
      if (!process.env.ETIME_SQL_SERVER || !process.env.ETIME_SQL_DB) {
        console.warn('⚠️  WARNING: Environment variables not found!');
        console.warn('💡 Make sure you have a .env file in Lovable_gym/backend/ with:');
        console.warn('   SQL_DISABLED=false');
        console.warn('   ETIME_SQL_SERVER=JSAM\\SQLEXPRESS');
        console.warn('   ETIME_SQL_DB=etimetracklite1');
        console.warn('   ETIME_SQL_USER=essl');
        console.warn('   ETIME_SQL_PASSWORD=essl');
      }
      
      const instanceStr = config.options?.instanceName ? '\\' + config.options.instanceName : '';
      console.log(`🔌 Attempting to connect to SQL Server...`);
      console.log(`   Server: ${config.server}${instanceStr}`);
      console.log(`   Database: ${config.database}`);
      console.log(`   User: ${config.user}`);
      
      pool = await sql.connect(config);
      console.log('✅ Connected to SQL Server (Tracklie / eTimeTrack)');
      console.log(`📁 Server: ${config.server}${instanceStr}`);
      console.log(`📁 Database: ${config.database}`);
    }
  } catch (error: any) {
    const config = getDatabaseConfig();
    const instanceStr = config.options?.instanceName ? '\\' + config.options.instanceName : '';
    console.error('❌ SQL Server connection failed:', error.message);
    console.error(`   Attempted connection to: ${config.server}${instanceStr}`);
    console.error(`   Database: ${config.database}`);
    console.error(`   User: ${config.user}`);
    console.warn('💡 Troubleshooting (connection timeout):');
    console.warn('   1. Start SQL Server Browser service (REQUIRED for named instances):');
    console.warn('      - Open Services (services.msc)');
    console.warn('      - Find "SQL Server Browser" → Start it');
    console.warn('   2. Enable TCP/IP in SQL Server Configuration Manager:');
    console.warn('      - Protocols for SQLEXPRESS → Enable TCP/IP');
    console.warn('      - Restart SQL Server service');
    console.warn('   3. Check SQL Server is running:');
    console.warn('      - Services → "SQL Server (SQLEXPRESS)" should be Running');
    console.warn('   4. Test connection in SQL Server Management Studio first');
    console.warn('   5. If on same machine, try: ETIME_SQL_SERVER=localhost\\SQLEXPRESS');
    // Don't throw - allow server to start without direct SQL connection
    pool = null;
  }
};

// Get connection pool
export const getPool = (): sql.ConnectionPool => {
  if (!pool && !isSqlDisabled()) {
    throw new Error('Database not connected. SQL Server connection is required for this operation. Set up SQL connection or use API endpoints instead.');
  }
  if (!pool && isSqlDisabled()) {
    throw new Error('SQL_DISABLED: Database pool is not available in API-only mode.');
  }
  return pool!; // Assert non-null as it's checked above
};

// Close connection
export const closeDB = async (): Promise<void> => {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('🔌 SQL Server connection closed');
  }
};

// Handle connection events
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});

export default connectDB;
