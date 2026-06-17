"use client";

import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import StatsOverview from "./components/StatsOverview";
import RequirementTable from "./components/RequirementTable";
import RequirementModal from "./components/RequirementModal";
import { Requirement } from "./components/types";
import {
  addRequirementAction,
  updateRequirementAction,
  deleteRequirementAction,
  changeStatusAction,
} from "./actions";

interface HomeClientProps {
  initialRequirements: Requirement[];
  totalCount: number;
  currentPage: number;
  filterType: string;
  sortBy: string;
  searchQuery: string;
}

export default function HomeClient({
  initialRequirements,
  totalCount,
  currentPage,
  filterType,
  sortBy,
  searchQuery,
}: HomeClientProps) {
  const [activeTab, setActiveTab] = useState("requirements");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);

  // Status handlers using Server Actions
  const handleStatusChange = async (code: string, newStatus: Requirement["status"]) => {
    const result = await changeStatusAction(code, newStatus);
    if (!result.success) {
      alert(`Error al actualizar estado: ${result.error}`);
    }
  };

  const handleEditClick = (req: Requirement) => {
    setEditingReq(req);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (code: string) => {
    const result = await deleteRequirementAction(code);
    if (!result.success) {
      alert(`Error al eliminar requerimiento: ${result.error}`);
    }
  };

  const handleModalSubmit = async (newReq: Requirement) => {
    let result;
    if (editingReq) {
      result = await updateRequirementAction(newReq);
    } else {
      result = await addRequirementAction(newReq);
    }

    if (!result.success) {
      alert(`Error al guardar: ${result.error}`);
    }
  };

  // Generate next code sequentially based on total count
  const generateNextCode = () => {
    const base = "REQ-ASSA-";
    // We append a random or timestamp or index. To be safe we can use timestamp or next sequence
    // Let's generate a code based on a simple unique identifier
    const nextNum = Math.floor(Math.random() * 900) + 100;
    return `${base}${nextNum}`;
  };

  return (
    <div className="min-h-screen bg-clear-day flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Top Header Bar */}
      <TopBar
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onAddClick={() => {
          setEditingReq(null);
          setIsModalOpen(true);
        }}
        searchQuery={searchQuery}
      />

      {/* Main Canvas Area */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === "requirements" && (
            <>
              {/* Header Title section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-sf-pro text-2xl md:text-3xl font-extrabold text-nordic tracking-tight">
                    Control de Requerimientos ASSA
                  </h1>
                  <p className="text-xs md:text-sm font-semibold text-nordic/60 mt-1">
                    Administre, apruebe y realice seguimiento de las solicitudes técnicas y de personal del proyecto.
                  </p>
                </div>
              </div>

              {/* Stats Metrics Cards */}
              <StatsOverview requirements={initialRequirements} />

              {/* Requirements Table Wrapper */}
              <RequirementTable
                requirements={initialRequirements}
                onStatusChange={handleStatusChange}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                currentPage={currentPage}
                totalCount={totalCount}
                limit={5}
                filterType={filterType}
                sortBy={sortBy}
              />
            </>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-sf-pro text-2xl md:text-3xl font-extrabold text-nordic tracking-tight">
                  Dashboard Resumen
                </h1>
                <p className="text-xs md:text-sm font-semibold text-nordic/60 mt-1">
                  Métricas clave y estado de avance de los requerimientos de ASSA.
                </p>
              </div>
              <StatsOverview requirements={initialRequirements} />
              
              {/* Custom Dashboard Visual Mock */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-nordic/10 p-6 rounded-xl shadow-sm space-y-4">
                  <h3 className="font-sf-pro font-bold text-sm text-nordic uppercase tracking-wider">
                    Distribución por Tipo de Requerimiento
                  </h3>
                  <div className="space-y-3 pt-2">
                    {["Staff", "Machine", "Service"].map((t) => {
                      const count = initialRequirements.filter((r) => r.type === t).length;
                      const percentage = initialRequirements.length ? (count / initialRequirements.length) * 100 : 0;
                      return (
                        <div key={t} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-nordic">
                            <span>{t === "Staff" ? "Staff (Personal)" : t === "Machine" ? "Machine (Equipos)" : "Service (Servicios)"}</span>
                            <span>{count} ({Math.round(percentage)}%)</span>
                          </div>
                          <div className="h-2 w-full bg-clear-day rounded-full overflow-hidden">
                            <div
                              className="h-full bg-mosque rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-nordic/10 p-6 rounded-xl shadow-sm space-y-4">
                  <h3 className="font-sf-pro font-bold text-sm text-nordic uppercase tracking-wider">
                    Estado por Módulos ASSA
                  </h3>
                  <div className="space-y-3 pt-2">
                    {Array.from(new Set(initialRequirements.map((r) => r.module))).slice(0, 4).map((mod) => {
                      const count = initialRequirements.filter((r) => r.module === mod).length;
                      const percentage = initialRequirements.length ? (count / initialRequirements.length) * 100 : 0;
                      return (
                        <div key={mod} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-nordic">
                            <span>{mod}</span>
                            <span>{count} requerimientos</span>
                          </div>
                          <div className="h-2 w-full bg-clear-day rounded-full overflow-hidden">
                            <div
                              className="h-full bg-hint-of-green rounded-full border border-mosque/20 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "modules" && (
            <div className="bg-white border border-nordic/10 p-8 rounded-xl shadow-sm space-y-4 text-center max-w-lg mx-auto mt-12">
              <span className="material-symbols-outlined text-[48px] text-mosque">
                inventory_2
              </span>
              <h2 className="font-sf-pro font-bold text-lg text-nordic">Módulos del Sistema ASSA</h2>
              <p className="text-xs font-semibold text-nordic/60">
                Visualice y configure los módulos asignados a este proyecto (Facturación, Inventarios, Clientes, Reportes, Infraestructura).
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab("requirements")}
                  className="bg-mosque text-clear-day px-4 py-2 text-xs font-bold rounded shadow-sm hover:opacity-90 transition-all outline-none"
                >
                  Volver a Requerimientos
                </button>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="bg-white border border-nordic/10 p-8 rounded-xl shadow-sm space-y-4 text-center max-w-lg mx-auto mt-12">
              <span className="material-symbols-outlined text-[48px] text-mosque">
                construction
              </span>
              <h2 className="font-sf-pro font-bold text-lg text-nordic">Reportes & Auditoría</h2>
              <p className="text-xs font-semibold text-nordic/60">
                Exportación de métricas consolidadas, tiempos de respuesta de aprobaciones e informes de personal asignado.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab("requirements")}
                  className="bg-mosque text-clear-day px-4 py-2 text-xs font-bold rounded shadow-sm hover:opacity-90 transition-all outline-none"
                >
                  Volver a Requerimientos
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Requirement Modal */}
      <RequirementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReq(null);
        }}
        onSubmit={handleModalSubmit}
        editingReq={editingReq}
        nextCode={generateNextCode()}
      />
    </div>
  );
}
