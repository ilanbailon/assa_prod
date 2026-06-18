"use client";

import React, { useState } from "react";
import Icon from "./Icon";
import { MaterialRequirement } from "./types";

interface MaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  codigoRequerimiento: string;
  items: MaterialRequirement[];
}

export default function MaterialsModal({
  isOpen,
  onClose,
  codigoRequerimiento,
  items,
}: MaterialsModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  // Local filtering by search query
  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (item.recurso && item.recurso.toLowerCase().includes(q)) ||
      (item.codigoRecurso && item.codigoRecurso.toLowerCase().includes(q)) ||
      (item.partidaControl && item.partidaControl.toLowerCase().includes(q)) ||
      (item.estado && item.estado.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 bg-nordic/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white w-full max-w-5xl border border-nordic/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-nordic text-clear-day px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-sf-pro font-bold text-base md:text-lg text-hint-of-green">
              Detalle de Solicitud de Materiales
            </h3>
            <p className="text-xs text-clear-day/70 font-semibold mt-0.5">
              Código de Requerimiento: {codigoRequerimiento} &bull; Total Ítems: {items.length}
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

        {/* Search Bar inside Modal */}
        <div className="px-6 pt-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-nordic/5 pb-4">
          <h4 className="font-sf-pro text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
            Lista de Insumos / Artículos ({filteredItems.length})
          </h4>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar insumo en esta solicitud..."
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

        {/* Content (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 bg-clear-day/10">
          {/* Desktop Table View */}
          <div className="hidden lg:block border border-nordic/10 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-[11px] md:text-xs">
              <thead>
                <tr className="bg-clear-day border-b border-nordic/10 text-nordic/60 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Descripción Recurso</th>
                  <th className="px-3 py-3 text-center">Unidad</th>
                  <th className="px-3 py-3 text-right">Cant. Solicitada</th>
                  <th className="px-4 py-3">Partida de Control</th>
                  <th className="px-3 py-3 text-center">Estado</th>
                  <th className="px-3 py-3 text-right">Cotización</th>
                  <th className="px-3 py-3 text-right">Orden Compra</th>
                  <th className="px-3 py-3 text-right">Almacén</th>
                  <th className="px-4 py-3">Cronograma Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nordic/5 font-semibold text-nordic/85">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-nordic/40 italic">
                      No se encontraron insumos.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-clear-day/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-nordic/50 text-[10px]">{item.codigoRecurso || "-"}</td>
                      <td className="px-4 py-3 font-bold text-nordic">{item.recurso}</td>
                      <td className="px-3 py-3 text-center font-bold text-nordic/70">{item.unidad}</td>
                      <td className="px-3 py-3 text-right font-extrabold text-nordic">{item.cantidad}</td>
                      <td className="px-4 py-3 text-nordic/60">
                        {item.partidaControlCode ? (
                          <div className="truncate max-w-[150px]" title={item.partidaControl || ""}>
                            <span className="font-mono text-[10px] block text-nordic/40">{item.partidaControlCode}</span>
                            <span>{item.partidaControl}</span>
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          item.estado === "Aprobado" ? "bg-hint-of-green border border-mosque/20 text-mosque" : "bg-amber-50 border border-amber-200 text-amber-800"
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-nordic/60">{item.cantidadCotizacion || "0"}</td>
                      <td className="px-3 py-3 text-right text-nordic/60">{item.cantidadOrdenCompra || "0"}</td>
                      <td className="px-3 py-3 text-right text-mosque font-bold">{item.cantidadAlmacen || "0"}</td>
                      <td className="px-4 py-3 text-[10px] text-nordic/50 leading-tight">
                        {item.cronogramaEntrega || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Tablets / Mobiles below lg) */}
          <div className="block lg:hidden space-y-3">
            {filteredItems.length === 0 ? (
              <div className="bg-white border border-nordic/10 p-6 text-center rounded-xl text-nordic/40 italic">
                No se encontraron insumos.
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="bg-white border border-nordic/10 rounded-xl p-4 space-y-3 shadow-sm">
                  {/* Title row */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-mono text-[9px] text-nordic/45 block">Cód: {item.codigoRecurso || "-"}</span>
                      <h4 className="text-xs font-extrabold text-nordic leading-tight">{item.recurso}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${
                      item.estado === "Aprobado" ? "bg-hint-of-green border border-mosque/20 text-mosque" : "bg-amber-50 border border-amber-200 text-amber-800"
                    }`}>
                      {item.estado}
                    </span>
                  </div>

                  {/* Quantities Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-clear-day/30 p-2.5 rounded-lg text-center text-[10px]">
                    <div>
                      <span className="block text-nordic/40 font-bold uppercase text-[8px]">Solicitada</span>
                      <span className="font-extrabold text-nordic text-xs">{item.cantidad} {item.unidad}</span>
                    </div>
                    <div>
                      <span className="block text-nordic/40 font-bold uppercase text-[8px]">Cotizada</span>
                      <span className="font-bold text-nordic/70">{item.cantidadCotizacion || "0"}</span>
                    </div>
                    <div>
                      <span className="block text-nordic/40 font-bold uppercase text-[8px]">En Almacén</span>
                      <span className="font-bold text-mosque">{item.cantidadAlmacen || "0"}</span>
                    </div>
                  </div>

                  {/* Footnotes */}
                  <div className="pt-2 border-t border-nordic/5 space-y-1 text-[10px] text-nordic/50">
                    <p>
                      <strong className="text-nordic/70">Partida:</strong> {item.partidaControl || "-"}
                    </p>
                    {item.cronogramaEntrega && (
                      <p>
                        <strong className="text-nordic/70">Cronograma:</strong> {item.cronogramaEntrega}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-clear-day px-6 py-3.5 border-t border-nordic/10 flex justify-end shrink-0">
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
