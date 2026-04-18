import { useState, useEffect } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { GymTable, Client } from "@/components/GymTable";
import { KPICard } from "@/components/KPICard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IndianRupee, Users, AlertCircle } from "lucide-react";
import { billingAPI, clientAPI, dashboardAPI, settingsAPI } from "@/lib/api";

const formatDisplayDate = (date: Date | null) =>
  date
    ? date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

function toKpiNum(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const calculateEndDate = (
  packageStartDate?: string | null,
  durationValue?: number | string | null
) => {
  if (!packageStartDate) return "N/A";

  let months: number | null = null;

  if (typeof durationValue === "number") {
    months = durationValue;
  } else if (typeof durationValue === "string") {
    const direct = Number(durationValue.trim());
    if (Number.isFinite(direct) && direct > 0) {
      months = direct;
    } else {
      const match = durationValue.match(/(\d+)\s*month/i);
      if (match && match[1]) {
        months = Number(match[1]);
      }
    }
  }

  if (!months || months <= 0) return "N/A";

  const start = new Date(packageStartDate);
  if (Number.isNaN(start.getTime())) return "N/A";

  const end = new Date(start);
  end.setMonth(end.getMonth() + months);

  return formatDisplayDate(end);
};

const CLIENT_PAGE_SIZE = 500;

/** Fetch all client pages (backend pagination cap was 200; roster can be 300+). */
async function fetchAllClientsForBilling(): Promise<{
  clients: any[];
  paginationTotal: number;
  success: boolean;
}> {
  const first = await clientAPI.getAll({ page: 1, limit: CLIENT_PAGE_SIZE });
  if (!first.data?.success || !Array.isArray(first.data.clients)) {
    return { clients: [], paginationTotal: 0, success: false };
  }
  let clients = [...first.data.clients];
  const paginationTotal = Number(first.data.pagination?.total) || clients.length;
  const pagesFromApi = Number(first.data.pagination?.pages);
  const pages =
    pagesFromApi > 0
      ? pagesFromApi
      : Math.max(1, Math.ceil(paginationTotal / CLIENT_PAGE_SIZE));

  for (let p = 2; p <= pages; p++) {
    const res = await clientAPI.getAll({ page: p, limit: CLIENT_PAGE_SIZE });
    if (res.data?.success && Array.isArray(res.data.clients)) {
      clients = clients.concat(res.data.clients);
    }
  }

  const byKey = new Map<string, any>();
  clients.forEach((c: any, index: number) => {
    const primary =
      String(c?.id ?? c?._id ?? "").trim() ||
      String(c?.esslUserId ?? c?.employeeCodeInDevice ?? c?.employeeCode ?? "").trim();
    const name = `${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim().toLowerCase();
    const phone = String(c?.phone ?? c?.contact ?? "").trim();
    const key =
      primary || (name || phone ? `nk:${name}|${phone}` : `nk:row:${index}`);
    if (!byKey.has(key)) byKey.set(key, c);
  });

  const deduped = Array.from(byKey.values());

  return {
    clients: deduped,
    paginationTotal: Math.max(paginationTotal, deduped.length),
    success: true,
  };
}

const Billing = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [billingClients, setBillingClients] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [gymProfile, setGymProfile] = useState({ 
    gymName: 'MS Fitness Studio', 
    gymAddress: 'Food street, 1st floor, thalambur, Thalambur Rd, Navalur, Chennai, Tamil Nadu 600130',
    gymContact: '70104 12237'
  });
  const [summary, setSummary] = useState({
    allClients: 0,
    totalBillings: 0,
    totalSales: 0,
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

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      const [clientsPack, billingRes, summaryRes, statsRes] = await Promise.all([
        fetchAllClientsForBilling(),
        billingAPI.getClients(),
        billingAPI.getSummary(),
        dashboardAPI.getStats().catch(() => ({ data: { success: false } })),
      ]);

      // Build quick lookup for billing amounts by client id
      const billingById: Record<string, any> = {};
      if (billingRes.data?.success && Array.isArray(billingRes.data.data)) {
        for (const b of billingRes.data.data) {
          const id = b.id ?? b.clientId ?? b._id;
          if (id != null) billingById[String(id)] = b;
        }
      }

      // Transform clients exactly like AllClients, then overlay billing amounts/balances
      let mergedClients: any[] = [];
      if (clientsPack.success && clientsPack.clients.length > 0) {
        mergedClients = clientsPack.clients
          .map((client: any, index: number) => {
            const id = client.id || client._id || `client-${index}`;
            const billing = billingById[String(id)] || {};

            const baseClient = {
              id,
              deviceId: client.esslUserId || client.employeeCodeInDevice || client.deviceId || "",
              name: `${client.firstName || ""} ${client.lastName || ""}`.trim() || client.name || "Unknown",
              contact: client.phone || client.contact || "N/A",
              status: client.status || billing.status || "inactive",
              billingDate: client.packageStartDate
                ? formatDisplayDate(new Date(client.packageStartDate))
                : "N/A",
              duration:
                client.months && Number(client.months) > 0
                  ? `${Number(client.months)} month${Number(client.months) > 1 ? "s" : ""}`
                  : client.packageType || billing.packageType || "N/A",
              endDate: client.packageEndDate || billing.packageEndDate
                ? formatDisplayDate(new Date(client.packageEndDate || billing.packageEndDate))
                : calculateEndDate(
                    client.packageStartDate || billing.packageStartDate,
                    client.months || client.packageType || billing.months || billing.packageType
                  ),
            };

            const totalAmount =
              billing.amount ??
              billing.totalAmount ??
              billing.packageAmount ??
              client.packageAmount ??
              client.totalAmount ??
              0;

            const paidAmount =
              billing.amountPaid ??
              client.amountPaid ??
              0;

            const balance = (typeof totalAmount === "number" ? totalAmount : parseFloat(String(totalAmount)) || 0) - 
                           (typeof paidAmount === "number" ? paidAmount : parseFloat(String(paidAmount)) || 0);

            return {
              ...baseClient,
              amount: typeof totalAmount === "number" ? totalAmount : parseFloat(String(totalAmount)) || 0,
              balance: balance >= 0 ? balance : 0,
              pendingAmount: balance >= 0 ? balance : 0,
            };
          })
          .sort((a: any, b: any) => {
            const aId = a.deviceId ?? a.id ?? "";
            const bId = b.deviceId ?? b.id ?? "";
            const aNum = Number(aId);
            const bNum = Number(bId);
            const aNumOk = Number.isFinite(aNum);
            const bNumOk = Number.isFinite(bNum);
            if (aNumOk && bNumOk && aNum !== bNum) return aNum - bNum;
            const aStr = String(aId);
            const bStr = String(bId);
            if (aStr !== bStr) return aStr.localeCompare(bStr);
            return String(a.name || "").localeCompare(String(b.name || ""));
          });

        setBillingClients(mergedClients);
      }

      const paginationTotal = clientsPack.paginationTotal;
      const dash = statsRes?.data?.success && statsRes?.data?.data ? statsRes.data.data : null;
      const d = summaryRes.data?.success && summaryRes.data?.data ? summaryRes.data.data : {};

      if (dash) {
        setSummary((prev) => ({
          allClients: toKpiNum(dash.allClients, prev.allClients),
          totalBillings: toKpiNum(dash.totalBillings, prev.totalBillings),
          totalSales: toKpiNum(dash.totalSales, prev.totalSales),
          pendingAmount: toKpiNum(dash.pendingAmount, prev.pendingAmount),
          thisMonthCollections: toKpiNum(dash.thisMonthCollections, prev.thisMonthCollections),
        }));
      } else if (summaryRes.data?.success) {
        const totalSalesRaw =
          d.totalSales != null && d.totalSales !== ""
            ? d.totalSales
            : d.totalPaid != null && d.totalPaid !== ""
              ? d.totalPaid
              : undefined;
        const allClientsRaw =
          d.allClients != null && d.allClients !== ""
            ? d.allClients
            : paginationTotal != null
              ? paginationTotal
              : mergedClients.length;
        setSummary((prev) => ({
          allClients: toKpiNum(allClientsRaw, prev.allClients),
          totalBillings: toKpiNum(d.totalBillings, prev.totalBillings),
          totalSales: toKpiNum(totalSalesRaw, prev.totalSales),
          pendingAmount: toKpiNum(d.pendingAmount, prev.pendingAmount),
          thisMonthCollections: toKpiNum(d.thisMonthCollections, prev.thisMonthCollections),
        }));
      } else {
        setSummary((prev) => ({
          allClients:
            paginationTotal != null
              ? toKpiNum(paginationTotal, prev.allClients)
              : toKpiNum(mergedClients.length, prev.allClients),
          totalBillings: prev.totalBillings,
          totalSales: prev.totalSales,
          pendingAmount: prev.pendingAmount,
          thisMonthCollections: prev.thisMonthCollections,
        }));
      }
    } catch (error: any) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search by client name (requested)
  const filteredClients = billingClients.filter(client =>
    String(client.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination (50 rows per page)
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const pagedClients = filteredClients.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    // Reset to page 1 when searching
    setPage(1);
  }, [searchTerm]);

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
          value={toKpiNum(summary.allClients, 0).toLocaleString()}
          icon={<Users className="h-6 w-6" />}
        />
        <KPICard
          title="Total Sales"
          value={`₹${toKpiNum(summary.totalSales, 0).toLocaleString()}`}
          icon={<IndianRupee className="h-6 w-6" />}
        />
        <KPICard
          title="Pending Amount"
          value={`₹${toKpiNum(summary.pendingAmount, 0).toLocaleString()}`}
          icon={<AlertCircle className="h-6 w-6" />}
        />
        <KPICard
          title="This Month Collections"
          value={`₹${toKpiNum(summary.thisMonthCollections, 0).toLocaleString()}`}
          icon={<IndianRupee className="h-6 w-6" />}
        />
      </div>

      {/* Client Billing Table (pending list removed) */}
      {loading ? (
        <div className="gym-card p-8 text-center text-gray-500">Loading billing data...</div>
      ) : (
        <>
          <GymTable
            clients={pagedClients}
            showAmount={true}
            showBalance={true}
            onView={handleView}
            onEdit={(client) => {
              if (client?.id == null) return;
              navigate(`/clients/edit/${String(client.id)}`);
            }}
            onDownload={handleDownloadBill}
          />
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Rows
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const next = Number(e.target.value) || 25;
                    setPageSize(next);
                    setPage(1);
                  }}
                  className="bg-transparent border border-border rounded px-2 py-1 text-foreground"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

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
