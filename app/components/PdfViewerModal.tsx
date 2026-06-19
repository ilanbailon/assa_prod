"use client";

import React from "react";
import Icon from "./Icon";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  codigoRequerimiento: string;
}

export default function PdfViewerModal({
  isOpen,
  onClose,
  pdfUrl,
  codigoRequerimiento,
}: PdfViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-nordic/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white w-full max-w-5xl border border-nordic/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300 flex flex-col h-[85vh]">
        {/* Header */}
        <div className="bg-nordic text-clear-day px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-sf-pro font-bold text-base md:text-lg text-hint-of-green">
              Visor de PDF - Requerimiento {codigoRequerimiento}
            </h3>
            <p className="text-xs text-clear-day/70 font-semibold mt-0.5">
              Visualización directa del documento oficial de requerimiento de materiales.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-hint-of-green bg-mosque/30 px-3 py-1.5 rounded-lg hover:bg-mosque/55 transition-colors outline-none"
            >
              <Icon name="download" className="h-4 w-4" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
            <button
              onClick={onClose}
              className="hover:bg-clear-day/10 rounded-full p-1.5 transition-colors cursor-pointer outline-none flex items-center justify-center text-clear-day"
              type="button"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-clear-day/30 p-2 overflow-hidden">
          <iframe
            src={pdfUrl}
            title={`PDF Requerimiento ${codigoRequerimiento}`}
            className="w-full h-full border-0 rounded-lg bg-white"
          />
        </div>

        {/* Footer */}
        <div className="bg-clear-day px-6 py-3 border-t border-nordic/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2 bg-nordic text-clear-day font-bold text-xs rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all outline-none cursor-pointer"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
}
