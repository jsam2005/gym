import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  return (
    <div className="p-8">
      <PageHeader 
        title="Settings" 
        showSearch={false}
      />
      
      <div className="w-full max-w-7xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="gym">Gym</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="gym-card p-10">
                <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      defaultValue="Vikram R"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="vikram@gmail.com"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      defaultValue="7958694675"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Password</h3>
                  <Button variant="outline">
                    Change Password
                  </Button>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Member Sign-Ups</p>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications for new member sign-ups
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Class Cancellations</p>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications for class cancellations
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Picture */}
              <div className="gym-card p-10">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-6">FitStudio</h2>
                  
                  <div className="flex justify-center mb-6">
                    <Avatar className="w-40 h-40 border-4 border-white shadow-xl">
                      <AvatarImage src="/placeholder.svg" alt="Profile" />
                      <AvatarFallback className="text-3xl bg-white text-cyan-600">VR</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white">Vikram R</h3>
                  <p className="text-white font-medium mt-1">Gym Owner</p>
                  
                  <Button className="mt-6 bg-white !text-gray-900 hover:bg-gray-100 border-2 border-white font-semibold shadow-lg">
                    Change Photo
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gym">
            <div className="gym-card p-10 w-full">
              <h2 className="text-xl font-semibold mb-8">Gym Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <Label htmlFor="gymName">Gym Name</Label>
                  <Input
                    id="gymName"
                    defaultValue="FitStudio"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gymEmail">Gym Email</Label>
                  <Input
                    id="gymEmail"
                    type="email"
                    defaultValue="contact@fitstudio.com"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gymPhone">Gym Phone</Label>
                  <Input
                    id="gymPhone"
                    defaultValue="+91 98765 43210"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gymAddress">Address</Label>
                  <Input
                    id="gymAddress"
                    defaultValue="123 Fitness Street, Gym City"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-8">
                <Button className="bg-sidebar-active hover:bg-sidebar-active/90 px-8 py-3 text-lg font-semibold">
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;