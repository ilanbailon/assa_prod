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
    <div className="fixed inset-0 bg-nordic/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white w-full max-w-2xl border border-nordic/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-nordic text-clear-day px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-sf-pro font-bold text-base md:text-lg text-hint-of-green">
              Desglose de Personal Activo
            </h3>
            <p className="text-xs text-clear-day/70 font-semibold mt-0.5">
              Capataz: {capataz} &bull; {tramo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-clear-day/10 rounded-full p-1.5 transition-colors cursor-pointer outline-none flex items-center justify-center text-clear-day"
            type="button"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Summary Cards of Cargo Breakdown */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <h4 className="font-sf-pro text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
                Filtrar por Puesto (Haga clic en una tarjeta)
              </h4>
              {selectedCargo && (
                <button
                  onClick={() => setSelectedCargo(null)}
                  className="text-xs font-bold text-mosque hover:underline flex items-center gap-1 cursor-pointer outline-none"
                >
                  <Icon name="close" className="h-3 w-3" />
                  <span>Limpiar Filtro</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cargoBreakdown.map((item, idx) => {
                const isActive = selectedCargo === item.cargo;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCargoClick(item.cargo)}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between text-left transition-all hover:shadow-sm cursor-pointer outline-none ${
                      isActive
                        ? "bg-mosque/10 border-mosque text-mosque ring-2 ring-mosque/20"
                        : "bg-clear-day/50 border-nordic/5 text-nordic hover:bg-clear-day"
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase leading-tight ${isActive ? "text-mosque" : "text-nordic/60"}`}>
                      {item.cargo}
                    </span>
                    <span className="text-xl font-extrabold mt-1.5">
                      {item.count} {item.count === 1 ? "persona" : "personas"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Employee List Section */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="font-sf-pro text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
                Listado de Trabajadores ({filteredEmployees.length})
                {selectedCargo && (
                  <span className="ml-1 text-mosque font-bold">
                    &bull; Filtrados por: {selectedCargo}
                  </span>
                )}
              </h4>
              {/* Search bar inside modal */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar trabajador en lista..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-clear-day border border-nordic/10 px-3 py-1.5 pl-8 rounded-lg text-xs text-nordic outline-none w-full focus:ring-2 focus:ring-mosque/40 placeholder:text-nordic/30 font-semibold"
                />
                <Icon
                  name="search"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nordic/40 h-3.5 w-3.5"
                />
              </div>
            </div>

            {/* Desktop and Mobile list view */}
            <div className="border border-nordic/10 rounded-xl overflow-hidden bg-white">
              {/* Desktop view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-clear-day border-b border-nordic/10">
                      <th className="px-4 py-3 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                        Código
                      </th>
                      <th className="px-4 py-3 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                        DNI
                      </th>
                      <th className="px-4 py-3 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                        Apellidos y Nombres
                      </th>
                      <th className="px-4 py-3 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                        Cargo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nordic/5 font-semibold text-nordic/80">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-nordic/40 italic">
                          No se encontraron registros.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-clear-day/30 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-nordic/60">{emp.codigo || "-"}</td>
                          <td className="px-4 py-2.5 text-nordic/60">{emp.dni || "-"}</td>
                          <td className="px-4 py-2.5 text-nordic font-bold">{emp.nombres}</td>
                          <td className="px-4 py-2.5 text-mosque font-bold">{emp.cargo}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile list view */}
              <div className="block sm:hidden divide-y divide-nordic/5 text-xs">
                {filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-nordic/40 italic">
                    No se encontraron registros.
                  </div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <div key={emp.id} className="p-3 space-y-1 bg-white">
                      <div className="flex justify-between items-center text-[10px] text-nordic/50 font-bold">
                        <span>Cód: {emp.codigo || "-"}</span>
                        <span>DNI: {emp.dni || "-"}</span>
                      </div>
                      <p className="font-extrabold text-nordic">{emp.nombres}</p>
                      <p className="text-[10px] font-bold text-mosque uppercase">{emp.cargo}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-clear-day px-6 py-3 border-t border-nordic/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 bg-nordic text-clear-day font-bold text-xs rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all outline-none cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
