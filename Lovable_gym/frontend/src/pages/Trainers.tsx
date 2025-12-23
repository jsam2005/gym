import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RefreshCw, Search } from "lucide-react";
import { clientAPI } from "@/lib/api";
import { transformClientList } from "@/utils/clientTransform";
import { Client, GymTable } from "@/components/GymTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Trainers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchTrainers = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        const response = await clientAPI.getTrainers();
        if (response.data?.success) {
          const transformed = transformClientList(response.data.clients);
          setClients(transformed);
        } else {
          setClients([]);
        }
      } catch (error) {
        console.error("Error fetching trainers:", error);
        setClients([]);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchTrainers(false);
  }, [fetchTrainers]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchTrainers(false);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchTrainers]);

  useEffect(() => {
    const handleClientUpdate = () => {
      fetchTrainers(false);
    };

    window.addEventListener("clientUpdated", handleClientUpdate);
    return () => window.removeEventListener("clientUpdated", handleClientUpdate);
  }, [fetchTrainers]);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact.includes(searchTerm) ||
      String(client.deviceId ?? client.esslUserId ?? client.id).includes(searchTerm)
  );

  const handleView = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    navigate(`/clients/edit/${client.id}`);
  };

  const handleRefresh = () => fetchTrainers(true);

  return (
    <div className="w-full p-4 flex justify-center">
      <div className="w-full max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Trainer List</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search trainers..."
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
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading trainers...</div>
          </div>
        ) : (
          <GymTable clients={filteredClients} onView={handleView} onEdit={handleEdit} />
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent
            className="w-full max-w-4xl"
            style={{
              backgroundColor: "#1F2937",
              borderRadius: "16px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
              border: "1px solid #374151",
              color: "#F9FAFB",
              maxWidth: "900px",
              width: "auto",
              padding: "0",
            }}
          >
            <DialogHeader>
              <DialogTitle
                style={{
                  color: "#F9FAFB",
                  fontSize: "24px",
                  fontWeight: "600",
                  textAlign: "center",
                  marginBottom: "32px",
                }}
              >
                Trainer Details
              </DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div style={{ padding: "30px", width: "100%", boxSizing: "border-box" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "40px",
                    marginBottom: "40px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#374151",
                      padding: "24px",
                      borderRadius: "12px",
                      border: "1px solid #4B5563",
                    }}
                  >
                    <h3
                      style={{
                        color: "#F9FAFB",
                        fontSize: "18px",
                        fontWeight: "600",
                        marginBottom: "20px",
                        textAlign: "left",
                      }}
                    >
                      Personal Information
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                      <div>
                        <label
                          style={{
                            color: "#D1D5DB",
                            fontSize: "14px",
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          Name
                        </label>
                        <div
                          style={{
                            backgroundColor: "#4B5563",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "16px",
                            color: "#F9FAFB",
                            fontWeight: "500",
                          }}
                        >
                          {selectedClient.name}
                        </div>
                      </div>
                      <div>
                        <label
                          style={{
                            color: "#D1D5DB",
                            fontSize: "14px",
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          Contact
                        </label>
                        <div
                          style={{
                            backgroundColor: "#4B5563",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "16px",
                            color: "#F9FAFB",
                            fontWeight: "500",
                          }}
                        >
                          {selectedClient.contact}
                        </div>
                      </div>
                      <div>
                        <label
                          style={{
                            color: "#D1D5DB",
                            fontSize: "14px",
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          User ID
                        </label>
                        <div
                          style={{
                            backgroundColor: "#4B5563",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "16px",
                            color: "#F9FAFB",
                            fontWeight: "500",
                          }}
                        >
                          {selectedClient.deviceId || selectedClient.esslUserId || selectedClient.id}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#374151",
                      padding: "24px",
                      borderRadius: "12px",
                      border: "1px solid #4B5563",
                    }}
                  >
                    <h3
                      style={{
                        color: "#F9FAFB",
                        fontSize: "18px",
                        fontWeight: "600",
                        marginBottom: "20px",
                        textAlign: "left",
                      }}
                    >
                      Membership Information
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                        marginBottom: "20px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            color: "#D1D5DB",
                            fontSize: "14px",
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          Billing Date
                        </label>
                        <div
                          style={{
                            backgroundColor: "#4B5563",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "16px",
                            color: "#F9FAFB",
                            fontWeight: "500",
                          }}
                        >
                          {selectedClient.billingDate}
                        </div>
                      </div>
                      <div>
                        <label
                          style={{
                            color: "#D1D5DB",
                            fontSize: "14px",
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "500",
                          }}
                        >
                          Duration
                        </label>
                        <div
                          style={{
                            backgroundColor: "#4B5563",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "16px",
                            color: "#F9FAFB",
                            fontWeight: "500",
                          }}
                        >
                          {selectedClient.duration}
                        </div>
                      </div>
                    </div>
                    <div style={{ borderTop: "1px solid #4B5563", paddingTop: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#D1D5DB", fontSize: "14px", fontWeight: "500" }}>Status</span>
                        <div
                          style={{
                            backgroundColor:
                              selectedClient.status === "active"
                                ? "#10B981"
                                : selectedClient.status === "suspended"
                                  ? "#F59E0B"
                                  : "#EF4444",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          {selectedClient.status === "active"
                            ? "Active"
                            : selectedClient.status === "suspended"
                              ? "Suspended"
                              : "Inactive"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    style={{
                      backgroundColor: "#2563EB",
                      color: "white",
                      padding: "12px 24px",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "500",
                      cursor: "pointer",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = "#1D4ED8";
                      (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = "#2563EB";
                      (e.target as HTMLButtonElement).style.transform = "translateY(0)";
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
    </div>
  );
};

export default Trainers;

