import React from "react";
import Icon from "./Icon";

interface StatsOverviewProps {
  activeStaffCount: number;
  totalRequirementsCount: number;
  tramoCount: number;
  cargoCount: number;
  isMaterials?: boolean;
}

export default function StatsOverview({
  activeStaffCount,
  totalRequirementsCount,
  tramoCount,
  cargoCount,
  isMaterials = false,
}: StatsOverviewProps) {
  const stats = isMaterials
    ? [
        {
          label: "Solicitudes de Materiales",
          value: activeStaffCount,
          icon: "widgets",
        },
        {
          label: "Insumos Recibidos en Almacén",
          value: `${totalRequirementsCount} de ${cargoCount}`,
          icon: "warehouse",
        },
      ]
    : [
        {
          label: "Personal Activo",
          value: activeStaffCount,
          icon: "group",
        },
        {
          label: "Personal Requerido",
          value: totalRequirementsCount,
          icon: "assignment_ind",
        },
      ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="px-4 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 flex items-center justify-between transition-colors hover:bg-slate-100/70"
        >
          <div className="flex flex-col">
            <span className="font-sf-pro text-[9px] font-bold tracking-wider text-slate-500 uppercase">
              {stat.label}
            </span>
            <span className="font-mono text-base md:text-lg font-extrabold tracking-tight mt-0.5 text-slate-900">
              {stat.value}
            </span>
          </div>
          <Icon
            name={stat.icon}
            className="h-5 w-5 text-slate-400"
          />
        </div>
      ))}
    </div>
  );
}
