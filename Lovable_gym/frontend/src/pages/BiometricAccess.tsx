import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { BiometricLogTable } from "@/components/BiometricLogTable";
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
  Filter,
  RefreshCw,
  Users
} from "lucide-react";
import { biometricAPI, clientAPI, etimetrackAPI } from "@/lib/api";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [errorLogs, setErrorLogs] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const fetchAccessLogs = useCallback(async () => {
    setLoadingLogs(true);
    setErrorLogs(null);
    try {
      // Use selected date or today
      const dateToUse = selectedDate || new Date();
      
      // Format date as YYYY-MM-DD to avoid timezone issues
      // Get local date components (not UTC)
      const year = dateToUse.getFullYear();
      const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
      const day = String(dateToUse.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      console.log('📤 Frontend: Fetching access logs for date:', { 
        dateStr,
        selectedDate: dateToUse.toLocaleDateString(),
        localDate: `${year}-${month}-${day}`
      });
      
      const response = await api.get('/access-logs', {
        params: {
          date: dateStr, // Send as YYYY-MM-DD string
          deviceId: '20',
          limit: 500,
          _t: new Date().getTime(), // Cache buster
        },
      });
      
      console.log('📥 Frontend: Received response:', response.data);
      
      if (response.data.success) {
        const logs = response.data.data || [];
        console.log('✅ Received logs:', logs.length, 'logs');
        setAccessLogs(logs);
        if (logs.length === 0) {
          setErrorLogs("No logs found for the selected date.");
        }
      } else {
        setErrorLogs("Failed to fetch access logs.");
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to fetch access logs.";
      setErrorLogs(errorMsg);
      console.error("❌ Failed to fetch logs:", {
        error,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        fullURL: error?.config?.baseURL + error?.config?.url
      });
    } finally {
      setLoadingLogs(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAccessLogs();
  }, [fetchAccessLogs]);

  // Refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAccessLogs();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchAccessLogs]);


  return (
    <div className="w-full min-h-screen p-4 flex justify-center">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Biometric Access Control</h1>
        </div>

        <Tabs defaultValue="access-logs" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-4">
            <TabsTrigger value="access-logs">Access Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="access-logs">
            <Card className="w-full">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <CardTitle>Access Log</CardTitle>
                    <CardDescription>View biometric access logs by date</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button onClick={fetchAccessLogs} disabled={loadingLogs}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                      {loadingLogs ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {loadingLogs ? (
                  <div className="flex justify-center items-center py-8">
                    <p>Loading access logs...</p>
                  </div>
                ) : errorLogs ? (
                  <div className="flex justify-center items-center py-8">
                    <p className="text-red-500">{errorLogs}</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <BiometricLogTable logs={accessLogs} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BiometricAccess;




