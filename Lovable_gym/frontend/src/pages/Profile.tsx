import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { settingsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  gymName: string;
  gymAddress: string;
  ownerName: string;
  ownerPhone: string;
  additionalContact: string | null;
}

const Profile = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    gymName: "",
    gymAddress: "",
    ownerName: "",
    ownerPhone: "",
    additionalContact: null,
  });
  const [formData, setFormData] = useState({
    gymName: "",
    gymAddress: "",
    ownerName: "",
    ownerPhone: "",
    additionalContact: "",
  });

  // Fetch profile data
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getProfile();
      if (response.data.success) {
        const data = response.data.data;
        setProfileData(data);
        setFormData({
          gymName: data.gymName || "",
          gymAddress: data.gymAddress || "",
          ownerName: data.ownerName || "",
          ownerPhone: data.ownerPhone || "",
          additionalContact: data.additionalContact || "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to fetch profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await settingsAPI.updateProfile({
        ...formData,
        additionalContact: formData.additionalContact || null,
        photo: null,
      });
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        await fetchProfileData();
      } else {
        toast({
          title: "Error",
          description: response.data.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };




  if (loading) {
    return (
      <div className="p-0">
        <PageHeader title="Profile" showSearch={false} />
        <div className="flex justify-center items-center py-12">
          <p>Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 flex justify-center">
      <div className="w-full max-w-7xl">
        <PageHeader title="Profile" showSearch={false} />
        
        <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Form */}
          <div className="gym-card p-10">
            <h2 className="text-xl font-semibold mb-6">Gym & Owner Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="gymName">Gym Name</Label>
                <Input
                  id="gymName"
                  value={formData.gymName}
                  onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="gymAddress">Address</Label>
                <Input
                  id="gymAddress"
                  value={formData.gymAddress}
                  onChange={(e) => setFormData({ ...formData, gymAddress: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="ownerPhone">Owner Phone</Label>
                <Input
                  id="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="additionalContact">Additional Contact</Label>
                <Input
                  id="additionalContact"
                  value={formData.additionalContact}
                  onChange={(e) => setFormData({ ...formData, additionalContact: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Photo Section */}
          <div className="gym-card p-10">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-6">M S Fitness Studio</h2>
              
              <div className="flex justify-center mb-6">
                <Avatar className="w-40 h-40 border-4 border-white shadow-xl">
                  <AvatarImage src="/logo.png" alt="Profile" />
                  <AvatarFallback className="text-3xl bg-white text-cyan-600">
                    MS
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <h3 className="text-xl font-semibold text-white">{profileData.ownerName || "Owner Name"}</h3>
              <p className="text-white font-medium mt-1">Gym Owner</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
