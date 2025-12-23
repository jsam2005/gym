import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, UserCheck, UserX, Package, DollarSign, User, ChevronDown, CreditCard, Fingerprint, Edit, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Logo } from "./Logo";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Packages", path: "/packages" },
  { icon: CreditCard, label: "Billing", path: "/billing" },
  { icon: Fingerprint, label: "Biometric Access", path: "/biometric" },
];

const clientSubItems = [
  { icon: Users, title: "All Clients", url: "/clients" },
  { icon: UserCheck, title: "Active Clients", url: "/clients/active" },
  { icon: UserX, title: "Inactive Clients", url: "/clients/inactive" },
  { icon: UserCog, title: "Trainers", url: "/clients/trainers" },
];

const GymLogo = () => (
  <div 
    className="flex items-center gap-3 p-6 border-b border-gray-200 relative overflow-hidden" 
    style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 animate-pulse"></div>
    <div className="relative z-10 flex items-center gap-3">
      <div className="relative">
        <Logo size="md" className="text-white drop-shadow-lg" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
      </div>
      <div>
        <span 
          className="font-bold text-lg bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          M★S Fitness
        </span>
        <p className="text-xs text-cyan-100 font-medium tracking-wider">STUDIO</p>
      </div>
    </div>
  </div>
);

export function GymSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isClientsOpen, setIsClientsOpen] = useState(
    currentPath.startsWith("/clients")
  );

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <div 
      className="w-64 h-screen border-r border-gray-300 flex flex-col shadow-2xl shadow-gray-900/20 relative overflow-hidden" 
      style={{
        background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
        color: 'white',
        padding: '0 8px 8px 8px'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-blue-600/10"></div>
      <GymLogo />
      
      <nav className="flex-1 px-6 py-8 overflow-y-auto relative z-10">
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                  isActive(item.path)
                    ? "shadow-lg transform scale-105"
                    : "hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:shadow-md hover:transform hover:scale-102"
                )}
                style={{
                  color: 'white',
                  background: isActive(item.path) 
                    ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' 
                    : 'transparent',
                  boxShadow: isActive(item.path) 
                    ? '0 8px 25px rgba(6, 182, 212, 0.4)' 
                    : 'none',
                  border: isActive(item.path) ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent'
                }}
              >
                {isActive(item.path) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 animate-pulse"></div>
                )}
                <div className="relative z-10 flex items-center gap-4">
                  <item.icon 
                    className="w-5 h-5 text-white drop-shadow-sm transition-all duration-300"
                  />
                  <span 
                    className="font-semibold text-white transition-all duration-300"
                  >
                    {item.label}
                  </span>
                </div>
              </NavLink>
            </li>
          ))}
          
          {/* Edit Client Collapsible Section */}
          <li>
            <Collapsible open={isClientsOpen} onOpenChange={setIsClientsOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center justify-between w-full px-6 py-4 text-left transition-all duration-300 rounded-xl group relative overflow-hidden"
                  style={{
                    color: 'white',
                    background: isActive("/clients") 
                      ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' 
                      : 'transparent',
                    boxShadow: isActive("/clients") 
                      ? '0 8px 25px rgba(6, 182, 212, 0.4)' 
                      : 'none',
                    border: isActive("/clients") ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent'
                  }}
                >
                  {isActive("/clients") && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 animate-pulse"></div>
                  )}
                  <div className="relative z-10 flex items-center gap-4">
                    <Edit 
                      className="h-5 w-5 text-white drop-shadow-sm transition-all duration-300"
                    />
                    <span 
                      className="font-semibold text-white transition-all duration-300"
                    >
                      Clients
                    </span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-white transition-all duration-300",
                      isClientsOpen && "rotate-180"
                    )} 
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-4 ml-6">
                {clientSubItems.map((item, index) => (
                  <NavLink
                    key={index}
                    to={item.url}
                    className="flex items-center gap-4 px-5 py-3 text-sm transition-all duration-300 rounded-lg group relative overflow-hidden hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:shadow-md"
                    style={{
                      color: 'white',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <div className="relative z-10 flex items-center gap-4">
                      <item.icon className="h-4 w-4 text-white transition-colors duration-300" />
                      <span className="text-white font-medium transition-colors duration-300">
                        {item.title}
                      </span>
                    </div>
                  </NavLink>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </li>
        </ul>
      </nav>

      <div className="p-6 border-t border-gray-600 relative z-10" style={{background: 'linear-gradient(180deg, #111827 0%, #1f2937 100%)'}}>
        <NavLink
          to="/profile"
          className="flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden"
          style={{
            color: 'white',
            background: isActive("/profile") 
              ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' 
              : 'transparent',
            boxShadow: isActive("/profile") 
              ? '0 8px 25px rgba(6, 182, 212, 0.4)' 
              : 'none',
            border: isActive("/profile") ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent'
          }}
        >
          {isActive("/profile") && (
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 animate-pulse"></div>
          )}
          <div className="relative z-10 flex items-center gap-4">
            <User 
              className="w-5 h-5 text-white drop-shadow-sm transition-all duration-300"
            />
            <span 
              className="font-semibold text-white transition-all duration-300"
            >
              Profile
            </span>
          </div>
        </NavLink>
      </div>
    </div>
  );
}




