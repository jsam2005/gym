import { useState, useEffect } from "react";
import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { GymTable, Client } from "@/components/GymTable";
import { KPICard } from "@/components/KPICard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Wallet, Smartphone, DollarSign, Users, AlertCircle } from "lucide-react";
import { billingAPI } from "@/lib/api";

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [billingClients, setBillingClients] = useState<Client[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [pendingOverdue, setPendingOverdue] = useState<{ pending: any[]; overdue: any[] }>({ pending: [], overdue: [] });
  const [summary, setSummary] = useState({
    totalBillings: 0,
    totalAmount: 0,
    totalPaid: 0,
    pendingAmount: 0,
    thisMonthCollections: 0,
  });

  useEffect(() => {
    fetchBillingData();
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
      const [clientsRes, paymentsRes, upcomingRes, pendingRes, summaryRes] = await Promise.all([
        billingAPI.getClients(),
        billingAPI.getPaymentHistory(),
        billingAPI.getUpcomingPayments(),
        billingAPI.getPendingOverdue(),
        billingAPI.getSummary(),
      ]);

      if (clientsRes.data.success) {
        setBillingClients(clientsRes.data.data || []);
      }
      if (paymentsRes.data.success) {
        setPaymentHistory(paymentsRes.data.data || []);
      }
      if (upcomingRes.data.success) {
        setUpcomingPayments(upcomingRes.data.data || []);
      }
      if (pendingRes.data.success) {
        setPendingOverdue({
          pending: pendingRes.data.data.pending || [],
          overdue: pendingRes.data.data.overdue || [],
        });
      }
      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data || { 
          totalBillings: 0, 
          totalAmount: 0,
          totalPaid: 0,
          pendingAmount: 0, 
          thisMonthCollections: 0 
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

  const handleView = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    if (confirm(`Are you sure you want to delete billing record for ${client.name}?`)) {
      console.log("Delete billing record:", client);
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card': return CreditCard;
      case 'cash': return Wallet;
      case 'upi': return Smartphone;
      default: return DollarSign;
    }
  };

  return (
    <div className="p-8">
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
          icon={<CreditCard className="h-6 w-6" />}
        />
      </div>

      {/* Billing Tabs */}
      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="clients">Client Billing</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingOverdue.pending.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({pendingOverdue.overdue.length})</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          {loading ? (
            <div className="gym-card p-8 text-center text-gray-500">Loading billing data...</div>
          ) : (
            <GymTable 
              clients={filteredClients}
              showAmount={true}
              showBalance={true}
              showRemainingDuration={true}
              onView={handleView}
              onDelete={handleDelete}
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
                    <th className="text-left p-4 font-semibold text-gray-700">Pending Amount</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Due Date</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Days Remaining</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Package</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOverdue.pending.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">No pending payments</td>
                    </tr>
                  ) : (
                    pendingOverdue.pending.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{client.name}</td>
                        <td className="p-4">{client.contact}</td>
                        <td className="p-4">₹{client.pendingAmount.toLocaleString()}</td>
                        <td className="p-4">{client.remainingDate ? new Date(client.remainingDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-4">
                          <Badge variant={client.daysRemaining && client.daysRemaining <= 7 ? 'destructive' : 'default'}>
                            {client.daysRemaining !== null ? `${client.daysRemaining} days` : 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-4">{client.packageType}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="overdue">
          <div className="gym-card overflow-hidden">
            <div className="p-6 border-b bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-3xl font-extrabold text-gray-900">Overdue Payments</h3>
                <Badge variant="destructive" className="bg-red-600 text-white px-4 py-2 text-base font-bold">
                  {pendingOverdue.overdue.length} {pendingOverdue.overdue.length === 1 ? 'Client' : 'Clients'}
                </Badge>
              </div>
              <p className="text-lg font-semibold text-gray-700 mt-3">Clients with pending amounts past their due date</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-100">
                    <th className="text-left p-4 font-semibold text-gray-700">Client Name</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Contact</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Overdue Amount</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Due Date</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Days Overdue</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Package</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOverdue.overdue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">No overdue payments</td>
                    </tr>
                  ) : (
                    pendingOverdue.overdue.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-red-50">
                        <td className="p-4 font-medium">{client.name}</td>
                        <td className="p-4">{client.contact}</td>
                        <td className="p-4 font-semibold text-red-600">₹{client.pendingAmount.toLocaleString()}</td>
                        <td className="p-4">{client.remainingDate ? new Date(client.remainingDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-4">
                          <Badge variant="destructive" className="bg-red-600">
                            {client.daysRemaining !== null ? `${Math.abs(client.daysRemaining)} days overdue` : 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-4">{client.packageType}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="gym-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Client Name</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Payment Method</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">Loading payment history...</td>
                    </tr>
                  ) : paymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No payment history found</td>
                    </tr>
                  ) : (
                    paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{payment.clientName}</td>
                      <td className="p-4">₹{payment.amount.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {React.createElement(getPaymentIcon(payment.method), { className: "h-4 w-4" })}
                          <span>{payment.method}</span>
                        </div>
                      </td>
                      <td className="p-4">{payment.date}</td>
                      <td className="p-4">
                        <Badge 
                          variant={payment.status === 'completed' ? 'default' : 'secondary'}
                          className={payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        >
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="gym-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Client Name</th>
                    <th className="text-left p-4 font-medium">Amount Due</th>
                    <th className="text-left p-4 font-medium">Due Date</th>
                    <th className="text-left p-4 font-medium">Days Left</th>
                    <th className="text-left p-4 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">Loading upcoming payments...</td>
                    </tr>
                  ) : upcomingPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No upcoming payments</td>
                    </tr>
                  ) : (
                    upcomingPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{payment.clientName}</td>
                      <td className="p-4">₹{payment.amount.toLocaleString()}</td>
                      <td className="p-4">{payment.dueDate}</td>
                      <td className="p-4">{payment.daysLeft} days</td>
                      <td className="p-4">
                        <Badge 
                          variant={payment.daysLeft <= 3 ? 'destructive' : payment.daysLeft <= 7 ? 'secondary' : 'default'}
                          className={
                            payment.daysLeft <= 3 
                              ? 'bg-red-100 text-red-800 border-red-300' 
                              : payment.daysLeft <= 7 
                                ? 'bg-orange-100 text-orange-800 border-orange-300' 
                                : 'bg-green-100 text-green-800 border-green-300'
                          }
                        >
                          {payment.daysLeft <= 3 ? 'Urgent' : payment.daysLeft <= 7 ? 'Soon' : 'Normal'}
                        </Badge>
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
          className="max-w-4xl" 
          style={{
            backgroundColor: '#1F2937',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            border: '1px solid #374151',
            color: '#F9FAFB'
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
            <div style={{padding: '30px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px'}}>
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
                        fontWeight: '500'
                      }}>
                        {selectedClient.name}
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
                        fontWeight: '500'
                      }}>
                        {selectedClient.contact}
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
                        fontWeight: '500'
                      }}>
                        {selectedClient.billingDate}
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
                        fontWeight: '500'
                      }}>
                        {selectedClient.duration}
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
                        fontWeight: '500'
                      }}>
                        ₹{selectedClient.amount?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Balance Due
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500'
                      }}>
                        ₹{selectedClient.balance?.toLocaleString() || 'N/A'}
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
                        fontWeight: '500'
                      }}>
                        {selectedClient.remainingDuration || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{borderTop: '1px solid #4B5563', paddingTop: '20px', marginTop: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{color: '#D1D5DB', fontSize: '14px', fontWeight: '500'}}>Status</span>
                      <div style={{
                        backgroundColor: selectedClient.status === 'active' ? '#10B981' : '#EF4444',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {selectedClient.status === 'active' ? 'Active' : 'Inactive'}
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
  );
};

export default Billing;
