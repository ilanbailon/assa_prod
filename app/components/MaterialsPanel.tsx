"use client";

import React, { useState, useEffect } from "react";
import { MaterialRequirement, MaterialReceipt } from "./types";
import Icon from "./Icon";
import { useRouter } from "next/navigation";
import {
  updateMaterialAlmacenAction,
  updateMaterialRequirementFieldAction,
  addMaterialReceiptAction,
  deleteMaterialReceiptAction,
} from "../actions";

interface MaterialsPanelProps {
  items: MaterialRequirement[];
  searchQuery: string;
}

// Editable Row for Desktop Insumos
interface EditableAlmacenRowProps {
  item: MaterialRequirement;
  onSaveAlmacen: (id: number, value: string) => Promise<boolean>;
  onSaveField: (id: number, fields: any) => Promise<boolean>;
  onAddReceipt: (materialRequirementId: number, qty: number, date: string) => Promise<boolean>;
  onDeleteReceipt: (id: number) => Promise<boolean>;
}

function EditableAlmacenRow({
  item,
  onSaveAlmacen,
  onSaveField,
  onAddReceipt,
  onDeleteReceipt,
}: EditableAlmacenRowProps) {
  const router = useRouter();

  // En Almacén Qty states
  const [almVal, setAlmVal] = useState(item.cantidadAlmacen || "0");
  const [isEditingAlm, setIsEditingAlm] = useState(false);
  const [isSavingAlm, setIsSavingAlm] = useState(false);

  // Fecha Pedido states
  const [fechaVal, setFechaVal] = useState(item.fechaPedido || "");
  const [isEditingFecha, setIsEditingFecha] = useState(false);
  const [isSavingFecha, setIsSavingFecha] = useState(false);

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

  // Sync states with props when they change on the server
  useEffect(() => {
    setAlmVal(item.cantidadAlmacen || "0");
  }, [item.cantidadAlmacen]);

  useEffect(() => {
    setFechaVal(item.fechaPedido || "");
  }, [item.fechaPedido]);

  useEffect(() => {
    setPartidaCodeVal(item.partidaControlCode || "");
  }, [item.partidaControlCode]);

  useEffect(() => {
    setPartidaDescVal(item.partidaControl || "");
  }, [item.partidaControl]);

  // Save Almacen Qty
  const handleSaveAlm = async () => {
    const trimmed = almVal.trim();
    if (trimmed === (item.cantidadAlmacen || "0")) {
      setIsEditingAlm(false);
      return;
    }
    setIsSavingAlm(true);
    const success = await onSaveAlmacen(item.id, trimmed);
    setIsSavingAlm(false);
    if (success) setIsEditingAlm(false);
  };

  // Save Fecha Pedido
  const handleSaveFecha = async () => {
    const val = fechaVal ? fechaVal.trim() : null;
    if (val === (item.fechaPedido || null)) {
      setIsEditingFecha(false);
      return;
    }
    setIsSavingFecha(true);
    const success = await onSaveField(item.id, { fechaPedido: val });
    setIsSavingFecha(false);
    if (success) setIsEditingFecha(false);
  };

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

        {/* Fecha Pedido (Editable Date) */}
        <td className="px-3 py-2.5 text-center min-w-[120px]">
          {isEditingFecha ? (
            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="date"
                value={fechaVal}
                onChange={(e) => setFechaVal(e.target.value)}
                onBlur={handleSaveFecha}
                onKeyDown={(e) => e.key === "Enter" && handleSaveFecha()}
                disabled={isSavingFecha}
                autoFocus
                className="bg-white border border-mosque text-[11px] py-0.5 px-1 rounded outline-none font-bold text-nordic"
              />
              {isSavingFecha && (
                <span className="animate-spin inline-block w-3 h-3 border border-mosque border-t-transparent rounded-full" />
              )}
            </div>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingFecha(true);
              }}
              className="group/cell flex items-center justify-center gap-1 cursor-pointer hover:bg-mosque/5 hover:text-mosque px-2 py-0.5 rounded border border-dashed border-transparent hover:border-mosque/35 transition-all text-nordic text-[11px] font-mono"
            >
              <span>{fechaVal || "Asignar Fecha"}</span>
              <Icon name="calendar_today" className="h-3 w-3 text-nordic/30 group-hover/cell:text-mosque opacity-0 group-hover/cell:opacity-100 transition-all" />
            </div>
          )}
        </td>

        {/* En Almacén (Editable Direct or updated by Receipts) */}
        <td className="px-3 py-2.5 text-center min-w-[100px]">
          {numReceipts > 0 ? (
            // If receipts exist, display calculated sum with link to expand
            <div
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="flex items-center justify-center gap-1 font-extrabold text-mosque hover:underline cursor-pointer"
              title="Sumado por historial de entregas parciales"
            >
              <span>{almVal}</span>
              <Icon name="history" className="h-3 w-3" />
            </div>
          ) : isEditingAlm ? (
            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={almVal}
                onChange={(e) => setAlmVal(e.target.value)}
                onBlur={handleSaveAlm}
                onKeyDown={(e) => e.key === "Enter" && handleSaveAlm()}
                disabled={isSavingAlm}
                autoFocus
                className="w-16 bg-white border border-mosque text-xs font-bold text-nordic text-center py-0.5 rounded outline-none"
              />
              {isSavingAlm && (
                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-mosque border-t-transparent rounded-full" />
              )}
            </div>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingAlm(true);
              }}
              className="group/cell flex items-center justify-center gap-1 cursor-pointer hover:bg-mosque/5 hover:text-mosque px-2 py-0.5 rounded border border-dashed border-transparent hover:border-mosque/35 transition-all font-extrabold text-nordic"
            >
              <span>{almVal}</span>
              <Icon name="edit" className="h-3 w-3 text-nordic/30 group-hover/cell:text-mosque opacity-0 group-hover/cell:opacity-100 transition-all" />
            </div>
          )}
        </td>

        {/* Estado badge */}
        <td className="px-3 py-2.5 text-center">
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusClass}`}>
            {itemStatus}
          </span>
        </td>

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
          <td colSpan={10} className="p-4">
            <div className="max-w-3xl bg-white border border-nordic/15 rounded-xl shadow-inner p-4 flex flex-col md:flex-row gap-6">
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
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm("¿Está seguro de eliminar esta entrega parcial?")) {
                                await onDeleteReceipt(r.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                          >
                            <Icon name="delete" className="h-3.5 w-3.5" />
                          </button>
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

  // Extract unique Partidas for the selector dropdown
  const partidasSet = new Set<string>();
  items.forEach((item) => {
    if (item.partidaControl && item.partidaControl.trim()) {
      partidasSet.add(item.partidaControl.trim());
    }
  });
  const existingPartidas = Array.from(partidasSet).sort((a, b) => a.localeCompare(b));

  // 2. Filter groups
  const filteredGroups = Object.values(groupedObj).filter((g) => {
    // Filter by Partida de Control
    if (filterPartida !== "All") {
      const hasPartida = g.items.some((item) => item.partidaControl === filterPartida);
      if (!hasPartida) return false;
    }

    // Filter by Warehouse status
    if (filterWarehouse !== "All" && g.warehouseStatus !== filterWarehouse) {
      return false;
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      // Match requisition code
      if (g.codigoRequerimiento.toLowerCase().includes(q)) return true;
      // Or match resource details
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

  // Sort groups numerically by requisition code
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

  const handleSaveAlmacen = async (id: number, value: string) => {
    try {
      const res = await updateMaterialAlmacenAction(id, value);
      if (res.success) {
        router.refresh();
        return true;
      } else {
        alert("Error al actualizar la cantidad: " + res.error);
        return false;
      }
    } catch (err: any) {
      alert("Error: " + err.message);
      return false;
    }
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

        {/* CSV Action Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-mosque hover:text-mosque/80 hover:underline cursor-pointer outline-none transition-colors border border-mosque/10 px-4 py-2 rounded-lg bg-clear-day/40 w-full lg:w-auto"
        >
          <Icon name="download" className="h-4 w-4" />
          <span>Exportar Resumen CSV</span>
        </button>
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
                        <td className="px-6 py-4 font-mono text-sm font-extrabold text-nordic group-hover:text-mosque transition-colors">
                          Req: {g.codigoRequerimiento}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-nordic/70">
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
                                    <th className="px-3 py-2.5 text-center">Fecha Pedido</th>
                                    <th className="px-3 py-2.5 text-center">En Almacén</th>
                                    <th className="px-3 py-2.5 text-center">Estado</th>
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
                                      onSaveAlmacen={handleSaveAlmacen}
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

              return (
                <div
                  key={g.codigoRequerimiento}
                  className="p-4 bg-white space-y-3"
                >
                  <div
                    onClick={() => toggleGroup(g.codigoRequerimiento)}
                    className="flex justify-between items-center cursor-pointer hover:bg-clear-day/10 p-1.5 rounded transition-all"
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon
                        name={isExpanded ? "expand_more" : "chevron_right"}
                        className="h-4 w-4 text-nordic/40"
                      />
                      <span className="font-mono text-sm font-extrabold text-nordic">
                        Req: {g.codigoRequerimiento}
                      </span>
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

                              <div className="text-[9px] text-nordic/50 pt-1.5 border-t border-nordic/5 leading-tight space-y-1">
                                <div>
                                  <strong className="text-nordic/70">Fecha Pedido:</strong> {item.fechaPedido || "Sin fecha"}
                                </div>
                                {item.partidaControl && (
                                  <div>
                                    <strong className="text-nordic/70">Partida:</strong> {item.partidaControl}
                                  </div>
                                )}
                              </div>
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
    </div>
  );
}
