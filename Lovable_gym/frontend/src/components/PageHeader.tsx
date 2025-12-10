import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export function PageHeader({ 
  title, 
  showSearch = true, 
  searchPlaceholder = "Search...",
  onSearch,
  actionButton 
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      
      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        )}
        
        {actionButton && (
          <Button 
            onClick={actionButton.onClick}
            className="bg-sidebar-active hover:bg-sidebar-active/90"
          >
            {actionButton.label}
          </Button>
        )}
      </div>
    </div>
  );
}