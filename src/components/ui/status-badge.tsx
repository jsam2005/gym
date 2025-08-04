import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    inactive: "bg-red-100 text-red-800 border-red-200", 
  };

  const labels = {
    active: "Active",
    inactive: "Inactive", 
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        variants[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}