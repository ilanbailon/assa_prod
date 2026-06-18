"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import StatsOverview from "./components/StatsOverview";
import RequirementTable from "./components/RequirementTable";
import RequirementModal from "./components/RequirementModal";
import { PersonalAssa, GroupedRequirementReport } from "./components/types";
import { createPersonalRequirementAction } from "./actions";

interface HomeClientProps {
  activeTab: string;
  staff: PersonalAssa[];
  report: GroupedRequirementReport[];
  totalCount: number;
  currentPage: number;
  filterTramo: string;
  filterCargo: string;
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
  staff,
  report,
  totalCount,
  currentPage,
  filterTramo,
  filterCargo,
  searchQuery,
  existingTramos,
  existingCargos,
  activeStaffCount,
  totalRequirementsCount,
  tramoCount,
  cargoCount,
}: HomeClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams();
    params.set("tab", tabId);
    // Reset page and other parameters when changing tabs to avoid mismatching filters
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleModalSubmit = async (data: {
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
        onAddClick={() => setIsModalOpen(true)}
        searchQuery={searchQuery}
      />

      {/* Main Canvas Area */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Title section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-sf-pro text-2xl md:text-3xl font-extrabold text-nordic tracking-tight">
                {activeTab === "personal"
                  ? "Reporte de Personal Activo"
                  : "Reporte de Requerimientos de Personal"}
              </h1>
              <p className="text-xs md:text-sm font-semibold text-nordic/60 mt-1">
                {activeTab === "personal"
                  ? "Visualización y filtrado del personal actualmente activo en obra."
                  : "Listado agrupado por frente, solicitud y puesto con cantidades requeridas."}
              </p>
            </div>
          </div>

          {/* Stats Metrics Cards */}
          <StatsOverview
            activeStaffCount={activeStaffCount}
            totalRequirementsCount={totalRequirementsCount}
            tramoCount={tramoCount}
            cargoCount={cargoCount}
          />

          {/* Main Table/Report */}
          <RequirementTable
            activeTab={activeTab}
            staff={staff}
            report={report}
            currentPage={currentPage}
            totalCount={totalCount}
            limit={10}
            filterTramo={filterTramo}
            filterCargo={filterCargo}
            existingTramos={existingTramos}
            existingCargos={existingCargos}
          />
        </div>
      </main>

      {/* Add Requirement Modal */}
      <RequirementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        existingTramos={existingTramos}
        existingCargos={existingCargos}
      />
    </div>
  );
}
