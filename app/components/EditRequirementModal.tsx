"use client";

import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import {
  updateRequisitionFechaPedidoAction,
  updateRequisitionDescriptionAction,
  uploadRequisitionPdfAction,
} from "../actions";

interface EditRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  codigoRequerimiento: string;
  currentFechaPedido: string | null;
  currentPdfUrl: string | null;
  currentDescription: string | null;
  onSuccess: () => void;
}

export default function EditRequirementModal({
  isOpen,
  onClose,
  codigoRequerimiento,
  currentFechaPedido,
  currentPdfUrl,
  currentDescription,
  onSuccess,
}: EditRequirementModalProps) {
  const [fechaPedido, setFechaPedido] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFechaPedido(currentFechaPedido || "");
      setDescription(currentDescription || "");
      setPdfFile(null);
      setSaveStatus("");
    }
  }, [isOpen, currentFechaPedido, currentDescription]);

  if (!isOpen) return null;

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("Guardando cambios...");

    try {
      // 1. Save Fecha Pedido if modified
      if (fechaPedido !== (currentFechaPedido || "")) {
        setSaveStatus("Actualizando fecha de pedido...");
        const res = await updateRequisitionFechaPedidoAction(
          codigoRequerimiento,
          fechaPedido || null
        );
        if (!res.success) {
          throw new Error("Error al guardar la fecha: " + res.error);
        }
      }

      // 2. Save Description if modified
      if (description !== (currentDescription || "")) {
        setSaveStatus("Actualizando descripción del requerimiento...");
        const res = await updateRequisitionDescriptionAction(
          codigoRequerimiento,
          description || null
        );
        if (!res.success) {
          throw new Error("Error al guardar la descripción: " + res.error);
        }
      }

      // 3. Upload PDF if selected
      if (pdfFile) {
        setSaveStatus("Sincronizando PDF con Supabase Storage...");
        const base64Data = await convertFileToBase64(pdfFile);
        const res = await uploadRequisitionPdfAction(
          codigoRequerimiento,
          pdfFile.name,
          base64Data,
          pdfFile.type
        );
        if (!res.success) {
          throw new Error("Error al cargar PDF: " + res.error);
        }
      }

      setSaveStatus("¡Guardado exitosamente!");
      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Error: " + err.message);
      setSaveStatus("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg border-2 border-slate-300 shadow-xl rounded-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="bg-slate-100 text-slate-800 px-4 py-2.5 flex justify-between items-center shrink-0 border-b border-slate-200">
          <div>
            <h3 className="font-sf-pro font-bold text-xs md:text-sm text-slate-900">
              Editar Requerimiento
            </h3>
            <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
              Requerimiento #{codigoRequerimiento} &mdash; Propiedades
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-slate-200 rounded p-1 transition-colors cursor-pointer outline-none flex items-center justify-center text-slate-500"
            type="button"
            disabled={isSaving}
          >
            <Icon name="close" className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-semibold text-slate-800">
          {/* Requisition Description */}
          <div className="space-y-1">
            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              Descripción del Requerimiento
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              placeholder="Ej. Tuberías y codos para el tramo 3 - Capataz: Juan Pérez"
              rows={2}
              className="w-full bg-white border border-slate-200 py-1.5 px-2 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400 transition-all font-sans resize-none"
            />
          </div>

          {/* Fecha Pedido */}
          <div className="space-y-1">
            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              Fecha de Pedido
            </label>
            <input
              type="date"
              value={fechaPedido}
              onChange={(e) => setFechaPedido(e.target.value)}
              disabled={isSaving}
              className="w-full bg-white border border-slate-200 py-1 px-2 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400 transition-all font-mono"
            />
          </div>

          {/* PDF Upload */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              Documento PDF del Requerimiento
            </label>

            {currentPdfUrl && (
              <div className="bg-emerald-55/10 border border-emerald-200 rounded p-2 flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon name="picture_as_pdf" className="h-4 w-4 text-red-600 shrink-0" />
                  <span className="truncate text-[9px] font-bold text-slate-600">
                    PDF cargado en el sistema
                  </span>
                </div>
                <a
                  href={currentPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] font-bold text-mosque hover:underline flex items-center gap-0.5 shrink-0"
                >
                  Ver PDF
                </a>
              </div>
            )}

            <div className="relative border border-dashed border-slate-300 rounded p-4 text-center bg-slate-50 hover:bg-slate-100/70 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                id="edit-pdf-file"
                disabled={isSaving}
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                <Icon name="upload_file" className="h-6 w-6 text-slate-400 mx-auto" />
                <p className="text-[9px] text-slate-500 font-bold">
                  {pdfFile ? pdfFile.name : "Haga clic o arrastre un archivo PDF para cargar/reemplazar"}
                </p>
                <p className="text-[8px] text-slate-400 font-medium">Solo PDF</p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {saveStatus && (
            <div className="text-center pt-1">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-mosque bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                {isSaving && (
                  <span className="animate-spin inline-block w-2 h-2 border-2 border-mosque border-t-transparent rounded-full" />
                )}
                {saveStatus}
              </span>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded shadow-xs hover:bg-slate-200 active:scale-98 transition-all outline-none cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-1.5 bg-mosque text-clear-day font-bold rounded shadow-sm hover:bg-mosque/95 active:scale-98 transition-all outline-none cursor-pointer text-center uppercase text-[9px] tracking-wider"
            >
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
