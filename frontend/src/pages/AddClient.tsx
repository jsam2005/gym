import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { clientAPI, packageAPI } from "@/lib/api";

const AddClient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    amount: "",
    pendingAmount: "",
    remainingDate: "",
    fromTime: "",
    fromAmPm: "AM",
    toTime: "",
    toAmPm: "PM",
    paymentMode: ""
  });
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // All fields are optional - no validation required

    setSubmitting(true);
    try {
      // Create client via API - this will:
      // 1. Create employee in Employees table (name + phone only)
      // 2. Create gym client in GymClients table (additional info - optional)
      // 3. Register user on ESSL device
      const response = await clientAPI.create({
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        phone: formData.contact || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        gender: formData.gender || undefined,
        dateOfBirth: new Date(),
        emergencyContact: {
          name: "Emergency Contact",
          phone: "0000000000",
          relation: "Family"
        },
        packageType: formData.package || undefined,
        packageStartDate: new Date(),
        packageEndDate: formData.remainingDate ? new Date(formData.remainingDate) : 
                       new Date(Date.now() + (parseInt(formData.months || "1") * 30 * 24 * 60 * 60 * 1000)),
        packageAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : undefined,
        amountPaid: formData.amount ? parseFloat(formData.amount) : undefined,
        // Additional fields for GymClients table - only send if provided
        bloodGroup: formData.bloodGroup || undefined,
        months: formData.months ? parseInt(formData.months) : undefined,
        timings: formData.fromTime && formData.toTime 
          ? `${formData.fromTime} ${formData.fromAmPm} - ${formData.toTime} ${formData.toAmPm}`
          : undefined,
        paymentMode: formData.paymentMode || undefined,
      });

      const deviceStatus = response.data.deviceRegistered 
        ? "✅ Registered on device" 
        : `⚠️ Device: ${response.data.deviceMessage || 'Not registered'}`;

      const clientName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Client';
      toast({
        title: "Client Added Successfully",
        description: `${clientName} has been added. ${deviceStatus}. User ID: ${response.data.employeeCodeInDevice}`,
      });

      // Navigate back to clients list
      navigate("/clients");
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add client",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-8">
      <PageHeader 
        title="Add New Client" 
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
                    value={formData.fromTime ? formData.fromTime.split(':')[0] : ''}
                    onChange={(e) => {
                      const hour = e.target.value;
                      const minute = formData.fromTime ? formData.fromTime.split(':')[1] || '00' : '00';
                      handleInputChange("fromTime", hour ? `${hour.padStart(2, '0')}:${minute}` : '');
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
              {submitting ? "Adding Client..." : "Add Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClient;

