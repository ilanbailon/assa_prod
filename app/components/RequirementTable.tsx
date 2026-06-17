"use client";

import React, { useState } from "react";
import { Requirement } from "./types";
import Icon from "./Icon";

interface RequirementTableProps {
  requirements: Requirement[];
  onStatusChange: (code: string, newStatus: Requirement["status"]) => void;
  onEditClick: (req: Requirement) => void;
  onDeleteClick: (code: string) => void;
}

export default function RequirementTable({
  requirements,
  onStatusChange,
  onEditClick,
  onDeleteClick,
}: RequirementTableProps) {
  const [filterType, setFilterType] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Filtering logic
  const filteredReqs = requirements.filter((req) => {
    if (filterType === "All") return true;
    return req.type.toLowerCase() === filterType.toLowerCase();
  });

  // Sorting logic
  const sortedReqs = [...filteredReqs].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime();
    }
    if (sortBy === "priority") {
      const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  // Get icon for type
  const getTypeIcon = (type: Requirement["type"]) => {
    switch (type) {
      case "Staff":
        return "person";
      case "Machine":
        return "precision_manufacturing";
      case "Service":
        return "settings_suggest";
      default:
        return "description";
    }
  };

  // Status badge style generator
  const getStatusBadgeClass = (status: Requirement["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 border border-amber-200 text-amber-800";
      case "APPROVED":
        return "bg-hint-of-green border border-mosque/20 text-mosque";
      case "IN_PROGRESS":
        return "bg-blue-50 border border-blue-200 text-blue-800";
      case "REJECTED":
        return "bg-red-50 border border-red-200 text-red-800";
    }
  };

  // Priority badge style generator
  const getPriorityBadgeClass = (priority: Requirement["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-100";
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-100";
      case "LOW":
        return "bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200";
    }
  };

  const [activeActionsMenu, setActiveActionsMenu] = useState<string | null>(null);

  const toggleActions = (code: string) => {
    if (activeActionsMenu === code) {
      setActiveActionsMenu(null);
    } else {
      setActiveActionsMenu(code);
    }
  };

  const handleExportCSV = () => {
    const headers = "Código,Tipo,Módulo,Solicitante,Fecha,Descripción,Prioridad,Estado\n";
    const rows = sortedReqs
      .map(
        (r) =>
          `"${r.code}","${r.type}","${r.module}","${r.requestor}","${r.requestDate}","${r.description.replace(
            /"/g,
            '""'
          )}","${r.priority}","${r.status}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `requerimientos_assa_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 border border-nordic/10 rounded-xl shadow-sm">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sf-pro text-[11px] font-bold tracking-wider text-nordic/50 uppercase mr-2">
            Filtrar Tipo:
          </span>
          {["All", "Staff", "Machine", "Service"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                (type === "All" && filterType === "All") || filterType === type
                  ? "bg-mosque text-clear-day border-mosque shadow-sm"
                  : "bg-white text-nordic/70 border-nordic/10 hover:bg-clear-day"
              }`}
            >
              {type === "All" ? "Todos" : type}
            </button>
          ))}
        </div>

        {/* Sort & Actions */}
        <div className="flex items-center gap-4 ml-0 md:ml-auto">
          <div className="flex items-center gap-2">
            <span className="font-sf-pro text-[11px] font-bold tracking-wider text-nordic/50 uppercase hidden sm:inline">
              Ordenar por:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-nordic/10 text-xs font-bold text-nordic py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 transition-all"
            >
              <option value="newest">Fecha: Recientes</option>
              <option value="oldest">Fecha: Antiguos</option>
              <option value="priority">Prioridad</option>
              <option value="status">Estado</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-bold text-mosque hover:text-mosque/80 hover:underline cursor-pointer outline-none transition-colors border border-mosque/10 px-3 py-1.5 rounded-lg bg-clear-day/40"
          >
            <Icon name="download" className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-nordic/10 rounded-xl shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-clear-day border-b border-nordic/10">
                <th className="px-6 py-4 font-sf-pro text-[11px] font-bold tracking-wider text-nordic/60 uppercase">
                  Código
                </th>
                <th className="px-6 py-4 font-sf-pro text-[11px] font-bold tracking-wider text-nordic/60 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-4 font-sf-pro text-[11px] font-bold tracking-wider text-nordic/60 uppercase">
                  Módulo
                </th>
                <th className="px-6 py-4 font-sf-pro text-[11px] font-bold tracking-wider text-nordic/60 uppercase">
                  Fecha Solicitud
                </th>
                <th className="px-6 py-4 font-sf-pro text-[11px] font-bold tracking-wider text-nordic/60 uppercase">
                  Descripción / Especificaciones
                </th>
                <th className="px-6 py-4 font-sf-pro text-[11px] font-bold tracking-wider text-nordic/60 uppercase text-center">
                  Prioridad
                </th>
                <th className="px-6 py-4 font-sf-pro text-[11px] font-bold tracking-wider text-nordic/60 uppercase text-center">
                  Estado
                </th>
                <th className="px-6 py-4 font-sf-pro text-[11px] font-bold tracking-wider text-nordic/60 uppercase text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nordic/5">
              {sortedReqs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-nordic/50 font-semibold">
                    No se encontraron requerimientos.
                  </td>
                </tr>
              ) : (
                sortedReqs.map((req) => (
                  <tr
                    key={req.code}
                    className="hover:bg-clear-day/30 transition-colors group relative"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-nordic/85">
                      {req.code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-nordic">
                        <Icon name={getTypeIcon(req.type)} className="h-4.5 w-4.5 text-mosque" />
                        <span>{req.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-nordic/70">
                      {req.module}
                    </td>
                    <td className="px-6 py-4 text-xs text-nordic/60 font-semibold">
                      {new Date(req.requestDate).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-nordic max-w-xs truncate" title={req.description}>
                      {req.description}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={getPriorityBadgeClass(req.priority)}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${getStatusBadgeClass(
                            req.status
                          )}`}
                        >
                          {req.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        {req.attachmentUrl && (
                          <a
                            href={req.attachmentUrl}
                            className="p-1 rounded text-nordic/50 hover:text-mosque hover:bg-clear-day transition-colors"
                            title="Ver adjunto"
                          >
                            <Icon name="description" className="h-5 w-5" />
                          </a>
                        )}
                        <button
                          onClick={() => toggleActions(req.code)}
                          className="p-1 rounded text-nordic/50 hover:text-nordic hover:bg-clear-day transition-colors outline-none cursor-pointer flex items-center justify-center"
                        >
                          <Icon name="more_vert" className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Dropdown Menu */}
                      {activeActionsMenu === req.code && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveActionsMenu(null)}
                          />
                          <div className="absolute right-6 top-12 w-48 bg-white border border-nordic/10 rounded-lg shadow-lg py-1 z-50 text-left">
                            <button
                              onClick={() => {
                                onEditClick(req);
                                setActiveActionsMenu(null);
                              }}
                              className="w-full flex items-center px-4 py-2 text-xs font-bold text-nordic hover:bg-clear-day transition-colors cursor-pointer"
                            >
                              <Icon name="edit" className="h-4 w-4 mr-2.5 text-nordic/60" />
                              Editar Requerimiento
                            </button>
                            <div className="border-t border-nordic/5 my-1" />
                            <div className="px-4 py-1 text-[9px] font-extrabold tracking-wider text-nordic/40 uppercase">
                              Cambiar Estado
                            </div>
                            {(["PENDING", "APPROVED", "IN_PROGRESS", "REJECTED"] as const).map(
                              (status) => (
                                <button
                                  key={status}
                                  onClick={() => {
                                    onStatusChange(req.code, status);
                                    setActiveActionsMenu(null);
                                  }}
                                  className={`w-full flex items-center px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                    req.status === status
                                      ? "text-mosque bg-hint-of-green/45 font-bold"
                                      : "text-nordic/70 hover:bg-clear-day"
                                  }`}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-current mr-2.5" />
                                  {status}
                                </button>
                              )
                            )}
                            <div className="border-t border-nordic/5 my-1" />
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar requerimiento ${req.code}?`)) {
                                  onDeleteClick(req.code);
                                }
                                setActiveActionsMenu(null);
                              }}
                              className="w-full flex items-center px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Icon name="delete" className="h-4 w-4 mr-2.5 text-red-600" />
                              Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden divide-y divide-nordic/5">
          {sortedReqs.length === 0 ? (
            <div className="px-6 py-8 text-center text-nordic/50 font-semibold text-sm">
              No se encontraron requerimientos.
            </div>
          ) : (
            sortedReqs.map((req) => (
              <div key={req.code} className="p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-nordic/85">
                    {req.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${getStatusBadgeClass(
                      req.status
                    )}`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Icon name={getTypeIcon(req.type)} className="h-4.5 w-4.5 text-mosque" />
                  <span className="text-xs font-bold text-nordic">
                    {req.type} &mdash; <span className="text-nordic/60 font-semibold">{req.module}</span>
                  </span>
                </div>

                <p className="text-xs font-bold text-nordic leading-relaxed">
                  {req.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-nordic/5 text-[11px] text-nordic/50">
                  <span>
                    Fecha: {new Date(req.requestDate).toLocaleDateString("es-ES")}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={getPriorityBadgeClass(req.priority)}>
                      {req.priority}
                    </span>
                    <button
                      onClick={() => onEditClick(req)}
                      className="text-mosque font-bold hover:underline"
                    >
                      Editar
                    </button>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table Footer / Pagination Info */}
        <div className="bg-clear-day px-6 py-4 flex items-center justify-between border-t border-nordic/10 text-xs text-nordic/60 font-semibold">
          <span>
            Mostrando {sortedReqs.length} de {requirements.length} registros
          </span>
          <div className="flex gap-1.5">
            <button className="p-1 border border-nordic/15 rounded bg-white hover:bg-clear-day transition-colors cursor-pointer text-nordic/50 hover:text-nordic outline-none flex items-center justify-center">
              <Icon name="chevron_left" className="h-4 w-4" />
            </button>
            <button className="px-2.5 py-1 border border-nordic/15 rounded bg-mosque text-clear-day font-bold text-[11px] outline-none">
              1
            </button>
            <button className="p-1 border border-nordic/15 rounded bg-white hover:bg-clear-day transition-colors cursor-pointer text-nordic/50 hover:text-nordic outline-none flex items-center justify-center">
              <Icon name="chevron_right" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
