"use client";

import React, { useState } from "react";
import { PersonalAssa } from "./types";
import Icon from "./Icon";

interface RequirementTableProps {
  allPersonal: PersonalAssa[];
  searchQuery: string;
  onCapatazClick: (capataz: string, tramo: string) => void;
  onSolicitudClick: (solicitud: string, tramo: string) => void;
}

export default function RequirementTable({
  allPersonal,
  searchQuery,
  onCapatazClick,
  onSolicitudClick,
}: RequirementTableProps) {
  const [subTab, setSubTab] = useState<"personal" | "requirements">("personal");
  const [filterTramo, setFilterTramo] = useState("All");
  const [filterCargo, setFilterCargo] = useState("All");

  // Get unique tramos and cargos from the dataset
  const tramosSet = new Set<string>();
  const cargosSet = new Set<string>();

  allPersonal.forEach((p) => {
    if (p.tramo) tramosSet.add(p.tramo.trim());
    if (p.cargo) cargosSet.add(p.cargo.trim());
  });

  const existingTramos = Array.from(tramosSet).sort((a, b) => a.localeCompare(b));
  const existingCargos = Array.from(cargosSet).sort((a, b) => a.localeCompare(b));

  // 1. Filter the entire dataset first
  const filtered = allPersonal.filter((p) => {
    // Filter by tramo
    if (filterTramo !== "All" && p.tramo !== filterTramo) return false;
    // Filter by cargo
    if (filterCargo !== "All" && p.cargo !== filterCargo) return false;
    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (p.nombres && p.nombres.toLowerCase().includes(q)) ||
        (p.codigo && p.codigo.toLowerCase().includes(q)) ||
        (p.dni && p.dni.toLowerCase().includes(q)) ||
        (p.cargo && p.cargo.toLowerCase().includes(q)) ||
        (p.capataz && p.capataz.toLowerCase().includes(q)) ||
        (p.solicitud && p.solicitud.toLowerCase().includes(q)) ||
        p.tramo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Separate active staff and requirements
  const activeStaff = filtered.filter((p) => p.estado === "Activo");
  const requirements = filtered.filter((p) => p.estado === "Requerimiento");

  // 2. Group Active Staff by Tramo -> Capataz
  const activeGrouped: Record<string, Record<string, number>> = {};
  activeStaff.forEach((emp) => {
    const t = emp.tramo;
    const c = emp.capataz || "Sin capataz asignado";
    if (!activeGrouped[t]) {
      activeGrouped[t] = {};
    }
    if (!activeGrouped[t][c]) {
      activeGrouped[t][c] = 0;
    }
    activeGrouped[t][c]++;
  });

  // 3. Group Requirements by Tramo -> Solicitud
  interface GroupedSolicitud {
    solicitud: string;
    capataz: string;
    totalCount: number;
    fechaSolicitud: string | null;
  }
  const reqGrouped: Record<string, Record<string, GroupedSolicitud>> = {};
  requirements.forEach((req) => {
    const t = req.tramo;
    const s = req.solicitud || "Sin Nro";
    const c = req.capataz || "Sin capataz asignado";
    const f = req.fechaSolicitud || null;

    if (!reqGrouped[t]) {
      reqGrouped[t] = {};
    }
    if (!reqGrouped[t][s]) {
      reqGrouped[t][s] = {
        solicitud: s,
        capataz: c,
        totalCount: 0,
        fechaSolicitud: f,
      };
    }
    reqGrouped[t][s].totalCount++;
  });

  const handleExportCSV = () => {
    let headers = "";
    let rows = "";
    let filename = "";

    if (subTab === "personal") {
      headers = "Tramo,Capataz,Total Personal\n";
      Object.entries(activeGrouped).forEach(([tramo, capataces]) => {
        Object.entries(capataces).forEach(([capataz, total]) => {
          rows += `"${tramo}","${capataz}","${total}"\n`;
        });
      });
      filename = `resumen_personal_activo_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      headers = "Tramo,Solicitud,Capataz,Total Requerimientos,Fecha Solicitud\n";
      Object.entries(reqGrouped).forEach(([tramo, solicitudes]) => {
        Object.values(solicitudes).forEach((sol) => {
          rows += `"${tramo}","${sol.solicitud}","${sol.capataz}","${sol.totalCount}","${sol.fechaSolicitud || ""}"\n`;
        });
      });
      filename = `resumen_requerimientos_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-5">
      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-nordic/15 shrink-0 bg-white px-2 pt-2 rounded-t-xl">
        <button
          onClick={() => setSubTab("personal")}
          className={`flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-bold border-b-2 transition-all outline-none cursor-pointer ${
            subTab === "personal"
              ? "border-mosque text-mosque font-extrabold"
              : "border-transparent text-nordic/50 hover:text-nordic"
          }`}
        >
          <Icon name="group" className="h-4.5 w-4.5" />
          <span>Personal Activo</span>
        </button>
        <button
          onClick={() => setSubTab("requirements")}
          className={`flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-bold border-b-2 transition-all outline-none cursor-pointer ${
            subTab === "requirements"
              ? "border-mosque text-mosque font-extrabold"
              : "border-transparent text-nordic/50 hover:text-nordic"
          }`}
        >
          <Icon name="assignment_ind" className="h-4.5 w-4.5" />
          <span>Requerimientos</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 border border-nordic/10 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
          {/* Tramo Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-sf-pro text-[10px] font-bold tracking-wider text-nordic/50 uppercase whitespace-nowrap">
              Frente (Tramo):
            </span>
            <select
              value={filterTramo}
              onChange={(e) => setFilterTramo(e.target.value)}
              className="bg-clear-day border border-nordic/10 text-xs font-bold text-nordic py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 transition-all w-full sm:w-48 cursor-pointer"
            >
              <option value="All">Todos los Frentes</option>
              {existingTramos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Cargo Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-sf-pro text-[10px] font-bold tracking-wider text-nordic/50 uppercase whitespace-nowrap">
              Puesto (Cargo):
            </span>
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className="bg-clear-day border border-nordic/10 text-xs font-bold text-nordic py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 transition-all w-full sm:w-48 cursor-pointer"
            >
              <option value="All">Todos los Puestos</option>
              {existingCargos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-mosque hover:text-mosque/80 hover:underline cursor-pointer outline-none transition-colors border border-mosque/10 px-4 py-2 rounded-lg bg-clear-day/40 w-full lg:w-auto"
        >
          <Icon name="download" className="h-4 w-4" />
          <span>Exportar Resumen CSV</span>
        </button>
      </div>

      {/* Main Grid divided by Tramo */}
      <div className="space-y-8">
        {subTab === "personal" ? (
          /* ==================== ACTIVE STAFF SUMMARY ==================== */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(activeGrouped).length === 0 ? (
              <div className="col-span-full bg-white border border-nordic/10 p-12 text-center rounded-xl shadow-sm text-nordic/40 font-semibold text-sm">
                No hay registros de personal activo con los filtros seleccionados.
              </div>
            ) : (
              Object.entries(activeGrouped).map(([tramoName, capataces]) => (
                <div
                  key={tramoName}
                  className="bg-white border border-nordic/10 rounded-xl shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Tramo Header */}
                  <div className="bg-nordic text-clear-day px-5 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Icon name="lan" className="h-5 w-5 text-hint-of-green" />
                      <h3 className="font-sf-pro font-extrabold text-sm md:text-base tracking-tight text-white">
                        {tramoName}
                      </h3>
                    </div>
                    <span className="bg-mosque text-clear-day text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {Object.values(capataces).reduce((a, b) => a + b, 0)} trabajadores
                    </span>
                  </div>

                  {/* Capataces List */}
                  <div className="divide-y divide-nordic/5 flex-1">
                    <div className="px-5 py-2.5 bg-clear-day/40 flex justify-between text-[9px] font-extrabold text-nordic/45 uppercase tracking-wider">
                      <span>Capataz / Encargado</span>
                      <span>Total Personal</span>
                    </div>

                    {Object.entries(capataces).map(([capatazName, total]) => (
                      <button
                        key={capatazName}
                        onClick={() => onCapatazClick(capatazName, tramoName)}
                        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-clear-day/40 transition-all cursor-pointer group outline-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-hint-of-green/40 text-nordic font-extrabold text-xs flex items-center justify-center border border-mosque/10 transition-transform group-hover:scale-105">
                            {capatazName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs md:text-sm font-bold text-nordic group-hover:text-mosque transition-colors">
                              {capatazName}
                            </span>
                            <p className="text-[10px] text-nordic/40 font-bold uppercase tracking-wider mt-0.5">
                              Haga clic para ver detalle
                            </p>
                          </div>
                        </div>
                        <span className="bg-clear-day border border-nordic/15 text-nordic font-extrabold px-3 py-1 rounded-lg text-xs md:text-sm group-hover:bg-mosque group-hover:text-clear-day group-hover:border-mosque transition-all shadow-sm">
                          {total} {total === 1 ? "persona" : "personas"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ==================== REQUIREMENTS SUMMARY ==================== */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(reqGrouped).length === 0 ? (
              <div className="col-span-full bg-white border border-nordic/10 p-12 text-center rounded-xl shadow-sm text-nordic/40 font-semibold text-sm">
                No hay solicitudes de requerimientos registradas con los filtros seleccionados.
              </div>
            ) : (
              Object.entries(reqGrouped).map(([tramoName, solicitudes]) => (
                <div
                  key={tramoName}
                  className="bg-white border border-nordic/10 rounded-xl shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Tramo Header */}
                  <div className="bg-nordic text-clear-day px-5 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Icon name="assignment" className="h-5 w-5 text-hint-of-green" />
                      <h3 className="font-sf-pro font-extrabold text-sm md:text-base tracking-tight text-white">
                        {tramoName}
                      </h3>
                    </div>
                    <span className="bg-mosque text-clear-day text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {Object.keys(solicitudes).length} solicitudes
                    </span>
                  </div>

                  {/* Solicitudes List */}
                  <div className="divide-y divide-nordic/5 flex-1">
                    <div className="px-5 py-2.5 bg-clear-day/40 flex justify-between text-[9px] font-extrabold text-nordic/45 uppercase tracking-wider">
                      <span>Nro. Solicitud & Capataz</span>
                      <span>Total Requerido</span>
                    </div>

                    {Object.values(solicitudes).map((sol) => (
                      <button
                        key={sol.solicitud}
                        onClick={() => onSolicitudClick(sol.solicitud, tramoName)}
                        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-clear-day/40 transition-all cursor-pointer group outline-none"
                      >
                        <div className="space-y-1">
                          <span className="font-mono text-xs md:text-sm font-extrabold text-nordic group-hover:text-mosque transition-colors">
                            {sol.solicitud}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-nordic/45 font-bold uppercase">
                              Capataz: {sol.capataz}
                            </span>
                            {sol.fechaSolicitud && (
                              <span className="text-[10px] text-nordic/35 font-bold">
                                &bull; {new Date(sol.fechaSolicitud).toLocaleDateString("es-ES")}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="bg-clear-day border border-nordic/15 text-nordic font-extrabold px-3 py-1 rounded-lg text-xs md:text-sm group-hover:bg-mosque group-hover:text-clear-day group-hover:border-mosque transition-all shadow-sm">
                          {sol.totalCount} {sol.totalCount === 1 ? "persona" : "personas"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
