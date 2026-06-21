"use client";

import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import { PersonalAssa } from "./types";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  capataz: string;
  tramo: string;
  cargoBreakdown: Array<{ cargo: string; count: number }>;
  employees: PersonalAssa[];
}

export default function DetailModal({
  isOpen,
  onClose,
  capataz,
  tramo,
  cargoBreakdown,
  employees,
}: DetailModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCargo, setSelectedCargo] = useState<string | null>(null);

  // Reset filter when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedCargo(null);
      setSearch("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCargoClick = (cargo: string) => {
    if (selectedCargo === cargo) {
      setSelectedCargo(null); // Toggle off
    } else {
      setSelectedCargo(cargo); // Toggle on
    }
  };

  // Filter employees locally in the modal by search and selected cargo
  const filteredEmployees = employees.filter((emp) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (emp.nombres && emp.nombres.toLowerCase().includes(q)) ||
      (emp.codigo && emp.codigo.toLowerCase().includes(q)) ||
      (emp.dni && emp.dni.toLowerCase().includes(q)) ||
      (emp.cargo && emp.cargo.toLowerCase().includes(q));

    const matchesCargo = !selectedCargo || emp.cargo === selectedCargo;

    return matchesSearch && matchesCargo;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl border-2 border-slate-300 shadow-xl rounded-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-slate-100 text-slate-800 px-4 py-2.5 flex justify-between items-center shrink-0 border-b border-slate-200">
          <div>
            <h3 className="font-sf-pro font-bold text-xs md:text-sm text-slate-900">
              Desglose de Personal Activo
            </h3>
            <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
              Capataz: {capataz} &bull; Frente: {tramo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-slate-200 rounded p-1 transition-colors cursor-pointer outline-none flex items-center justify-center text-slate-500"
            type="button"
          >
            <Icon name="close" className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Summary Cards of Cargo Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-sf-pro text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                Filtrar por Puesto (Haga clic en una tarjeta)
              </h4>
              {selectedCargo && (
                <button
                  onClick={() => setSelectedCargo(null)}
                  className="text-[10px] font-bold text-mosque hover:underline flex items-center gap-0.5 cursor-pointer outline-none"
                >
                  <Icon name="close" className="h-3 w-3" />
                  <span>Limpiar Filtro</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cargoBreakdown.map((item, idx) => {
                const isActive = selectedCargo === item.cargo;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCargoClick(item.cargo)}
                    className={`p-2.5 rounded border flex flex-col justify-between text-left transition-all cursor-pointer outline-none ${
                      isActive
                        ? "bg-mosque/10 border-mosque text-mosque ring-1 ring-mosque/20"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70"
                    }`}
                  >
                    <span className={`text-[9px] font-bold uppercase leading-tight ${isActive ? "text-mosque" : "text-slate-500"}`}>
                      {item.cargo}
                    </span>
                    <span className="text-sm font-extrabold mt-1 font-mono text-slate-900">
                      {item.count} {item.count === 1 ? "persona" : "personas"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Employee List Section */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="font-sf-pro text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                Listado de Trabajadores ({filteredEmployees.length})
                {selectedCargo && (
                  <span className="ml-1 text-mosque font-bold">
                    &bull; {selectedCargo}
                  </span>
                )}
              </h4>
              {/* Search bar inside modal */}
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  placeholder="Buscar trabajador..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-2.5 py-1 pl-7 rounded text-[11px] text-slate-800 outline-none w-full focus:border-slate-400 placeholder:text-slate-400 font-semibold"
                />
                <Icon
                  name="search"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-450 h-3.5 w-3.5"
                />
              </div>
            </div>

            {/* Desktop and Mobile list view (Excel style) */}
            <div className="border border-slate-200 rounded overflow-hidden bg-white">
              {/* Desktop view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="border border-slate-200 px-3 py-1.5 text-center w-[100px]">Código</th>
                      <th className="border border-slate-200 px-3 py-1.5 text-center w-[100px]">DNI</th>
                      <th className="border border-slate-200 px-3 py-1.5">Apellidos y Nombres</th>
                      <th className="border border-slate-200 px-3 py-1.5 text-center w-[150px]">Cargo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-semibold text-slate-800">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-slate-400 italic">
                          No se encontraron registros.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="border border-slate-200 px-3 py-1.5 font-mono text-center text-slate-400">{emp.codigo || "-"}</td>
                          <td className="border border-slate-200 px-3 py-1.5 font-mono text-center text-slate-650">{emp.dni || "-"}</td>
                          <td className="border border-slate-200 px-3 py-1.5 text-slate-900 font-bold">{emp.nombres}</td>
                          <td className="border border-slate-200 px-3 py-1.5 text-center">
                            <span className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200 text-[10px] font-bold">
                              {emp.cargo}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile list view */}
              <div className="block sm:hidden divide-y divide-slate-150 text-xs">
                {filteredEmployees.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 italic">
                    No se encontraron registros.
                  </div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <div key={emp.id} className="p-2.5 space-y-1 bg-white">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                        <span>Cód: {emp.codigo || "-"}</span>
                        <span>DNI: {emp.dni || "-"}</span>
                      </div>
                      <p className="font-bold text-slate-900">{emp.nombres}</p>
                      <span className="inline-block bg-slate-50 px-1 py-0.2 rounded border border-slate-200 text-[9px] font-bold text-slate-700">
                        {emp.cargo}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="px-3.5 py-1 bg-slate-700 text-white font-bold text-xs rounded hover:bg-slate-800 active:scale-95 transition-all outline-none cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
