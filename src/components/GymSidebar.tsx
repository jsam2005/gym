import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, UserCheck, UserX, UserPlus, Package, DollarSign, User, Plus, ChevronDown, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Logo } from "./Logo";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Packages", path: "/packages" },
  { icon: CreditCard, label: "Billing", path: "/billing" },
];

const clientSubItems = [
  { icon: Users, title: "All Clients", url: "/clients" },
  { icon: UserCheck, title: "Active Clients", url: "/clients/active" },
  { icon: UserX, title: "Inactive Clients", url: "/clients/inactive" },
  { icon: UserPlus, title: "Add Client", url: "/clients/add" },
];

const GymLogo = () => (
  <div className="flex items-center gap-3 p-6 border-b border-white/20">
    <Logo size="md" className="text-white" />
    <div>
      <span className="text-white font-bold text-lg">M★S Fitness</span>
      <p className="text-xs text-gray-300">Studio</p>
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
    <div className="w-64 h-screen bg-sidebar border-r border-border flex flex-col">
      <GymLogo />
      
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200",
                  isActive(item.path)
                    ? "bg-sidebar-active text-sidebar-active-foreground shadow-md"
                    : "text-white hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
          
          {/* All Clients Collapsible Section - Moved below Dashboard */}
          <li>
            <Collapsible open={isClientsOpen} onOpenChange={setIsClientsOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors rounded-lg mx-2",
                    isActive("/clients") && "bg-amber-800 text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <span>Clients</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isClientsOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                {clientSubItems.map((item, index) => (
                  <NavLink
                    key={index}
                    to={item.url}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-8 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors rounded-lg mx-2",
                        isActive && "bg-amber-800 text-white border-l-4 border-amber-600"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <NavLink
          to="/profile"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
            isActive("/profile")
              ? "bg-sidebar-active text-sidebar-active-foreground shadow-md"
              : "text-white hover:bg-white/10 hover:text-white"
          )}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </div>
    </div>
  );
}





