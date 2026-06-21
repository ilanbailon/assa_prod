"use client";

import React, { useState } from "react";
import Icon from "./Icon";
import { PersonalAssa } from "./types";

interface SolicitudModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: string;
  tramo: string;
  requirements: PersonalAssa[];
  existingCapataces: string[];
  onPromote: (
    id: number,
    data: {
      nombres: string;
      codigo: string;
      dni: string;
      capataz: string;
      fecing: string;
    }
  ) => Promise<void>;
}

export default function SolicitudModal({
  isOpen,
  onClose,
  solicitud,
  tramo,
  requirements,
  existingCapataces,
  onPromote,
}: SolicitudModalProps) {
  // Track which requirement row is currently being activated
  const [activatingId, setActivatingId] = useState<number | null>(null);

  // Form states for activation
  const [nombres, setNombres] = useState("");
  const [codigo, setCodigo] = useState("");
  const [dni, setDni] = useState("");
  const [capataz, setCapataz] = useState("");
  const [fecing, setFecing] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStartActivation = (req: PersonalAssa) => {
    setActivatingId(req.id);
    setNombres("");
    setCodigo("");
    setDni("");
    setCapataz(existingCapataces[0] || "");
    setFecing(new Date().toISOString().slice(0, 10));
  };

  const handleCancelActivation = () => {
    setActivatingId(null);
  };

  const handleConfirmActivation = async (id: number) => {
    if (!nombres.trim() || !codigo.trim() || !dni.trim() || !capataz) {
      alert("Por favor complete todos los datos del trabajador.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onPromote(id, {
        nombres: nombres.trim(),
        codigo: codigo.trim(),
        dni: dni.trim(),
        capataz,
        fecing,
      });
      setActivatingId(null);
    } catch (error) {
      console.error(error);
      alert("Error al promover el requerimiento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl border-2 border-slate-300 shadow-xl rounded-lg overflow-hidden transform flex flex-col max-h-[85vh] animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-slate-100 text-slate-800 px-4 py-2.5 flex justify-between items-center shrink-0 border-b border-slate-200">
          <div>
            <h3 className="font-sf-pro font-bold text-xs md:text-sm text-slate-900">
              Detalle de Solicitud de Personal
            </h3>
            <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
              Solicitud: {solicitud} &bull; Frente: {tramo}
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
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs font-semibold text-slate-800">
          <h4 className="font-sf-pro text-[9px] font-bold tracking-wider text-slate-500 uppercase">
            Lista de Requerimientos en esta Solicitud ({requirements.length})
          </h4>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                  <th className="border border-slate-200 px-3 py-1.5 text-center w-[80px]">ID</th>
                  <th className="border border-slate-200 px-3 py-1.5">Cargo Requerido</th>
                  <th className="border border-slate-200 px-3 py-1.5 text-center w-[100px]">Estado</th>
                  <th className="border border-slate-200 px-3 py-1.5">Trabajador Asignado / Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {requirements.map((req) => {
                  const isActivating = activatingId === req.id;
                  const isFilled = req.estado === "Activo";

                  return (
                    <React.Fragment key={req.id}>
                      <tr className={`hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-805 ${isFilled ? "bg-emerald-50/10" : ""}`}>
                        <td className="border border-slate-200 px-3 py-1.5 text-center font-mono text-slate-400">
                          {req.id}
                        </td>
                        <td className="border border-slate-200 px-3 py-1.5 font-bold text-slate-900">
                          {req.cargo}
                        </td>
                        <td className="border border-slate-200 px-3 py-1.5 text-center">
                          {isFilled ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded">
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-750 bg-red-50 border border-red-200 px-2 py-0.2 rounded">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="border border-slate-200 px-3 py-1.5 text-center">
                          {isFilled ? (
                            <div className="text-left font-bold text-slate-700 leading-tight">
                              <div>{req.nombres}</div>
                              <div className="text-[9px] text-slate-450 font-semibold mt-0.5 font-mono">
                                Cód: {req.codigo} | DNI: {req.dni}
                              </div>
                            </div>
                          ) : isActivating ? (
                            <span className="text-[10px] text-mosque font-bold">Llenando formulario...</span>
                          ) : (
                            <button
                              onClick={() => handleStartActivation(req)}
                              className="px-2 py-1 bg-mosque text-clear-day font-bold text-[10px] rounded hover:bg-mosque/90 active:scale-95 transition-all outline-none cursor-pointer flex items-center justify-center gap-1 mx-auto"
                            >
                              <Icon name="person_add" className="h-3.5 w-3.5" />
                              <span>Activar Personal</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Inline Form Row when activating */}
                      {isActivating && (
                        <tr>
                          <td colSpan={4} className="border border-slate-200 p-4 bg-slate-50">
                            <div className="bg-white border border-slate-200 rounded p-3 shadow-xs space-y-3.5 text-xs text-slate-800">
                              <h5 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1">
                                <Icon name="person" className="h-4.5 w-4.5 text-slate-400" />
                                <span>Asignar Trabajador a Requerimiento ID: {req.id}</span>
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase">
                                    Apellidos y Nombres *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Ej. SUCARI SUCARI, LUIS"
                                    value={nombres}
                                    onChange={(e) => setNombres(e.target.value)}
                                    required
                                    className="w-full bg-white border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400 placeholder:text-slate-350"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase">
                                    Código de Trabajador *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Ej. 008123"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    required
                                    className="w-full bg-white border border-slate-200 px-2 py-1 text-xs font-mono font-semibold text-slate-800 rounded outline-none focus:border-slate-400 placeholder:text-slate-350"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase">
                                    DNI *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Ej. 70543210"
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value)}
                                    required
                                    className="w-full bg-white border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400 placeholder:text-slate-350"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase">
                                    Capataz Asignado *
                                  </label>
                                  <select
                                    value={capataz}
                                    onChange={(e) => setCapataz(e.target.value)}
                                    className="w-full bg-white border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400"
                                  >
                                    {existingCapataces.map((cap) => (
                                      <option key={cap} value={cap}>
                                        {cap}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase">
                                    Fecha de Ingreso *
                                  </label>
                                  <input
                                    type="date"
                                    value={fecing}
                                    onChange={(e) => setFecing(e.target.value)}
                                    required
                                    className="w-full bg-white border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400 font-mono"
                                  />
                                </div>
                              </div>

                              {/* Form Actions */}
                              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                                <button
                                  onClick={handleCancelActivation}
                                  type="button"
                                  disabled={isSubmitting}
                                  className="px-3.5 py-1 text-xs font-bold text-slate-650 hover:bg-slate-100 rounded transition-all outline-none"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleConfirmActivation(req.id)}
                                  type="button"
                                  disabled={isSubmitting}
                                  className="px-4 py-1 bg-mosque text-clear-day font-bold text-xs rounded hover:bg-mosque/90 active:scale-95 transition-all outline-none disabled:opacity-50 flex items-center gap-1.5 uppercase text-[9px] tracking-wider"
                                >
                                  {isSubmitting ? (
                                    <>
                                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Activando...</span>
                                    </>
                                  ) : (
                                    <span>Confirmar</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="px-3.5 py-1 bg-slate-700 text-white font-bold text-xs rounded hover:bg-slate-800 active:scale-95 transition-all outline-none cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
