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
    <div className="fixed inset-0 bg-nordic/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white w-full max-w-md border border-nordic/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="bg-nordic text-clear-day px-6 py-4 flex justify-between items-center">
          <h3 className="font-sf-pro font-bold text-base md:text-lg text-hint-of-green">
            Registrar Requerimiento de Personal
          </h3>
          <button
            onClick={onClose}
            className="hover:bg-clear-day/10 rounded-full p-1.5 transition-colors cursor-pointer outline-none flex items-center justify-center text-clear-day"
            type="button"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Frente / Tramo Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
              Frente (Tramo) *
            </label>
            <select
              value={tramo}
              onChange={(e) => setTramo(e.target.value)}
              className="w-full bg-clear-day border border-nordic/15 px-3 py-2 text-xs md:text-sm font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40"
            >
              {existingTramos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Solicitud / Nro Requerimiento */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
              Nro. Requerimiento (Solicitud) *
            </label>
            <input
              type="text"
              placeholder="Ej. 2026-03462"
              value={solicitud}
              onChange={(e) => setSolicitud(e.target.value)}
              required
              className="w-full bg-white border border-nordic/15 px-3 py-2 text-xs md:text-sm font-mono font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 placeholder:text-nordic/30"
            />
          </div>

          {/* Fecha de Solicitud */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
              Fecha de Solicitud *
            </label>
            <input
              type="date"
              value={fechaSolicitud}
              onChange={(e) => setFechaSolicitud(e.target.value)}
              required
              className="w-full bg-white border border-nordic/15 px-3 py-2 text-xs md:text-sm font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40"
            />
          </div>

          {/* Cargo / Puesto Existing Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
              Puesto (Cargo Existente) *
            </label>
            <select
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="w-full bg-clear-day border border-nordic/15 px-3 py-2 text-xs md:text-sm font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40"
            >
              {existingCargos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad (Quantity) */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
              Cantidad de Personal Requerido *
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value, 10) || 1)}
              required
              className="w-full bg-white border border-nordic/15 px-3 py-2 text-xs md:text-sm font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40"
            />
            <p className="text-[10px] text-nordic/40 italic">
              Se insertarán {cantidad} fila(s) individuales en la base de datos al enviar.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-nordic/5">
            <button
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
              className="flex-1 py-2 rounded-lg text-xs md:text-sm font-bold text-nordic hover:bg-clear-day active:scale-98 transition-all cursor-pointer outline-none disabled:opacity-50"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-mosque text-clear-day rounded-lg font-bold text-xs md:text-sm shadow-md hover:bg-mosque/95 active:scale-98 transition-all cursor-pointer outline-none disabled:opacity-50 flex items-center justify-center gap-1.5"
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
