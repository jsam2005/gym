import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    active: "text-green-400",
    inactive: "text-red-400", 
  };

  const labels = {
    active: "Active",
    inactive: "Inactive", 
  };

  return (
    <span
      className={cn(
        "text-sm font-medium",
        variants[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}