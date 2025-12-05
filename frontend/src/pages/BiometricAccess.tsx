import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { 
  Fingerprint, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  UserPlus,
  Shield,
  Activity,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  Users
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { biometricAPI, clientAPI, etimetrackAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  esslUserId?: string;
  fingerprintEnrolled: boolean;
  isAccessActive: boolean;
  packageEndDate: string;
  accessSchedule: any[];
  lastAccessTime?: string;
}

interface AccessLogClientRef {
  firstName?: string;
  lastName?: string;
  photo?: string;
}

interface AccessLog {
  _id?: string;
  id?: string;
  esslUserId?: string;
  userId?: string;
  employeeName?: string;
  timestamp: string;
  clientId?: AccessLogClientRef | null;
  clientName?: string;
  accessGranted?: boolean;
  reason?: string;
  biometricType?: string;
  deviceId?: string | null;
  deviceName?: string | null;
  direction?: string | null;
  workCode?: string | null;
  location?: string | null;
  bodyTemperature?: number | null;
  isMaskOn?: boolean | null;
  source?: string;
}

const BiometricAccess = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [migrating, setMigrating] = useState(false);
  const [refreshingLogs, setRefreshingLogs] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [newLogEntry, setNewLogEntry] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  // Clear new entry highlight after 5 seconds
  useEffect(() => {
    if (newLogEntry) {
      const timer = setTimeout(() => {
        setNewLogEntry(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newLogEntry]);

  // Initialize Socket.IO
  useEffect(() => {
    // Prevent multiple socket instances - check if socket already exists
    if (socket) {
      return;
    }

    const socketInstance = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: false,
      autoConnect: true,
      closeOnBeforeunload: false
    });
    setSocket(socketInstance);

    let reconnectToastShown = false;
    let isInitialConnect = true;

    socketInstance.on('connect', () => {
      console.log('✅ Connected to server');
      setSocketConnected(true);
      reconnectToastShown = false;
      
      // Only show toast on initial connect, not on reconnects
      if (isInitialConnect) {
        isInitialConnect = false;
        toast({
          title: "Connected",
          description: "Real-time updates active",
        });
      }
    });

    // Handle server connection confirmation
    socketInstance.on('connected', (data) => {
      console.log('✅ Server confirmed connection:', data);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      setSocketConnected(false);
      
      // Don't show toast for intentional client disconnects (e.g., during cleanup)
      if (reason === 'io client disconnect' || reason === 'io server disconnect') {
        return;
      }
      
      if (!reconnectToastShown) {
        reconnectToastShown = true;
        toast({
          title: "Disconnected",
          description: "Real-time updates offline. Reconnecting...",
          variant: "destructive",
        });
      }
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      setSocketConnected(true);
      toast({
        title: "Reconnected",
        description: "Real-time updates restored",
      });
    });

    socketInstance.on('reconnect_error', (error) => {
      console.log('❌ Reconnection failed:', error);
    });

    socketInstance.on('reconnect_failed', () => {
      console.log('❌ Reconnection failed permanently');
      toast({
        title: "Connection Failed",
        description: "Unable to reconnect. Please refresh the page.",
        variant: "destructive",
      });
    });

    // Handle access attempts from ESSL device
    socketInstance.on('access_attempt', (data) => {
      console.log('🔐 Access attempt received:', data);
      toast({
        title: data.allowed ? "✅ Access Granted" : "❌ Access Denied",
        description: `${data.clientName} - ${data.reason}`,
        variant: data.allowed ? "default" : "destructive",
      });
      
      // Refresh logs and dashboard
      fetchAccessLogs();
      fetchDashboard();
    });

    // Handle new access log entries in real-time
    socketInstance.on('new_access_log', (newLog) => {
      console.log('📝 New access log received:', newLog);
      const normalizedLog = mapLegacyLogs([newLog])[0] || newLog;

      // Add new log to the top of the list with animation
      setNewLogEntry(normalizedLog);
      
      // Update the access logs list
      setAccessLogs(prevLogs => [normalizedLog, ...prevLogs]);
      
      // Update dashboard stats
      fetchDashboard();
      
      // Show notification
      toast({
        title: "New Check-in",
        description: `${normalizedLog.clientName || normalizedLog.userId || 'Unknown'} checked in`,
      });
    });

    // Handle access logs from ESSL device (new format)
    socketInstance.on('access-log', (data) => {
      console.log('📋 Access log received:', data);
      toast({
        title: data.accessGranted ? "✅ Access Granted" : "❌ Access Denied",
        description: `${data.client.name} - ${data.reason}`,
        variant: data.accessGranted ? "default" : "destructive",
      });
      
      // Refresh logs and dashboard
      fetchAccessLogs();
      fetchDashboard();
    });

    // Handle fingerprint enrollment completion
    socketInstance.on('fingerprint_enrolled', (data) => {
      console.log('👆 Fingerprint enrolled:', data);
      toast({
        title: "🎉 Fingerprint Enrolled",
        description: `${data.name} successfully enrolled`,
      });
      fetchClients();
      fetchDashboard();
    });

    // Handle device status updates
    socketInstance.on('device_status', (data) => {
      console.log('📊 Device status:', data);
      if (data.status === 'online') {
        setDeviceConnected(true);
      }
    });

    return () => {
      // Only disconnect if socket is still connected
      if (socketInstance && socketInstance.connected) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
      }
    };
  }, []); // Empty deps - socket should only be created once

  // Fetch data on mount
  useEffect(() => {
    testDevice();
    fetchClients();
    fetchAccessLogs();
    fetchDashboard();
  }, []);

  // Fetch logs when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAccessLogs(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchClients();
        fetchAccessLogs();
        fetchDashboard();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const testDevice = async () => {
    try {
      // Test both regular and direct ESSL connection
      const [regularResponse, directResponse] = await Promise.allSettled([
        biometricAPI.testConnection(),
        fetch('http://localhost:5000/api/direct-essl/test-direct')
      ]);
      
      const regularSuccess = regularResponse.status === 'fulfilled' && regularResponse.value.data.success;
      const directSuccess = directResponse.status === 'fulfilled' && directResponse.value.ok;
      
      const isConnected = regularSuccess || directSuccess;
      setDeviceConnected(isConnected);
      
      if (isConnected) {
        toast({
          title: "✅ Device Connected",
          description: "ESSL K30 Pro is online and ready",
        });
      } else {
        toast({
          title: "⚠️ Device Offline",
          description: "ESSL K30 Pro not connected. Running in development mode.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Device test failed:', error);
      setDeviceConnected(false);
      toast({
        title: "❌ Connection Failed",
        description: "Unable to connect to ESSL device",
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getAll({ status: 'active' });
      setClients(response.data.clients);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  const mapRealtimeLogs = (data: any[] = []): AccessLog[] => {
    return data.map((log) => {
      const timestamp = log.logDate || new Date().toISOString();
      const id =
        (log.deviceLogId && log.deviceLogId.toString()) ||
        `${log.userId || 'user'}-${timestamp}`;

      return {
        id,
        timestamp,
        userId: log.userId,
        employeeName: log.employeeName,
        clientName: log.employeeName || log.userId || 'Unknown',
        accessGranted: true,
        reason: log.workCode ? `WorkCode: ${log.workCode}` : 'Device log',
        biometricType: log.verifyMode || 'fingerprint',
        deviceId: log.deviceId || null,
        direction: log.direction || null,
        workCode: log.workCode || null,
        location: log.location || null,
        bodyTemperature: typeof log.bodyTemperature === 'number' ? log.bodyTemperature : null,
        isMaskOn:
          typeof log.isMaskOn === 'boolean'
            ? log.isMaskOn
            : log.isMaskOn === 1
              ? true
              : log.isMaskOn === 0
                ? false
                : null,
        source: 'sql-device',
      };
    });
  };

  const mapLegacyLogs = (data: any[] = []): AccessLog[] => {
    return data.map((log, index) => {
      // Ensure timestamp is in the correct format (yyyy-MM-ddTHH:mm:ss.fff)
      // Remove any timezone indicators (Z) since SQL Server datetime has no timezone
      let timestamp = log.timestamp;
      if (timestamp && typeof timestamp === 'string') {
        // Remove trailing Z and ensure format is correct
        timestamp = timestamp.replace(/Z$/, '').replace(/\.\d{4,}.*$/, '');
        // Ensure it has milliseconds (add .000 if missing)
        if (!timestamp.includes('.')) {
          timestamp += '.000';
        }
      }
      
      // Generate unique ID - prioritize existing IDs, then create unique one with index
      const uniqueId = log.id 
        ? log.id 
        : log._id 
          ? log._id 
          : log.DeviceLogId 
            ? `devicelog-${log.DeviceLogId}` 
            : `${log.userId || log.esslUserId || 'log'}-${timestamp || Date.now()}-${index}`;
      
      return {
        id: uniqueId,
        userId: log.userId || log.esslUserId,
        employeeName: log.employeeName || log.clientName || 'Unknown',
        esslUserId: log.esslUserId || log.userId,
        timestamp: timestamp || new Date().toISOString().replace('Z', ''),
        accessGranted: log.accessGranted !== false,
      };
    });
  };

  const buildLogKey = (log: AccessLog, index?: number): string => {
    // Prioritize unique identifiers
    if (log._id) return `log-${log._id}`;
    if (log.id) return `log-${log.id}`;
    
    // Fallback: combine userId, timestamp, and index for uniqueness
    const userId = log.userId || log.esslUserId || 'unknown';
    const timestamp = log.timestamp || Date.now().toString();
    const indexSuffix = index !== undefined ? `-${index}` : '';
    return `log-${userId}-${timestamp}${indexSuffix}`;
  };

  const getLogDisplayName = (log: AccessLog): string => {
    if (log.clientName && log.clientName.trim().length > 0) {
      return log.clientName;
    }
    if (log.clientId) {
      const composed = `${log.clientId.firstName ?? ''} ${log.clientId.lastName ?? ''}`.trim();
      if (composed.length > 0) {
        return composed;
      }
    }
    if (log.employeeName) {
      return log.employeeName;
    }
    if (log.userId) {
      return log.userId;
    }
    if (log.esslUserId) {
      return log.esslUserId;
    }
    return 'Unknown';
  };

  const fetchAccessLogs = async (date?: Date) => {
    try {
      const filterDate = date || selectedDate || new Date();
      const startDate = new Date(filterDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filterDate);
      endDate.setHours(23, 59, 59, 999);

      const params: any = {
        limit: 500,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        deviceId: 20 // FACE device
      };

      const response = await biometricAPI.getAllLogs(params);
      
      if (response.data.success && response.data.logs) {
        const logs = mapLegacyLogs(response.data.logs);
        setAccessLogs(logs);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch access logs",
        variant: "destructive",
      });
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await biometricAPI.getDashboard();
      setDashboardStats(response.data.dashboard);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    }
  };

  const handleRegisterClient = async (client: Client) => {
    setLoading(true);
    try {
      await biometricAPI.registerClient({ clientId: client._id });
      toast({
        title: "Success",
        description: `${client.firstName} ${client.lastName} registered on device`,
      });
      fetchClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to register client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollFingerprint = async () => {
    if (!selectedClient) return;

    setEnrolling(true);
    try {
      const response = await biometricAPI.enrollFingerprint({ 
        clientId: selectedClient._id 
      });
      
      toast({
        title: "Enrollment Started",
        description: response.data.message,
      });

      setEnrollDialogOpen(false);
      
      // Wait for socket event to update UI
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to enroll fingerprint",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleAccess = async (client: Client, enabled: boolean) => {
    try {
      await biometricAPI.toggleAccess(client._id, { enabled });
      toast({
        title: "Success",
        description: `Access ${enabled ? 'enabled' : 'disabled'} for ${client.firstName} ${client.lastName}`,
      });
      fetchClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to toggle access",
        variant: "destructive",
      });
    }
  };

  const handleMigration = async () => {
    setMigrating(true);
    try {
      const response = await biometricAPI.migrateUsers();
      toast({
        title: "Migration Complete",
        description: `${response.data.migrated} users migrated, ${response.data.skipped} skipped`,
      });
      fetchClients(); // Refresh client list
    } catch (error: any) {
      toast({
        title: "Migration Failed",
        description: error.response?.data?.message || "Failed to migrate users",
        variant: "destructive",
      });
    } finally {
      setMigrating(false);
    }
  };

  const filteredClients = filterStatus === "all" 
    ? clients 
    : filterStatus === "enrolled"
    ? clients.filter(c => c.fingerprintEnrolled)
    : clients.filter(c => !c.fingerprintEnrolled);

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Biometric Access Control"
      />

      {/* Device Status Banner */}
      <Card className="gym-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {deviceConnected ? (
              <Wifi className="w-6 h-6 text-green-400" />
            ) : (
              <WifiOff className="w-6 h-6 text-red-400" />
            )}
            <div>
              <h3 className="font-semibold text-white">ESSL K30 Pro Status</h3>
              <p className="text-sm text-slate-300">
                {deviceConnected ? "Connected and ready for access control" : "Device offline (Development Mode)"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Webhook: /api/direct-essl/webhook | Device validates access via website
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-slate-400">
                  Real-time: {socketConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testDevice}
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Test Connection
            </Button>
            {!socketConnected && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (socket) {
                    socket.disconnect();
                    socket.connect();
                  }
                }}
                className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
              >
                <Wifi className="w-4 h-4 mr-1" />
                Reconnect
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMigration}
              disabled={!deviceConnected || migrating}
              className="border-green-500 text-green-400 hover:bg-green-500/10"
            >
              {migrating ? "Migrating..." : "Migrate ESSL Users"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="gym-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Today's Access</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {dashboardStats.todayStats.totalAttempts}
                </p>
              </div>
              <Activity className="w-10 h-10 text-cyan-400" />
            </div>
            <p className="text-xs text-green-400 mt-2">
              {dashboardStats.todayStats.successRate}% success rate
            </p>
          </Card>

          <Card className="gym-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Granted</p>
                <p className="text-3xl font-bold text-green-400 mt-1">
                  {dashboardStats.todayStats.granted}
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
          </Card>

          <Card className="gym-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Denied</p>
                <p className="text-3xl font-bold text-red-400 mt-1">
                  {dashboardStats.todayStats.denied}
                </p>
              </div>
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
          </Card>

          <Card className="gym-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Enrolled Clients</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {dashboardStats.clientStats.enrolledClients}
                </p>
              </div>
              <Fingerprint className="w-10 h-10 text-cyan-400" />
            </div>
            <p className="text-xs text-cyan-400 mt-2">
              {dashboardStats.clientStats.enrollmentRate}% of active clients
            </p>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="bg-slate-700/50">
          <TabsTrigger value="clients">Client Management</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
        </TabsList>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="not-enrolled">Not Enrolled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setLoading(true);
                try {
                  await Promise.all([fetchClients(), fetchAccessLogs(), fetchDashboard()]);
                  toast({
                    title: "Refreshed",
                    description: "Client list updated",
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to refresh data",
                    variant: "destructive",
                  });
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <Card className="gym-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Package Expiry</TableHead>
                  <TableHead>ESSL ID</TableHead>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client._id}>
                    <TableCell className="font-medium">
                      {client.firstName} {client.lastName}
                    </TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>
                      {new Date(client.packageEndDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {client.esslUserId ? (
                        <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                          {client.esslUserId}
                        </Badge>
                      ) : (
                        <span className="text-slate-500 text-sm">Not registered</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.fingerprintEnrolled ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Enrolled
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={client.isAccessActive}
                        onCheckedChange={(checked) => handleToggleAccess(client, checked)}
                        disabled={!client.fingerprintEnrolled}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!client.esslUserId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegisterClient(client)}
                            disabled={loading}
                            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Register
                          </Button>
                        )}
                        {client.esslUserId && !client.fingerprintEnrolled && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedClient(client);
                              setEnrollDialogOpen(true);
                            }}
                            className="bg-cyan-500 hover:bg-cyan-600"
                          >
                            <Fingerprint className="w-4 h-4 mr-1" />
                            Enroll
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Access Logs Tab */}
        <TabsContent value="logs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Access Logs</span>
              <span className="text-xs text-slate-500">({accessLogs.length} entries)</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Date Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border-slate-700"
                  />
                </PopoverContent>
              </Popover>
              
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setRefreshingLogs(true);
                  try {
                    await fetchAccessLogs(selectedDate);
                    toast({
                      title: "Refreshed",
                      description: "Access logs updated",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to refresh logs",
                      variant: "destructive",
                    });
                  } finally {
                    setRefreshingLogs(false);
                  }
                }}
                disabled={refreshingLogs}
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshingLogs ? 'animate-spin' : ''}`} />
                {refreshingLogs ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
          <Card className="gym-card">
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>User Name</TableHead>
                    <TableHead>Check-in Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {accessLogs.map((log, index) => {
                  const logKey = buildLogKey(log, index);
                  const highlightedKey = newLogEntry ? buildLogKey(newLogEntry) : null;
                  const isHighlighted = Boolean(highlightedKey && logKey === highlightedKey);

                  return (
                    <TableRow 
                      key={logKey}
                      className={`transition-all duration-500 ${
                        isHighlighted
                          ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500 animate-pulse'
                          : ''
                      }`}
                    >
                      <TableCell className="font-medium">
                        {log.userId || log.esslUserId || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.employeeName || getLogDisplayName(log) || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(() => {
                            // Parse timestamp string (format: yyyy-MM-ddTHH:mm:ss.fff or yyyy-MM-ddTHH:mm:ss)
                            // SQL Server datetime has no timezone - parse and display as-is
                            const timestamp = log.timestamp;
                            if (!timestamp) return '-';
                            
                            // Parse the timestamp string directly (handles both with and without milliseconds)
                            const match = timestamp.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/);
                            if (!match) {
                              // Fallback: try to parse as ISO string
                              try {
                                const date = new Date(timestamp);
                                if (!isNaN(date.getTime())) {
                                  return date.toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true
                                  });
                                }
                              } catch (e) {
                                // Ignore parse errors
                              }
                              return timestamp; // Return as-is if can't parse
                            }
                            
                            const [, year, month, day, hourStr, minute, second] = match;
                            const hours = parseInt(hourStr, 10);
                            const ampm = hours >= 12 ? 'PM' : 'AM';
                            const displayHours = hours % 12 || 12;
                            
                            return `${month}/${day}/${year}, ${String(displayHours).padStart(2, '0')}:${minute}:${second} ${ampm}`;
                          })()}
                          {isHighlighted && (
                            <Badge className="bg-green-500 text-white animate-bounce">
                              NEW
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enrollment Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="gym-card border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-cyan-400" />
              Enroll Fingerprint
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              {selectedClient && `Enrolling fingerprint for ${selectedClient.firstName} ${selectedClient.lastName}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">ESSL Device Enrollment Instructions:</h4>
              <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
                <li>Ensure ESSL K30 Pro device is powered on and connected to network</li>
                <li>Click "Start Enrollment" below to initiate the process</li>
                <li>Device will prompt for fingerprint enrollment</li>
                <li>Client must place the same finger on the scanner 3 times</li>
                <li>Device will send confirmation to website when complete</li>
                <li>Real-time notification will appear when enrollment is successful</li>
              </ol>
            </div>
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
              <p className="text-xs text-slate-400">
                <strong>Note:</strong> ESSL device only stores fingerprint data. All business logic 
                (package expiry, payment status, access schedules) is handled by your website.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEnrollDialogOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnrollFingerprint}
              disabled={enrolling}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {enrolling ? "Enrolling..." : "Start Enrollment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BiometricAccess;




