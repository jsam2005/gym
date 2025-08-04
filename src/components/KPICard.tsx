import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import "./kpi-card.css";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon | React.ReactElement;
  variant?: "default" | "success" | "warning" | "danger";
  subtitle?: string;
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  icon, 
  variant = "default", 
  subtitle,
  className 
}: KPICardProps) {
  const iconClasses = {
    default: "icon-default",
    success: "icon-success",
    warning: "icon-warning", 
    danger: "icon-danger",
  };

  const iconBgClasses = {
    default: "icon-bg-default",
    success: "icon-bg-success",
    warning: "icon-bg-warning",
    danger: "icon-bg-danger",
  };

  // Handle both LucideIcon components and React elements
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, {
        className: `h-6 w-6 transition-colors ${iconClasses[variant]}`
      });
    } else {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className={`h-6 w-6 transition-colors ${iconClasses[variant]}`} />;
    }
  };

  return (
    <div className={cn("kpi-card group", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="kpi-title">
            {title}
          </p>
          <p className="kpi-value">
            {value}
          </p>
          {subtitle && (
            <p className="kpi-subtitle">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn("icon-container", iconBgClasses[variant])}>
          {renderIcon()}
        </div>
      </div>
    </div>
  );
}











