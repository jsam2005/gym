import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { GymTable, Client } from "@/components/GymTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clientAPI } from "@/lib/api";

const AllClients = () => {
  console.log("AllClients component is rendering");
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const limit = 25;

  // Fetch clients from API - extracted to be reusable
  const fetchClients = async (isRefresh = false, overridePage?: number, overrideSearch?: string) => {
      try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
        const effectivePage = overridePage ?? page;
        const effectiveSearch = overrideSearch ?? searchTerm;
        const response = await clientAPI.getAll({
          page: effectivePage,
          limit,
          search: effectiveSearch ? effectiveSearch : undefined,
        });
        if (response.data.success) {
          // Transform API data to match the expected format
        // Transform and deduplicate clients
        const transformedClients = response.data.clients
          .map((client: any, index: number) => ({
            id: client.id || client._id || `client-${index}`, // EmployeeId from database (unique)
            deviceId: client.esslUserId || client.employeeCodeInDevice || '', // Device ID (EmployeeCodeInDevice)
            name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown',
            contact: client.phone || '',
            status: client.status || 'inactive',
            billingDate: client.packageStartDate 
              ? new Date(client.packageStartDate).toLocaleDateString('en-GB', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
                })
              : 'N/A',
            duration: (client.months && Number(client.months) > 0)
              ? `${Number(client.months)} month${Number(client.months) > 1 ? 's' : ''}`
              : (client.packageType || 'N/A')
          }))
          // Remove duplicates based on EmployeeId (id field)
          .filter((client: any, index: number, self: any[]) => 
            index === self.findIndex((c: any) => c.id === client.id)
          )
          // Always show ascending order by User ID (deviceId) then name
          .sort((a: any, b: any) => {
            const aId = a.deviceId ?? a.id ?? '';
            const bId = b.deviceId ?? b.id ?? '';
            const aNum = Number(aId);
            const bNum = Number(bId);
            const aNumOk = Number.isFinite(aNum);
            const bNumOk = Number.isFinite(bNum);
            if (aNumOk && bNumOk && aNum !== bNum) return aNum - bNum;
            const aStr = String(aId);
            const bStr = String(bId);
            if (aStr !== bStr) return aStr.localeCompare(bStr);
            return String(a.name || '').localeCompare(String(b.name || ''));
          });
          setClients(transformedClients);
          if (response.data.pagination?.pages) {
            setPages(Number(response.data.pagination.pages) || 1);
          } else {
            setPages(1);
          }
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        setClients([]);
        setPages(1);
      } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
      }
    };

  // Initial fetch on component mount
  useEffect(() => {
    fetchClients(false);
  }, []);

  // Server-side search: debounce and reset to page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchClients(false, 1, searchTerm);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Page change fetch
  useEffect(() => {
    fetchClients(false, page, searchTerm);
  }, [page]);

  const filteredClients = clients;

  const handleView = async (client: Client) => {
    try {
      // Fetch fresh data from API to get latest updates
      const response = await clientAPI.getById(String(client.id));
      if (response.data.success && response.data.client) {
        const freshClient = response.data.client;
        
        // Debug: Log the API response to see what we're getting
        console.log('🔍 API Response for client:', {
          id: freshClient.id,
          bloodGroup: freshClient.bloodGroup,
          packageAmount: freshClient.packageAmount,
          totalAmount: freshClient.totalAmount,
        });
        
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
          // Include GymClients data - explicitly check for null/undefined/empty
          bloodGroup: (freshClient.bloodGroup && freshClient.bloodGroup.trim() !== '') ? freshClient.bloodGroup : null,
          amount: ((freshClient.packageAmount && freshClient.packageAmount > 0) || (freshClient.totalAmount && freshClient.totalAmount > 0)) 
            ? (freshClient.packageAmount || freshClient.totalAmount) 
            : null,
          packageAmount: ((freshClient.packageAmount && freshClient.packageAmount > 0) || (freshClient.totalAmount && freshClient.totalAmount > 0)) 
            ? (freshClient.packageAmount || freshClient.totalAmount) 
            : null,
          amountPaid: (freshClient.amountPaid && freshClient.amountPaid > 0) ? freshClient.amountPaid : null,
          pendingAmount: (freshClient.pendingAmount !== undefined && freshClient.pendingAmount !== null) ? freshClient.pendingAmount : null,
          months: freshClient.months || null,
          trainer: (freshClient.trainer && freshClient.trainer.trim() !== '') ? freshClient.trainer : null,
          preferredTimings: (freshClient.preferredTimings && freshClient.preferredTimings.trim() !== '') ? freshClient.preferredTimings : null,
          paymentMode: (freshClient.paymentMode && freshClient.paymentMode.trim() !== '') ? freshClient.paymentMode : null,
        };
        
        console.log('🔍 Updated client data:', {
          bloodGroup: updatedClient.bloodGroup,
          amount: updatedClient.amount,
          packageAmount: updatedClient.packageAmount,
        });
        
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
      setClients(clients.filter(c => c.id !== client.id));
    }
  };

  const handleAddClient = () => {
    navigate("/clients/add");
  };

  const handleEdit = (client: Client) => {
    navigate(`/clients/edit/${client.id}`);
  };

  const handleRefresh = () => {
    fetchClients(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">All Clients List</h1>
        
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search clients..."
              className="pl-10"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button 
            onClick={handleAddClient}
            className="bg-sidebar-active hover:bg-sidebar-active/90"
          >
            Add New Client
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-400">Loading clients...</div>
        </div>
      ) : (
        <>
          <GymTable 
            clients={filteredClients}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {pages}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1 || loading || refreshing} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Prev
              </Button>
              <Button variant="outline" disabled={page >= pages || loading || refreshing} onClick={() => setPage(p => Math.min(pages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        </>
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
                        {selectedClient.name.split(' ')[0] || ''}
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
                        {selectedClient.billingDate}
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
                        {((selectedClient as any).bloodGroup && (selectedClient as any).bloodGroup.trim() !== '') ? (selectedClient as any).bloodGroup : ''}
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

export default AllClients;