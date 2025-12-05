import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Trash2 } from "lucide-react";

interface Package {
  id: number;
  name: string;
  description: string;
  plan: string;
  amount: number;
}

const samplePackages: Package[] = [
  { id: 1, name: "Basic", description: "Program Basic + Trainer", plan: "3 month", amount: 5000 },
  { id: 2, name: "Standard", description: "Program Standard + Trainer", plan: "6 month", amount: 9000 },
];

const Packages = () => {
  const [packages, setPackages] = useState<Package[]>(samplePackages);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    plan: "",
    amount: "",
    timing: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.description && formData.plan && formData.amount) {
      const newPackage: Package = {
        id: packages.length + 1,
        name: formData.name,
        description: formData.description,
        plan: formData.plan,
        amount: parseInt(formData.amount)
      };
      setPackages([...packages, newPackage]);
      setFormData({ name: "", description: "", plan: "", amount: "", timing: "" });
    }
  };

  const handleView = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsDialogOpen(true);
  };

  const handleDelete = (pkg: Package) => {
    if (confirm(`Are you sure you want to delete ${pkg.name}?`)) {
      setPackages(packages.filter(p => p.id !== pkg.id));
    }
  };

  return (
    <div className="p-8">
      <PageHeader 
        title="Package Management" 
        showSearch={false}
      />
      
      {/* Package Form */}
      <div className="gym-card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Package Form</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="packageName">Package Name</Label>
              <Input
                id="packageName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter package name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                className="mt-1"
                rows={1}
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter amount"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="plans">Plans</Label>
              <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 month">1 Month</SelectItem>
                  <SelectItem value="3 month">3 Months</SelectItem>
                  <SelectItem value="6 month">6 Months</SelectItem>
                  <SelectItem value="12 month">12 Months</SelectItem>
                  <SelectItem value="24 month">24 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="timing">Timing</Label>
              <Select value={formData.timing} onValueChange={(value) => setFormData({ ...formData, timing: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (6:00 AM - 10:00 AM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12:00 PM - 4:00 PM)</SelectItem>
                  <SelectItem value="evening">Evening (5:00 PM - 9:00 PM)</SelectItem>
                  <SelectItem value="night">Night (8:00 PM - 11:00 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-end gap-4">
            <Button type="submit" className="bg-sidebar-active hover:bg-sidebar-active/90">
              Save
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setFormData({ name: "", description: "", plan: "", amount: "", timing: "" })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Packages Table */}
      <div className="gym-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No.</TableHead>
              <TableHead>Package Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="w-24">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="font-medium">{pkg.id}</TableCell>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell>{pkg.description}</TableCell>
                <TableCell>{pkg.plan}</TableCell>
                <TableCell>₹{pkg.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleView(pkg)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(pkg)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
              Package Details
            </DialogTitle>
          </DialogHeader>
          {selectedPackage && (
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
                    Package Information
                  </h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Package Name
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
                        {selectedPackage.name}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Description
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
                        {selectedPackage.description}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Plan Duration
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
                        {selectedPackage.plan}
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
                    Pricing Details
                  </h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Package Amount
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
                        ₹{selectedPackage.amount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Monthly Rate
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
                        ₹{Math.round(selectedPackage.amount / (selectedPackage.plan.includes('3') ? 3 : selectedPackage.plan.includes('6') ? 6 : selectedPackage.plan.includes('12') ? 12 : 1)).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Package ID
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
                        PKG-{selectedPackage.id.toString().padStart(3, '0')}
                      </div>
                    </div>
                  </div>
                  <div style={{borderTop: '1px solid #4B5563', paddingTop: '20px', marginTop: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{color: '#D1D5DB', fontSize: '14px', fontWeight: '500'}}>Status</span>
                      <div style={{
                        backgroundColor: '#10B981',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Active
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

export default Packages;


