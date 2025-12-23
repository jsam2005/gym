import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { clientAPI, packageAPI } from "@/lib/api";
import { Switch } from "@/components/ui/switch";

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
    package: "",
    totalAmount: "",
    pendingAmount: "",
    billingDate: "",
    fromTime: "",
    fromAmPm: "AM",
    toTime: "",
    toAmPm: "PM",
    paymentMode: "",
    status: "active",
    isTrainer: false
  });
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [originalFormData, setOriginalFormData] = useState<any>(null);

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
          
          // Parse preferred timings if available (format: "06:00 AM - 10:00 PM")
          let fromTime = "";
          let fromAmPm = "AM";
          let toTime = "";
          let toAmPm = "PM";
          
          if (client.preferredTimings || (client as any).timings) {
            const timingsStr = client.preferredTimings || (client as any).timings || "";
            const match = timingsStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (match) {
              fromTime = `${match[1]}:${match[2]}`;
              fromAmPm = match[3].toUpperCase();
              toTime = `${match[4]}:${match[5]}`;
              toAmPm = match[6].toUpperCase();
            }
          }
          
          const initialFormData = {
            firstName: client.firstName || "",
            lastName: client.lastName || "",
            contact: client.phone || "",
            email: client.email || "",
            address: client.address || "",
            gender: client.gender || "",
            bloodGroup: (client as any).bloodGroup || "",
            months: (client as any).months?.toString() || "",
            package: client.packageType || "",
            totalAmount: client.packageAmount?.toString() || "",
            pendingAmount: client.pendingAmount?.toString() || "",
            billingDate: (client as any).billingDate 
              ? new Date((client as any).billingDate).toISOString().split('T')[0] 
              : (client as any).packageStartDate 
                ? new Date((client as any).packageStartDate).toISOString().split('T')[0] 
                : client.packageStartDate 
                  ? new Date(client.packageStartDate).toISOString().split('T')[0] 
                  : "",
            fromTime,
            fromAmPm,
            toTime,
            toAmPm,
            paymentMode: (client as any).paymentMode || "",
            status: client.status || "active",
            isTrainer: Boolean((client as any).isTrainer || client.role === "trainer")
          };
          
          setFormData(initialFormData);
          setOriginalFormData(JSON.parse(JSON.stringify(initialFormData))); // Deep copy for comparison
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

  // Fetch packages on component mount
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoadingPackages(true);
        const response = await packageAPI.getAll();
        if (response.data.success) {
          setPackages(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
        setPackages([]);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !originalFormData) return;

    // Compare current formData with originalFormData to only send modified fields
    const updates: any = {};
    
    // Only include fields that have changed
    if (formData.firstName !== originalFormData.firstName) updates.firstName = formData.firstName;
    if (formData.lastName !== originalFormData.lastName) updates.lastName = formData.lastName || "";
    if (formData.contact !== originalFormData.contact) updates.phone = formData.contact;
    if (formData.email !== originalFormData.email) updates.email = formData.email || undefined;
    if (formData.address !== originalFormData.address) updates.address = formData.address || undefined;
    if (formData.gender !== originalFormData.gender) updates.gender = formData.gender || undefined;
    if (formData.status !== originalFormData.status) updates.status = formData.status;
    
    // Package and billing fields
    if (formData.package !== originalFormData.package) updates.packageType = formData.package || undefined;
    if (formData.billingDate !== originalFormData.billingDate) {
      updates.billingDate = formData.billingDate ? new Date(formData.billingDate).toISOString() : undefined;
    }
    if (formData.totalAmount !== originalFormData.totalAmount) {
      updates.packageAmount = formData.totalAmount ? parseFloat(formData.totalAmount) : undefined;
    }
    if (formData.pendingAmount !== originalFormData.pendingAmount) {
      updates.pendingAmount = formData.pendingAmount ? parseFloat(formData.pendingAmount) : undefined;
    }
    
    // GymClients table fields
    if (formData.bloodGroup !== originalFormData.bloodGroup) {
      updates.bloodGroup = formData.bloodGroup || undefined;
    }
    if (formData.months !== originalFormData.months) {
      updates.months = formData.months ? parseInt(formData.months) : undefined;
    }
    
    // Timings - compare the full timing string
    const currentTimings = formData.fromTime && formData.toTime 
      ? `${formData.fromTime} ${formData.fromAmPm} - ${formData.toTime} ${formData.toAmPm}`
      : "";
    const originalTimings = originalFormData.fromTime && originalFormData.toTime
      ? `${originalFormData.fromTime} ${originalFormData.fromAmPm} - ${originalFormData.toTime} ${originalFormData.toAmPm}`
      : "";
    if (currentTimings !== originalTimings) {
      updates.timings = currentTimings || undefined;
    }
    
    if (formData.paymentMode !== originalFormData.paymentMode) {
      updates.paymentMode = formData.paymentMode || undefined;
    }
    if (formData.isTrainer !== originalFormData.isTrainer) {
      updates.isTrainer = formData.isTrainer;
    }

    // If no fields were modified, show message and return
    if (Object.keys(updates).length === 0) {
      toast({
        title: "No Changes",
        description: "No fields were modified.",
        variant: "default"
      });
      return;
    }

    setSubmitting(true);
    try {
      await clientAPI.update(id, updates);
      
      // Dispatch custom event to refresh all pages
      window.dispatchEvent(new CustomEvent('clientUpdated', { detail: { clientId: id, updates } }));

      toast({
        title: "Client Updated Successfully",
        description: `${formData.firstName} ${formData.lastName} has been updated.`,
      });

      // Navigate back and trigger refresh
      navigate("/clients", { state: { refresh: true } });
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
      <div className="min-h-screen bg-transparent p-0">
        <div className="text-center py-8">
          <div className="text-gray-400">Loading client...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-transparent p-4 flex justify-center">
      <div className="w-full max-w-7xl">
      <PageHeader 
        title="Edit Client" 
        actionButton={{
          label: "Back to Clients",
          onClick: () => navigate("/clients")
        }}
      />
      
      <div className="w-full">
        <form onSubmit={handleSubmit} className="gym-card p-8 bg-white shadow-lg">
          {/* Personal Information Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium mb-2 block">First Name</Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
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
              <Label htmlFor="contact" className="text-sm font-medium mb-2 block">Contact</Label>
              <Input
                id="contact"
                placeholder="Enter contact number"
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
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
              <Label htmlFor="bloodGroup" className="text-sm font-medium mb-2 block">Blood Group</Label>
              <Select value={formData.bloodGroup} onValueChange={(value) => handleInputChange("bloodGroup", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Package and Training Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <Label htmlFor="months" className="text-sm font-medium mb-2 block">Duration (Months)</Label>
              <Input
                id="months"
                type="text"
                placeholder="Enter duration in months"
                value={formData.months}
                onChange={(e) => handleInputChange("months", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="package" className="text-sm font-medium mb-2 block">Package</Label>
              {loadingPackages ? (
                <Input
                  disabled
                  placeholder="Loading packages..."
                  className="mt-1"
                />
              ) : packages.length === 0 ? (
                <Input
                  disabled
                  placeholder="No packages available. Create packages first."
                  className="mt-1"
                />
              ) : (
                <Select 
                  value={formData.package} 
                  onValueChange={(value) => handleInputChange("package", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => {
                      const packageValue = pkg.name || pkg.id || pkg._id || `package-${Math.random()}`;
                      return (
                        <SelectItem key={pkg.id || pkg._id || packageValue} value={packageValue}>
                          {pkg.name || 'Unnamed Package'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
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
            <div className="space-y-2">
              <Label className="text-sm font-medium mb-2 block">Preferred Timings</Label>
              <div className="grid grid-cols-6 gap-2">
                {/* From Time - Hours */}
                <div>
                  <Label htmlFor="fromHour" className="text-xs text-gray-600 mb-1 block">From Hour</Label>
                  <Input
                    id="fromHour"
                    type="number"
                    min="1"
                    max="12"
                    placeholder="6"
                    value={formData.fromTime ? formData.fromTime.split(':')[0].replace(/^0+/, '') || '6' : ''}
                    onChange={(e) => {
                      const hour = e.target.value || '6';
                      const minute = formData.fromTime ? formData.fromTime.split(':')[1] || '00' : '00';
                      handleInputChange("fromTime", `${hour.padStart(2, '0')}:${minute}`);
                    }}
                    className="text-sm h-9"
                  />
                </div>
                {/* From Time - Minutes */}
                <div>
                  <Label htmlFor="fromMinute" className="text-xs text-gray-600 mb-1 block">Min</Label>
                  <Input
                    id="fromMinute"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="00"
                    value={formData.fromTime ? formData.fromTime.split(':')[1] || '00' : ''}
                    onChange={(e) => {
                      const minute = e.target.value.padStart(2, '0');
                      const hour = formData.fromTime ? formData.fromTime.split(':')[0] || '06' : '06';
                      handleInputChange("fromTime", `${hour}:${minute}`);
                    }}
                    className="text-sm h-9"
                  />
                </div>
                {/* From AM/PM */}
                <div>
                  <Label htmlFor="fromAmPm" className="text-xs text-gray-600 mb-1 block">AM/PM</Label>
                  <Select 
                    value={formData.fromAmPm} 
                    onValueChange={(value) => handleInputChange("fromAmPm", value)}
                  >
                    <SelectTrigger className="text-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* To Time - Hours */}
                <div>
                  <Label htmlFor="toHour" className="text-xs text-gray-600 mb-1 block">To Hour</Label>
                  <Input
                    id="toHour"
                    type="number"
                    min="1"
                    max="12"
                    placeholder="10"
                    value={formData.toTime ? formData.toTime.split(':')[0].replace(/^0+/, '') || '10' : ''}
                    onChange={(e) => {
                      const hour = e.target.value || '10';
                      const minute = formData.toTime ? formData.toTime.split(':')[1] || '00' : '00';
                      handleInputChange("toTime", `${hour.padStart(2, '0')}:${minute}`);
                    }}
                    className="text-sm h-9"
                  />
                </div>
                {/* To Time - Minutes */}
                <div>
                  <Label htmlFor="toMinute" className="text-xs text-gray-600 mb-1 block">Min</Label>
                  <Input
                    id="toMinute"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="00"
                    value={formData.toTime ? formData.toTime.split(':')[1] || '00' : ''}
                    onChange={(e) => {
                      const minute = e.target.value.padStart(2, '0');
                      const hour = formData.toTime ? formData.toTime.split(':')[0] || '10' : '10';
                      handleInputChange("toTime", `${hour}:${minute}`);
                    }}
                    className="text-sm h-9"
                  />
                </div>
                {/* To AM/PM */}
                <div>
                  <Label htmlFor="toAmPm" className="text-xs text-gray-600 mb-1 block">AM/PM</Label>
                  <Select 
                    value={formData.toAmPm} 
                    onValueChange={(value) => handleInputChange("toAmPm", value)}
                  >
                    <SelectTrigger className="text-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.fromTime && formData.toTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formData.fromTime} {formData.fromAmPm} - {formData.toTime} {formData.toAmPm}
                </p>
              )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
              <Label htmlFor="billingDate" className="text-sm font-medium mb-2 block">Billing Date</Label>
              <Input
                id="billingDate"
                type="date"
                value={formData.billingDate || ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log("Billing date changed:", newValue);
                  handleInputChange("billingDate", newValue);
                }}
                disabled={loading || submitting}
              />
            </div>
          </div>

          {/* Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <div className="md:col-span-2">
              <Label className="text-sm font-medium mb-2 block">Role</Label>
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Mark as Trainer</p>
                  <p className="text-xs text-muted-foreground">Enable to show this client under the Trainers list.</p>
                </div>
                <Switch
                  checked={formData.isTrainer}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isTrainer: checked }))}
                />
              </div>
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
    </div>
  );
};

export default EditClient;






