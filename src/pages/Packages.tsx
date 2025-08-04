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
    </div>
  );
};

export default Packages;


