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
    // Default to the first existing capataz if available
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
    <div className="fixed inset-0 bg-nordic/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white w-full max-w-2xl border border-nordic/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-nordic text-clear-day px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-sf-pro font-bold text-base md:text-lg text-hint-of-green">
              Detalle de Solicitud de Personal
            </h3>
            <p className="text-xs text-clear-day/70 font-semibold mt-0.5">
              Solicitud: {solicitud} &bull; Frente: {tramo}
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <h4 className="font-sf-pro text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
            Lista de Requerimientos en esta Solicitud
          </h4>

          <div className="space-y-3">
            {requirements.map((req) => {
              const isActivating = activatingId === req.id;
              const isFilled = req.estado === "Activo";

              return (
                <div
                  key={req.id}
                  className={`border rounded-xl p-4 transition-all duration-200 ${
                    isFilled
                      ? "bg-hint-of-green/10 border-mosque/20"
                      : isActivating
                      ? "bg-clear-day border-mosque"
                      : "bg-white border-nordic/10 hover:border-nordic/20"
                  }`}
                >
                  {/* Summary row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] bg-clear-day border border-nordic/10 text-nordic px-2 py-0.5 rounded font-mono font-semibold">
                        ID: {req.id}
                      </span>
                      <p className="text-sm font-extrabold text-nordic">{req.cargo}</p>
                      {isFilled && (
                        <p className="text-xs text-mosque font-bold">
                          Contratado: <span className="underline">{req.nombres}</span> &bull; Cód: {req.codigo} &bull; DNI: {req.dni}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isFilled ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-mosque bg-hint-of-green border border-mosque/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          <Icon name="check_circle" className="h-3.5 w-3.5" />
                          <span>Activo</span>
                        </span>
                      ) : isActivating ? (
                        <span className="text-[10px] font-bold text-mosque uppercase tracking-wider">
                          Llenando datos...
                        </span>
                      ) : (
                        <button
                          onClick={() => handleStartActivation(req)}
                          className="px-3 py-1.5 bg-mosque text-clear-day font-bold text-xs rounded-lg hover:bg-mosque/90 active:scale-95 transition-all outline-none cursor-pointer flex items-center gap-1"
                        >
                          <Icon name="person_add" className="h-3.5 w-3.5" />
                          <span>Activar Personal</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Activation Form */}
                  {isActivating && (
                    <div className="mt-4 pt-4 border-t border-nordic/10 space-y-4">
                      <h5 className="text-xs font-bold text-nordic uppercase tracking-wider">
                        Datos del Trabajador a Asignar
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold tracking-wider text-nordic/50 uppercase">
                            Apellidos y Nombres *
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. SUCARI SUCARI, LUIS"
                            value={nombres}
                            onChange={(e) => setNombres(e.target.value)}
                            required
                            className="w-full bg-white border border-nordic/15 px-3 py-1.5 text-xs font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 placeholder:text-nordic/30"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold tracking-wider text-nordic/50 uppercase">
                            Código de Trabajador *
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. 008123"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            required
                            className="w-full bg-white border border-nordic/15 px-3 py-1.5 text-xs font-mono font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 placeholder:text-nordic/30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold tracking-wider text-nordic/50 uppercase">
                            DNI *
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. 70543210"
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            required
                            className="w-full bg-white border border-nordic/15 px-3 py-1.5 text-xs font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 placeholder:text-nordic/30"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold tracking-wider text-nordic/50 uppercase">
                            Capataz Asignado *
                          </label>
                          <select
                            value={capataz}
                            onChange={(e) => setCapataz(e.target.value)}
                            className="w-full bg-white border border-nordic/15 px-3 py-1.5 text-xs font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40"
                          >
                            {existingCapataces.map((cap) => (
                              <option key={cap} value={cap}>
                                {cap}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold tracking-wider text-nordic/50 uppercase">
                            Fecha de Ingreso *
                          </label>
                          <input
                            type="date"
                            value={fecing}
                            onChange={(e) => setFecing(e.target.value)}
                            required
                            className="w-full bg-white border border-nordic/15 px-3 py-1.5 text-xs font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40"
                          />
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          onClick={handleCancelActivation}
                          type="button"
                          disabled={isSubmitting}
                          className="px-3.5 py-1.5 text-xs font-bold text-nordic hover:bg-clear-day rounded-lg transition-all outline-none"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleConfirmActivation(req.id)}
                          type="button"
                          disabled={isSubmitting}
                          className="px-4 py-1.5 bg-mosque text-clear-day font-bold text-xs rounded-lg hover:bg-mosque/90 active:scale-95 transition-all outline-none disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Activando...</span>
                            </>
                          ) : (
                            <span>Confirmar Activación</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
