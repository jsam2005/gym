import { useState, useEffect } from "react";
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
import { Eye, Trash2, Pencil } from "lucide-react";
import { packageAPI } from "@/lib/api";

interface Package {
  id: string;
  name: string;
  description: string;
  duration: number;
  amount: number;
  timingSlot?: string;
}

const Packages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "",
    amount: "",
    timing: "morning"
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await packageAPI.getAll();
      if (response.data.success) {
        setPackages(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate if values are provided (all fields optional)
    const durationMonths = formData.duration ? parseInt(formData.duration) : 0;
    const amount = formData.amount ? parseFloat(formData.amount) : 0;

    // Only validate format if values are provided
    if (formData.duration && (isNaN(durationMonths) || durationMonths <= 0)) {
      alert("Please enter a valid duration (number of months) or leave empty");
      return;
    }

    if (formData.amount && (isNaN(amount) || amount < 0)) {
      alert("Please enter a valid amount or leave empty");
      return;
    }

    try {
      const durationDays = durationMonths * 30; // Convert months to days (0 if empty)
      
      if (editingPackage) {
        // Update existing package
        const updateData: any = {};
        if (formData.name) updateData.name = formData.name.trim();
        if (formData.description) updateData.description = formData.description.trim();
        if (formData.duration) updateData.duration = durationDays;
        if (formData.amount) updateData.amount = amount;
        if (formData.timing) {
          updateData.timingSlot = formData.timing;
          updateData.accessSchedule = {
            startTime: formData.timing === 'morning' ? '06:00' : formData.timing === 'afternoon' ? '12:00' : formData.timing === 'evening' ? '17:00' : '20:00',
            endTime: formData.timing === 'morning' ? '10:00' : formData.timing === 'afternoon' ? '16:00' : formData.timing === 'evening' ? '21:00' : '23:00',
          };
        }
        
        const response = await packageAPI.update(editingPackage.id, updateData);
        
        if (response.data.success) {
          alert("Package updated successfully!");
          setEditingPackage(null);
          setFormData({ name: "", description: "", duration: "", amount: "", timing: "morning" });
          await fetchPackages(); // Refresh list
        } else {
          alert("Failed to update package: " + (response.data.error || "Unknown error"));
        }
      } else {
        // Create new package - all fields optional
        const createData: any = {};
        if (formData.name) createData.name = formData.name.trim();
        if (formData.description) createData.description = formData.description.trim();
        if (formData.duration) createData.duration = durationDays;
        if (formData.amount) createData.amount = amount;
        if (formData.timing) {
          createData.timingSlot = formData.timing;
          createData.accessSchedule = {
            startTime: formData.timing === 'morning' ? '06:00' : formData.timing === 'afternoon' ? '12:00' : formData.timing === 'evening' ? '17:00' : '20:00',
            endTime: formData.timing === 'morning' ? '10:00' : formData.timing === 'afternoon' ? '16:00' : formData.timing === 'evening' ? '21:00' : '23:00',
          };
        }
        
        const response = await packageAPI.create(createData);
        
        if (response.data.success) {
          alert("Package created successfully!");
          setFormData({ name: "", description: "", duration: "", amount: "", timing: "morning" });
          await fetchPackages(); // Refresh list
        } else {
          alert("Failed to create package: " + (response.data.error || "Unknown error"));
        }
      }
    } catch (error: any) {
      console.error("Error saving package:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Unknown error";
      alert("Failed to save package: " + errorMessage);
    }
  };

  const handleView = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsDialogOpen(true);
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    const months = Math.floor(pkg.duration / 30);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      duration: months.toString(),
      amount: pkg.amount.toString(),
      timing: pkg.timingSlot || 'morning'
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPackage(null);
    setFormData({ name: "", description: "", duration: "", amount: "", timing: "morning" });
  };

  const handleDelete = async (pkg: Package) => {
    if (confirm(`Are you sure you want to delete ${pkg.name}?`)) {
      try {
        await packageAPI.delete(pkg.id);
        await fetchPackages(); // Refresh list
      } catch (error: any) {
        console.error("Error deleting package:", error);
        alert("Failed to delete package: " + (error.response?.data?.error || error.message));
      }
    }
  };

  const formatDuration = (days: number): string => {
    const months = Math.floor(days / 30);
    if (months === 0) return `${days} day${days !== 1 ? 's' : ''}`;
    return `${months} month${months !== 1 ? 's' : ''}`;
  };

  return (
    <div className="w-full p-4 flex justify-center">
      <div className="w-full max-w-7xl">
      <PageHeader 
        title="Package Management" 
        showSearch={false}
      />
      
      {/* Package Form */}
      <div className="gym-card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {editingPackage ? `Edit Package: ${editingPackage.name}` : "Create New Package"}
          </h2>
          {editingPackage && (
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCancelEdit}
            >
              Cancel Edit
            </Button>
          )}
        </div>
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
              <Label htmlFor="duration">Duration (Months)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Enter duration in months"
                className="mt-1"
                min="1"
              />
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
              {editingPackage ? "Update Package" : "Create Package"}
            </Button>
            {!editingPackage && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setFormData({ name: "", description: "", duration: "", amount: "", timing: "morning" })}
              >
                Clear
              </Button>
            )}
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
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading packages...
                </TableCell>
              </TableRow>
            ) : packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No packages found. Create your first package above.
                </TableCell>
              </TableRow>
            ) : (
              packages.map((pkg, index) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell>{pkg.description}</TableCell>
                  <TableCell>{formatDuration(pkg.duration)}</TableCell>
                  <TableCell>₹{pkg.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleView(pkg)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleEdit(pkg)}
                        title="Edit Package"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pkg)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete Package"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="w-full" 
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
                        {formatDuration(selectedPackage.duration)}
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
                        ₹{Math.round(selectedPackage.amount / (selectedPackage.duration / 30)).toLocaleString()}
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
    </div>
  );
};

export default Packages;


