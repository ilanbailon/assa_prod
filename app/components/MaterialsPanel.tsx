"use client";

import React, { useState, useEffect, useRef } from "react";
import { MaterialRequirement } from "./types";
import Icon from "./Icon";
import { useRouter } from "next/navigation";
import PdfViewerModal from "./PdfViewerModal";
import DeliveriesModal from "./DeliveriesModal";
import EditRequirementModal from "./EditRequirementModal";
import {
  addMaterialReceiptAction,
  deleteMaterialReceiptAction,
} from "../actions";

interface MaterialsPanelProps {
  items: MaterialRequirement[];
  searchQuery: string;
  onAddClick?: () => void;
}

// Function to escape regex characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Function to highlight matching search query in texts
function highlightText(text: string, search: string) {
  if (!search.trim()) return text;
  const cleanSearch = search.trim();
  const regex = new RegExp(`(${escapeRegExp(cleanSearch)})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-black font-extrabold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// Business days counter from date of order until today
const getBusinessDaysCount = (startDateStr?: string | null): number => {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr + "T00:00:00");
  if (isNaN(start.getTime())) return 0;
  
  const today = new Date();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (s > t) return 0;
  
  let count = 0;
  let cur = new Date(s.getTime());
  cur.setDate(cur.getDate() + 1);
  
  while (cur <= t) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) { // Exclude Sat and Sun
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// Compact Row for Insumos
interface EditableAlmacenRowProps {
  item: MaterialRequirement;
  searchQuery: string;
  onOpenDeliveries: (item: MaterialRequirement) => void;
}

function EditableAlmacenRow({
  item,
  searchQuery,
  onOpenDeliveries,
}: EditableAlmacenRowProps) {
  const qtyReq = item.cantidad || 0;
  const qtyAlm = parseFloat(item.cantidadAlmacen || "0") || 0;

  let itemStatus = "Sin Recibir";
  let statusClass = "bg-red-50 text-red-700 border-red-200";
  if (qtyAlm >= qtyReq && qtyReq > 0) {
    itemStatus = "Completo";
    statusClass = "bg-emerald-50 text-emerald-700 border-emerald-150";
  } else if (qtyAlm > 0) {
    itemStatus = "Parcial";
    statusClass = "bg-amber-50 text-amber-700 border-amber-200";
  }

  const numReceipts = item.receipts?.length || 0;

  return (
    <tr className="hover:bg-slate-50 transition-colors text-[11px] font-semibold text-slate-800">
      {/* Código Insumo */}
      <td className="border-r border-slate-200 px-3 py-1.5 font-mono text-slate-400 text-center">
        {highlightText(item.codigoRecurso || "-", searchQuery)}
      </td>
      
      {/* Insumo (Wider column) */}
      <td className="border-r border-slate-200 px-3 py-1.5 font-bold text-slate-700 text-left min-w-[300px] md:min-w-[400px]">
        {highlightText(item.recurso || "", searchQuery)}
      </td>
      
      {/* Unidad */}
      <td className="border-r border-slate-200 px-3 py-1.5 text-center font-bold text-slate-500">
        {item.unidad}
      </td>
      
      {/* Cantidad Solicitada */}
      <td className="border-r border-slate-200 px-3 py-1.5 text-right font-extrabold text-slate-800 font-mono">
        {item.cantidad?.toLocaleString()}
      </td>

      {/* En Almacén */}
      <td 
        onClick={() => onOpenDeliveries(item)}
        className="border-r border-slate-200 px-3 py-1.5 text-center font-mono cursor-pointer hover:bg-slate-100 hover:text-mosque hover:underline group"
        title="Haga clic para ver o agregar entregas"
      >
        <div className="flex items-center justify-center gap-1 font-extrabold text-slate-800 group-hover:text-mosque">
          <span>{qtyAlm}</span>
          <Icon
            name="history"
            className={`h-3 w-3 ${numReceipts > 0 ? "text-mosque" : "text-slate-350"}`}
          />
        </div>
      </td>

      {/* Estado badge */}
      <td className="border-r border-slate-200 px-3 py-1.5 text-center">
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusClass}`}>
          {itemStatus}
        </span>
      </td>

      {/* Action to Open deliveries modal */}
      <td className="px-3 py-1.5 text-center">
        <button
          type="button"
          onClick={() => onOpenDeliveries(item)}
          className="flex items-center justify-center gap-1 text-[9px] font-bold px-1.5 py-0.5 border border-slate-200 rounded hover:bg-slate-100 text-slate-600 transition-all cursor-pointer outline-none mx-auto"
        >
          <Icon name="local_shipping" className="h-3 w-3 text-slate-400" />
          <span>{numReceipts}</span>
        </button>
      </td>
    </tr>
  );
}

