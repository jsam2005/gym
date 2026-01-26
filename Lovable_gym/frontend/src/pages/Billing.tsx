import { useState, useEffect } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { GymTable, Client } from "@/components/GymTable";
import { KPICard } from "@/components/KPICard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Users, AlertCircle, Edit } from "lucide-react";
import { billingAPI, clientAPI, settingsAPI } from "@/lib/api";

const Billing = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [billingClients, setBillingClients] = useState<Client[]>([]);
  const [pendingOverdue, setPendingOverdue] = useState<{ pending: any[]; overdue: any[] }>({ pending: [], overdue: [] });
  const [gymProfile, setGymProfile] = useState({ 
    gymName: 'MS Fitness Studio', 
    gymAddress: 'Food street, 1st floor, thalambur, Thalambur Rd, Navalur, Chennai, Tamil Nadu 600130',
    gymContact: '70104 12237'
  });
  const [summary, setSummary] = useState({
    totalBillings: 0,
    totalAmount: 0,
    totalPaid: 0,
    pendingAmount: 0,
    thisMonthCollections: 0,
  });

  useEffect(() => {
    fetchBillingData();
    fetchGymProfile();
  }, []);

  // Fetch gym profile for bill generation (use hardcoded values as fallback)
  const fetchGymProfile = async () => {
    try {
      const response = await settingsAPI.getProfile();
      if (response.data.success && response.data.data.gymName) {
        setGymProfile({
          gymName: response.data.data.gymName || 'MS Fitness Studio',
          gymAddress: response.data.data.gymAddress || 'Food street, 1st floor, thalambur, Thalambur Rd, Navalur, Chennai, Tamil Nadu 600130',
          gymContact: response.data.data.ownerPhone || '70104 12237',
        });
      }
    } catch (error) {
      console.error('Error fetching gym profile:', error);
      // Use default values if API fails
    }
  };

  // Listen for client update events to refresh billing data (including status updates)
  useEffect(() => {
    const handleClientUpdate = () => {
      fetchBillingData();
    };
    
    window.addEventListener('clientUpdated', handleClientUpdate);
    return () => window.removeEventListener('clientUpdated', handleClientUpdate);
  }, []);

  // Listen for client update events to refresh billing data
  useEffect(() => {
    const handleClientUpdate = () => {
      fetchBillingData();
    };
    
    window.addEventListener('clientUpdated', handleClientUpdate);
    return () => window.removeEventListener('clientUpdated', handleClientUpdate);
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch both billing clients and all clients to merge amount/pendingAmount data
      const [clientsRes, allClientsRes, pendingRes, summaryRes] = await Promise.all([
        billingAPI.getClients(),
        clientAPI.getAll(), // Fetch all clients to get amount and pendingAmount
        billingAPI.getPendingOverdue(),
        billingAPI.getSummary(),
      ]);

      // Create a map of client data by EmployeeId for quick lookup
      const clientDataMap = new Map();
      if (allClientsRes.data && allClientsRes.data.success && Array.isArray(allClientsRes.data.clients)) {
        allClientsRes.data.clients.forEach((client: any) => {
          const clientId = client.id || client._id || client.employeeId;
          if (clientId) {
            clientDataMap.set(String(clientId), {
              deviceId: client.esslUserId || client.employeeCodeInDevice || client.deviceId || '',
              packageAmount: client.packageAmount || (client as any).totalAmount || 0,
              pendingAmount: client.pendingAmount || 0,
              amountPaid: client.amountPaid || 0,
              status: client.status || 'inactive', // Include status from client data
            });
          }
        });
      }

        // Merge billing data with client data to get amount and pendingAmount
      let mergedClients: any[] = [];
      if (clientsRes.data.success) {
        mergedClients = (clientsRes.data.data || []).map((billingClient: any) => {
          const clientId = String(billingClient.id);
          const clientData = clientDataMap.get(clientId);
          
          // Use deviceId (esslUserId) as User ID, same as clients page
          const deviceId = clientData?.deviceId || billingClient.deviceId || billingClient.esslUserId || '';
          
          // Get amount and pendingAmount from client data (preferred) or billing data (fallback)
          const amount = clientData?.packageAmount || billingClient.amount || billingClient.totalAmount || 0;
          const pendingAmount = clientData?.pendingAmount !== undefined && clientData?.pendingAmount !== null
            ? clientData.pendingAmount 
            : (billingClient.balance !== undefined && billingClient.balance !== null 
                ? billingClient.balance 
                : (billingClient.pendingAmount !== undefined && billingClient.pendingAmount !== null 
                    ? billingClient.pendingAmount 
                    : 0));
          
          return {
            ...billingClient,
            id: billingClient.id, // Keep EmployeeId for internal use
            deviceId: deviceId, // User ID for display (same as clients page)
            amount: amount,
            balance: pendingAmount,
            pendingAmount: pendingAmount,
            contact: billingClient.contact || 'N/A',
            status: clientData?.status || billingClient.status || 'inactive', // Use status from client data (preferred) or billing data (fallback)
          };
        });
        setBillingClients(mergedClients);
      }
      if (pendingRes.data.success) {
        setPendingOverdue({
          pending: pendingRes.data.data.pending || [],
          overdue: pendingRes.data.data.overdue || [],
        });
      }
      
      // Calculate totals from merged client data (uses updated pendingAmount from client data)
      const totalAmount = mergedClients.reduce((sum: number, c: any) => {
        const amount = c.amount || c.totalAmount || c.packageAmount || 0;
        return sum + (typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0);
      }, 0);
      
      const totalPending = mergedClients.reduce((sum: number, c: any) => {
        const pending = c.pendingAmount !== undefined && c.pendingAmount !== null 
          ? c.pendingAmount 
          : (c.balance !== undefined && c.balance !== null ? c.balance : 0);
        return sum + (typeof pending === 'number' ? pending : parseFloat(String(pending)) || 0);
      }, 0);
      
      const totalPaid = totalAmount - totalPending;
      
      if (summaryRes.data.success) {
        const summaryData = summaryRes.data.data || {};
        // Use calculated totals from merged client data (more accurate, includes updated pendingAmount)
        setSummary({ 
          totalBillings: mergedClients.length || summaryData.totalBillings || 0, 
          totalAmount: totalAmount || summaryData.totalAmount || 0,
          totalPaid: totalPaid || summaryData.totalPaid || 0,
          pendingAmount: totalPending || summaryData.pendingAmount || 0, 
          thisMonthCollections: summaryData.thisMonthCollections || 0 
        });
      } else {
        // Fallback: use calculated totals from merged client data
        setSummary({
          totalBillings: mergedClients.length || 0,
          totalAmount: totalAmount,
          totalPaid: totalPaid,
          pendingAmount: totalPending,
          thisMonthCollections: 0,
        });
      }
    } catch (error: any) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = billingClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.includes(searchTerm)
  );

  const handleView = async (client: Client) => {
    try {
      // Fetch fresh data from API to get latest updates
      const [clientRes, billingRes] = await Promise.all([
        clientAPI.getById(String(client.id)).catch(() => null),
        billingAPI.getClients().catch(() => null),
      ]);
      
      // Try to get updated client data from billing API first (has billing-specific data)
      let updatedClient = client;
      if (billingRes?.data?.success && billingRes.data.data) {
        const freshBillingClient = billingRes.data.data.find((c: any) => String(c.id) === String(client.id));
        if (freshBillingClient) {
          updatedClient = {
            ...client,
            ...freshBillingClient,
            // Merge billing-specific fields
            amount: freshBillingClient.amount || freshBillingClient.totalAmount || client.amount,
            balance: freshBillingClient.balance || freshBillingClient.pendingAmount || client.balance,
            pendingAmount: freshBillingClient.pendingAmount || freshBillingClient.balance || client.pendingAmount,
            contact: freshBillingClient.contact || client.contact,
            bloodGroup: freshBillingClient.bloodGroup || (client as any).bloodGroup || null,
          };
        }
      }
      
      // If client API has more detailed info, merge it
      if (clientRes?.data?.success && clientRes.data.client) {
        const freshClient = clientRes.data.client;
        updatedClient = {
          ...updatedClient,
          name: `${freshClient.firstName || ''} ${freshClient.lastName || ''}`.trim() || updatedClient.name,
          contact: freshClient.phone || freshClient.contact || updatedClient.contact,
          email: freshClient.email || (updatedClient as any).email || '',
          gender: freshClient.gender || (updatedClient as any).gender || '',
          status: freshClient.status || updatedClient.status,
          // Include GymClients data
          bloodGroup: freshClient.bloodGroup || (updatedClient as any).bloodGroup || null,
          packageAmount: freshClient.packageAmount || freshClient.totalAmount || (updatedClient as any).packageAmount || null,
        };
      }
      
      setSelectedClient(updatedClient);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching fresh client data:', error);
      // Fallback to cached data if API fails
      setSelectedClient(client);
      setIsDialogOpen(true);
    }
  };

  const handleEdit = (client: Client) => {
    navigate(`/clients/edit/${client.id}`);
  };

  const handleDownloadBill = (client: Client) => {
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const invoiceNumber = `INV-${client.id || '000'}-${new Date().getTime().toString().slice(-4)}`;
    const totalAmount = client.amount || client.totalAmount || client.packageAmount || 0;
    const pendingAmount = client.pendingAmount !== undefined && client.pendingAmount !== null 
      ? client.pendingAmount 
      : (client.balance !== undefined && client.balance !== null ? client.balance : 0);
    const amountPaid = totalAmount - pendingAmount;

    // Create professional invoice HTML content
    const billHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${client.name}</title>
  <style>
    @media print {
      body { 
        margin: 0;
        background: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print { display: none; }
      .invoice-container {
        box-shadow: none;
      }
      .invoice-header {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%) !important;
      }
      .items-table thead {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: #1e40af !important;
      }
      .subtotal-row {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: #1e40af !important;
      }
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: A4;
      margin: 10mm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: white;
      padding: 0;
      margin: 0;
      color: #333;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      page-break-inside: avoid;
    }
    .invoice-header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      background-color: #1e40af;
      color: white;
      padding: 25px 35px;
      position: relative;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0,0 C150,80 350,80 500,40 C650,0 850,0 1000,40 C1150,80 1200,80 1200,80 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.1)"/></svg>');
      background-size: cover;
      opacity: 0.3;
    }
    .invoice-title {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
      position: relative;
      z-index: 1;
    }
    .invoice-number {
      font-size: 14px;
      position: absolute;
      top: 25px;
      right: 35px;
      z-index: 1;
    }
    .invoice-body {
      padding: 25px 35px;
    }
    .billing-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-bottom: 20px;
    }
    .bill-to, .from {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
    }
    .section-label {
      font-weight: bold;
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-line {
      margin-bottom: 6px;
      font-size: 14px;
      color: #1f2937;
    }
    .info-line strong {
      color: #111827;
    }
    .date-info {
      margin-top: 20px;
      font-size: 14px;
      color: #6b7280;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .items-table thead {
      background: #1e40af;
      background-color: #1e40af;
      color: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .items-table th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
    }
    .items-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    .items-table tbody tr:hover {
      background: #f9fafb;
    }
    .subtotal-row {
      background: #1e40af;
      background-color: #1e40af;
      color: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .subtotal-row td {
      padding: 12px;
      font-weight: 600;
      font-size: 15px;
    }
    .payment-info {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
    }
    .payment-label {
      font-weight: bold;
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .payment-details {
      font-size: 12px;
      color: #1f2937;
      line-height: 1.5;
    }
    .thank-you {
      text-align: right;
      margin-top: 20px;
      font-size: 20px;
      font-weight: bold;
      color: #1e40af;
    }
    .print-button {
      text-align: center;
      margin: 20px 0;
    }
    .print-btn {
      background: #1e40af;
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      font-weight: 600;
    }
    .print-btn:hover {
      background: #1e3a8a;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">NO: ${invoiceNumber}</div>
    </div>
    
    <div class="invoice-body">
      <div class="billing-info">
        <div class="bill-to">
          <div class="section-label">Bill To:</div>
          <div class="info-line"><strong>${client.name || 'N/A'}</strong></div>
          <div class="info-line">User ID: ${client.deviceId || client.esslUserId || client.id || 'N/A'}</div>
          <div class="info-line">Contact: ${client.contact || 'N/A'}</div>
          <div class="info-line">Billing Date: ${client.billingDate || 'N/A'}</div>
          <div class="info-line">Package Duration: ${client.duration || 'N/A'}</div>
          <div class="info-line">Status: ${client.status === 'active' ? 'Active' : client.status === 'suspended' ? 'Suspended' : 'Inactive'}</div>
          <div class="date-info">Date: ${currentDate}</div>
        </div>
        
        <div class="from">
          <div class="section-label">From:</div>
          <div class="info-line"><strong>${gymProfile.gymName}</strong></div>
          <div class="info-line">${gymProfile.gymContact}</div>
          <div class="info-line">${gymProfile.gymAddress}</div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Membership</strong> - ${client.duration || 'Package'}</td>
            <td style="text-align: center;">1</td>
            <td style="text-align: right;">₹${totalAmount.toLocaleString('en-IN')}</td>
            <td style="text-align: right;">₹${totalAmount.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td><strong>Amount</strong></td>
            <td style="text-align: center;">-</td>
            <td style="text-align: right;">-</td>
            <td style="text-align: right;">₹${totalAmount.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td><strong>Pending Amount</strong></td>
            <td style="text-align: center;">-</td>
            <td style="text-align: right;">-</td>
            <td style="text-align: right;">₹${pendingAmount.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td><strong>Paid Amount</strong></td>
            <td style="text-align: center;">-</td>
            <td style="text-align: right;">-</td>
            <td style="text-align: right;">₹${amountPaid.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="subtotal-row">
            <td colspan="3" style="text-align: right;"><strong>Total Amount</strong></td>
            <td style="text-align: right;">₹${totalAmount.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <div class="payment-info">
        <div class="payment-label">Payment Information:</div>
        <div class="payment-details">
          Contact: ${gymProfile.gymContact}<br>
          Address: ${gymProfile.gymAddress}
        </div>
      </div>

      <div class="thank-you">Thank You!</div>
    </div>
  </div>

  <div class="print-button no-print">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <script>
    // Auto-trigger print dialog for PDF download
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `;

    // Create blob and open in new window for printing/downloading as PDF
    const blob = new Blob([billHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = function() {
        setTimeout(function() {
          printWindow.print();
        }, 500);
      };
    } else {
      // Fallback: download as HTML if popup is blocked
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${client.name}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Clean up URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };


  return (
    <div className="w-full p-4 flex justify-center">
      <div className="w-full max-w-7xl">
      <PageHeader 
        title="Billing & Payments" 
        searchPlaceholder="Search billing records..."
        onSearch={setSearchTerm}
      />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Clients"
          value={summary.totalBillings?.toLocaleString() || '0'}
          icon={<Users className="h-6 w-6" />}
        />
        <KPICard
          title="Total Amount"
          value={`₹${(summary.totalAmount || 0).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <KPICard
          title="Pending Amount"
          value={`₹${(summary.pendingAmount || 0).toLocaleString()}`}
          icon={<AlertCircle className="h-6 w-6" />}
        />
        <KPICard
          title="This Month Collections"
          value={`₹${(summary.thisMonthCollections || 0).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
        />
      </div>

      {/* Billing Tabs */}
      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clients">Client Billing</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingOverdue.pending.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          {loading ? (
            <div className="gym-card p-8 text-center text-gray-500">Loading billing data...</div>
          ) : (
            <GymTable 
              clients={filteredClients}
              showAmount={true}
              showBalance={true}
              onView={handleView}
              onEdit={handleEdit}
              onDownload={handleDownloadBill}
            />
          )}
        </TabsContent>

        <TabsContent value="pending">
          <div className="gym-card overflow-hidden">
            <div className="p-6 border-b bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-3xl font-extrabold text-gray-900">Pending Payments</h3>
                <Badge variant="secondary" className="bg-orange-500 text-white px-4 py-2 text-base font-bold">
                  {pendingOverdue.pending.length} {pendingOverdue.pending.length === 1 ? 'Client' : 'Clients'}
                </Badge>
              </div>
              <p className="text-lg font-semibold text-gray-700 mt-3">Clients with pending amounts and future due dates</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-100">
                    <th className="text-left p-4 font-semibold text-gray-700">Client Name</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Contact</th>
                    <th className="text-right p-4 font-semibold text-gray-700">Pending Amount</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Due Date</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Days Remaining</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Package</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOverdue.pending.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">No pending payments</td>
                    </tr>
                  ) : (
                    pendingOverdue.pending.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{client.name || 'N/A'}</td>
                        <td className="p-4">{client.contact || 'N/A'}</td>
                        <td className="p-4 text-right font-medium">₹{((client.pendingAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                        <td className="p-4">{client.remainingDate ? new Date(client.remainingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</td>
                        <td className="p-4 text-center">
                          <Badge variant={client.daysRemaining && client.daysRemaining <= 7 ? 'destructive' : 'default'}>
                            {client.daysRemaining !== null ? `${client.daysRemaining} days` : 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-4">{client.packageType || 'N/A'}</td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(client)}
                              className="h-8 w-8 p-0 flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-300 rounded-md transition-colors"
                              title="Edit Client"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="w-full max-w-4xl" 
          style={{
            backgroundColor: '#1F2937',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            border: '1px solid #374151',
            color: '#F9FAFB',
            maxWidth: '900px'
          }}
        >
          <DialogHeader>
            <DialogTitle style={{
              color: '#F9FAFB', 
              fontSize: '24px', 
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              Billing Details
            </DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div style={{padding: '30px', width: '100%', boxSizing: 'border-box', overflow: 'auto'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px', width: '100%', minWidth: '0'}}>
                <div style={{
                  backgroundColor: '#374151',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #4B5563'
                }}>
                  <h3 style={{
                    color: '#F9FAFB', 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: '20px',
                    textAlign: 'left'
                  }}>
                    Client Information
                  </h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Client Name
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500',
                        textAlign: 'left'
                      }}>
                        {selectedClient.name || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Contact Number
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500',
                        textAlign: 'left'
                      }}>
                        {selectedClient.contact || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Billing Date
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500',
                        textAlign: 'left'
                      }}>
                        {selectedClient.billingDate || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Package Duration
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500',
                        textAlign: 'left'
                      }}>
                        {selectedClient.duration || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#374151',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #4B5563'
                }}>
                  <h3 style={{
                    color: '#F9FAFB', 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: '20px',
                    textAlign: 'left'
                  }}>
                    Financial Details
                  </h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Total Amount
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500',
                        textAlign: 'left'
                      }}>
                        {((selectedClient.amount || selectedClient.totalAmount || selectedClient.packageAmount) && (selectedClient.amount || selectedClient.totalAmount || selectedClient.packageAmount) > 0)
                          ? `₹${((selectedClient.amount || selectedClient.totalAmount || selectedClient.packageAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                          : ''}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Pending Amount
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500',
                        textAlign: 'left'
                      }}>
                        {((selectedClient.pendingAmount !== undefined && selectedClient.pendingAmount !== null && selectedClient.pendingAmount > 0)
                          ? selectedClient.pendingAmount 
                          : (selectedClient.balance !== undefined && selectedClient.balance !== null && selectedClient.balance > 0
                              ? selectedClient.balance 
                              : null))
                          ? `₹${((selectedClient.pendingAmount !== undefined && selectedClient.pendingAmount !== null 
                              ? selectedClient.pendingAmount 
                              : selectedClient.balance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                          : ''}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Remaining Duration
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500',
                        textAlign: 'left'
                      }}>
                        {selectedClient.remainingDuration && selectedClient.remainingDuration !== 'N/A' ? selectedClient.remainingDuration : ''}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Blood Group
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500',
                        textAlign: 'left'
                      }}>
                        {(selectedClient as any).bloodGroup || ''}
                      </div>
                    </div>
                  </div>
                  <div style={{borderTop: '1px solid #4B5563', paddingTop: '20px', marginTop: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{color: '#D1D5DB', fontSize: '14px', fontWeight: '500'}}>Status</span>
                      <div style={{
                        backgroundColor: selectedClient.status === 'active' ? '#10B981' : selectedClient.status === 'suspended' ? '#F59E0B' : '#EF4444',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {selectedClient.status === 'active' ? 'Active' : selectedClient.status === 'suspended' ? 'Suspended' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{display: 'flex', justifyContent: 'center', marginTop: '32px'}}>
                <button 
                  onClick={() => setIsDialogOpen(false)}
                  style={{
                    backgroundColor: '#2563EB',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#1D4ED8';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#2563EB';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default Billing;
