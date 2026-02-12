import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { GymTable, Client } from "@/components/GymTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clientAPI } from "@/lib/api";

const ActiveClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch active clients from API
  useEffect(() => {
    const fetchActiveClients = async () => {
      try {
        setLoading(true);
        const response = await clientAPI.getAll({ status: 'active', limit: 5000 });
        if (response.data.success) {
          // Transform API data to match the expected format
          const transformedClients = response.data.clients.map((client: any, index: number) => ({
            id: client.id || client._id || `client-${index}`,
            deviceId: client.esslUserId || client.employeeCodeInDevice || '',
            name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown',
            contact: client.phone || '',
            status: client.status || 'inactive',
            billingDate: client.packageStartDate
              ? new Date(client.packageStartDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'N/A',
            duration: (client.months && Number(client.months) > 0)
              ? `${Number(client.months)} month${Number(client.months) > 1 ? 's' : ''}`
              : (client.packageType || 'N/A'),
          }));
          setClients(transformedClients);
        }
      } catch (error) {
        console.error('Error fetching active clients:', error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveClients();
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.includes(searchTerm)
  );

  const handleView = async (client: Client) => {
    try {
      // Fetch fresh data from API to get latest updates
      const response = await clientAPI.getById(String(client.id));
      if (response.data.success && response.data.client) {
        const freshClient = response.data.client;
        // Transform to match Client interface
        const updatedClient: any = {
          id: freshClient.id || freshClient._id || client.id,
          deviceId: freshClient.esslUserId || freshClient.employeeCodeInDevice || freshClient.deviceId || client.deviceId,
          name: `${freshClient.firstName || ''} ${freshClient.lastName || ''}`.trim() || freshClient.name || client.name,
          contact: freshClient.phone || freshClient.contact || client.contact,
          email: freshClient.email || '',
          gender: freshClient.gender || '',
          status: freshClient.status || client.status,
          billingDate: freshClient.packageStartDate 
            ? new Date(freshClient.packageStartDate).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })
            : client.billingDate,
          duration: freshClient.packageType || freshClient.duration || client.duration,
          // Include GymClients data - explicitly set to null if not present
          bloodGroup: freshClient.bloodGroup || null,
          amount: (freshClient.packageAmount || freshClient.totalAmount) ? (freshClient.packageAmount || freshClient.totalAmount) : null,
          packageAmount: (freshClient.packageAmount || freshClient.totalAmount) ? (freshClient.packageAmount || freshClient.totalAmount) : null,
          amountPaid: freshClient.amountPaid || null,
          pendingAmount: freshClient.pendingAmount || null,
        };
        setSelectedClient(updatedClient);
      } else {
        // Fallback: clear bloodGroup and amount to show blank
        const fallbackClient: any = {
          ...client,
          bloodGroup: null,
          amount: null,
          packageAmount: null,
        };
        setSelectedClient(fallbackClient);
      }
    } catch (error) {
      console.error('Error fetching fresh client data:', error);
      // Fallback: clear bloodGroup and amount to show blank
      const fallbackClient: any = {
        ...client,
        bloodGroup: null,
        amount: null,
        packageAmount: null,
      };
      setSelectedClient(fallbackClient);
    }
    setIsDialogOpen(true);
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
          onClick: () => navigate("/clients/add")
        }}
      />
      
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-400">Loading active clients...</div>
        </div>
      ) : (
        <GymTable 
          clients={filteredClients}
          onView={handleView}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="max-w-4xl" 
          style={{
            backgroundColor: '#1F2937',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            border: '1px solid #374151',
            color: '#F9FAFB'
          }}
        >
          <DialogHeader>
            <DialogTitle style={{
              color: '#F9FAFB', 
              fontSize: '24px', 
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              Client Details
            </DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div style={{padding: '30px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px'}}>
                <div style={{
                  backgroundColor: '#374151',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #4B5563'
                }}>
                  <h3 style={{
                    color: '#F9FAFB', 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: '20px',
                    textAlign: 'left'
                  }}>
                    Personal Information
                  </h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        First name
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500'
                      }}>
                        {selectedClient.name.split(' ')[0]}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Gender
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500'
                      }}>
                        {(selectedClient as any).gender || ''}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Contact
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500'
                      }}>
                        {selectedClient.contact || ''}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Email
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500'
                      }}>
                        {(selectedClient as any).email || ''}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#374151',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #4B5563'
                }}>
                  <h3 style={{
                    color: '#F9FAFB', 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: '20px',
                    textAlign: 'left'
                  }}>
                    Package Information
                  </h3>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Billing Date
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500'
                      }}>
                        {selectedClient.billingDate || ''}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Duration
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500'
                      }}>
                        {selectedClient.duration || ''}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Blood Group
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500'
                      }}>
                        {(selectedClient as any).bloodGroup || ''}
                      </div>
                    </div>
                    <div>
                      <label style={{color: '#D1D5DB', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                        Amount
                      </label>
                      <div style={{
                        backgroundColor: '#4B5563',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '16px',
                        color: '#F9FAFB',
                        fontWeight: '500'
                      }}>
                        {((selectedClient as any).amount && (selectedClient as any).amount > 0) || ((selectedClient as any).packageAmount && (selectedClient as any).packageAmount > 0)
                          ? `₹${((selectedClient as any).amount || (selectedClient as any).packageAmount || 0).toLocaleString('en-IN')}`
                          : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{borderTop: '1px solid #4B5563', paddingTop: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{color: '#D1D5DB', fontSize: '14px', fontWeight: '500'}}>Status</span>
                      <div style={{
                        backgroundColor: selectedClient.status === 'active' ? '#10B981' : '#EF4444',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {selectedClient.status === 'active' ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{display: 'flex', justifyContent: 'center', marginTop: '32px'}}>
                <button 
                  onClick={() => setIsDialogOpen(false)}
                  style={{
                    backgroundColor: '#2563EB',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#1D4ED8';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#2563EB';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveClients;