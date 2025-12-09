import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { clientAPI } from "@/lib/api";

const EditClient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    email: "",
    address: "",
    gender: "",
    bloodGroup: "",
    months: "",
    trainer: "",
    package: "",
    totalAmount: "",
    amount: "",
    pendingAmount: "",
    remainingDate: "",
    timings: "",
    paymentMode: "",
    status: "active"
  });

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "Client ID is required",
          variant: "destructive"
        });
        navigate("/clients");
        return;
      }

      try {
        setLoading(true);
        const response = await clientAPI.getById(id);
        if (response.data.success && response.data.client) {
          const client = response.data.client;
          setFormData({
            firstName: client.firstName || "",
            lastName: client.lastName || "",
            contact: client.phone || "",
            email: client.email || "",
            address: client.address || "",
            gender: client.gender || "",
            bloodGroup: "",
            months: "",
            trainer: "",
            package: client.packageType || "",
            totalAmount: client.packageAmount?.toString() || "",
            amount: client.amountPaid?.toString() || "",
            pendingAmount: client.pendingAmount?.toString() || "",
            remainingDate: client.packageEndDate ? new Date(client.packageEndDate).toISOString().split('T')[0] : "",
            timings: "",
            paymentMode: "",
            status: client.status || "active"
          });
        } else {
          toast({
            title: "Error",
            description: "Client not found",
            variant: "destructive"
          });
          navigate("/clients");
        }
      } catch (error: any) {
        console.error("Error fetching client:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to load client",
          variant: "destructive"
        });
        navigate("/clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Basic validation
    if (!formData.firstName || !formData.contact) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (First Name, Contact)",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      await clientAPI.update(id, {
        firstName: formData.firstName,
        lastName: formData.lastName || "",
        phone: formData.contact,
        email: formData.email || undefined,
        address: formData.address || undefined,
        gender: formData.gender || undefined,
        packageType: formData.package || undefined,
        packageEndDate: formData.remainingDate ? new Date(formData.remainingDate).toISOString() : undefined,
        packageAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : undefined,
        amountPaid: formData.amount ? parseFloat(formData.amount) : undefined,
        pendingAmount: formData.pendingAmount ? parseFloat(formData.pendingAmount) : undefined,
        status: formData.status,
        // Additional fields for GymClients table
        bloodGroup: formData.bloodGroup || undefined,
        trainer: formData.trainer || undefined,
        months: formData.months ? parseInt(formData.months) : undefined,
        timings: formData.timings || undefined,
        paymentMode: formData.paymentMode || undefined,
      });

      toast({
        title: "Client Updated Successfully",
        description: `${formData.firstName} ${formData.lastName} has been updated.`,
      });

      navigate("/clients");
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update client",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-8">
        <div className="text-center py-8">
          <div className="text-gray-400">Loading client...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-8">
      <PageHeader 
        title="Edit Client" 
        actionButton={{
          label: "Back to Clients",
          onClick: () => navigate("/clients")
        }}
      />
      
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="gym-card p-8 bg-white shadow-lg">
          {/* Personal Information Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium mb-2 block">First Name *</Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium mb-2 block">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contact" className="text-sm font-medium mb-2 block">Contact *</Label>
              <Input
                id="contact"
                placeholder="Enter contact number"
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

          {/* Address and Personal Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <Label htmlFor="address" className="text-sm font-medium mb-2 block">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-sm font-medium mb-2 block">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status" className="text-sm font-medium mb-2 block">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Package and Training Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <Label htmlFor="months" className="text-sm font-medium mb-2 block">Months</Label>
              <Select value={formData.months} onValueChange={(value) => handleInputChange("months", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trainer" className="text-sm font-medium mb-2 block">Trainer</Label>
              <Select value={formData.trainer} onValueChange={(value) => handleInputChange("trainer", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trainer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trainer1">John Doe</SelectItem>
                  <SelectItem value="trainer2">Jane Smith</SelectItem>
                  <SelectItem value="trainer3">Mike Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="package" className="text-sm font-medium mb-2 block">Package</Label>
              <Select value={formData.package} onValueChange={(value) => handleInputChange("package", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="totalAmount" className="text-sm font-medium mb-2 block">Total Amount</Label>
              <Input
                id="totalAmount"
                placeholder="Enter total amount"
                value={formData.totalAmount}
                onChange={(e) => handleInputChange("totalAmount", e.target.value)}
              />
            </div>
          </div>

          {/* Timing and Payment Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="timings" className="text-sm font-medium mb-2 block">Preferred Timings</Label>
              <Select value={formData.timings} onValueChange={(value) => handleInputChange("timings", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (6:00 AM - 10:00 AM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12:00 PM - 4:00 PM)</SelectItem>
                  <SelectItem value="evening">Evening (5:00 PM - 9:00 PM)</SelectItem>
                  <SelectItem value="night">Night (8:00 PM - 11:00 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentMode" className="text-sm font-medium mb-2 block">Mode of Payment</Label>
              <Select value={formData.paymentMode} onValueChange={(value) => handleInputChange("paymentMode", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Financial Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <Label htmlFor="amount" className="text-sm font-medium mb-2 block">Amount</Label>
              <Input
                id="amount"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pendingAmount" className="text-sm font-medium mb-2 block">Pending Amount</Label>
              <Input
                id="pendingAmount"
                placeholder="Enter pending amount"
                value={formData.pendingAmount}
                onChange={(e) => handleInputChange("pendingAmount", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="remainingDate" className="text-sm font-medium mb-2 block">Remaining Date</Label>
              <Input
                id="remainingDate"
                type="date"
                value={formData.remainingDate}
                onChange={(e) => handleInputChange("remainingDate", e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/clients")}
              className="px-8"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-white px-8"
              disabled={submitting}
            >
              {submitting ? "Updating Client..." : "Update Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClient;





