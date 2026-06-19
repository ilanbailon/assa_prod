"use client";

import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import { createBulkMaterialRequirementsAction } from "../actions";
import { useRouter } from "next/navigation";

interface AddMaterialRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NewMaterialItem {
  codigoRecurso: string;
  recurso: string;
  unidad: string;
  cantidad: number;
  partidaControlCode: string;
  partidaControl: string;
  fechaPedido: string;
}

export default function AddMaterialRequisitionModal({
  isOpen,
  onClose,
}: AddMaterialRequisitionModalProps) {
  const router = useRouter();
  const [codigoRequerimiento, setCodigoRequerimiento] = useState("");
  const [items, setItems] = useState<NewMaterialItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with one blank row when opened
  useEffect(() => {
    if (isOpen) {
      setCodigoRequerimiento("");
      setItems([
        {
          codigoRecurso: "",
          recurso: "",
          unidad: "UND",
          cantidad: 1,
          partidaControlCode: "",
          partidaControl: "",
          fechaPedido: new Date().toISOString().slice(0, 10),
        },
      ]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        codigoRecurso: "",
        recurso: "",
        unidad: "UND",
        cantidad: 1,
        partidaControlCode: "",
        partidaControl: "",
        fechaPedido: new Date().toISOString().slice(0, 10),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof NewMaterialItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = codigoRequerimiento.trim();
    if (!cleanCode) {
      alert("Por favor ingrese el código del requerimiento.");
      return;
    }

    // Validate items
    const invalidItem = items.some((item) => !item.recurso.trim() || item.cantidad <= 0);
    if (invalidItem) {
      alert("Por favor, asegúrese de que todos los insumos tengan una descripción válida y cantidad mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedItems = items.map((item) => ({
        codigoRecurso: item.codigoRecurso.trim() || null,
        recurso: item.recurso.trim(),
        unidad: item.unidad.trim(),
        cantidad: item.cantidad,
        partidaControlCode: item.partidaControlCode.trim() || null,
        partidaControl: item.partidaControl.trim() || null,
        fechaPedido: item.fechaPedido || null,
      }));

      const res = await createBulkMaterialRequirementsAction(cleanCode, formattedItems);
      if (res.success) {
        router.refresh();
        onClose();
      } else {
        alert("Error al guardar: " + res.error);
      }
    } catch (err: any) {
      alert("Error en el servidor: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-nordic/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white w-full max-w-5xl border border-nordic/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-nordic text-clear-day px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="font-sf-pro font-bold text-base md:text-lg text-hint-of-green">
            Registrar Nuevo Requerimiento de Materiales
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
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Requisition General Details */}
          <div className="p-6 pb-4 border-b border-nordic/5 bg-clear-day/30 shrink-0">
            <div className="max-w-xs space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-nordic/50 uppercase">
                Código del Requerimiento *
              </label>
              <input
                type="text"
                placeholder="Ej. 105"
                value={codigoRequerimiento}
                onChange={(e) => setCodigoRequerimiento(e.target.value)}
                required
                className="w-full bg-white border border-nordic/15 px-3 py-2 text-xs md:text-sm font-mono font-bold text-nordic rounded-lg outline-none focus:ring-2 focus:ring-mosque/40 placeholder:text-nordic/30"
              />
              <p className="text-[9px] text-nordic/40 italic">
                Este código identificará la solicitud de materiales en el listado agrupado.
              </p>
            </div>
          </div>

          {/* Requisition Material Items (Scrollable Table) */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-sf-pro text-[11px] font-bold tracking-wider text-nordic/60 uppercase">
                Insumos a Solicitar ({items.length})
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-xs font-bold text-mosque hover:bg-mosque/5 border border-mosque/20 px-3 py-1.5 rounded-lg outline-none cursor-pointer transition-all"
              >
                <Icon name="add" className="h-4 w-4" />
                <span>Agregar Insumo</span>
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block border border-nordic/10 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-clear-day border-b border-nordic/10 text-nordic/60 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-3 py-2.5 w-10 text-center">#</th>
                    <th className="px-3 py-2.5 w-24">Cód. Recurso</th>
                    <th className="px-4 py-2.5">Insumo / Descripción *</th>
                    <th className="px-3 py-2.5 w-20 text-center">Unidad</th>
                    <th className="px-3 py-2.5 w-24 text-right">Cantidad *</th>
                    <th className="px-4 py-2.5">Partida de Control (Código y Desc.)</th>
                    <th className="px-3 py-2.5 w-36">Fecha Pedido</th>
                    <th className="px-3 py-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nordic/5 font-semibold text-nordic">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-clear-day/10 transition-colors">
                      <td className="px-3 py-2.5 text-center text-nordic/40 font-bold">{idx + 1}</td>
                      
                      {/* Resource Code */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="Código"
                          value={item.codigoRecurso}
                          onChange={(e) => handleUpdateItem(idx, "codigoRecurso", e.target.value)}
                          className="w-full bg-clear-day/30 border border-nordic/10 px-2 py-1 rounded outline-none focus:border-mosque font-mono text-[11px]"
                        />
                      </td>

                      {/* Resource Name */}
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Ej. Madera tornillo 2x2"
                          value={item.recurso}
                          onChange={(e) => handleUpdateItem(idx, "recurso", e.target.value)}
                          required
                          className="w-full bg-clear-day/30 border border-nordic/10 px-2 py-1 rounded outline-none focus:border-mosque"
                        />
                      </td>

                      {/* Unit */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="Ej. GLN"
                          value={item.unidad}
                          onChange={(e) => handleUpdateItem(idx, "unidad", e.target.value)}
                          required
                          className="w-full bg-clear-day/30 border border-nordic/10 px-2 py-1 rounded outline-none focus:border-mosque text-center font-bold"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.cantidad}
                          onChange={(e) => handleUpdateItem(idx, "cantidad", parseFloat(e.target.value) || 0)}
                          required
                          className="w-full bg-clear-day/30 border border-nordic/10 px-2 py-1 rounded outline-none focus:border-mosque text-right font-extrabold"
                        />
                      </td>

                      {/* Partida de Control */}
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Cód (ej. 01.01)"
                            value={item.partidaControlCode}
                            onChange={(e) => handleUpdateItem(idx, "partidaControlCode", e.target.value)}
                            className="w-24 bg-clear-day/30 border border-nordic/10 px-2 py-1 rounded outline-none focus:border-mosque font-mono text-[10px]"
                          />
                          <input
                            type="text"
                            placeholder="Descripción de la Partida"
                            value={item.partidaControl}
                            onChange={(e) => handleUpdateItem(idx, "partidaControl", e.target.value)}
                            className="flex-1 bg-clear-day/30 border border-nordic/10 px-2 py-1 rounded outline-none focus:border-mosque text-[11px]"
                          />
                        </div>
                      </td>

                      {/* Order Date */}
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={item.fechaPedido}
                          onChange={(e) => handleUpdateItem(idx, "fechaPedido", e.target.value)}
                          className="w-full bg-clear-day/30 border border-nordic/10 px-2 py-1 rounded outline-none focus:border-mosque font-bold text-[11px]"
                        />
                      </td>

                      {/* Delete button */}
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-red-500 hover:text-red-700 disabled:opacity-30 cursor-pointer p-1 transition-colors"
                        >
                          <Icon name="delete" className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View for List (Below lg) */}
            <div className="block lg:hidden space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="border border-nordic/10 rounded-xl p-4 space-y-3 bg-clear-day/20 relative">
                  <div className="flex justify-between items-center border-b border-nordic/5 pb-2">
                    <span className="font-bold text-xs text-nordic">Insumo #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 cursor-pointer p-1 transition-colors absolute top-3 right-3"
                    >
                      <Icon name="delete" className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[8px] font-bold text-nordic/50 uppercase">Descripción *</label>
                      <input
                        type="text"
                        placeholder="Descripción"
                        value={item.recurso}
                        onChange={(e) => handleUpdateItem(idx, "recurso", e.target.value)}
                        required
                        className="w-full bg-white border border-nordic/10 px-2 py-1 rounded text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] font-bold text-nordic/50 uppercase">Cód. Recurso</label>
                      <input
                        type="text"
                        placeholder="Código"
                        value={item.codigoRecurso}
                        onChange={(e) => handleUpdateItem(idx, "codigoRecurso", e.target.value)}
                        className="w-full bg-white border border-nordic/10 px-2 py-1 rounded text-xs outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className="block text-[8px] font-bold text-nordic/50 uppercase">Unidad</label>
                        <input
                          type="text"
                          value={item.unidad}
                          onChange={(e) => handleUpdateItem(idx, "unidad", e.target.value)}
                          required
                          className="w-full bg-white border border-nordic/10 px-2 py-1 rounded text-xs outline-none text-center font-bold"
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="block text-[8px] font-bold text-nordic/50 uppercase">Cantidad *</label>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleUpdateItem(idx, "cantidad", parseFloat(e.target.value) || 0)}
                          required
                          className="w-full bg-white border border-nordic/10 px-2 py-1 rounded text-xs outline-none text-right font-extrabold"
                        />
                      </div>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="block text-[8px] font-bold text-nordic/50 uppercase">Partida de Control</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Cód"
                          value={item.partidaControlCode}
                          onChange={(e) => handleUpdateItem(idx, "partidaControlCode", e.target.value)}
                          className="w-1/3 bg-white border border-nordic/10 px-2 py-1 rounded text-xs outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Descripción"
                          value={item.partidaControl}
                          onChange={(e) => handleUpdateItem(idx, "partidaControl", e.target.value)}
                          className="w-2/3 bg-white border border-nordic/10 px-2 py-1 rounded text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[8px] font-bold text-nordic/50 uppercase">Fecha Pedido</label>
                      <input
                        type="date"
                        value={item.fechaPedido}
                        onChange={(e) => handleUpdateItem(idx, "fechaPedido", e.target.value)}
                        className="w-full bg-white border border-nordic/10 px-2 py-1 rounded text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-clear-day px-6 py-4 border-t border-nordic/10 flex gap-3 justify-end shrink-0">
            <button
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-xs font-bold text-nordic hover:bg-clear-day/80 active:scale-98 transition-all cursor-pointer outline-none disabled:opacity-50"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-mosque text-clear-day rounded-lg font-bold text-xs shadow-md hover:bg-mosque/95 active:scale-98 transition-all cursor-pointer outline-none disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>GUARDANDO...</span>
                </>
              ) : (
                <span>GUARDAR REQUERIMIENTO</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
