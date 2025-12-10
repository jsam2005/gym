import { useState, useEffect } from "react";
import { Users, UserCheck, UserX, UserPlus, CreditCard, DollarSign, Clock, ShoppingBag, AlertCircle } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { dashboardAPI } from "@/lib/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    allClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    renewalClients: 0,
    totalBillings: 0,
    totalSales: 0,
    pendingAmount: 0,
    thisMonthCollections: 0,
    pendingClients: 0,
    overdueClients: 0,
    monthlyGrowth: [] as { month: string; value: number }[],
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Listen for client update events to refresh dashboard stats
  useEffect(() => {
    const handleClientUpdate = () => {
      fetchDashboardStats();
    };
    
    window.addEventListener('clientUpdated', handleClientUpdate);
    return () => window.removeEventListener('clientUpdated', handleClientUpdate);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add Client feature hidden - clients are added via device and fetched via middleware
  // const handleAddClient = () => {
  //   navigate("/clients/add");
  // };

  const kpiData = [
    { title: "All Clients", value: stats.allClients.toLocaleString(), icon: Users, variant: "default" as const },
    { title: "Active Clients", value: stats.activeClients.toLocaleString(), icon: UserCheck, variant: "success" as const },
    { title: "Inactive Clients", value: stats.inactiveClients.toLocaleString(), icon: UserX, variant: "warning" as const },
    { title: "Renewal Clients", value: stats.renewalClients.toLocaleString(), icon: UserPlus, variant: "danger" as const },
  ];

  const secondaryKpis = [
    { title: "Number of Billings", value: stats.totalBillings.toLocaleString(), icon: CreditCard, subtitle: "This month" },
    { title: "Total Sales", value: `₹${stats.totalSales.toLocaleString()}`, icon: DollarSign, subtitle: "Revenue" },
    { title: "Pending Amount", value: `₹${stats.pendingAmount.toLocaleString()}`, icon: Clock, subtitle: "Outstanding" },
    { title: "Pending Clients", value: `${stats.pendingClients}`, icon: AlertCircle, subtitle: `${stats.overdueClients} overdue` },
  ];

  const chartData = stats.monthlyGrowth.length > 0 
    ? stats.monthlyGrowth 
    : [
        { month: "Jan", value: 0 },
        { month: "Feb", value: 0 },
        { month: "Mar", value: 0 },
        { month: "Apr", value: 0 },
        { month: "May", value: 0 },
        { month: "Jun", value: 0 },
        { month: "Jul", value: 0 },
        { month: "Aug", value: 0 },
        { month: "Sep", value: 0 },
        { month: "Oct", value: 0 },
        { month: "Nov", value: 0 },
        { month: "Dec", value: 0 },
      ];

  if (loading) {
    return (
      <div className="p-8 animate-fade-in">
        <PageHeader title="Dashboard" showSearch={false} />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        showSearch={false}
        // Add Client button hidden - clients are added via device and fetched via middleware
        // actionButton={{
        //   label: "Add New Client",
        //   onClick: handleAddClient
        // }}
      />
      
      {/* Primary KPI Cards with staggered animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi, index) => (
          <div 
            key={index}
            className={`animate-slide-in-left animate-delay-${(index + 1) * 100} hover-lift`}
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
          >
            <KPICard
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              variant={kpi.variant}
            />
          </div>
        ))}
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {secondaryKpis.map((kpi, index) => (
          <div 
            key={index}
            className={`animate-slide-in-right animate-delay-${(index + 1) * 100} hover-lift`}
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
          >
            <KPICard
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              subtitle={kpi.subtitle}
            />
          </div>
        ))}
      </div>

      {/* Business Growth Chart with scale animation */}
      <div className="gym-card p-6 animate-scale-in animate-delay-400 hover-lift">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Business Growth</h2>
          <select className="px-3 py-2 border border-border rounded-lg text-sm transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20">
            <option>This Year</option>
            <option>Last Year</option>
          </select>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                fontSize={12}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, "Growth"]}
                labelStyle={{ color: "#1e293b" }}
                contentStyle={{ 
                  backgroundColor: "white", 
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(43, 49, 11)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(43, 49, 11)" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <Line 
                type="monotone"
                dataKey="value" 
                stroke="rgb(43, 49, 11)"
                strokeWidth={3}
                dot={{ fill: "rgb(43, 49, 11)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "rgb(43, 49, 11)" }}
                fill="url(#colorGradient)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;





