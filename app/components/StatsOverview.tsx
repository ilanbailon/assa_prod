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
          isHighlighted: true,
          icon: "widgets",
        },
        {
          label: "Insumos Recibidos en Almacén",
          value: `${totalRequirementsCount} de ${cargoCount}`,
          isHighlighted: false,
          icon: "warehouse",
          textColor: "text-mosque",
        },
      ]
    : [
        {
          label: "Personal Activo",
          value: activeStaffCount,
          isHighlighted: true,
          icon: "group",
        },
        {
          label: "Personal Requerido",
          value: totalRequirementsCount,
          isHighlighted: false,
          icon: "assignment_ind",
          textColor: "text-mosque",
        },
      ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`px-4 py-4 md:px-6 md:py-5 border rounded-xl flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
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
              className={`h-5 w-5 md:h-6 md:w-6 ${
                stat.isHighlighted ? "text-mosque" : stat.textColor || "text-nordic/50"
              }`}
            />
          </div>
          <span className="font-sf-pro text-xl md:text-3xl font-extrabold tracking-tight mt-1">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
