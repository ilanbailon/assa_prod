import React from "react";
import { Requirement } from "./types";
import Icon from "./Icon";

interface StatsOverviewProps {
  requirements: Requirement[];
}

export default function StatsOverview({ requirements }: StatsOverviewProps) {
  const total = requirements.length;
  const pending = requirements.filter((r) => r.status === "PENDING").length;
  const approved = requirements.filter((r) => r.status === "APPROVED").length;
  const inProgress = requirements.filter((r) => r.status === "IN_PROGRESS").length;

  const stats = [
    {
      label: "TOTAL REQUERIMIENTOS",
      value: total,
      isHighlighted: true,
      icon: "assignment",
    },
    {
      label: "PENDIENTES",
      value: pending,
      isHighlighted: false,
      icon: "schedule",
      textColor: "text-amber-600",
    },
    {
      label: "EN DESARROLLO",
      value: inProgress,
      isHighlighted: false,
      icon: "trending_up",
      textColor: "text-blue-600",
    },
    {
      label: "APROBADOS",
      value: approved,
      isHighlighted: false,
      icon: "check_circle",
      textColor: "text-mosque",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`px-6 py-5 border rounded-xl flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
            stat.isHighlighted
              ? "bg-hint-of-green border-mosque/20 text-nordic"
              : "bg-white border-nordic/10 text-nordic"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-sf-pro text-[10px] md:text-[11px] font-bold tracking-wider text-nordic/60 uppercase">
              {stat.label}
            </span>
            <Icon
              name={stat.icon}
              className={`h-6 w-6 ${
                stat.isHighlighted ? "text-mosque" : stat.textColor || "text-nordic/50"
              }`}
            />
          </div>
          <span className="font-sf-pro text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