export default function MaterialsPanel({
  items,
  searchQuery,
  onAddClick,
}: MaterialsPanelProps) {
  const router = useRouter();
  const [filterWarehouse, setFilterWarehouse] = useState("All");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // PDF Viewer Modal states
  const [activePdfUrl, setActivePdfUrl] = useState("");
  const [activePdfReq, setActivePdfReq] = useState("");
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Deliveries Modal state
  const [selectedDeliveryItem, setSelectedDeliveryItem] = useState<MaterialRequirement | null>(null);

  // Edit Requirement Modal state
  const [editingRequisition, setEditingRequisition] = useState<{
    codigoRequerimiento: string;
    fechaPedido: string | null;
    pdfUrl: string | null;
    description: string | null;
  } | null>(null);

  // 1. Group all items by Requisition Code
  interface GroupedRequest {
    codigoRequerimiento: string;
    items: MaterialRequirement[];
    totalItems: number;
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
        warehouseStatus: "Sin Recibir",
      };
    }

    const g = groupedObj[code];
    g.items.push(item);
    g.totalItems++;
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

  // 2. Filter groups
  const filteredGroups = Object.values(groupedObj).filter((g) => {
    if (filterWarehouse !== "All" && g.warehouseStatus !== filterWarehouse) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (g.codigoRequerimiento.toLowerCase().includes(q)) return true;
      
      // Also match if any of the items inside matches
      const matchesItem = g.items.some(
        (item) =>
          (item.recurso && item.recurso.toLowerCase().includes(q)) ||
          (item.codigoRecurso && item.codigoRecurso.toLowerCase().includes(q))
      );
      if (!matchesItem) return false;
    }

    return true;
  });

  // Sort groups numerically or alphabetically
  const sortedGroups = filteredGroups.sort((a, b) => {
    const numA = parseInt(a.codigoRequerimiento, 10);
    const numB = parseInt(b.codigoRequerimiento, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.codigoRequerimiento.localeCompare(b.codigoRequerimiento);
  });

  // Auto-expand groups when search query matches items inside them
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const newExpanded: Record<string, boolean> = {};
      sortedGroups.forEach((g) => {
        const matchesItem = g.items.some(
          (item) =>
            (item.recurso && item.recurso.toLowerCase().includes(q)) ||
            (item.codigoRecurso && item.codigoRecurso.toLowerCase().includes(q))
        );
        if (matchesItem || g.codigoRequerimiento.toLowerCase().includes(q)) {
          newExpanded[g.codigoRequerimiento] = true;
        }
      });
      setExpandedGroups(newExpanded);
    } else {
      setExpandedGroups({});
    }
  }, [searchQuery]);

  const toggleGroup = (code: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  // Open PDF Viewer Modal
  const handleViewPdf = (url: string, code: string) => {
    setActivePdfUrl(url);
    setActivePdfReq(code);
    setIsPdfModalOpen(true);
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
    const headers = "Código Requerimiento,Descripción,Cant. Ítems,Estado Recepción\n";
    const rows = sortedGroups
      .map(
        (g) =>
          `"${g.codigoRequerimiento}","${g.items[0]?.partidaControl || ""}","${g.totalItems}","${g.warehouseStatus}"`
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

  // Find current snapshot of item in deliveries modal (for real-time update on refresh)
  const currentDeliveryItem = selectedDeliveryItem
    ? items.find((item) => item.id === selectedDeliveryItem.id) || selectedDeliveryItem
    : null;

  return (
    <div className="w-full space-y-4 font-sf-pro">

      {/* Filters Bar (Excel toolbar style) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-2.5 border border-slate-200 rounded">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
          {/* Warehouse Arrival Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="font-sf-pro text-[9px] font-bold tracking-wider text-slate-500 uppercase whitespace-nowrap">
              Estado en Almacén:
            </span>
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold text-slate-800 py-1 pl-2 pr-6 rounded outline-none focus:ring-1 focus:ring-mosque/40 transition-all w-full sm:w-44 cursor-pointer"
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
            onClick={onAddClick}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-mosque bg-hint-of-green/20 border border-mosque/10 px-3 py-1 rounded hover:bg-hint-of-green/35 transition-all cursor-pointer outline-none w-full sm:w-auto"
          >
            <Icon name="upload_file" className="h-3.5 w-3.5" />
            <span>Cargar Excel Requerimiento</span>
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200/50 transition-all border border-slate-200 px-3 py-1 rounded bg-white w-full sm:w-auto cursor-pointer outline-none"
          >
            <Icon name="download" className="h-3.5 w-3.5" />
            <span>Exportar Resumen CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Container (Excel style) */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                <th className="w-8 border border-slate-200 text-center py-2"></th>
                <th className="border border-slate-200 px-3 py-2 text-center w-[120px]">Req (Excel)</th>
                <th className="border border-slate-200 px-3 py-2 text-left">Descripción del Requerimiento</th>
                <th className="border border-slate-200 px-3 py-2 text-center w-[80px]">PDF</th>
                <th className="border border-slate-200 px-3 py-2 text-center w-[150px]">Fecha Pedido</th>
                <th className="border border-slate-200 px-3 py-2 text-center w-[120px]">Total Insumos</th>
                <th className="border border-slate-200 px-3 py-2 text-center w-[130px]">Estado Almacén</th>
                <th className="border border-slate-200 px-3 py-2 text-center w-[80px]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {sortedGroups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-semibold text-xs border border-slate-200 bg-slate-50/50">
                    No se encontraron requerimientos de materiales que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                sortedGroups.map((g) => {
                  const isExpanded = !!expandedGroups[g.codigoRequerimiento];
                  
                  let groupStatusClass = "bg-red-50 text-red-700 border-red-200";
                  if (g.warehouseStatus === "Completo") {
                    groupStatusClass = "bg-emerald-50 text-emerald-700 border-emerald-250";
                  } else if (g.warehouseStatus === "Parcial") {
                    groupStatusClass = "bg-amber-50 text-amber-800 border-amber-200";
                  }

                  const firstItem = g.items[0];
                  const pdfUrl = firstItem?.pdfUrl;
                  const fechaPedido = firstItem?.fechaPedido;
                  const description = firstItem?.partidaControl; // Mapped to requirement description

                  const daysElapsed = getBusinessDaysCount(fechaPedido);
                  const isComplete = g.warehouseStatus === "Completo";

                  return (
                    <React.Fragment key={g.codigoRequerimiento}>
                      <tr
                        className={`hover:bg-slate-50 transition-colors group cursor-pointer text-xs font-semibold text-slate-800 ${
                          isExpanded ? "bg-slate-50/40" : ""
                        }`}
                        onClick={() => toggleGroup(g.codigoRequerimiento)}
                      >
                        {/* Expand/Collapse Chevron */}
                        <td className="border border-slate-200 py-1 text-center">
                          <Icon
                            name={isExpanded ? "expand_more" : "chevron_right"}
                            className="h-4.5 w-4.5 text-slate-400 group-hover:text-mosque transition-colors"
                          />
                        </td>
                        
                        {/* Requisition Code */}
                        <td className="border border-slate-200 px-3 py-1 text-center font-mono text-slate-900">
                          {g.codigoRequerimiento}
                        </td>
                        
                        {/* Description */}
                        <td className="border border-slate-200 px-3 py-1 text-slate-700 font-medium">
                          {description || <span className="text-slate-400 italic">Sin descripción</span>}
                        </td>

                        {/* PDF Column */}
                        <td className="border border-slate-200 px-3 py-1 text-center">
                          {pdfUrl ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewPdf(pdfUrl, g.codigoRequerimiento);
                              }}
                              className="p-1 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 cursor-pointer inline-flex items-center justify-center transition-all hover:scale-105"
                              title="Ver PDF"
                            >
                              <Icon name="picture_as_pdf" className="h-4 w-4" />
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* Order Date Column */}
                        <td className="border border-slate-200 px-3 py-1 text-center font-mono text-[11px]">
                          {!isComplete ? (
                            fechaPedido ? (
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-slate-800">{fechaPedido}</span>
                                <span className="text-[9px] font-bold text-red-500 mt-0.5 bg-red-50 px-1.5 py-0.2 rounded-full border border-red-100 shrink-0">
                                  {daysElapsed} {daysElapsed === 1 ? "día" : "días"} hábil{daysElapsed === 1 ? "" : "es"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Sin fecha</span>
                            )
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* Total items in requisition */}
                        <td className="border border-slate-200 px-3 py-1 text-center text-slate-600 font-mono">
                          {g.totalItems}
                        </td>

                        {/* Warehouse Status */}
                        <td className="border border-slate-200 px-3 py-1 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${groupStatusClass}`}>
                            {g.warehouseStatus}
                          </span>
                        </td>

                        {/* Action / Edit button */}
                        <td className="border border-slate-200 px-3 py-1 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRequisition({
                                codigoRequerimiento: g.codigoRequerimiento,
                                fechaPedido: fechaPedido || null,
                                pdfUrl: pdfUrl || null,
                                description: description || null,
                              });
                            }}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 cursor-pointer inline-flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            title="Editar requerimiento"
                          >
                            <Icon name="edit" className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Items Table (Excel style) */}
                      {isExpanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={8} className="border border-slate-200 p-3 bg-slate-100/65">
                            <div className="bg-white border-2 border-slate-300 rounded-lg overflow-hidden shadow-md border-l-4 border-l-mosque">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="border-r border-b border-slate-200 px-3 py-1.5 text-center w-[120px]">Código</th>
                                    <th className="border-r border-b border-slate-200 px-3 py-1.5 text-left">Insumo</th>
                                    <th className="border-r border-b border-slate-200 px-3 py-1.5 text-center w-[80px]">Unidad</th>
                                    <th className="border-r border-b border-slate-200 px-3 py-1.5 text-right w-[120px]">Cant. Solicitada</th>
                                    <th className="border-r border-b border-slate-200 px-3 py-1.5 text-center w-[120px]">En Almacén</th>
                                    <th className="border-r border-b border-slate-200 px-3 py-1.5 text-center w-[100px]">Estado</th>
                                    <th className="border-b border-slate-200 px-3 py-1.5 text-center w-[100px]">Entregas</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-150">
                                  {g.items.map((item) => (
                                    <EditableAlmacenRow
                                      key={item.id}
                                      item={item}
                                      searchQuery={searchQuery}
                                      onOpenDeliveries={(itm) => setSelectedDeliveryItem(itm)}
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
        <div className="block md:hidden divide-y divide-slate-150">
          {sortedGroups.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 font-semibold text-xs">
              No se encontraron requerimientos de materiales.
            </div>
          ) : (
            sortedGroups.map((g) => {
              const isExpanded = !!expandedGroups[g.codigoRequerimiento];
              
              let groupStatusClass = "bg-red-50 text-red-700 border-red-200";
              if (g.warehouseStatus === "Completo") {
                groupStatusClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
              } else if (g.warehouseStatus === "Parcial") {
                groupStatusClass = "bg-amber-50 text-amber-800 border-amber-200";
              }

              const firstItem = g.items[0];
              const pdfUrl = firstItem?.pdfUrl;
              const fechaPedido = firstItem?.fechaPedido;
              const description = firstItem?.partidaControl;

              const daysElapsed = getBusinessDaysCount(fechaPedido);
              const isComplete = g.warehouseStatus === "Completo";

              return (
                <div key={g.codigoRequerimiento} className="p-3 bg-white space-y-2">
                  <div
                    onClick={() => toggleGroup(g.codigoRequerimiento)}
                    className="flex justify-between items-start cursor-pointer hover:bg-slate-50 p-1 rounded transition-all"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          name={isExpanded ? "expand_more" : "chevron_right"}
                          className="h-4.5 w-4.5 text-slate-400"
                        />
                        <span className="font-mono text-xs font-extrabold text-slate-900">
                          Req: {g.codigoRequerimiento}
                        </span>
                      </div>
                      
                      {description && (
                        <p className="text-[10px] text-slate-600 font-bold pl-6 truncate leading-tight">
                          {description}
                        </p>
                      )}

                      {/* Mobile Order Date */}
                      {!isComplete && fechaPedido && (
                        <div className="pl-6 text-[10px] font-bold text-slate-500 flex flex-wrap items-center gap-1">
                          <span>Pedido: {fechaPedido}</span>
                          <span className="text-red-500">
                            ({daysElapsed} días hábiles)
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${groupStatusClass}`}>
                        {g.warehouseStatus}
                      </span>
                      
                      {/* PDF Viewer Trigger */}
                      {pdfUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPdf(pdfUrl, g.codigoRequerimiento);
                          }}
                          className="p-1 rounded bg-red-50 text-red-600 border border-red-200 cursor-pointer flex items-center justify-center"
                          title="Ver PDF"
                        >
                          <Icon name="picture_as_pdf" className="h-3 w-3" />
                        </button>
                      )}

                      {/* Edit Requisition Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRequisition({
                            codigoRequerimiento: g.codigoRequerimiento,
                            fechaPedido: fechaPedido || null,
                            pdfUrl: pdfUrl || null,
                            description: description || null,
                          });
                        }}
                        className="p-1 rounded bg-slate-50 text-slate-600 border border-slate-200 cursor-pointer flex items-center justify-center"
                        title="Editar"
                      >
                        <Icon name="edit" className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Expanded Items for Mobile */}
                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-2 pl-3">
                      <h4 className="font-sf-pro text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Insumos del Requerimiento ({g.items.length})
                      </h4>
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {g.items.map((item) => {
                          const itemQtyReq = item.cantidad || 0;
                          const itemQtyAlm = parseFloat(item.cantidadAlmacen || "0") || 0;
                          let itemStatus = "Sin Recibir";
                          let itemClass = "bg-red-50 text-red-700 border-red-150";
                          if (itemQtyAlm >= itemQtyReq && itemQtyReq > 0) {
                            itemStatus = "Completo";
                            itemClass = "bg-emerald-50 text-emerald-700 border-emerald-150";
                          } else if (itemQtyAlm > 0) {
                            itemStatus = "Parcial";
                            itemClass = "bg-amber-50 text-amber-700 border-amber-150";
                          }

                          return (
                            <div key={item.id} className="bg-slate-50/50 border border-slate-200 rounded p-2.5 space-y-1.5 text-[11px] relative">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <span className="font-mono text-[9px] text-slate-400 block">Cód: {highlightText(item.codigoRecurso || "-", searchQuery)}</span>
                                  <h5 className="font-bold text-slate-700 leading-tight">{highlightText(item.recurso || "", searchQuery)}</h5>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${itemClass} shrink-0`}>
                                  {itemStatus}
                                </span>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[8px] mr-1">Sol:</span>
                                  <span className="font-extrabold text-slate-800">{item.cantidad} {item.unidad}</span>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => setSelectedDeliveryItem(item)}
                                  className="flex items-center gap-1 bg-white hover:bg-slate-100 text-mosque border border-slate-200 px-2 py-0.5 rounded font-bold transition-all cursor-pointer"
                                >
                                  <Icon name="history" className="h-3 w-3" />
                                  <span>Recibido: <strong className="font-mono">{itemQtyAlm}</strong></span>
                                </button>
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

      {/* Deliveries Modal */}
      {currentDeliveryItem && (
        <DeliveriesModal
          isOpen={!!selectedDeliveryItem}
          onClose={() => setSelectedDeliveryItem(null)}
          item={currentDeliveryItem}
          onAddReceipt={handleAddReceipt}
          onDeleteReceipt={handleDeleteReceipt}
        />
      )}

      {/* Edit Requirement Modal */}
      {editingRequisition && (
        <EditRequirementModal
          isOpen={!!editingRequisition}
          onClose={() => setEditingRequisition(null)}
          codigoRequerimiento={editingRequisition.codigoRequerimiento}
          currentFechaPedido={editingRequisition.fechaPedido}
          currentPdfUrl={editingRequisition.pdfUrl}
          currentDescription={editingRequisition.description}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
