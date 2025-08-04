import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GymTable, Client } from "@/components/GymTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const sampleClients: Client[] = [
  { id: 4, name: "Arun K", contact: "7958894675", status: "active", billingDate: "20 June 2024", duration: "6 month" },
  { id: 5, name: "Sethu R", contact: "5986086089", status: "inactive", billingDate: "18 June 2024", duration: "2 month" },
  { id: 6, name: "Uthaya J", contact: "7958894675", status: "active", billingDate: "20 June 2024", duration: "12 month" },
  { id: 7, name: "Sowmiya R", contact: "5986086089", status: "inactive", billingDate: "18 June 2024", duration: "6 month" },
  { id: 8, name: "John M", contact: "7958894675", status: "active", billingDate: "20 June 2024", duration: "12 month" },
  { id: 9, name: "Swetha R", contact: "5986086089", status: "active", billingDate: "18 June 2024", duration: "6 month" },
  { id: 10, name: "Ram T", contact: "7958894675", status: "active", billingDate: "20 June 2024", duration: "2 month" },
];

const AllClients = () => {
  const [clients, setClients] = useState<Client[]>(sampleClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.includes(searchTerm)
  );

  const handleView = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    if (confirm(`Are you sure you want to delete ${client.name}?`)) {
      setClients(clients.filter(c => c.id !== client.id));
    }
  };

  const handleAddClient = () => {
    // This would open an add client form
    console.log("Add new client");
  };

  return (
    <div className="p-8">
      <PageHeader 
        title="All Clients List" 
        searchPlaceholder="Search clients..."
        onSearch={setSearchTerm}
        actionButton={{
          label: "Add New Client",
          onClick: handleAddClient
        }}
      />
      
      <GymTable 
        clients={filteredClients}
        onView={handleView}
        onDelete={handleDelete}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">First Name:</label>
                      <p className="font-medium">{selectedClient.name.split(' ')[0]}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gender:</label>
                      <p className="font-medium">Male</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contact:</label>
                      <p className="font-medium">{selectedClient.contact}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email:</label>
                      <p className="font-medium">john@gmail.com</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-4">Package Information</h3>
                  <div className="gym-card p-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Billing Date</p>
                        <p className="font-medium">{selectedClient.billingDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Month</p>
                        <p className="font-medium">{selectedClient.duration.split(' ')[0]}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Blood Group</p>
                        <p className="font-medium">O+</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">₹5,000</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedClient.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedClient.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllClients;