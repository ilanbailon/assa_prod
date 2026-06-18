"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import StatsOverview from "./components/StatsOverview";
import RequirementTable from "./components/RequirementTable";
import RequirementModal from "./components/RequirementModal";
import DetailModal from "./components/DetailModal";
import SolicitudModal from "./components/SolicitudModal";
import MaterialsPanel from "./components/MaterialsPanel";
import MaterialsModal from "./components/MaterialsModal";
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);

  // States for Active Staff Capataz Detail Modal
  const [activeDetailCapataz, setActiveDetailCapataz] = useState<string | null>(null);
  const [activeDetailTramo, setActiveDetailTramo] = useState<string | null>(null);

  // States for Requirement Solicitud Detail Modal
  const [activeSolicitud, setActiveSolicitud] = useState<string | null>(null);
  const [activeSolicitudTramo, setActiveSolicitudTramo] = useState<string | null>(null);

  // States for Materials Solicitud Detail Modal
  const [activeMaterialSolicitud, setActiveMaterialSolicitud] = useState<string | null>(null);

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams();
    params.set("tab", tabId);
    router.push(`/?${params.toString()}`);
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
      router.refresh();
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
      router.refresh();
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
  const approvedMaterialItems = materials.filter((m) => m.estado === "Aprobado").length;

  return (
    <div className="min-h-screen bg-clear-day flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {/* Top Header Bar */}
      <TopBar
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onAddClick={() => setIsRequirementModalOpen(true)}
        searchQuery={searchQuery}
      />

      {/* Main Canvas Area */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === "materials" ? (
            /* ==================== MATERIALS SECTION ==================== */
            <>
              {/* Header Title section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-sf-pro text-2xl md:text-3xl font-extrabold text-nordic tracking-tight">
                    Requerimientos de Materiales ASSA
                  </h1>
                  <p className="text-xs md:text-sm font-semibold text-nordic/60 mt-1">
                    Visualización consolidada de solicitudes de materiales e insumos de obra.
                  </p>
                </div>
              </div>

              {/* Stats Metrics Cards */}
              <StatsOverview
                activeStaffCount={totalMaterialRequests}
                totalRequirementsCount={approvedMaterialItems}
                tramoCount={0}
                cargoCount={0}
                isMaterials={true}
              />

              {/* Materials List Panel */}
              <MaterialsPanel
                items={materials}
                searchQuery={searchQuery}
                onSolicitudClick={(codigoRequerimiento) => {
                  setActiveMaterialSolicitud(codigoRequerimiento);
                }}
              />
            </>
          ) : (
            /* ==================== PERSONAL SECTION ==================== */
            <>
              {/* Header Title section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-sf-pro text-2xl md:text-3xl font-extrabold text-nordic tracking-tight">
                    Control de Personal ASSA
                  </h1>
                  <p className="text-xs md:text-sm font-semibold text-nordic/60 mt-1">
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

      {/* Materials Requisition Detail Modal */}
      <MaterialsModal
        isOpen={!!activeMaterialSolicitud}
        onClose={() => setActiveMaterialSolicitud(null)}
        codigoRequerimiento={activeMaterialSolicitud || ""}
        items={materials.filter((m) => m.codigoRequerimiento === activeMaterialSolicitud)}
      />
    </div>
  );
}
