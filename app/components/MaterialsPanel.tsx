"use client";

import React, { useState, useEffect, useRef } from "react";
import { MaterialRequirement, MaterialReceipt } from "./types";
import Icon from "./Icon";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import PdfViewerModal from "./PdfViewerModal";
import {
  updateMaterialRequirementFieldAction,
  addMaterialReceiptAction,
  deleteMaterialReceiptAction,
  updateRequisitionFechaPedidoAction,
  uploadRequisitionPdfAction,
  overwriteMaterialRequisitionAction,
} from "../actions";

interface MaterialsPanelProps {
  items: MaterialRequirement[];
  searchQuery: string;
}

// Editable Row for Desktop Insumos (without Fecha Pedido column)
interface EditableAlmacenRowProps {
  item: MaterialRequirement;
  onSaveField: (id: number, fields: any) => Promise<boolean>;
  onAddReceipt: (materialRequirementId: number, qty: number, date: string) => Promise<boolean>;
  onDeleteReceipt: (id: number) => Promise<boolean>;
}

function EditableAlmacenRow({
  item,
  onSaveField,
  onAddReceipt,
  onDeleteReceipt,
}: EditableAlmacenRowProps) {
  // En Almacén Qty states
  const [almVal, setAlmVal] = useState(item.cantidadAlmacen || "0");

  // Partida Code states
  const [partidaCodeVal, setPartidaCodeVal] = useState(item.partidaControlCode || "");
  const [isEditingPartidaCode, setIsEditingPartidaCode] = useState(false);
  const [isSavingPartidaCode, setIsSavingPartidaCode] = useState(false);

  // Partida Description states
  const [partidaDescVal, setPartidaDescVal] = useState(item.partidaControl || "");
  const [isEditingPartidaDesc, setIsEditingPartidaDesc] = useState(false);
  const [isSavingPartidaDesc, setIsSavingPartidaDesc] = useState(false);

  // Receipts History Panel state
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [newReceiptQty, setNewReceiptQty] = useState("");
  const [newReceiptDate, setNewReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const [deletingReceiptId, setDeletingReceiptId] = useState<number | null>(null);


  useEffect(() => {
    setAlmVal(item.cantidadAlmacen || "0");
  }, [item.cantidadAlmacen]);

  useEffect(() => {
    setPartidaCodeVal(item.partidaControlCode || "");
  }, [item.partidaControlCode]);

  useEffect(() => {
    setPartidaDescVal(item.partidaControl || "");
  }, [item.partidaControl]);

  // Save Partida Code
  const handleSavePartidaCode = async () => {
    const val = partidaCodeVal ? partidaCodeVal.trim() : null;
    if (val === (item.partidaControlCode || null)) {
      setIsEditingPartidaCode(false);
      return;
    }
    setIsSavingPartidaCode(true);
    const success = await onSaveField(item.id, { partidaControlCode: val });
    setIsSavingPartidaCode(false);
    if (success) setIsEditingPartidaCode(false);
  };

  // Save Partida Description
  const handleSavePartidaDesc = async () => {
    const val = partidaDescVal ? partidaDescVal.trim() : null;
    if (val === (item.partidaControl || null)) {
      setIsEditingPartidaDesc(false);
      return;
    }
    setIsSavingPartidaDesc(true);
    const success = await onSaveField(item.id, { partidaControl: val });
    setIsSavingPartidaDesc(false);
    if (success) setIsEditingPartidaDesc(false);
  };

  // Add Partial Receipt
  const handleAddReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(newReceiptQty);
    if (isNaN(qty) || qty <= 0) {
      alert("Por favor ingrese una cantidad válida y mayor a 0.");
      return;
    }
    if (!newReceiptDate) {
      alert("Por favor seleccione una fecha.");
      return;
    }

    setIsSavingReceipt(true);
    const success = await onAddReceipt(item.id, qty, newReceiptDate);
    setIsSavingReceipt(false);
    if (success) {
      setNewReceiptQty("");
    }
  };

  const qtyReq = item.cantidad || 0;
  const qtyAlm = parseFloat(almVal) || 0;

  let itemStatus = "Sin Recibir";
  let statusClass = "bg-red-50 text-red-700 border-red-200";
  if (qtyAlm >= qtyReq && qtyReq > 0) {
    itemStatus = "Completo";
    statusClass = "bg-hint-of-green text-mosque border-mosque/20";
  } else if (qtyAlm > 0) {
    itemStatus = "Parcial";
    statusClass = "bg-amber-50 text-amber-800 border-amber-200";
  }

  const numReceipts = item.receipts?.length || 0;

  return (
    <>
      <tr className="hover:bg-clear-day/20 transition-colors text-xs font-semibold text-nordic">
        {/* Código Insumo */}
        <td className="px-4 py-2.5 font-mono text-nordic/50 text-[10px]">{item.codigoRecurso || "-"}</td>
        
        {/* Insumo */}
        <td className="px-4 py-2.5 font-bold text-nordic">{item.recurso}</td>
        
        {/* Unidad */}
        <td className="px-3 py-2.5 text-center font-bold text-nordic/70">{item.unidad}</td>
        
        {/* Cantidad Solicitada */}
        <td className="px-3 py-2.5 text-right font-extrabold text-nordic">{item.cantidad?.toLocaleString()}</td>

        {/* En Almacén (Only updated by Receipts) */}
        <td className="px-3 py-2.5 text-center min-w-[100px]">
          <div
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className={`flex items-center justify-center gap-1 font-extrabold cursor-pointer hover:underline ${
              numReceipts > 0 ? "text-mosque" : "text-nordic hover:text-mosque"
            }`}
            title={
              numReceipts > 0
                ? "Sumado por historial de entregas parciales. Click para ver historial."
                : "Click para registrar entregas parciales."
            }
          >
            <span>{almVal}</span>
            <Icon
              name="history"
              className={`h-3 w-3 ${numReceipts > 0 ? "text-mosque" : "text-nordic/30"}`}
            />
          </div>
        </td>

        {/* Estado badge */}
        <td className="px-3 py-2.5 text-center">
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusClass}`}>
            {itemStatus}
          </span>
        </td>

        <td className="px-3 py-2.5 text-right text-nordic/60 font-semibold">{item.cantidadCotizacion || "0"}</td>
        <td className="px-3 py-2.5 text-right text-nordic/60 font-semibold">{item.cantidadOrdenCompra || "0"}</td>

        {/* Partida de Control Code and Description */}
        <td className="px-4 py-2.5 min-w-[200px]">
          <div className="flex flex-col gap-0.5">
            {/* Code */}
            {isEditingPartidaCode ? (
              <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Código"
                  value={partidaCodeVal}
                  onChange={(e) => setPartidaCodeVal(e.target.value)}
                  onBlur={handleSavePartidaCode}
                  onKeyDown={(e) => e.key === "Enter" && handleSavePartidaCode()}
                  disabled={isSavingPartidaCode}
                  autoFocus
                  className="w-24 bg-white border border-mosque text-[10px] font-mono py-0.5 px-1 rounded outline-none"
                />
              </div>
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingPartidaCode(true);
                }}
                className="group/code font-mono text-[10px] text-nordic/45 cursor-pointer hover:text-mosque flex items-center gap-1"
              >
                <span>{partidaCodeVal || "Código Partida"}</span>
                <Icon name="edit" className="h-2.5 w-2.5 opacity-0 group-hover/code:opacity-100" />
              </div>
            )}

            {/* Description */}
            {isEditingPartidaDesc ? (
              <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Descripción partida / requerimiento"
                  value={partidaDescVal}
                  onChange={(e) => setPartidaDescVal(e.target.value)}
                  onBlur={handleSavePartidaDesc}
                  onKeyDown={(e) => e.key === "Enter" && handleSavePartidaDesc()}
                  disabled={isSavingPartidaDesc}
                  autoFocus
                  className="w-full bg-white border border-mosque text-[11px] py-0.5 px-1 rounded outline-none font-semibold text-nordic"
                />
              </div>
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingPartidaDesc(true);
                }}
                className="group/desc text-[11px] text-nordic/70 font-semibold cursor-pointer hover:text-mosque flex items-center gap-1 leading-tight"
              >
                <span className="truncate max-w-[220px]" title={partidaDescVal || ""}>
                  {partidaDescVal || "Agregar descripción partida..."}
                </span>
                <Icon name="edit" className="h-2.5 w-2.5 opacity-0 group-hover/desc:opacity-100" />
              </div>
            )}
          </div>
        </td>

        {/* Cronograma de entrega */}
        <td className="px-4 py-2.5 text-[10px] text-nordic/50 leading-tight font-medium">
          {item.cronogramaEntrega || "-"}
        </td>

        {/* Entregas Log Expander Action */}
        <td className="px-3 py-2.5 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsHistoryExpanded(!isHistoryExpanded);
            }}
            className={`flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1 border rounded-lg transition-all cursor-pointer outline-none ${
              isHistoryExpanded
                ? "bg-mosque text-clear-day border-mosque"
                : "bg-clear-day text-mosque border-mosque/20 hover:bg-mosque/5"
            }`}
          >
            <Icon name="local_shipping" className="h-3.5 w-3.5" />
            <span>{numReceipts}</span>
          </button>
        </td>
      </tr>

      {/* Expanded Receipts Log Row */}
      {isHistoryExpanded && (
        <tr className="bg-clear-day/30 border-t border-b border-nordic/10 text-xs">
          <td colSpan={11} className="p-4">
            <div className="max-w-3xl bg-white border border-nordic/15 rounded-xl shadow-inner p-4 flex flex-col md:flex-row gap-6" onClick={(e) => e.stopPropagation()}>
              {/* Receipt List */}
              <div className="flex-1 space-y-2">
                <h6 className="font-sf-pro text-[10px] font-bold text-nordic/50 uppercase tracking-wider mb-2">
                  Historial de Entregas Parciales en Almacén ({numReceipts})
                </h6>
                {numReceipts === 0 ? (
                  <p className="text-[11px] text-nordic/45 italic py-2 pl-1">
                    No se han registrado entregas parciales para este insumo. Registre una entrega a la derecha.
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
                    {item.receipts?.map((r) => (
                      <div
                        key={r.id}
                        className="flex justify-between items-center bg-clear-day/20 border border-nordic/5 rounded-lg py-1 px-3"
                      >
                        <span className="font-semibold text-nordic/70">
                          Fecha: <strong className="text-nordic font-mono">{r.fecha}</strong>
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="font-extrabold text-mosque">
                            +{r.cantidad.toLocaleString()} {item.unidad}
                          </span>
                          {deletingReceiptId === r.id ? (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-lg">
                              <span className="text-[9px] font-bold text-red-700 mr-1 uppercase">¿Eliminar?</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteReceipt(r.id);
                                  setDeletingReceiptId(null);
                                }}
                                className="text-red-600 hover:text-red-800 p-0.5 cursor-pointer flex items-center justify-center"
                                title="Confirmar eliminación"
                              >
                                <Icon name="check_circle" className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingReceiptId(null)}
                                className="text-nordic/50 hover:text-nordic p-0.5 cursor-pointer flex items-center justify-center"
                                title="Cancelar"
                              >
                                <Icon name="close" className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingReceiptId(r.id)}
                              className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                              title="Eliminar entrega parcial"
                            >
                              <Icon name="delete" className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Receipt Form */}
              <form onSubmit={handleAddReceipt} className="w-full md:w-72 shrink-0 border-t md:border-t-0 md:border-l border-nordic/10 pt-4 md:pt-0 md:pl-6 space-y-3">
                <h6 className="font-sf-pro text-[10px] font-bold text-nordic/50 uppercase tracking-wider">
                  Registrar Nueva Entrega
                </h6>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-bold text-nordic/40 uppercase">Cantidad</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="Ej. 20"
                      value={newReceiptQty}
                      onChange={(e) => setNewReceiptQty(e.target.value)}
                      disabled={isSavingReceipt}
                      className="w-full bg-clear-day border border-nordic/10 py-1 px-2 text-xs font-bold text-nordic rounded"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[8px] font-bold text-nordic/40 uppercase">Fecha</label>
                    <input
                      type="date"
                      required
                      value={newReceiptDate}
                      onChange={(e) => setNewReceiptDate(e.target.value)}
                      disabled={isSavingReceipt}
                      className="w-full bg-clear-day border border-nordic/10 py-1 px-2 text-xs font-bold text-nordic rounded"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingReceipt}
                  className="w-full py-1.5 bg-mosque text-clear-day font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-mosque/95 transition-all outline-none cursor-pointer flex items-center justify-center gap-1"
                >
                  {isSavingReceipt ? (
                    <>
                      <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="add" className="h-3 w-3" />
                      <span>Registrar Entrega</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function MaterialsPanel({
  items,
  searchQuery,
}: MaterialsPanelProps) {
  const router = useRouter();
  const [filterPartida, setFilterPartida] = useState("All");
  const [filterWarehouse, setFilterWarehouse] = useState("All");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Requisition-level manual date picker states
  const [editingGroupFecha, setEditingGroupFecha] = useState<string | null>(null);
  const [tempGroupFecha, setTempGroupFecha] = useState("");
  const [isSavingGroupFecha, setIsSavingGroupFecha] = useState(false);

  // PDF Viewer / Uploading states
  const [activePdfUrl, setActivePdfUrl] = useState("");
  const [activePdfReq, setActivePdfReq] = useState("");
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadingReqCode, setUploadingReqCode] = useState<string | null>(null);

  // File Input Refs
  const excelInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // 1. Group all items by Requisition Code
  interface GroupedRequest {
    codigoRequerimiento: string;
    items: MaterialRequirement[];
    totalItems: number;
    totalQuantity: number;
    totalAlmacen: number;
    partidas: string[];
    warehouseStatus: "Completo" | "Parcial" | "Sin Recibir";
  }

  const groupedObj: Record<string, GroupedRequest> = {};

  items.forEach((item) => {
    const code = item.codigoRequerimiento;
    if (!groupedObj[code]) {
      groupedObj[code] = {
        codigoRequerimiento: code,
        items: [],
        totalItems: 0,
        totalQuantity: 0,
        totalAlmacen: 0,
        partidas: [],
        warehouseStatus: "Sin Recibir",
      };
    }

    const g = groupedObj[code];
    g.items.push(item);
    g.totalItems++;
    g.totalQuantity += item.cantidad || 0;
    const qtyAlm = parseFloat(item.cantidadAlmacen || "0") || 0;
    g.totalAlmacen += qtyAlm;
    if (item.partidaControl && !g.partidas.includes(item.partidaControl)) {
      g.partidas.push(item.partidaControl);
    }
  });

  // Calculate warehouse status for each group
  Object.values(groupedObj).forEach((g) => {
    const anyReceived = g.items.some((item) => {
      const qtyAlm = parseFloat(item.cantidadAlmacen || "0") || 0;
      return qtyAlm > 0;
    });

    const allComplete = g.items.every((item) => {
      const qtyReq = item.cantidad || 0;
      const qtyAlm = parseFloat(item.cantidadAlmacen || "0") || 0;
      return qtyAlm >= qtyReq && qtyReq > 0;
    });

    if (allComplete) {
      g.warehouseStatus = "Completo";
    } else if (anyReceived) {
      g.warehouseStatus = "Parcial";
    } else {
      g.warehouseStatus = "Sin Recibir";
    }
  });

  // Extract unique Partidas for the dropdown filter
  const partidasSet = new Set<string>();
  items.forEach((item) => {
    if (item.partidaControl && item.partidaControl.trim()) {
      partidasSet.add(item.partidaControl.trim());
    }
  });
  const existingPartidas = Array.from(partidasSet).sort((a, b) => a.localeCompare(b));

  // 2. Filter groups
  const filteredGroups = Object.values(groupedObj).filter((g) => {
    if (filterPartida !== "All") {
      const hasPartida = g.items.some((item) => item.partidaControl === filterPartida);
      if (!hasPartida) return false;
    }

    if (filterWarehouse !== "All" && g.warehouseStatus !== filterWarehouse) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (g.codigoRequerimiento.toLowerCase().includes(q)) return true;
      const matchesItem = g.items.some(
        (item) =>
          (item.recurso && item.recurso.toLowerCase().includes(q)) ||
          (item.codigoRecurso && item.codigoRecurso.toLowerCase().includes(q)) ||
          (item.partidaControl && item.partidaControl.toLowerCase().includes(q))
      );
      if (!matchesItem) return false;
    }

    return true;
  });

  // Sort groups numerically
  const sortedGroups = filteredGroups.sort((a, b) => {
    const numA = parseInt(a.codigoRequerimiento, 10);
    const numB = parseInt(b.codigoRequerimiento, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.codigoRequerimiento.localeCompare(b.codigoRequerimiento);
  });

  const toggleGroup = (code: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  // Save manual Requisition Date
  const handleSaveGroupFecha = async (code: string) => {
    const originalFecha = groupedObj[code]?.items[0]?.fechaPedido || "";
    if (tempGroupFecha === originalFecha) {
      setEditingGroupFecha(null);
      return;
    }

    setIsSavingGroupFecha(true);
    try {
      const res = await updateRequisitionFechaPedidoAction(code, tempGroupFecha || null);
      if (res.success) {
        router.refresh();
      } else {
        alert("Error al actualizar la fecha del requerimiento: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSavingGroupFecha(false);
      setEditingGroupFecha(null);
    }
  };

  // Open hidden PDF file picker
  const handlePdfUploadClick = (code: string) => {
    setUploadingReqCode(code);
    pdfInputRef.current?.click();
  };

  // Process uploaded PDF
  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingReqCode) return;

    setIsUploadingPdf(true);
    try {
      const base64Data = await convertFileToBase64(file);
      const res = await uploadRequisitionPdfAction(
        uploadingReqCode,
        file.name,
        base64Data,
        file.type
      );

      if (res.success) {
        alert(`Documento PDF subido exitosamente para el Requerimiento ${uploadingReqCode}.`);
        router.refresh();
      } else {
        alert("Error al cargar PDF: " + res.error);
      }
    } catch (err: any) {
      alert("Error en el servidor: " + err.message);
    } finally {
      setIsUploadingPdf(false);
      setUploadingReqCode(null);
      e.target.value = ""; // Reset
    }
  };

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

  // Open PDF Viewer Modal
  const handleViewPdf = (url: string, code: string) => {
    setActivePdfUrl(url);
    setActivePdfReq(code);
    setIsPdfModalOpen(true);
  };

  // Handle Excel Upload
  const handleExcelUploadClick = () => {
    excelInputRef.current?.click();
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const filename = file.name;
    const dotIndex = filename.lastIndexOf(".");
    const extractedCode = dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;

    // Check if requisition code already exists
    const exists = !!groupedObj[extractedCode];
    if (exists) {
      const confirmOverwrite = confirm(
        `El requerimiento "${extractedCode}" ya existe.\n¿Está seguro de que desea sobrescribirlo?\nSe conservará la fecha de pedido y el documento PDF cargado previamente.`
      );
      if (!confirmOverwrite) {
        e.target.value = ""; // Reset
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

        if (rawData.length <= 1) {
          alert("El archivo Excel está vacío o no tiene el formato correcto.");
          e.target.value = "";
          return;
        }

        const parsedItems: any[] = [];
        // Index 0 is header. Start from index 1.
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

          const partidaControlCode = row[6] !== undefined && row[6] !== null ? String(row[6]).trim() : null;
          const partidaControl = row[7] !== undefined && row[7] !== null ? String(row[7]).trim() : null;

          parsedItems.push({
            codigoRecurso,
            recurso: recurso || "Insumo sin nombre",
            unidad,
            cantidad,
            partidaControlCode,
            partidaControl,
          });
        }

        if (parsedItems.length === 0) {
          alert("No se encontraron insumos válidos en el archivo Excel.");
          e.target.value = "";
          return;
        }

        const res = await overwriteMaterialRequisitionAction(extractedCode, parsedItems);
        if (res.success) {
          alert(`Requerimiento ${extractedCode} cargado exitosamente con ${parsedItems.length} insumos.`);
          router.refresh();
        } else {
          alert("Error al cargar requerimiento: " + res.error);
        }
      } catch (err: any) {
        alert("Error al leer el archivo Excel: " + err.message);
      } finally {
        e.target.value = ""; // Reset
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveField = async (id: number, fields: any) => {
    try {
      const res = await updateMaterialRequirementFieldAction(id, fields);
      if (res.success) {
        router.refresh();
        return true;
      } else {
        alert("Error al guardar: " + res.error);
        return false;
      }
    } catch (err: any) {
      alert("Error: " + err.message);
      return false;
    }
  };

  const handleAddReceipt = async (id: number, qty: number, date: string) => {
    try {
      const res = await addMaterialReceiptAction(id, qty, date);
      if (res.success) {
        router.refresh();
        return true;
      } else {
        alert("Error al registrar entrega: " + res.error);
        return false;
      }
    } catch (err: any) {
      alert("Error: " + err.message);
      return false;
    }
  };

  const handleDeleteReceipt = async (id: number) => {
    try {
      const res = await deleteMaterialReceiptAction(id);
      if (res.success) {
        router.refresh();
        return true;
      } else {
        alert("Error al eliminar entrega: " + res.error);
        return false;
      }
    } catch (err: any) {
      alert("Error: " + err.message);
      return false;
    }
  };

  const handleExportCSV = () => {
    const headers = "Código Requerimiento,Cant. Ítems,Cant. Solicitada Total,Cant. Almacén Total,Estado Recepción,Partidas de Control\n";
    const rows = sortedGroups
      .map(
        (g) =>
          `"${g.codigoRequerimiento}","${g.totalItems}","${g.totalQuantity}","${g.totalAlmacen}","${g.warehouseStatus}","${g.partidas.join(
            " | "
          )}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `resumen_requerimientos_materiales_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-4 font-sf-pro">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={excelInputRef}
        accept=".xlsx, .xls"
        className="hidden"
        onChange={handleExcelFileChange}
      />
      <input
        type="file"
        ref={pdfInputRef}
        accept="application/pdf"
        className="hidden"
        onChange={handlePdfFileChange}
      />

      {/* PDF Uploading Overlay */}
      {isUploadingPdf && (
        <div className="fixed inset-0 bg-nordic/20 backdrop-blur-xs z-[120] flex items-center justify-center">
          <div className="bg-white border border-nordic/15 rounded-xl shadow-lg p-4 flex items-center gap-3 font-semibold text-nordic">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-mosque border-t-transparent rounded-full" />
            <span>Sincronizando documento PDF con Supabase Storage...</span>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 border border-nordic/10 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
          {/* Partida de Control Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="font-sf-pro text-[10px] font-bold tracking-wider text-nordic/50 uppercase whitespace-nowrap">
              Partida de Control:
            </span>
            <select
              value={filterPartida}
              onChange={(e) => setFilterPartida(e.target.value)}
              className="bg-clear-day border border-nordic/10 text-xs font-bold text-nordic py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 transition-all w-full sm:w-56 cursor-pointer"
            >
              <option value="All">Todas las Partidas</option>
              {existingPartidas.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Warehouse Arrival Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="font-sf-pro text-[10px] font-bold tracking-wider text-nordic/50 uppercase whitespace-nowrap">
              Estado en Almacén:
            </span>
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="bg-clear-day border border-nordic/10 text-xs font-bold text-nordic py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 transition-all w-full sm:w-56 cursor-pointer"
            >
              <option value="All">Todos los Estados</option>
              <option value="Completo">Entregado Completo</option>
              <option value="Parcial">Entregado Parcial</option>
              <option value="Sin Recibir">Sin Recibir</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Upload Excel Button */}
          <button
            onClick={handleExcelUploadClick}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-mosque bg-hint-of-green/45 border border-mosque/20 px-4 py-2 rounded-lg hover:bg-hint-of-green transition-all cursor-pointer outline-none w-full sm:w-auto shadow-sm"
          >
            <Icon name="upload_file" className="h-4 w-4" />
            <span>Cargar Excel Requerimiento</span>
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-nordic hover:text-nordic/85 transition-colors border border-nordic/15 px-4 py-2 rounded-lg bg-clear-day/30 w-full sm:w-auto cursor-pointer outline-none"
          >
            <Icon name="download" className="h-4 w-4" />
            <span>Exportar Resumen CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-nordic/10 rounded-xl shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-clear-day border-b border-nordic/10">
                <th className="w-10 px-6 py-4"></th>
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                  Requerimiento (Excel)
                </th>
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase text-center">
                  Total Insumos
                </th>
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase text-center">
                  Estado en Almacén
                </th>
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase">
                  Partidas de Control
                </th>
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase text-right">
                  Cant. Solicitada Total
                </th>
                <th className="px-6 py-4 font-sf-pro text-[10px] font-bold tracking-wider text-nordic/60 uppercase text-right">
                  Cant. Almacén Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nordic/5">
              {sortedGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-nordic/50 font-semibold">
                    No se encontraron requerimientos de materiales que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                sortedGroups.map((g) => {
                  const isExpanded = !!expandedGroups[g.codigoRequerimiento];
                  
                  let groupStatusClass = "bg-red-50 text-red-700 border-red-150";
                  if (g.warehouseStatus === "Completo") {
                    groupStatusClass = "bg-hint-of-green text-mosque border-mosque/20";
                  } else if (g.warehouseStatus === "Parcial") {
                    groupStatusClass = "bg-amber-50 text-amber-800 border-amber-200";
                  }

                  const firstItem = g.items[0];
                  const pdfUrl = firstItem?.pdfUrl;
                  const fechaPedido = firstItem?.fechaPedido;

                  return (
                    <React.Fragment key={g.codigoRequerimiento}>
                      <tr
                        className={`hover:bg-clear-day/30 transition-colors group cursor-pointer ${
                          isExpanded ? "bg-clear-day/10" : ""
                        }`}
                        onClick={() => toggleGroup(g.codigoRequerimiento)}
                      >
                        {/* Expand/Collapse Chevron */}
                        <td className="px-6 py-4 text-center">
                          <Icon
                            name={isExpanded ? "expand_more" : "chevron_right"}
                            className="h-5 w-5 text-nordic/40 group-hover:text-mosque transition-colors"
                          />
                        </td>
                        
                        {/* Requisition Code, Fecha and PDF Metadata Column */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-sm font-extrabold text-nordic group-hover:text-mosque transition-colors">
                              Req: {g.codigoRequerimiento}
                            </span>
                            
                            {/* Requisition-level Fecha Pedido */}
                            {editingGroupFecha === g.codigoRequerimiento ? (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] font-bold text-nordic/40 uppercase">Fecha:</span>
                                <input
                                  type="date"
                                  value={tempGroupFecha}
                                  onChange={(e) => setTempGroupFecha(e.target.value)}
                                  onBlur={() => handleSaveGroupFecha(g.codigoRequerimiento)}
                                  onKeyDown={(e) => e.key === "Enter" && handleSaveGroupFecha(g.codigoRequerimiento)}
                                  disabled={isSavingGroupFecha}
                                  className="bg-white border border-mosque text-[10px] py-0.5 px-1 rounded outline-none font-bold text-nordic"
                                  autoFocus
                                />
                                {isSavingGroupFecha && (
                                  <span className="animate-spin inline-block w-2.5 h-2.5 border border-mosque border-t-transparent rounded-full" />
                                )}
                              </div>
                            ) : (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingGroupFecha(g.codigoRequerimiento);
                                  setTempGroupFecha(fechaPedido || "");
                                }}
                                className="group/fecha flex items-center gap-1 text-[10px] text-nordic/45 font-bold hover:text-mosque cursor-pointer w-fit"
                                title="Editar fecha de pedido del requerimiento"
                              >
                                <span>Fecha Pedido: {fechaPedido || "Asignar fecha"}</span>
                                <Icon name="calendar_today" className="h-3 w-3 text-nordic/30 group-hover/fecha:text-mosque opacity-0 group-hover/fecha:opacity-100 transition-all" />
                              </div>
                            )}

                            {/* Requisition-level PDF Actions */}
                            <div className="flex items-center gap-2 mt-0.5" onClick={(e) => e.stopPropagation()}>
                              {pdfUrl ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleViewPdf(pdfUrl, g.codigoRequerimiento)}
                                    className="flex items-center gap-0.5 text-[10px] font-extrabold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                                  >
                                    <Icon name="picture_as_pdf" className="h-3.5 w-3.5" />
                                    <span>Ver PDF</span>
                                  </button>
                                  <button
                                    onClick={() => handlePdfUploadClick(g.codigoRequerimiento)}
                                    className="text-[9px] font-bold text-nordic/30 hover:text-mosque transition-colors"
                                    title="Actualizar documento PDF"
                                  >
                                    (Actualizar)
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handlePdfUploadClick(g.codigoRequerimiento)}
                                  className="flex items-center gap-0.5 text-[9px] font-extrabold text-mosque bg-mosque/5 px-2 py-0.5 border border-mosque/20 rounded hover:bg-mosque/10 transition-all cursor-pointer"
                                >
                                  <Icon name="upload_file" className="h-3.5 w-3.5" />
                                  <span>Subir PDF</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-nordic/70 font-mono">
                          {g.totalItems}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${groupStatusClass}`}>
                            {g.warehouseStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-nordic/65 font-semibold max-w-xs truncate" title={g.partidas.join(", ")}>
                          {g.partidas.join(", ") || "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-nordic text-xs">
                          {g.totalQuantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-mosque text-xs">
                          {g.totalAlmacen.toLocaleString()}
                        </td>
                      </tr>

                      {/* Inline Expanded Items Table */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-clear-day/15 p-4 border-t border-b border-nordic/10">
                            <div className="bg-white border border-nordic/15 rounded-xl overflow-hidden shadow-inner max-h-[500px] overflow-y-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-clear-day/30 border-b border-nordic/10 text-[10px] font-bold uppercase tracking-wider text-nordic/50">
                                    <th className="px-4 py-2.5">Código</th>
                                    <th className="px-4 py-2.5">Insumo</th>
                                    <th className="px-3 py-2.5 text-center">Unidad</th>
                                    <th className="px-3 py-2.5 text-right">Cant. Solicitada</th>
                                    <th className="px-3 py-2.5 text-center">En Almacén</th>
                                    <th className="px-3 py-2.5 text-center">Estado</th>
                                    <th className="px-3 py-2.5 text-right">Cotización</th>
                                    <th className="px-3 py-2.5 text-right">O. Compra</th>
                                    <th className="px-4 py-2.5">Partida de Control</th>
                                    <th className="px-4 py-2.5">Cronograma</th>
                                    <th className="px-3 py-2.5 text-center">Entregas</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-nordic/5">
                                  {g.items.map((item) => (
                                    <EditableAlmacenRow
                                      key={item.id}
                                      item={item}
                                      onSaveField={handleSaveField}
                                      onAddReceipt={handleAddReceipt}
                                      onDeleteReceipt={handleDeleteReceipt}
                                    />
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-nordic/5">
          {sortedGroups.length === 0 ? (
            <div className="px-6 py-8 text-center text-nordic/50 font-semibold text-sm">
              No se encontraron requerimientos de materiales.
            </div>
          ) : (
            sortedGroups.map((g) => {
              const isExpanded = !!expandedGroups[g.codigoRequerimiento];
              
              let groupStatusClass = "bg-red-50 text-red-700 border-red-200";
              if (g.warehouseStatus === "Completo") {
                groupStatusClass = "bg-hint-of-green text-mosque border-mosque/20";
              } else if (g.warehouseStatus === "Parcial") {
                groupStatusClass = "bg-amber-50 text-amber-800 border-amber-200";
              }

              const firstItem = g.items[0];
              const pdfUrl = firstItem?.pdfUrl;
              const fechaPedido = firstItem?.fechaPedido;

              return (
                <div
                  key={g.codigoRequerimiento}
                  className="p-4 bg-white space-y-3"
                >
                  <div
                    onClick={() => toggleGroup(g.codigoRequerimiento)}
                    className="flex justify-between items-start cursor-pointer hover:bg-clear-day/10 p-1.5 rounded transition-all"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          name={isExpanded ? "expand_more" : "chevron_right"}
                          className="h-4 w-4 text-nordic/40"
                        />
                        <span className="font-mono text-sm font-extrabold text-nordic">
                          Req: {g.codigoRequerimiento}
                        </span>
                      </div>
                      
                      {/* Mobile Fecha Pedido */}
                      <span className="text-[10px] text-nordic/45 font-bold pl-5 leading-tight">
                        Fecha: {fechaPedido || "Sin fecha"}
                      </span>

                      {/* Mobile PDF Action */}
                      {pdfUrl && (
                        <div className="pl-5 mt-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPdf(pdfUrl, g.codigoRequerimiento);
                            }}
                            className="flex items-center gap-0.5 text-[9px] font-bold text-red-600 cursor-pointer"
                          >
                            <Icon name="picture_as_pdf" className="h-3 w-3" />
                            <span>Ver PDF</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${groupStatusClass}`}>
                      {g.warehouseStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px] text-nordic/50 font-semibold px-2">
                    <div>
                      <span>Cant. Solicitada: <strong className="text-nordic">{g.totalQuantity.toLocaleString()}</strong></span>
                    </div>
                    <div>
                      <span>Cant. Almacén: <strong className="text-mosque font-extrabold">{g.totalAlmacen.toLocaleString()}</strong></span>
                    </div>
                  </div>

                  {/* Inline Expanded Items for Mobile */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-nordic/15 space-y-3 pl-2">
                      <h4 className="font-sf-pro text-[9px] font-bold text-nordic/40 uppercase tracking-wider mb-2">
                        Lista de Insumos ({g.items.length})
                      </h4>
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {g.items.map((item) => {
                          const qtyReq = item.cantidad || 0;
                          const qtyAlm = parseFloat(item.cantidadAlmacen || "0") || 0;
                          let itemStatus = "Sin Recibir";
                          let itemClass = "bg-red-50 text-red-700 border-red-200";
                          if (qtyAlm >= qtyReq && qtyReq > 0) {
                            itemStatus = "Completo";
                            itemClass = "bg-hint-of-green text-mosque border-mosque/20";
                          } else if (qtyAlm > 0) {
                            itemStatus = "Parcial";
                            itemClass = "bg-amber-50 text-amber-800 border-amber-200";
                          }

                          return (
                            <div key={item.id} className="bg-clear-day/30 border border-nordic/5 rounded-lg p-3 space-y-2 text-xs relative">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="font-mono text-[9px] text-nordic/40 block">Cód: {item.codigoRecurso || "-"}</span>
                                  <h5 className="font-bold text-nordic leading-tight">{item.recurso}</h5>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${itemClass}`}>
                                  {itemStatus}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <span className="block text-nordic/40 font-bold uppercase text-[8px]">Solicitada</span>
                                  <span className="font-extrabold text-nordic text-xs">{item.cantidad} {item.unidad}</span>
                                </div>
                                <div>
                                  <span className="block text-nordic/40 font-bold uppercase text-[8px]">En Almacén</span>
                                  <span className="font-extrabold text-mosque text-xs">{qtyAlm} {item.unidad}</span>
                                </div>
                              </div>

                              {item.partidaControl && (
                                <div className="text-[9px] text-nordic/50 pt-1.5 border-t border-nordic/5 leading-tight">
                                  <strong className="text-nordic/70">Partida:</strong> {item.partidaControl}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => {
          setIsPdfModalOpen(false);
          setActivePdfUrl("");
          setActivePdfReq("");
        }}
        pdfUrl={activePdfUrl}
        codigoRequerimiento={activePdfReq}
      />
    </div>
  );
}
