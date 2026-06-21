"use client";

import React, { useState, useEffect } from "react";
import Icon from "./Icon";

interface RequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    tramo: string;
    solicitud: string;
    fechaSolicitud: string;
    cargo: string;
    cantidad: number;
  }) => Promise<void>;
  existingTramos: string[];
  existingCargos: string[];
}

export default function RequirementModal({
  isOpen,
  onClose,
  onSubmit,
  existingTramos,
  existingCargos,
}: RequirementModalProps) {
  const [tramo, setTramo] = useState("");
  const [solicitud, setSolicitud] = useState("");
  const [fechaSolicitud, setFechaSolicitud] = useState("");
  const [cargo, setCargo] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default values when opening modal
  useEffect(() => {
    if (isOpen) {
      setTramo(existingTramos[0] || "");
      // Generate a requirement code estimate or leave empty
      const currentYear = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 90000) + 10000;
      setSolicitud(`${currentYear}-${randomNum}`);
      setFechaSolicitud(new Date().toISOString().slice(0, 10));
      setCargo(existingCargos[0] || "");
      setCantidad(1);
      setIsSubmitting(false);
    }
  }, [isOpen, existingTramos, existingCargos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tramo || !cargo || cantidad <= 0 || !solicitud.trim()) {
      alert("Por favor rellene todos los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        tramo,
        solicitud: solicitud.trim(),
        fechaSolicitud,
        cargo,
        cantidad,
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar el requerimiento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md border-2 border-slate-300 shadow-xl rounded-lg overflow-hidden flex flex-col animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-slate-100 text-slate-800 px-4 py-2.5 flex justify-between items-center shrink-0 border-b border-slate-200">
          <h3 className="font-sf-pro font-bold text-xs md:text-sm text-slate-900">
            Registrar Requerimiento de Personal
          </h3>
          <button
            onClick={onClose}
            className="hover:bg-slate-200 rounded p-1 transition-colors cursor-pointer outline-none flex items-center justify-center text-slate-500"
            type="button"
          >
            <Icon name="close" className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs font-semibold text-slate-800">
          {/* Frente / Tramo Dropdown */}
          <div className="space-y-1">
            <label className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase">
              Frente (Tramo) *
            </label>
            <select
              value={tramo}
              onChange={(e) => setTramo(e.target.value)}
              className="w-full bg-white border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400"
            >
              {existingTramos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Solicitud / Nro Requerimiento */}
          <div className="space-y-1">
            <label className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase">
              Nro. Requerimiento (Solicitud) *
            </label>
            <input
              type="text"
              placeholder="Ej. 2026-03462"
              value={solicitud}
              onChange={(e) => setSolicitud(e.target.value)}
              required
              className="w-full bg-white border border-slate-200 px-2 py-1.5 text-xs font-mono font-semibold text-slate-800 rounded outline-none focus:border-slate-400"
            />
          </div>

          {/* Fecha de Solicitud */}
          <div className="space-y-1">
            <label className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase">
              Fecha de Solicitud *
            </label>
            <input
              type="date"
              value={fechaSolicitud}
              onChange={(e) => setFechaSolicitud(e.target.value)}
              required
              className="w-full bg-white border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400 font-mono"
            />
          </div>

          {/* Cargo / Puesto Existing Dropdown */}
          <div className="space-y-1">
            <label className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase">
              Puesto (Cargo Existente) *
            </label>
            <select
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="w-full bg-white border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400"
            >
              {existingCargos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="space-y-1">
            <label className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase">
              Cantidad de Personal Requerido *
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value, 10) || 1)}
              required
              className="w-full bg-white border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400 font-mono"
            />
            <p className="text-[9px] text-slate-400 italic">
              Se insertarán {cantidad} fila(s) individuales en la base de datos.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
              className="flex-1 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded shadow-xs hover:bg-slate-200 active:scale-98 transition-all cursor-pointer outline-none disabled:opacity-50"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-1.5 bg-mosque text-clear-day rounded font-bold hover:bg-mosque/95 active:scale-98 transition-all cursor-pointer outline-none disabled:opacity-50 flex items-center justify-center gap-1.5 text-[9px] tracking-wider uppercase"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>REGISTRANDO...</span>
                </>
              ) : (
                <span>REGISTRAR</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
