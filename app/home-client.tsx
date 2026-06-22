"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import StatsOverview from "./components/StatsOverview";
import RequirementTable from "./components/RequirementTable";
import RequirementModal from "./components/RequirementModal";
import DetailModal from "./components/DetailModal";
import SolicitudModal from "./components/SolicitudModal";
import MaterialsPanel from "./components/MaterialsPanel";
import UploadExcelRequisitionModal from "./components/UploadExcelRequisitionModal";
import { PersonalAssa, MaterialRequirement } from "./components/types";
import { createPersonalRequirementAction, promoteRequirementAction } from "./actions";

interface HomeClientProps {
  activeTab: string;
  allPersonal: PersonalAssa[];
  materials: MaterialRequirement[];
  searchQuery: string;
  existingTramos: string[];
  existingCargos: string[];
  activeStaffCount: number;
  totalRequirementsCount: number;
  tramoCount: number;
  cargoCount: number;
}

export default function HomeClient({
  activeTab,
  allPersonal,
  materials,
  searchQuery,
  existingTramos,
  existingCargos,
  activeStaffCount,
  totalRequirementsCount,
  tramoCount,
  cargoCount,
}: HomeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved !== null) {
      setIsSidebarCollapsed(saved === "true");
    }
  }, []);

  const handleToggleSidebarCollapse = () => {
    const newVal = !isSidebarCollapsed;
    setIsSidebarCollapsed(newVal);
    localStorage.setItem("sidebar_collapsed", String(newVal));
  };

  // States for Active Staff Capataz Detail Modal
  const [activeDetailCapataz, setActiveDetailCapataz] = useState<string | null>(null);
  const [activeDetailTramo, setActiveDetailTramo] = useState<string | null>(null);

  // States for Requirement Solicitud Detail Modal
  const [activeSolicitud, setActiveSolicitud] = useState<string | null>(null);
  const [activeSolicitudTramo, setActiveSolicitudTramo] = useState<string | null>(null);

  // States for Materials Solicitud Detail Modal
  const [activeMaterialSolicitud, setActiveMaterialSolicitud] = useState<string | null>(null);

  const handleTabChange = (tabId: string) => {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("tab", tabId);
      router.push(`/?${params.toString()}`);
    });
  };

  const handleRequirementSubmit = async (data: {
    tramo: string;
    solicitud: string;
    fechaSolicitud: string;
    cargo: string;
    cantidad: number;
  }) => {
    const result = await createPersonalRequirementAction(data);
    if (!result.success) {
      alert(`Error al guardar el requerimiento: ${result.error}`);
    } else {
      startTransition(() => {
        router.refresh();
      });
    }
  };

  const handlePromoteRequirement = async (
    id: number,
    data: {
      nombres: string;
      codigo: string;
      dni: string;
      capataz: string;
      fecing: string;
    }
  ) => {
    const result = await promoteRequirementAction(id, data);
    if (!result.success) {
      alert(`Error al activar personal: ${result.error}`);
      throw new Error(result.error);
    } else {
      startTransition(() => {
        router.refresh();
      });
    }
  };

  // Derive distinct capataces list from active staff to feed the dropdown in SolicitudModal
  const existingCapataces = Array.from(
    new Set(
      allPersonal
        .filter((p) => p.estado === "Activo" && p.capataz && p.capataz.trim())
        .map((p) => p.capataz!.trim())
    )
  ).sort((a, b) => a.localeCompare(b));

  // Gather active staff employees under the selected capataz & tramo
  const capatazEmployees =
    activeDetailCapataz && activeDetailTramo
      ? allPersonal.filter(
          (p) =>
            p.estado === "Activo" &&
            p.capataz === activeDetailCapataz &&
            p.tramo === activeDetailTramo
        )
      : [];

  // Group cargos and counts for the selected capataz
  const cargoBreakdownObj: Record<string, number> = {};
  capatazEmployees.forEach((emp) => {
    cargoBreakdownObj[emp.cargo] = (cargoBreakdownObj[emp.cargo] || 0) + 1;
  });
  const cargoBreakdown = Object.entries(cargoBreakdownObj).map(([cargo, count]) => ({
    cargo,
    count,
  }));

  // Gather individual requirements under the selected solicitud & tramo
  const solicitudRequirements =
    activeSolicitud && activeSolicitudTramo
      ? allPersonal.filter(
          (p) => p.solicitud === activeSolicitud && p.tramo === activeSolicitudTramo
        )
      : [];

  // Calculate Materials stats
  const totalMaterialRequests = Array.from(new Set(materials.map((m) => m.codigoRequerimiento))).length;
  const arrivedMaterialItems = materials.filter((m) => (parseFloat(m.cantidadAlmacen || "0") || 0) > 0).length;

  return (
    <div className="min-h-screen bg-clear-day flex flex-col antialiased">
      {/* Loading Overlay Spinner for Client Transitions */}
      {isPending && (
        <div className="fixed inset-0 bg-clear-day/70 backdrop-blur-xs z-[999] flex flex-col items-center justify-center font-sf-pro animate-in fade-in duration-200">
          <div className="relative flex flex-col items-center gap-4 p-8 rounded-2xl bg-white border border-slate-200 shadow-xl max-w-sm w-full mx-4">
            <div className="relative flex items-center justify-center w-16 h-16">
              <div className="absolute inset-0 border-4 border-mosque/20 border-t-mosque rounded-full animate-spin" />
              <span className="material-symbols-outlined text-2xl text-mosque animate-pulse select-none">
                lan
              </span>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Control ASSA
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Cargando información...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Top Header Bar */}
      <TopBar
        onMenuToggle={() => {
          if (window.innerWidth >= 768) {
            handleToggleSidebarCollapse();
          } else {
            setIsSidebarOpen(!isSidebarOpen);
          }
        }}
        onAddClick={() => {
          setIsRequirementModalOpen(true);
        }}
        searchQuery={searchQuery}
        isSidebarCollapsed={isSidebarCollapsed}
        showAddButton={activeTab !== "materials"}
      />

      {/* Main Canvas Area */}
      <main className={`flex-1 ml-0 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"} p-4 md:p-6 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto space-y-4">
          {activeTab === "materials" ? (
            /* ==================== MATERIALS SECTION ==================== */
            <>
              {/* Header Title section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-sf-pro text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">
                    Requerimientos de Materiales ASSA
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Visualización consolidada de solicitudes de materiales e insumos de obra.
                  </p>
                </div>
              </div>

              {/* Stats Metrics Cards */}
              <StatsOverview
                activeStaffCount={totalMaterialRequests}
                totalRequirementsCount={arrivedMaterialItems}
                tramoCount={0}
                cargoCount={materials.length}
                isMaterials={true}
              />

              {/* Materials List Panel */}
              <MaterialsPanel
                items={materials}
                searchQuery={searchQuery}
                onAddClick={() => setIsAddMaterialModalOpen(true)}
              />
            </>
          ) : (
            /* ==================== PERSONAL SECTION ==================== */
            <>
              {/* Header Title section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-sf-pro text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">
                    Control de Personal ASSA
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Visualice el resumen de personal activo por capataz y gestione la activación de requerimientos pendientes.
                  </p>
                </div>
              </div>

              {/* Stats Metrics Cards */}
              <StatsOverview
                activeStaffCount={activeStaffCount}
                totalRequirementsCount={totalRequirementsCount}
                tramoCount={tramoCount}
                cargoCount={cargoCount}
                isMaterials={false}
              />

              {/* Personal List Panel */}
              <RequirementTable
                allPersonal={allPersonal}
                searchQuery={searchQuery}
                onCapatazClick={(capataz, tramo) => {
                  setActiveDetailCapataz(capataz);
                  setActiveDetailTramo(tramo);
                }}
                onSolicitudClick={(solicitud, tramo) => {
                  setActiveSolicitud(solicitud);
                  setActiveSolicitudTramo(tramo);
                }}
              />
            </>
          )}
        </div>
      </main>

      {/* Add Requirement Modal */}
      <RequirementModal
        isOpen={isRequirementModalOpen}
        onClose={() => setIsRequirementModalOpen(false)}
        onSubmit={handleRequirementSubmit}
        existingTramos={existingTramos}
        existingCargos={existingCargos}
      />

      {/* Active Staff Drill-down Detail Modal */}
      <DetailModal
        isOpen={!!activeDetailCapataz}
        onClose={() => {
          setActiveDetailCapataz(null);
          setActiveDetailTramo(null);
        }}
        capataz={activeDetailCapataz || ""}
        tramo={activeDetailTramo || ""}
        cargoBreakdown={cargoBreakdown}
        employees={capatazEmployees}
      />

      {/* Grouped Solicitud Detail Modal (Promotion flow) */}
      <SolicitudModal
        isOpen={!!activeSolicitud}
        onClose={() => {
          setActiveSolicitud(null);
          setActiveSolicitudTramo(null);
        }}
        solicitud={activeSolicitud || ""}
        tramo={activeSolicitudTramo || ""}
        requirements={solicitudRequirements}
        existingCapataces={existingCapataces}
        onPromote={handlePromoteRequirement}
      />

      {/* Upload Material Requisition Modal */}
      <UploadExcelRequisitionModal
        isOpen={isAddMaterialModalOpen}
        onClose={() => setIsAddMaterialModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
