import { DollarSign, CreditCard, Clock } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { PageHeader } from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const kpiData = [
  { title: "Total Billings", value: "1200", icon: CreditCard, variant: "success" as const },
  { title: "Total Sales", value: "₹45,000", icon: DollarSign, variant: "success" as const },
  { title: "Pending Amount", value: "₹5,000", icon: Clock, variant: "warning" as const },
];

const salesData = [
  { month: "Jan", sales: 35000 },
  { month: "Feb", sales: 42000 },
  { month: "Mar", sales: 38000 },
  { month: "Apr", sales: 45000 },
  { month: "May", sales: 41000 },
  { month: "Jun", sales: 48000 },
  { month: "Jul", sales: 0 },
  { month: "Aug", sales: 0 },
  { month: "Sep", sales: 0 },
  { month: "Oct", sales: 0 },
  { month: "Nov", sales: 0 },
  { month: "Dec", sales: 0 },
];

const FinancialOverview = () => {
  return (
    <div className="p-0">
      <PageHeader 
        title="Financial Overview" 
        showSearch={false}
      />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {kpiData.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            variant={kpi.variant}
          />
        ))}
      </div>

      {/* Time Period Filters */}
      <div className="flex gap-4 mb-6">
        <button className="px-4 py-2 bg-sidebar-active text-white rounded-lg font-medium">
          This Year
        </button>
        <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80">
          Last Year
        </button>
      </div>

      {/* Sales Performance Chart */}
      <div className="gym-card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Sales Performance</h2>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-foreground">₹25,000</div>
              <div className="text-sm text-green-600 font-medium">This Month +15%</div>
            </div>
          </div>
          <select className="px-3 py-2 border border-border rounded-lg text-sm">
            <option>This Year</option>
            <option>Last Year</option>
          </select>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => `₹${value/1000}k`}
              />
              <Tooltip 
                formatter={(value) => [`₹${value.toLocaleString()}`, "Sales"]}
                labelStyle={{ color: "#1e293b" }}
                contentStyle={{ 
                  backgroundColor: "white", 
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px"
                }}
              />
              <Bar 
                dataKey="sales" 
                fill="hsl(215 28% 17%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Client List Breakdown */}
      <div className="gym-card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Client List Breakdown</h2>
        <p className="text-muted-foreground">
          Detailed breakdown of client categories and their contribution to overall revenue.
        </p>
      </div>
    </div>
  );
};

export default FinancialOverview;