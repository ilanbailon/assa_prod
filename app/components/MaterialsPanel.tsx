"use client";

import React, { useState, useEffect } from "react";
import { MaterialRequirement } from "./types";
import Icon from "./Icon";

interface MaterialsPanelProps {
  items: MaterialRequirement[];
  searchQuery: string;
  onSolicitudClick: (codigoRequerimiento: string) => void;
}

export default function MaterialsPanel({
  items,
  searchQuery,
  onSolicitudClick,
}: MaterialsPanelProps) {
  const [filterPartida, setFilterPartida] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPartida]);

  // Extract unique Partidas de Control for the dropdown filter
  const partidasSet = new Set<string>();
  items.forEach((item) => {
    if (item.partidaControl && item.partidaControl.trim()) {
      partidasSet.add(item.partidaControl.trim());
    }
  });
  const existingPartidas = Array.from(partidasSet).sort((a, b) => a.localeCompare(b));

  // 1. Filter items
  const filteredItems = items.filter((item) => {
    // Filter by Partida
    if (filterPartida !== "All" && item.partidaControl !== filterPartida) return false;

    // Filter by Search Query (match against codigoRequerimiento, recurso, codigoRecurso, or partidaControl)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.codigoRequerimiento.toLowerCase().includes(q) ||
        (item.recurso && item.recurso.toLowerCase().includes(q)) ||
        (item.codigoRecurso && item.codigoRecurso.toLowerCase().includes(q)) ||
        (item.partidaControl && item.partidaControl.toLowerCase().includes(q))
      );
    }

    return true;
  });

  // 2. Group items by Request Code (codigoRequerimiento)
  interface GroupedRequest {
    codigoRequerimiento: string;
    totalItems: number;
    approvedItems: number;
    partidas: string[];
    totalQuantity: number;
  }

  const groupedObj: Record<string, GroupedRequest> = {};

  filteredItems.forEach((item) => {
    const code = item.codigoRequerimiento;
    if (!groupedObj[code]) {
      groupedObj[code] = {
        codigoRequerimiento: code,
        totalItems: 0,
        approvedItems: 0,
        partidas: [],
        totalQuantity: 0,
      };
    }

    const g = groupedObj[code];
    g.totalItems++;
    if (item.estado === "Aprobado") {
      g.approvedItems++;
    }
    if (item.partidaControl && !g.partidas.includes(item.partidaControl)) {
      g.partidas.push(item.partidaControl);
    }
    g.totalQuantity += item.cantidad || 0;
  });

  // Convert groups to sorted array (by request code numerically if possible, or alphabetically)
  const groupedList = Object.values(groupedObj).sort((a, b) => {
    const numA = parseInt(a.codigoRequerimiento, 10);
    const numB = parseInt(b.codigoRequerimiento, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.codigoRequerimiento.localeCompare(b.codigoRequerimiento);
  });

  // 3. Paginate the grouped list
  const totalCount = groupedList.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);
  const paginatedGroups = groupedList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    const headers = "Código Requerimiento,Cant. Ítems,Cant. Aprobados,Total Cantidad Insumos,Partidas de Control\n";
    const rows = groupedList
      .map(
        (g) =>
          `"${g.codigoRequerimiento}","${g.totalItems}","${g.approvedItems}","${g.totalQuantity}","${g.partidas.join(
            " | "
          )}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `resumen_requerimientos_materiales_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 border border-nordic/10 rounded-xl shadow-sm">
        {/* Partida de Control Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
          <span className="font-sf-pro text-[10px] font-bold tracking-wider text-nordic/50 uppercase whitespace-nowrap">
            Partida de Control:
          </span>
          <select
            value={filterPartida}
            onChange={(e) => setFilterPartida(e.target.value)}
            className="bg-clear-day border border-nordic/10 text-xs font-bold text-nordic py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 transition-all w-full sm:w-64 cursor-pointer"
          >
            <option value="All">Todas las Partidas</option>
            {existingPartidas.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* CSV Action Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-mosque hover:text-mosque/80 hover:underline cursor-pointer outline-none transition-colors border border-mosque/10 px-4 py-2 rounded-lg bg-clear-day/40 w-full lg:w-auto"
        >
          <Icon name="download" className="h-4 w-4" />
          <span>Exportar Resumen CSV</span>
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-nordic/10 rounded-xl shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-clear-day border-b border-nordic/10">
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                  Código Requerimiento
                </th>
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase text-center">
                  Total Ítems
                </th>
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase text-center">
                  Ítems Aprobados
                </th>
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                  Partidas de Control Involucradas
                </th>
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase text-right">
                  Cant. Insumos Total
                </th>
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nordic/5">
              {paginatedGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-nordic/50 font-semibold">
                    No se encontraron requerimientos de materiales.
                  </td>
                </tr>
              ) : (
                paginatedGroups.map((g) => (
                  <tr
                    key={g.codigoRequerimiento}
                    className="hover:bg-clear-day/30 transition-colors group cursor-pointer"
                    onClick={() => onSolicitudClick(g.codigoRequerimiento)}
                  >
                    <td className="px-6 py-4 font-mono text-sm font-extrabold text-nordic group-hover:text-mosque transition-colors">
                      {g.codigoRequerimiento}
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-nordic/70">
                      {g.totalItems}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        g.approvedItems === g.totalItems
                          ? "bg-hint-of-green text-mosque border border-mosque/20"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        {g.approvedItems} / {g.totalItems} Aprobados
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-nordic/65 font-semibold max-w-xs truncate" title={g.partidas.join(", ")}>
                      {g.partidas.join(", ") || "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-nordic text-xs">
                      {g.totalQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="text-xs font-extrabold text-mosque hover:underline flex items-center justify-end gap-1 outline-none ml-auto"
                      >
                        <span>Ver Insumos</span>
                        <Icon name="chevron_right" className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden divide-y divide-nordic/5">
          {paginatedGroups.length === 0 ? (
            <div className="px-6 py-8 text-center text-nordic/50 font-semibold text-sm">
              No se encontraron requerimientos de materiales.
            </div>
          ) : (
            paginatedGroups.map((g) => (
              <div
                key={g.codigoRequerimiento}
                onClick={() => onSolicitudClick(g.codigoRequerimiento)}
                className="p-4 space-y-3 bg-white hover:bg-clear-day/10 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm font-extrabold text-nordic">
                    Req: {g.codigoRequerimiento}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    g.approvedItems === g.totalItems
                      ? "bg-hint-of-green text-mosque border border-mosque/20"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}>
                    {g.approvedItems}/{g.totalItems} Aprobados
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-[9px] font-bold text-nordic/40 uppercase tracking-wider">Partidas de Control</h4>
                  <p className="text-xs text-nordic/70 font-semibold leading-tight line-clamp-1">{g.partidas.join(", ") || "-"}</p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-nordic/5 text-[11px] text-nordic/50 font-semibold">
                  <span>Cant. Insumos: <strong className="text-nordic">{g.totalQuantity.toLocaleString()}</strong></span>
                  <span className="text-mosque font-bold flex items-center gap-0.5">
                    <span>Ver Insumos</span>
                    <Icon name="chevron_right" className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table Footer / Pagination */}
        <div className="bg-clear-day px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-nordic/10 text-xs text-nordic/60 font-semibold gap-3">
          <span>
            Mostrando {startItem} a {endItem} de {totalCount} requerimientos de materiales
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1 border border-nordic/15 rounded bg-white hover:bg-clear-day transition-colors cursor-pointer text-nordic/50 hover:text-nordic outline-none flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="chevron_left" className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-2.5 py-1 border rounded font-bold text-[11px] outline-none cursor-pointer transition-colors ${
                  p === currentPage
                    ? "bg-mosque text-clear-day border-mosque"
                    : "bg-white border-nordic/15 text-nordic/70 hover:bg-clear-day"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1 border border-nordic/15 rounded bg-white hover:bg-clear-day transition-colors cursor-pointer text-nordic/50 hover:text-nordic outline-none flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="chevron_right" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
