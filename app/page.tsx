import React from "react";
import HomeClient from "./home-client";
import { PersonalAssa } from "./components/types";
import {
  getAllPersonalAction,
  getExistingCargosAction,
  getExistingTramosAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    search?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const tab = resolvedParams.tab || "personal";
  const search = resolvedParams.search || "";

  // Fetch lists for filters and dropdowns
  const existingCargos = await getExistingCargosAction();
  const existingTramos = await getExistingTramosAction();

  // Fetch all personnel records to perform groupings dynamically
  const allPersonal: PersonalAssa[] = await getAllPersonalAction();

  // Calculate stats for overview
  const activeStaffCount = allPersonal.filter((p) => p.estado === "Activo").length;
  const totalRequirementsCount = allPersonal.filter((p) => p.estado === "Requerimiento").length;

  return (
    <HomeClient
      activeTab={tab}
      allPersonal={allPersonal}
      searchQuery={search}
      existingTramos={existingTramos}
      existingCargos={existingCargos}
      activeStaffCount={activeStaffCount}
      totalRequirementsCount={totalRequirementsCount}
      tramoCount={existingTramos.length}
      cargoCount={existingCargos.length}
    />
  );
}
