"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PersonalAssa, GroupedRequirementReport } from "./types";
import Icon from "./Icon";

interface RequirementTableProps {
  activeTab: string; // "personal" | "requirements"
  staff: PersonalAssa[];
  report: GroupedRequirementReport[];
  currentPage: number;
  totalCount: number;
  limit: number;
  filterTramo: string;
  filterCargo: string;
  existingTramos: string[];
  existingCargos: string[];
}

export default function RequirementTable({
  activeTab,
  staff,
  report,
  currentPage,
  totalCount,
  limit,
  filterTramo,
  filterCargo,
  existingTramos,
  existingCargos,
}: RequirementTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper to update URL params
  const updateParams = (newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    // Reset page to 1 when changing filters
    if (!("page" in newParams)) {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleExportCSV = () => {
    let headers = "";
    let rows = "";
    let filename = "";

    if (activeTab === "personal") {
      headers = "Código,DNI,Apellidos y Nombres,Cargo,Capataz/Encargado,Tramo (Frente),Fecha de Ingreso\n";
      rows = staff
        .map(
          (s) =>
            `"${s.codigo || ""}","${s.dni || ""}","${s.nombres || ""}","${s.cargo || ""}","${s.capataz || ""}","${
              s.tramo || ""
            }","${s.fecing || ""}"`
        )
        .join("\n");
      filename = `personal_activo_assa_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      headers = "Frente (Tramo),Nro Requerimiento (Solicitud),Cargo (Puesto),Cantidad,Fecha de Solicitud\n";
      rows = report
        .map(
          (r) =>
            `"${r.tramo}","${r.solicitud}","${r.cargo}","${r.cantidad}","${r.fechaSolicitud || ""}"`
        )
        .join("\n");
      filename = `requerimientos_agrupados_assa_${new Date().toISOString().slice(0, 10)}.csv`;
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

  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  return (
    <div className="w-full space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 border border-nordic/10 rounded-xl shadow-sm">
        {/* Tramo & Cargo Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
          {/* Tramo (Frente) Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-sf-pro text-[10px] font-bold tracking-wider text-nordic/50 uppercase whitespace-nowrap">
              Frente (Tramo):
            </span>
            <select
              value={filterTramo}
              onChange={(e) => updateParams({ tramo: e.target.value })}
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

          {/* Cargo (Puesto) Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-sf-pro text-[10px] font-bold tracking-wider text-nordic/50 uppercase whitespace-nowrap">
              Puesto (Cargo):
            </span>
            <select
              value={filterCargo}
              onChange={(e) => updateParams({ cargo: e.target.value })}
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

        {/* CSV Action Button */}
        <div className="flex justify-end shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-mosque hover:text-mosque/80 hover:underline cursor-pointer outline-none transition-colors border border-mosque/10 px-3 py-2 rounded-lg bg-clear-day/40 w-full sm:w-auto"
          >
            <Icon name="download" className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="bg-white border border-nordic/10 rounded-xl shadow-sm overflow-hidden">
        {activeTab === "personal" ? (
          /* ==================== ACTIVE STAFF VIEW ==================== */
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-clear-day border-b border-nordic/10">
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                      Código
                    </th>
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                      DNI
                    </th>
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                      Apellidos y Nombres
                    </th>
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                      Cargo / Puesto
                    </th>
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                      Capataz / Encargado
                    </th>
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                      Frente (Tramo)
                    </th>
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase text-right">
                      Fec. Ingreso
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nordic/5">
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-nordic/50 font-semibold">
                        No se encontró personal activo.
                      </td>
                    </tr>
                  ) : (
                    staff.map((s) => (
                      <tr key={s.id} className="hover:bg-clear-day/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-nordic/85">
                          {s.codigo || "-"}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-nordic/70">
                          {s.dni || "-"}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-nordic">
                          {s.nombres}
                        </td>
                        <td className="px-6 py-4 text-xs text-nordic font-semibold">
                          <span className="bg-clear-day px-2 py-0.5 rounded text-nordic/80 border border-nordic/10 text-[11px]">
                            {s.cargo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-nordic/65 font-semibold">
                          {s.capataz || "-"}
                        </td>
                        <td className="px-6 py-4 text-xs text-nordic/65 font-semibold">
                          {s.tramo}
                        </td>
                        <td className="px-6 py-4 text-xs text-nordic/60 font-semibold text-right">
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
            <div className="block md:hidden divide-y divide-nordic/5">
              {staff.length === 0 ? (
                <div className="px-6 py-8 text-center text-nordic/50 font-semibold text-sm">
                  No se encontró personal activo.
                </div>
              ) : (
                staff.map((s) => (
                  <div key={s.id} className="p-4 space-y-2 bg-white hover:bg-clear-day/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-nordic/80">
                        Cód: {s.codigo || "-"}
                      </span>
                      <span className="text-[11px] text-nordic/50 font-semibold">
                        DNI: {s.dni || "-"}
                      </span>
                    </div>

                    <p className="text-sm font-extrabold text-nordic leading-tight">
                      {s.nombres}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="bg-clear-day px-2 py-0.5 rounded text-nordic border border-nordic/10 text-[10px] font-bold">
                        {s.cargo}
                      </span>
                      <span className="text-[10px] text-nordic/60 font-semibold">
                        &bull; {s.tramo}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-nordic/5 text-[11px] text-nordic/50">
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

            {/* Table Footer / Pagination */}
            <div className="bg-clear-day px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-nordic/10 text-xs text-nordic/60 font-semibold gap-3">
              <span>
                Mostrando {startItem} a {endItem} de {totalCount} registros de personal
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => updateParams({ page: currentPage - 1 })}
                  className="p-1 border border-nordic/15 rounded bg-white hover:bg-clear-day transition-colors cursor-pointer text-nordic/50 hover:text-nordic outline-none flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="chevron_left" className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - currentPage) < 3 || p === 1 || p === totalPages)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1.5 self-end">...</span>}
                        <button
                          onClick={() => updateParams({ page: p })}
                          className={`px-2.5 py-1 border rounded font-bold text-[11px] outline-none cursor-pointer transition-colors ${
                            p === currentPage
                              ? "bg-mosque text-clear-day border-mosque"
                              : "bg-white border-nordic/15 text-nordic/70 hover:bg-clear-day"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => updateParams({ page: currentPage + 1 })}
                  className="p-1 border border-nordic/15 rounded bg-white hover:bg-clear-day transition-colors cursor-pointer text-nordic/50 hover:text-nordic outline-none flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="chevron_right" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ==================== GROUPED REQUIREMENTS REPORT VIEW ==================== */
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-clear-day border-b border-nordic/10">
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                      Frente (Tramo)
                    </th>
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                      Nro. Requerimiento (Solicitud)
                    </th>
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                      Cargo / Puesto
                    </th>
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase text-center">
                      Cantidad Requerida
                    </th>
                    <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase text-right">
                      Fecha Solicitud
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nordic/5">
                  {report.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-nordic/50 font-semibold">
                        No se encontraron requerimientos registrados.
                      </td>
                    </tr>
                  ) : (
                    report.map((r, index) => (
                      <tr key={index} className="hover:bg-clear-day/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-nordic">
                          {r.tramo}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-nordic/85">
                          {r.solicitud}
                        </td>
                        <td className="px-6 py-4 text-xs text-nordic font-semibold">
                          {r.cargo}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-mosque/10 text-mosque border border-mosque/20 font-bold px-3 py-1 rounded-full text-xs">
                            {r.cantidad} {r.cantidad === 1 ? "persona" : "personas"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-nordic/60 font-semibold text-right">
                          {r.fechaSolicitud
                            ? new Date(r.fechaSolicitud).toLocaleDateString("es-ES", {
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
            <div className="block md:hidden divide-y divide-nordic/5">
              {report.length === 0 ? (
                <div className="px-6 py-8 text-center text-nordic/50 font-semibold text-sm">
                  No se encontraron requerimientos registrados.
                </div>
              ) : (
                report.map((r, index) => (
                  <div key={index} className="p-4 space-y-3 bg-white hover:bg-clear-day/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-nordic/80 bg-clear-day border border-nordic/15 px-2 py-0.5 rounded">
                        Req: {r.solicitud}
                      </span>
                      <span className="bg-mosque text-clear-day font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase">
                        Cant: {r.cantidad}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-nordic/50 uppercase tracking-wider">Frente / Tramo</h4>
                      <p className="text-sm font-extrabold text-nordic leading-tight">{r.tramo}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-nordic/5 text-[11px] text-nordic/50">
                      <span className="font-bold text-mosque">{r.cargo}</span>
                      <span>
                        F. Solicitud:{" "}
                        {r.fechaSolicitud
                          ? new Date(r.fechaSolicitud).toLocaleDateString("es-ES", {
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

            {/* Table Footer */}
            <div className="bg-clear-day px-6 py-4 border-t border-nordic/10 text-xs text-nordic/60 font-semibold">
              Mostrando {report.length} grupos de requerimientos en el frente actual
            </div>
          </>
        )}
      </div>
    </div>
  );
}
