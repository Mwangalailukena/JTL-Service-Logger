"use client";

import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    isUp: boolean;
  };
  icon: LucideIcon;
  description: string;
  color?: "blue" | "green" | "amber" | "purple";
}

export function StatCard({ title, value, trend, icon: Icon, description, color = "blue" }: StatCardProps) {
  const colorMap = {
    blue: "bg-brand-50 text-brand-600 border-brand-100",
    green: "bg-success-50 text-success-600 border-success-50",
    amber: "bg-warning-50 text-warning-600 border-warning-50",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div className="card-base p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="metadata-label mb-1.5">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span className={cn(
                "flex items-center text-xs font-bold",
                trend.isUp ? "text-success-600" : "text-danger-600"
              )}>
                {trend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {trend.value}
              </span>
              <span className="text-[10px] text-surface-500 font-bold uppercase tracking-tighter">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn("rounded-lg border p-2.5 shadow-subtle", colorMap[color])}>
          <Icon size={20} />
        </div>
      </div>
      
      <div className="mt-5 border-t border-surface-100 pt-4">
        <p className="text-[11px] text-surface-500 font-medium leading-relaxed italic">{description}</p>
      </div>
    </div>
  );
}