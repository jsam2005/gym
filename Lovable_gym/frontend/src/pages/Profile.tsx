import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { settingsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  gymName: string;
  gymAddress: string;
  ownerName: string;
  ownerPhone: string;
  additionalContact: string | null;
  photo: string | null;
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
    photo: null,
  });
  const [formData, setFormData] = useState({
    gymName: "",
    gymAddress: "",
    ownerName: "",
    ownerPhone: "",
    additionalContact: "",
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch profile data
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching profile data...');
      const response = await settingsAPI.getProfile();
      console.log('📥 Profile response:', response.data);
      if (response.data.success) {
        const data = response.data.data;
        console.log('✅ Profile data received:', data);
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
      console.error("❌ Failed to fetch profile:", error);
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
      console.log('💾 Saving profile:', formData);
      const response = await settingsAPI.updateProfile({
        ...formData,
        additionalContact: formData.additionalContact || null,
        photo: profileData.photo,
      });
      console.log('📥 Update response:', response.data);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        // Refresh data from server
        await fetchProfileData();
        console.log('✅ Profile data refreshed');
      } else {
        toast({
          title: "Error",
          description: response.data.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);
      const response = await settingsAPI.changePassword(passwordForm);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setPasswordDialogOpen(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await settingsAPI.uploadPhoto(formData);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Photo uploaded successfully",
        });
        await fetchProfileData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to upload photo",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
                  placeholder="Enter gym name"
                />
              </div>
              
              <div>
                <Label htmlFor="gymAddress">Address</Label>
                <Input
                  id="gymAddress"
                  value={formData.gymAddress}
                  onChange={(e) => setFormData({ ...formData, gymAddress: e.target.value })}
                  className="mt-1"
                  placeholder="Enter gym address"
                />
              </div>
              
              <div>
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="mt-1"
                  placeholder="Enter owner name"
                />
              </div>
              
              <div>
                <Label htmlFor="ownerPhone">Owner Phone</Label>
                <Input
                  id="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="mt-1"
                  placeholder="Enter owner phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="additionalContact">Additional Contact (Optional)</Label>
                <Input
                  id="additionalContact"
                  value={formData.additionalContact}
                  onChange={(e) => setFormData({ ...formData, additionalContact: e.target.value })}
                  className="mt-1"
                  placeholder="Enter additional contact number"
                />
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Password</h3>
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleChangePassword} disabled={saving}>
                      {saving ? "Changing..." : "Change Password"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Photo Section */}
          <div className="gym-card p-10">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-6">{profileData.gymName || "Gym Name"}</h2>
              
              <div className="flex justify-center mb-6">
                <Avatar className="w-40 h-40 border-4 border-white shadow-xl">
                  <AvatarImage src={profileData.photo || "/placeholder.svg"} alt="Profile" />
                  <AvatarFallback className="text-3xl bg-white text-cyan-600">
                    {getInitials(profileData.ownerName || "GO")}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <h3 className="text-xl font-semibold text-white">{profileData.ownerName || "Owner Name"}</h3>
              <p className="text-white font-medium mt-1">Gym Owner</p>
              
              <div className="mt-6">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <Button
                  className="bg-white !text-gray-900 hover:bg-gray-100 border-2 border-white font-semibold shadow-lg w-full"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  Change Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
