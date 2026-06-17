import React from "react";
import HomeClient from "./home-client";
import { getRequirementsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    type?: string;
    sort?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);
  const search = resolvedParams.search || "";
  const type = resolvedParams.type || "All";
  const sort = resolvedParams.sort || "newest";

  // Fetch paginated, filtered, sorted data directly from Supabase on the server
  const { requirements, totalCount } = await getRequirementsAction(
    page,
    5, // limit
    search,
    type,
    sort
  );

  return (
    <HomeClient
      initialRequirements={requirements}
      totalCount={totalCount}
      currentPage={page}
      filterType={type}
      sortBy={sort}
      searchQuery={search}
    />
  );
}

