import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Client {
  id: string | number; // Can be string (from API) or number
  deviceId?: string | number; // Device ID (EmployeeCodeInDevice)
  name: string;
  contact: string;
  status: "active" | "inactive";
  billingDate: string;
  duration: string;
  amount?: number;
  balance?: number;
  remainingDuration?: string;
}

interface GymTableProps {
  clients: Client[];
  showAmount?: boolean;
  showBalance?: boolean;
  showRemainingDuration?: boolean;
  onView?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export function GymTable({ 
  clients, 
  showAmount = false, 
  showBalance = false,
  showRemainingDuration = false,
  onView,
  onDelete 
}: GymTableProps) {
  return (
    <div className="gym-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            {showAmount && <TableHead>Amount</TableHead>}
            {showBalance && <TableHead>Balance</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Billing Date</TableHead>
            <TableHead>Duration</TableHead>
            {showRemainingDuration && <TableHead>Remaining Duration</TableHead>}
            <TableHead className="w-24">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client, index) => {
            // Use EmployeeId (client.id) as key - it's unique, deviceId might be duplicated
            // Add index to ensure uniqueness even if EmployeeId is somehow duplicated
            const uniqueKey = client.id ? `employee-${client.id}-${index}` : `client-${index}`;
            return (
            <TableRow key={uniqueKey}>
              <TableCell className="font-medium">{client.deviceId || client.id || '-'}</TableCell>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.contact || 'N/A'}</TableCell>
              {showAmount && (
                <TableCell>₹{client.amount?.toLocaleString()}</TableCell>
              )}
              {showBalance && (
                <TableCell>₹{client.balance?.toLocaleString()}</TableCell>
              )}
              <TableCell>
                <StatusBadge status={client.status} />
              </TableCell>
              <TableCell>{client.billingDate}</TableCell>
              <TableCell>{client.duration}</TableCell>
              {showRemainingDuration && (
                <TableCell>{client.remainingDuration}</TableCell>
              )}
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView?.(client)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete?.(client)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}