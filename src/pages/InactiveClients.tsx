import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GymTable, Client } from "@/components/GymTable";

const inactiveClients: Client[] = [
  { id: 11, name: "Swetha R", contact: "5986086089", status: "inactive", billingDate: "18 June 2024", duration: "6 month" },
  { id: 12, name: "Ram T", contact: "7958894675", status: "inactive", billingDate: "20 June 2024", duration: "3 month" },
  { id: 13, name: "Vikram R", contact: "5986086089", status: "inactive", billingDate: "18 June 2024", duration: "24 month" },
  { id: 14, name: "Arun K", contact: "7958894675", status: "inactive", billingDate: "20 June 2024", duration: "6 month" },
  { id: 15, name: "Sethu R", contact: "5986086089", status: "inactive", billingDate: "18 June 2024", duration: "2 month" },
  { id: 16, name: "Uthaya J", contact: "7958894675", status: "inactive", billingDate: "20 June 2024", duration: "24 month" },
  { id: 17, name: "Sowmiya R", contact: "5986086089", status: "inactive", billingDate: "18 June 2024", duration: "3 month" },
  { id: 18, name: "John M", contact: "7958894675", status: "inactive", billingDate: "20 June 2024", duration: "6 month" },
];

const InactiveClients = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = inactiveClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.includes(searchTerm)
  );

  const handleView = (client: Client) => {
    console.log("View client:", client);
  };

  const handleDelete = (client: Client) => {
    if (confirm(`Are you sure you want to delete ${client.name}?`)) {
      console.log("Delete client:", client);
    }
  };

  return (
    <div className="p-8">
      <PageHeader 
        title="Inactive Clients List" 
        searchPlaceholder="Search inactive clients..."
        onSearch={setSearchTerm}
        actionButton={{
          label: "Add New Client",
          onClick: () => console.log("Add new client")
        }}
      />
      
      <GymTable 
        clients={filteredClients}
        onView={handleView}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default InactiveClients;