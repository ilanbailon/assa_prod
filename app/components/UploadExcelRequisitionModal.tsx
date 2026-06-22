"use client";

import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import {
  overwriteMaterialRequisitionAction,
  updateRequisitionDescriptionAction,
  updateRequisitionFechaPedidoAction,
  uploadRequisitionPdfAction,
} from "../actions";
import * as XLSX from "xlsx";

interface UploadExcelRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UploadExcelRequisitionModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadExcelRequisitionModalProps) {
  const [codigoRequerimiento, setCodigoRequerimiento] = useState("");
  const [description, setDescription] = useState("");
  const [fechaPedido, setFechaPedido] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCodigoRequerimiento("");
      setDescription("");
      setFechaPedido("");
      setPdfFile(null);
      setExcelFile(null);
      setSaveStatus("");
      setIsSaving(false);
    }
  }, [isOpen]);

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

  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

          if (rawData.length <= 1) {
            reject(new Error("El archivo Excel está vacío o no tiene el formato correcto."));
            return;
          }

          const parsedItems: any[] = [];
          for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;

            const codigoRecurso = row[2] !== undefined && row[2] !== null ? String(row[2]).trim() : null;
            const recurso = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : null;
            const unidad = row[4] !== undefined && row[4] !== null ? String(row[4]).trim() : "UND";
            const cantidadVal = row[5];
            
            if (!recurso && !codigoRecurso) continue;

            let cantidad = 0;
            if (typeof cantidadVal === "number") {
              cantidad = cantidadVal;
            } else if (cantidadVal) {
              cantidad = parseFloat(String(cantidadVal)) || 0;
            }

            parsedItems.push({
              codigoRecurso,
              recurso: recurso || "Insumo sin nombre",
              unidad,
              cantidad,
            });
          }
          resolve(parsedItems);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setExcelFile(file);
    if (file && !codigoRequerimiento) {
      const name = file.name;
      const dotIndex = name.lastIndexOf(".");
      const code = dotIndex !== -1 ? name.substring(0, dotIndex) : name;
      setCodigoRequerimiento(code);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = codigoRequerimiento.trim();
    if (!cleanCode) {
      alert("Por favor ingrese el código del requerimiento.");
      return;
    }

    setIsSaving(true);
    setSaveStatus("Iniciando carga...");

    try {
      // 1. Process Excel File first if uploaded (so that requisition rows exist)
      if (excelFile) {
        setSaveStatus("Leyendo y procesando archivo Excel...");
        const parsedItems = await parseExcelFile(excelFile);
        
        setSaveStatus("Guardando insumos en la base de datos...");
        const res = await overwriteMaterialRequisitionAction(cleanCode, parsedItems);
        if (!res.success) {
          throw new Error("Error al guardar insumos del Excel: " + res.error);
        }
      }

      // 2. Save Description if provided
      if (description.trim()) {
        setSaveStatus("Actualizando descripción...");
        const res = await updateRequisitionDescriptionAction(cleanCode, description.trim());
        if (!res.success) {
          throw new Error("Error al guardar descripción: " + res.error);
        }
      }

      // 3. Save Fecha Pedido if provided
      if (fechaPedido) {
        setSaveStatus("Actualizando fecha de pedido...");
        const res = await updateRequisitionFechaPedidoAction(cleanCode, fechaPedido);
        if (!res.success) {
          throw new Error("Error al guardar fecha de pedido: " + res.error);
        }
      }

      // 4. Upload PDF if selected
      if (pdfFile) {
        setSaveStatus("Cargando documento PDF...");
        const base64Data = await convertFileToBase64(pdfFile);
        const res = await uploadRequisitionPdfAction(
          cleanCode,
          pdfFile.name,
          base64Data,
          pdfFile.type
        );
        if (!res.success) {
          throw new Error("Error al cargar PDF: " + res.error);
        }
      }

      setSaveStatus("¡Carga completada exitosamente!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert("Error en el proceso de carga: " + err.message);
      setSaveStatus("Error en la carga");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-nordic/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg border border-nordic/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-nordic text-clear-day px-5 py-3.5 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-sf-pro font-bold text-sm md:text-base text-hint-of-green">
              Cargar Requerimiento de Materiales
            </h3>
            <p className="text-[10px] text-clear-day/70 mt-0.5 font-semibold">
              Sube archivos Excel, documentos PDF o edita metadatos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-clear-day/10 rounded-full p-1.5 transition-colors cursor-pointer outline-none flex items-center justify-center text-clear-day"
            type="button"
            disabled={isSaving}
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-semibold text-slate-800">
          {/* Requisition Code */}
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Código del Requerimiento *
            </label>
            <input
              type="text"
              placeholder="Ej. 105 (Se auto-rellena con el nombre del Excel)"
              value={codigoRequerimiento}
              onChange={(e) => setCodigoRequerimiento(e.target.value)}
              disabled={isSaving}
              required
              className="w-full bg-white border border-slate-200 py-1.5 px-3 text-xs font-mono font-bold text-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-mosque/40 focus:border-mosque transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Descripción del Requerimiento (Opcional)
            </label>
            <textarea
              placeholder="Ej. Insumos para encofrado - Tramo II"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={2}
              className="w-full bg-white border border-slate-200 py-1.5 px-3 text-xs font-semibold text-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-mosque/40 focus:border-mosque transition-all font-sans resize-none"
            />
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Fecha de Pedido (Opcional)
            </label>
            <input
              type="date"
              value={fechaPedido}
              onChange={(e) => setFechaPedido(e.target.value)}
              disabled={isSaving}
              className="w-full bg-white border border-slate-200 py-1.5 px-3 text-xs font-semibold text-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-mosque/40 focus:border-mosque transition-all font-mono"
            />
          </div>

          {/* Excel File Select */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Archivo Excel de Insumos (Opcional)
            </label>
            <div className="relative border border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors">
              <input
                type="file"
                accept=".xlsx, .xls"
                disabled={isSaving}
                onChange={handleExcelChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                <Icon name="table_chart" className="h-6 w-6 text-emerald-600 mx-auto animate-pulse" />
                <p className="text-[10px] text-slate-600 font-bold">
                  {excelFile ? excelFile.name : "Seleccione o arrastre un archivo Excel (.xlsx, .xls)"}
                </p>
                <p className="text-[8px] text-slate-400 font-medium">Extraerá automáticamente el código del nombre</p>
              </div>
            </div>
          </div>

          {/* PDF File Select */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Documento PDF del Requerimiento (Opcional)
            </label>
            <div className="relative border border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                disabled={isSaving}
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                <Icon name="picture_as_pdf" className="h-6 w-6 text-red-500 mx-auto" />
                <p className="text-[10px] text-slate-600 font-bold">
                  {pdfFile ? pdfFile.name : "Seleccione o arrastre un documento PDF"}
                </p>
                <p className="text-[8px] text-slate-400 font-medium">Formato admitido: PDF</p>
              </div>
            </div>
          </div>

          {/* Status Alert */}
          {saveStatus && (
            <div className="text-center pt-1 animate-fade-in">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-mosque bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                {isSaving && (
                  <span className="animate-spin inline-block w-2.5 h-2.5 border-2 border-mosque border-t-transparent rounded-full" />
                )}
                {saveStatus}
              </span>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-150 active:scale-98 transition-all outline-none cursor-pointer text-center text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2 bg-mosque text-clear-day font-bold rounded-lg hover:bg-mosque/95 active:scale-98 transition-all outline-none cursor-pointer text-center text-[10px] tracking-wider uppercase"
            >
              {isSaving ? "Guardando..." : "Guardar Requerimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
