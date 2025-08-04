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
      
      <div className="max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="gym">Gym</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="gym-card p-6">
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
              <div className="gym-card p-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-6">FitStudio</h2>
                  
                  <div className="flex justify-center mb-6">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src="/placeholder.svg" alt="Profile" />
                      <AvatarFallback className="text-2xl">VR</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-foreground">Vikram R</h3>
                  <p className="text-muted-foreground">Gym Owner</p>
                  
                  <Button variant="outline" className="mt-4">
                    Change Photo
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gym">
            <div className="gym-card p-6">
              <h2 className="text-xl font-semibold mb-6">Gym Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              
              <div className="flex justify-end mt-6">
                <Button className="bg-sidebar-active hover:bg-sidebar-active/90">
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