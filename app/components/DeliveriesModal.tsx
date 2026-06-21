"use client";

import React, { useState } from "react";
import { MaterialRequirement } from "./types";
import Icon from "./Icon";

interface DeliveriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MaterialRequirement;
  onAddReceipt: (materialRequirementId: number, qty: number, date: string) => Promise<boolean>;
  onDeleteReceipt: (id: number) => Promise<boolean>;
}

export default function DeliveriesModal({
  isOpen,
  onClose,
  item,
  onAddReceipt,
  onDeleteReceipt,
}: DeliveriesModalProps) {
  const [newReceiptQty, setNewReceiptQty] = useState("");
  const [newReceiptDate, setNewReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const [deletingReceiptId, setDeletingReceiptId] = useState<number | null>(null);

  if (!isOpen) return null;

  const numReceipts = item.receipts?.length || 0;

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

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl border-2 border-slate-300 shadow-xl rounded-lg overflow-hidden flex flex-col h-[70vh] max-h-[600px] animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="bg-slate-100 text-slate-800 px-4 py-2.5 flex justify-between items-center shrink-0 border-b border-slate-200">
          <div>
            <h3 className="font-sf-pro font-bold text-xs md:text-sm text-slate-900">
              Historial de Entregas
            </h3>
            <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
              {item.recurso} ({item.unidad}) &mdash; Req: {item.codigoRequerimiento}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col md:flex-row gap-5">
          
          {/* History List */}
          <div className="flex-1 flex flex-col min-w-0">
            <span className="font-sf-pro text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Entregas Parciales ({numReceipts})
            </span>
            
            {numReceipts === 0 ? (
              <div className="flex-1 border border-dashed border-slate-300 rounded flex items-center justify-center p-6 text-center text-slate-400 italic text-xs bg-slate-50">
                No hay entregas registradas para este insumo.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded bg-white divide-y divide-slate-150">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <th className="px-3 py-1.5 border-r border-slate-200">Fecha</th>
                      <th className="px-3 py-1.5 border-r border-slate-200 text-right">Cantidad</th>
                      <th className="px-3 py-1.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-semibold text-slate-800">
                    {item.receipts?.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-1.5 border-r border-slate-200 font-mono text-[11px]">{r.fecha}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-right font-extrabold text-mosque">
                          +{r.cantidad.toLocaleString()} {item.unidad}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          {deletingReceiptId === r.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteReceipt(r.id);
                                  setDeletingReceiptId(null);
                                }}
                                className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer flex items-center justify-center"
                                title="Confirmar"
                              >
                                <Icon name="check_circle" className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingReceiptId(null)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer flex items-center justify-center"
                                title="Cancelar"
                              >
                                <Icon name="close" className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingReceiptId(r.id)}
                              className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer inline-flex items-center justify-center hover:scale-105 transition-all"
                              title="Eliminar"
                            >
                              <Icon name="delete" className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Form Side */}
          <form onSubmit={handleAddReceipt} className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-5 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="block font-sf-pro text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Registrar Entrega
              </span>
              
              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-slate-400 uppercase">Cantidad a recibir</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="Ej. 20"
                  value={newReceiptQty}
                  onChange={(e) => setNewReceiptQty(e.target.value)}
                  disabled={isSavingReceipt}
                  className="w-full bg-white border border-slate-200 py-1 px-2 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400 transition-all font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-slate-400 uppercase">Fecha de Recepción</label>
                <input
                  type="date"
                  required
                  value={newReceiptDate}
                  onChange={(e) => setNewReceiptDate(e.target.value)}
                  disabled={isSavingReceipt}
                  className="w-full bg-white border border-slate-200 py-1 px-2 text-xs font-semibold text-slate-800 rounded outline-none focus:border-slate-400 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingReceipt}
              className="mt-6 w-full py-1.5 bg-mosque text-clear-day font-bold text-[9px] uppercase tracking-wider rounded hover:bg-mosque/95 transition-all outline-none cursor-pointer flex items-center justify-center gap-1"
            >
              {isSavingReceipt ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <Icon name="local_shipping" className="h-3.5 w-3.5" />
                  <span>Registrar Entrega</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="px-3.5 py-1 bg-slate-700 text-white font-bold text-xs rounded hover:bg-slate-800 active:scale-95 transition-all outline-none cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
