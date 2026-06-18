import React from "react";
import HomeClient from "./home-client";
import {
  getActiveStaffAction,
  getRequirementsReportAction,
  getExistingCargosAction,
  getExistingTramosAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    search?: string;
    tramo?: string;
    cargo?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const tab = resolvedParams.tab || "personal";
  const page = parseInt(resolvedParams.page || "1", 10);
  const search = resolvedParams.search || "";
  const tramo = resolvedParams.tramo || "All";
  const cargo = resolvedParams.cargo || "All";

  // Fetch lists for filters and dropdowns
  const existingCargos = await getExistingCargosAction();
  const existingTramos = await getExistingTramosAction();

  // Fetch counts for the global metrics cards
  const { totalCount: activeStaffCount } = await getActiveStaffAction(1, 1);
  const { report: globalReport } = await getRequirementsReportAction();
  const totalRequirementsCount = globalReport.reduce((acc, curr) => acc + curr.cantidad, 0);

  let staff: any[] = [];
  let report: any[] = [];
  let totalCount = 0;

  if (tab === "personal") {
    const res = await getActiveStaffAction(page, 10, search, tramo, cargo);
    staff = res.staff;
    totalCount = res.totalCount;
  } else {
    const res = await getRequirementsReportAction(search, tramo, cargo);
    report = res.report;
    totalCount = res.report.length;
  }

  return (
    <HomeClient
      activeTab={tab}
      staff={staff}
      report={report}
      totalCount={totalCount}
      currentPage={page}
      filterTramo={tramo}
      filterCargo={cargo}
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
