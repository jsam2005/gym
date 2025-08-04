import { useState } from "react";
import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { GymTable, Client } from "@/components/GymTable";
import { KPICard } from "@/components/KPICard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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

  const filteredClients = billingClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.includes(searchTerm)
  );

  const handleView = (client: Client) => {
    console.log("View client billing:", client);
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
    </div>
  );
};

export default Billing;
