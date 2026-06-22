"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [localMobileSearch, setLocalMobileSearch] = useState(searchQuery);

  const [subTab, setSubTab] = useState<"summary" | "personal" | "requirements">("summary");
  const [filterTramo, setFilterTramo] = useState("All");
  const [filterCargo, setFilterCargo] = useState("All");

  useEffect(() => {
    setLocalMobileSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (localMobileSearch !== searchQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (localMobileSearch.trim()) {
          params.set("search", localMobileSearch.trim());
        } else {
          params.delete("search");
        }
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [localMobileSearch, searchQuery, router, pathname, searchParams]);

  // Local pagination for the flat Active Personal list (10 items per page)
  const [personalPage, setPersonalPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination page when filters, tab or search query changes
  useEffect(() => {
    setPersonalPage(1);
  }, [searchQuery, filterTramo, filterCargo, subTab]);

  // Get unique tramos and cargos from the dataset to feed filter dropdowns
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

  // 2. Group Active Staff for the "Resumen de Personal" tab (Tramo -> Capataz)
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

  // 3. Group Requirements for the "Requerimientos" tab (Tramo -> Solicitud)
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

  // Flat Active Staff Pagination Calculations
  const totalPersonalCount = activeStaff.length;
  const totalPersonalPages = Math.ceil(totalPersonalCount / itemsPerPage) || 1;
  const startPersonalItem = totalPersonalCount === 0 ? 0 : (personalPage - 1) * itemsPerPage + 1;
  const endPersonalItem = Math.min(personalPage * itemsPerPage, totalPersonalCount);
  const paginatedActiveStaff = activeStaff.slice(
    (personalPage - 1) * itemsPerPage,
    personalPage * itemsPerPage
  );

  const handleExportCSV = () => {
    let headers = "";
    let rows = "";
    let filename = "";

    if (subTab === "summary") {
      headers = "Tramo,Capataz,Total Personal\n";
      Object.entries(activeGrouped).forEach(([tramo, capataces]) => {
        Object.entries(capataces).forEach(([capataz, total]) => {
          rows += `"${tramo}","${capataz}","${total}"\n`;
        });
      });
      filename = `resumen_personal_capataz_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (subTab === "personal") {
      headers = "Código,DNI,Apellidos y Nombres,Cargo,Capataz,Tramo,Fecha Ingreso\n";
      activeStaff.forEach((s) => {
        rows += `"${s.codigo || ""}","${s.dni || ""}","${s.nombres || ""}","${s.cargo}","${s.capataz || ""}","${s.tramo}","${s.fecing || ""}"\n`;
      });
      filename = `personal_activo_detallado_${new Date().toISOString().slice(0, 10)}.csv`;
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
      {/* Mobile-Only Search Input */}
      <div className="relative sm:hidden block w-full">
        <input
          type="text"
          placeholder="Buscar personal o requerimientos..."
          value={localMobileSearch}
          onChange={(e) => setLocalMobileSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 px-3.5 py-2 pl-9 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-mosque/40 outline-none transition-all placeholder:text-slate-400 font-semibold"
        />
        <Icon
          name="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4"
        />
        {localMobileSearch && (
          <button
            onClick={() => setLocalMobileSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer outline-none"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sub-Tabs Navigation (Excel style tab sheets) */}
      <div className="flex border-b border-slate-200 shrink-0 bg-slate-100 px-2 pt-1.5 overflow-x-auto scrollbar-none rounded-t-lg">
        {/* Tab 1: Resumen de Personal */}
        <button
          onClick={() => setSubTab("summary")}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-all outline-none cursor-pointer border-t border-x border-transparent whitespace-nowrap rounded-t ${
            subTab === "summary"
              ? "bg-white border-slate-200 border-t-2 border-t-mosque text-mosque font-extrabold"
              : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
          }`}
        >
          <Icon name="bar_chart" className="h-4 w-4" />
          <span>Resumen de Personal</span>
        </button>

        {/* Tab 2: Personal Activo (Flat list) */}
        <button
          onClick={() => setSubTab("personal")}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-all outline-none cursor-pointer border-t border-x border-transparent whitespace-nowrap rounded-t ${
            subTab === "personal"
              ? "bg-white border-slate-200 border-t-2 border-t-mosque text-mosque font-extrabold"
              : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
          }`}
        >
          <Icon name="group" className="h-4 w-4" />
          <span>Personal Activo</span>
        </button>

        {/* Tab 3: Requerimientos */}
        <button
          onClick={() => setSubTab("requirements")}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-all outline-none cursor-pointer border-t border-x border-transparent whitespace-nowrap rounded-t ${
            subTab === "requirements"
              ? "bg-white border-slate-200 border-t-2 border-t-mosque text-mosque font-extrabold"
              : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
          }`}
        >
          <Icon name="assignment_ind" className="h-4 w-4" />
          <span>Requerimientos</span>
        </button>
      </div>

      {/* Filters Bar (Excel toolbar style) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-2.5 border border-slate-200 rounded">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
          {/* Tramo Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-sf-pro text-[9px] font-bold tracking-wider text-slate-500 uppercase whitespace-nowrap">
              Frente (Tramo):
            </span>
            <select
              value={filterTramo}
              onChange={(e) => setFilterTramo(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold text-slate-800 py-1 pl-2 pr-6 rounded outline-none focus:ring-1 focus:ring-mosque/40 transition-all w-full sm:w-44 cursor-pointer"
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
            <span className="font-sf-pro text-[9px] font-bold tracking-wider text-slate-500 uppercase whitespace-nowrap">
              Puesto (Cargo):
            </span>
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold text-slate-800 py-1 pl-2 pr-6 rounded outline-none focus:ring-1 focus:ring-mosque/40 transition-all w-full sm:w-44 cursor-pointer"
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

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-mosque hover:text-mosque/80 hover:underline cursor-pointer outline-none transition-colors border border-mosque/10 px-3 py-1 rounded bg-hint-of-green/20 w-full lg:w-auto"
        >
          <Icon name="download" className="h-3.5 w-3.5" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {subTab === "summary" ? (
          /* ==================== 1. RESUMEN DE PERSONAL TAB ==================== */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(activeGrouped).length === 0 ? (
              <div className="col-span-full bg-white border border-slate-200 p-12 text-center rounded-xl shadow-sm text-slate-400 font-semibold text-sm">
                No hay registros de personal activo con los filtros seleccionados.
              </div>
            ) : (
              Object.entries(activeGrouped).map(([tramoName, capataces]) => (
                <div
                  key={tramoName}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="bg-nordic text-clear-day px-4 py-2 flex items-center justify-between shrink-0 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Icon name="lan" className="h-4 w-4 text-hint-of-green" />
                      <h3 className="font-sf-pro font-extrabold tracking-tight text-white">
                        {tramoName}
                      </h3>
                    </div>
                    <span className="bg-mosque text-clear-day text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                      {Object.values(capataces).reduce((a, b) => a + b, 0)}
                    </span>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <th className="border border-slate-200 px-3 py-1.5">Capataz / Encargado</th>
                          <th className="border border-slate-200 px-3 py-1.5 text-center w-[150px]">Total Personal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {Object.entries(capataces).map(([capatazName, total]) => (
                          <tr
                            key={capatazName}
                            onClick={() => onCapatazClick(capatazName, tramoName)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-800"
                          >
                            <td className="border border-slate-200 px-3 py-1.5 flex items-center gap-2">
                              <div className="h-5 w-5 rounded bg-emerald-50 text-emerald-800 font-extrabold text-[10px] flex items-center justify-center border border-emerald-200 shrink-0">
                                {capatazName.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="hover:underline">{capatazName}</span>
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center font-mono font-extrabold text-slate-700">
                              {total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List View */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {Object.entries(capataces).map(([capatazName, total]) => (
                      <div
                        key={capatazName}
                        onClick={() => onCapatazClick(capatazName, tramoName)}
                        className="flex items-center justify-between p-3 active:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-6 w-6 rounded bg-emerald-50 text-emerald-800 font-extrabold text-[9px] flex items-center justify-center border border-emerald-250 shrink-0">
                            {capatazName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-slate-800 font-bold">{capatazName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md font-mono">
                            {total} pers.
                          </span>
                          <Icon name="chevron_right" className="h-4 w-4 text-slate-350" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : subTab === "personal" ? (
          /* ==================== 2. PERSONAL ACTIVO (FLAT TABLE) TAB ==================== */
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase">
                    <th className="border border-slate-200 px-3 py-2 text-center w-[100px]">Código</th>
                    <th className="border border-slate-200 px-3 py-2 text-center w-[100px]">DNI</th>
                    <th className="border border-slate-200 px-3 py-2">Apellidos y Nombres</th>
                    <th className="border border-slate-200 px-3 py-2 text-center w-[150px]">Cargo / Puesto</th>
                    <th className="border border-slate-200 px-3 py-2">Capataz / Encargado</th>
                    <th className="border border-slate-200 px-3 py-2 text-center w-[120px]">Frente (Tramo)</th>
                    <th className="border border-slate-200 px-3 py-2 text-center w-[120px]">Fec. Ingreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-semibold text-slate-800 text-xs">
                  {paginatedActiveStaff.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-400 font-semibold">
                        No se encontraron trabajadores activos en esta búsqueda.
                      </td>
                    </tr>
                  ) : (
                    paginatedActiveStaff.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="border border-slate-200 px-3 py-1 text-center font-mono text-slate-400 text-[11px]">
                          {s.codigo || "-"}
                        </td>
                        <td className="border border-slate-200 px-3 py-1 text-center font-mono text-slate-600 text-[11px]">
                          {s.dni || "-"}
                        </td>
                        <td className="border border-slate-200 px-3 py-1 font-bold text-slate-900">
                          {s.nombres}
                        </td>
                        <td className="border border-slate-200 px-3 py-1 text-center">
                          <span className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200 text-[10px] font-bold">
                            {s.cargo}
                          </span>
                        </td>
                        <td className="border border-slate-200 px-3 py-1 text-slate-600">
                          {s.capataz || "-"}
                        </td>
                        <td className="border border-slate-200 px-3 py-1 text-center text-slate-600">
                          {s.tramo}
                        </td>
                        <td className="border border-slate-200 px-3 py-1 text-center font-mono text-[11px]">
                          {s.fecing
                            ? new Date(s.fecing).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden divide-y divide-slate-150">
              {paginatedActiveStaff.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 font-semibold text-xs">
                  No se encontraron trabajadores activos.
                </div>
              ) : (
                paginatedActiveStaff.map((s) => (
                  <div key={s.id} className="p-3.5 space-y-1.5 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        Cód: {s.codigo || "-"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        DNI: {s.dni || "-"}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {s.nombres}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="bg-slate-50 px-1.5 py-0.2 rounded text-slate-700 border border-slate-200 text-[9px] font-bold">
                        {s.cargo}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        &bull; {s.tramo}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>Capataz: {s.capataz || "-"}</span>
                      <span>
                        F. Ingreso:{" "}
                        {s.fecing
                          ? new Date(s.fecing).toLocaleDateString("es-ES", {
                              year: "2-digit",
                              month: "2-digit",
                              day: "2-digit",
                            })
                          : "-"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            <div className="bg-slate-50 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 text-xs text-slate-500 font-semibold gap-3">
              <span>
                Mostrando {startPersonalItem} a {endPersonalItem} de {totalPersonalCount} trabajadores
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={personalPage <= 1}
                  onClick={() => setPersonalPage(personalPage - 1)}
                  className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 transition-colors cursor-pointer text-slate-400 hover:text-slate-700 outline-none flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="chevron_left" className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPersonalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - personalPage) < 3 || p === 1 || p === totalPersonalPages)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1.5 self-end">...</span>}
                        <button
                          onClick={() => setPersonalPage(p)}
                          className={`px-2 py-0.5 border rounded font-bold text-[10px] outline-none cursor-pointer transition-colors ${
                            p === personalPage
                              ? "bg-mosque text-clear-day border-mosque"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
                <button
                  disabled={personalPage >= totalPersonalPages}
                  onClick={() => setPersonalPage(personalPage + 1)}
                  className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 transition-colors cursor-pointer text-slate-400 hover:text-slate-700 outline-none flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="chevron_right" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ==================== 3. REQUERIMIENTOS TAB ==================== */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(reqGrouped).length === 0 ? (
              <div className="col-span-full bg-white border border-slate-200 p-12 text-center rounded-xl shadow-sm text-slate-400 font-semibold text-sm">
                No hay solicitudes de requerimientos registradas con los filtros seleccionados.
              </div>
            ) : (
              Object.entries(reqGrouped).map(([tramoName, solicitudes]) => (
                <div
                  key={tramoName}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="bg-nordic text-clear-day px-4 py-2 flex items-center justify-between shrink-0 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Icon name="assignment" className="h-4 w-4 text-hint-of-green" />
                      <h3 className="font-sf-pro font-extrabold tracking-tight text-white">
                        {tramoName}
                      </h3>
                    </div>
                    <span className="bg-mosque text-clear-day text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                      {Object.keys(solicitudes).length}
                    </span>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <th className="border border-slate-200 px-3 py-1.5 w-[120px]">Nro. Solicitud</th>
                          <th className="border border-slate-200 px-3 py-1.5">Capataz / Encargado</th>
                          <th className="border border-slate-200 px-3 py-1.5 text-center w-[120px]">Fecha Solicitud</th>
                          <th className="border border-slate-200 px-3 py-1.5 text-center w-[130px]">Total Requerido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {Object.values(solicitudes).map((sol) => (
                          <tr
                            key={sol.solicitud}
                            onClick={() => onSolicitudClick(sol.solicitud, tramoName)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer text-xs font-semibold text-slate-800"
                          >
                            <td className="border border-slate-200 px-3 py-1.5 font-mono font-bold text-slate-900">
                              {sol.solicitud}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-slate-700">
                              {sol.capataz}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center font-mono text-slate-600 text-[11px]">
                              {sol.fechaSolicitud
                                ? new Date(sol.fechaSolicitud).toLocaleDateString("es-ES")
                                : "-"}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center font-mono">
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-extrabold">
                                {sol.totalCount} {sol.totalCount === 1 ? "persona" : "personas"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List View */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {Object.values(solicitudes).map((sol) => (
                      <div
                        key={sol.solicitud}
                        onClick={() => onSolicitudClick(sol.solicitud, tramoName)}
                        className="flex flex-col p-3 active:bg-slate-50 transition-colors cursor-pointer text-xs space-y-1.5 font-semibold"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-extrabold text-slate-900">
                            Sol: {sol.solicitud}
                          </span>
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-250 text-[9px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                            {sol.totalCount} pers.
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>Capataz: <strong className="text-slate-700 font-bold">{sol.capataz}</strong></span>
                          <span>
                            {sol.fechaSolicitud
                              ? new Date(sol.fechaSolicitud).toLocaleDateString("es-ES", {
                                  year: "2-digit",
                                  month: "2-digit",
                                  day: "2-digit",
                                })
                              : "-"}
                          </span>
                        </div>
                      </div>
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
