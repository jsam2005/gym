import { Eye, Trash2, Edit, Download } from "lucide-react";
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
  id: string | number; // Can be string (from API) or number (EmployeeId)
  deviceId?: string | number; // Device ID (EmployeeCodeInDevice) - User ID for display
  esslUserId?: string | number; // Alias for deviceId
  name: string;
  contact: string;
  status: "active" | "inactive" | "suspended";
  billingDate: string;
  duration: string;
  amount?: number; // Total amount / package amount
  totalAmount?: number; // Alias for amount
  packageAmount?: number; // Alias for amount
  balance?: number; // Pending amount (alias)
  pendingAmount?: number; // Pending amount
  amountPaid?: number; // Amount paid
  remainingDuration?: string;
}

interface GymTableProps {
  clients: Client[];
  showAmount?: boolean;
  showBalance?: boolean;
  showRemainingDuration?: boolean;
  onView?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  onEdit?: (client: Client) => void;
  onDownload?: (client: Client) => void;
  deleting?: string | null;
}

export function GymTable({ 
  clients, 
  showAmount = false, 
  showBalance = false,
  showRemainingDuration = false,
  onView,
  onDelete,
  onEdit,
  onDownload,
  deleting
}: GymTableProps) {
  return (
    <div className="gym-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            {showAmount && <TableHead className="text-right">Amount</TableHead>}
            {showBalance && <TableHead className="text-right">Pending Amount</TableHead>}
            <TableHead className="text-center">Status</TableHead>
            <TableHead>Billing Date</TableHead>
            <TableHead>Duration</TableHead>
            {showRemainingDuration && <TableHead>Remaining Duration</TableHead>}
            <TableHead className="w-24 text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client, index) => {
            // Use EmployeeId (client.id) as key - it's unique, deviceId might be duplicated
            // Add index to ensure uniqueness even if EmployeeId is somehow duplicated
            const uniqueKey = client.id ? `employee-${client.id}-${index}` : `client-${index}`;
            return (
            <TableRow key={uniqueKey}>
              <TableCell className="font-medium">{client.deviceId || client.esslUserId || client.id || '-'}</TableCell>
              <TableCell className="font-medium">{client.name || 'N/A'}</TableCell>
              <TableCell>{client.contact || 'N/A'}</TableCell>
              {showAmount && (
                <TableCell className="text-right font-medium">
                  ₹{(client.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </TableCell>
              )}
              {showBalance && (
                <TableCell className="text-right font-medium">
                  ₹{(client.pendingAmount !== undefined && client.pendingAmount !== null 
                    ? client.pendingAmount 
                    : (client.balance !== undefined && client.balance !== null 
                        ? client.balance 
                        : 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </TableCell>
              )}
              <TableCell className="text-center">
                <StatusBadge status={client.status} />
              </TableCell>
              <TableCell>{client.billingDate || 'N/A'}</TableCell>
              <TableCell>{client.duration || 'N/A'}</TableCell>
              {showRemainingDuration && (
                <TableCell>{client.remainingDuration || 'N/A'}</TableCell>
              )}
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView?.(client)}
                    className="h-8 w-8 p-0"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(client)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDownload && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(client)}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Download Bill"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(client)}
                      disabled={deleting === String(client.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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