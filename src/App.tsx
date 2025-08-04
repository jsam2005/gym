import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GymSidebar } from "@/components/GymSidebar";
import Dashboard from "./pages/Dashboard";
import AllClients from "./pages/AllClients";
import ActiveClients from "./pages/ActiveClients";
import InactiveClients from "./pages/InactiveClients";
import AddClient from "./pages/AddClient";
import Packages from "./pages/Packages";
import Billing from "./pages/Billing";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen w-full">
          <GymSidebar />
          <main className="flex-1 overflow-auto bg-white text-foreground main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<AllClients />} />
              <Route path="/clients/active" element={<ActiveClients />} />
              <Route path="/clients/inactive" element={<InactiveClients />} />
              <Route path="/clients/add" element={<AddClient />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

