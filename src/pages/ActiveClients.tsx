import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GymTable, Client } from "@/components/GymTable";

const activeClients: Client[] = [
  { id: 4, name: "Arun K", contact: "7958894675", status: "active", billingDate: "20 June 2024", duration: "6 month" },
  { id: 6, name: "Uthaya J", contact: "7958894675", status: "active", billingDate: "20 June 2024", duration: "12 month" },
  { id: 8, name: "John M", contact: "7958894675", status: "active", billingDate: "20 June 2024", duration: "12 month" },
  { id: 9, name: "Swetha R", contact: "5986086089", status: "active", billingDate: "18 June 2024", duration: "6 month" },
  { id: 10, name: "Ram T", contact: "7958894675", status: "active", billingDate: "20 June 2024", duration: "2 month" },
];

const ActiveClients = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = activeClients.filter(client =>
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
        title="Active Clients List" 
        searchPlaceholder="Search active clients..."
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

export default ActiveClients;