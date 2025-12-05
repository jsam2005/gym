import { useState } from "react";
import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { GymTable, Client } from "@/components/GymTable";
import { KPICard } from "@/components/KPICard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Wallet, Smartphone, DollarSign, Users, AlertCircle } from "lucide-react";

// Sample billing data
const billingClients: Client[] = [
  { id: 1, name: "John M", contact: "7958894675", status: "active", billingDate: "20 June 2024", duration: "12 month", amount: 15000, balance: 5000, remainingDuration: "10 month" },
  { id: 2, name: "Swetha R", contact: "5986086089", status: "active", billingDate: "18 June 2024", duration: "6 month", amount: 8000, balance: 2000, remainingDuration: "4 month" },
  { id: 3, name: "Ram T", contact: "7958894675", status: "inactive", billingDate: "15 May 2024", duration: "3 month", amount: 5000, balance: 1000, remainingDuration: "1 month" },
];

const paymentHistory = [
  { id: 1, clientName: "John M", amount: 10000, method: "UPI", date: "20 June 2024", status: "completed" },
  { id: 2, clientName: "Swetha R", amount: 6000, method: "Card", date: "18 June 2024", status: "completed" },
  { id: 3, clientName: "Ram T", amount: 4000, method: "Cash", date: "15 May 2024", status: "completed" },
  { id: 4, clientName: "Arun K", amount: 8000, method: "UPI", date: "10 June 2024", status: "pending" },
];

const upcomingPayments = [
  { id: 1, clientName: "John M", amount: 5000, dueDate: "20 July 2024", daysLeft: 5 },
  { id: 2, clientName: "Swetha R", amount: 2000, dueDate: "18 July 2024", daysLeft: 3 },
  { id: 3, clientName: "Vikram R", amount: 7500, dueDate: "25 July 2024", daysLeft: 10 },
];

const Billing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard
          title="Total Billings"
          value="₹28,000"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <KPICard
          title="Pending Amount"
          value="₹8,000"
          icon={<AlertCircle className="h-6 w-6" />}
        />
        <KPICard
          title="This Month Collections"
          value="₹20,000"
          icon={<Users className="h-6 w-6" />}
        />
      </div>

      {/* Billing Tabs */}
      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients">Client Billing</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <GymTable 
            clients={filteredClients}
            showAmount={true}
            showBalance={true}
            showRemainingDuration={true}
            onView={handleView}
            onDelete={handleDelete}
          />
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
                  {paymentHistory.map((payment) => (
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
                  ))}
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
                  {upcomingPayments.map((payment) => (
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
                  ))}
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
