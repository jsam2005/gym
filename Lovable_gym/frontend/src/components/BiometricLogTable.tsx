import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface Log {
  id: number;
  user_id: string;
  user_name: string;
  device_id: number;
  log_time: string;
  status: 'Granted' | 'Denied';
}

interface BiometricLogTableProps {
  logs: Log[];
}

export const BiometricLogTable = ({ logs }: BiometricLogTableProps) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-muted-foreground">No access logs found for the selected date.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">User Name</TableHead>
            <TableHead className="text-center">User ID</TableHead>
            <TableHead className="text-center">Timestamp</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Device ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-center">{log.user_name || 'N/A'}</TableCell>
              <TableCell className="text-center">{log.user_id}</TableCell>
              <TableCell className="text-center">
                {(() => {
                  // If log_time is already formatted (YYYY-MM-DD HH:mm:ss), parse and format it
                  // Otherwise, treat it as ISO string
                  try {
                    if (log.log_time.includes(' ') && log.log_time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
                      // Already formatted string from backend (YYYY-MM-DD HH:mm:ss)
                      const [datePart, timePart] = log.log_time.split(' ');
                      const [year, month, day] = datePart.split('-');
                      const [hours, minutes, seconds] = timePart.split(':');
                      // Create date in local timezone without conversion
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
                      return format(date, 'dd MMM yyyy HH:mm:ss');
                    } else {
                      // ISO string - parse normally
                      return format(new Date(log.log_time), 'dd MMM yyyy HH:mm:ss');
                    }
                  } catch (e) {
                    return log.log_time; // Fallback to raw string
                  }
                })()}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={log.status === 'Granted' ? 'success' : 'destructive'}>
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center">{log.device_id}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
