"use client";

import React, { useState, useEffect } from "react";
import { Requirement } from "./types";
import Icon from "./Icon";

interface RequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: Requirement) => void;
  editingReq: Requirement | null;
  nextCode: string;
}

export default function RequirementModal({
  isOpen,
  onClose,
  onSubmit,
  editingReq,
  nextCode,
}: RequirementModalProps) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<Requirement["type"]>("Staff");
  const [module, setModule] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [description, setDescription] = useState("");
  const [requestor, setRequestor] = useState("");
  const [priority, setPriority] = useState<Requirement["priority"]>("MEDIUM");
  const [hasAttachment, setHasAttachment] = useState(false);

  // Synchronize state when opening modal (either editing or adding)
  useEffect(() => {
    if (isOpen) {
      if (editingReq) {
        setCode(editingReq.code);
        setType(editingReq.type);
        setModule(editingReq.module);
        setRequestDate(editingReq.requestDate);
        setDescription(editingReq.description);
        setRequestor(editingReq.requestor);
        setPriority(editingReq.priority);
        setHasAttachment(!!editingReq.attachmentUrl);
      } else {
        setCode(nextCode);
        setType("Staff");
        setModule("");
        setRequestDate(new Date().toISOString().slice(0, 10));
        setDescription("");
        setRequestor("");
        setPriority("MEDIUM");
        setHasAttachment(false);
      }
    }
  }, [isOpen, editingReq, nextCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!module.trim() || !description.trim() || !requestor.trim()) {
      alert("Por favor rellene todos los campos obligatorios.");
      return;
    }

    const requirement: Requirement = {
      code,
      type,
      module: module.trim(),
      requestDate,
      description: description.trim(),
      requestor: requestor.trim(),
      priority,
      status: editingReq ? editingReq.status : "PENDING",
      attachmentUrl: hasAttachment ? "#" : undefined,
    };

    onSubmit(requirement);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-nordic/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white w-full max-w-lg border border-nordic/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="bg-nordic text-clear-day px-6 py-4 flex justify-between items-center">
          <h3 className="font-sf-pro font-bold text-base md:text-lg text-hint-of-green">
            {editingReq ? "Editar Requerimiento" : "Nuevo Requerimiento ASSA"}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1: Code & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
                Código Requerimiento
              </label>
              <input
                type="text"
                value={code}
                disabled
                className="w-full bg-clear-day border border-nordic/15 px-3 py-2 text-xs md:text-sm font-mono font-bold text-nordic/60 rounded-lg outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
                Tipo Recurso
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Requirement["type"])}
                className="w-full bg-clear-day border border-nordic/15 px-3 py-2 text-xs md:text-sm font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40"
              >
                <option value="Staff">Staff (Personal)</option>
                <option value="Machine">Machine (Servidor/Equipos)</option>
                <option value="Service">Service (Servicio Externo)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Module & Requestor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
                Módulo / Área *
              </label>
              <input
                type="text"
                placeholder="Ej. Facturación"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                required
                className="w-full bg-white border border-nordic/15 px-3 py-2 text-xs md:text-sm font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 placeholder:text-nordic/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
                Solicitante *
              </label>
              <input
                type="text"
                placeholder="Ej. Carlos Torres"
                value={requestor}
                onChange={(e) => setRequestor(e.target.value)}
                required
                className="w-full bg-white border border-nordic/15 px-3 py-2 text-xs md:text-sm font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 placeholder:text-nordic/30"
              />
            </div>
          </div>

          {/* Row 3: Priority & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
                Prioridad *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Requirement["priority"])}
                className="w-full bg-clear-day border border-nordic/15 px-3 py-2 text-xs md:text-sm font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40"
              >
                <option value="HIGH">Alta (High)</option>
                <option value="MEDIUM">Media (Medium)</option>
                <option value="LOW">Baja (Low)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
                Fecha de Solicitud *
              </label>
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                required
                className="w-full bg-white border border-nordic/15 px-3 py-2 text-xs md:text-sm font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
              Descripción / Especificaciones Detalladas *
            </label>
            <textarea
              placeholder="Detalle las especificaciones técnicas o necesidades de personal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full bg-white border border-nordic/15 px-3 py-2 text-xs md:text-sm font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 placeholder:text-nordic/30"
            />
          </div>

          {/* Attachment upload */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
              Documentación Adjunta (PDF, Word)
            </label>
            <div
              onClick={() => setHasAttachment(!hasAttachment)}
              className={`border-2 border-dashed rounded-xl px-6 py-5 flex flex-col items-center justify-center cursor-pointer transition-colors group ${
                hasAttachment
                  ? "border-mosque bg-hint-of-green/20"
                  : "border-nordic/15 bg-clear-day hover:bg-clear-day/80"
              }`}
            >
              <Icon
                name={hasAttachment ? "check_circle" : "upload_file"}
                className={`h-8 w-8 mb-1 transition-colors ${
                  hasAttachment ? "text-mosque" : "text-nordic/40 group-hover:text-mosque"
                }`}
              />
              <p className="text-[11px] font-bold text-nordic">
                {hasAttachment
                  ? "Archivo adjuntado correctamente"
                  : "Presione para adjuntar especificación técnica"}
              </p>
              <p className="text-[9px] text-nordic/40 uppercase mt-0.5">
                {hasAttachment ? "Haga clic para remover" : "PDF, DOCX hasta 10MB"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-nordic/5">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-2 rounded-lg text-xs md:text-sm font-bold text-nordic hover:bg-clear-day active:scale-98 transition-all cursor-pointer outline-none"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-mosque text-clear-day rounded-lg font-bold text-xs md:text-sm shadow-md hover:bg-mosque/95 active:scale-98 transition-all cursor-pointer outline-none"
            >
              {editingReq ? "GUARDAR CAMBIOS" : "ENVIAR REQUERIMIENTO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
