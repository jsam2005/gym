import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Outlet } from "react-router-dom";
import { GymSidebar } from "@/components/GymSidebar";
import Dashboard from "./pages/Dashboard";
import AllClients from "./pages/AllClients";
import ActiveClients from "./pages/ActiveClients";
import InactiveClients from "./pages/InactiveClients";
import AddClient from "./pages/AddClient";
import EditClient from "./pages/EditClient";
import Packages from "./pages/Packages";
import Billing from "./pages/Billing";
import PendingMembers from "./pages/PendingMembers";
import Profile from "./pages/Profile";
import BiometricAccess from "./pages/BiometricAccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="flex min-h-screen w-full">
        <GymSidebar />
        <main className="flex-1 overflow-auto bg-transparent text-foreground main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Outlet />}>
              <Route index element={<AllClients />} />
              <Route path="active" element={<ActiveClients />} />
              <Route path="inactive" element={<InactiveClients />} />
              <Route path="add" element={<AddClient />} />
              <Route path="edit/:id" element={<EditClient />} />
            </Route>
            <Route path="/packages" element={<Packages />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/pending-members" element={<PendingMembers />} />
            <Route path="/biometric" element={<BiometricAccess />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

