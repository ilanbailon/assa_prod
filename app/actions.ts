"use server";

import { revalidatePath } from "next/cache";
import { PersonalAssa, GroupedRequirementReport } from "./components/types";

// Helper to map DB row to client PersonalAssa
function mapPersonalToClient(row: any): PersonalAssa {
  return {
    id: row.id,
    tramo: row.tramo,
    solicitud: row.solicitud,
    fechaSolicitud: row.fecha_solicitud,
    estado: row.estado as 'Activo' | 'Requerimiento',
    capataz: row.capataz,
    cargo: row.cargo,
    nombres: row.nombres,
    codigo: row.codigo,
    dni: row.dni,
    fecing: row.fecing,
  };
}

// Fetch all personnel records (active and requirements) from Supabase
export async function getAllPersonalAction() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("Credentials error: Supabase variables are not set in the environment.");
    return [];
  }

  // Fetch all rows (limit set to 1000 since there are ~400, ordering by id)
  const url = `${supabaseUrl}/rest/v1/personal_assa?order=id.asc`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase Rest API getAllPersonalAction fetch failed:", errText);
      return [];
    }

    const data = await res.json();
    return data.map(mapPersonalToClient);
  } catch (error) {
    console.error("Error in getAllPersonalAction:", error);
    return [];
  }
}

// Promote a requirement to active staff
export async function promoteRequirementAction(
  id: number,
  data: {
    nombres: string;
    codigo: string;
    dni: string;
    capataz: string;
    fecing: string;
  }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: "Supabase credentials are missing." };
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/personal_assa?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        nombres: data.nombres,
        codigo: data.codigo,
        dni: data.dni,
        capataz: data.capataz,
        fecing: data.fecing,
        estado: "Activo",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase promote PATCH failed:", errText);
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in promoteRequirementAction:", error);
    return { success: false, error: error.message };
  }
}

// Get paginated and filtered active staff from Supabase (kept for legacy support or alternative views)
export async function getActiveStaffAction(
  page: number = 1,
  limit: number = 10,
  search?: string,
  tramo?: string,
  cargo?: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("Credentials error: Supabase variables are not set in the environment.");
    return { staff: [], totalCount: 0 };
  }

  const params = new URLSearchParams();
  params.append("estado", "eq.Activo");

  if (tramo && tramo !== "All") {
    params.append("tramo", `eq.${tramo}`);
  }

  if (cargo && cargo !== "All") {
    params.append("cargo", `eq.${cargo}`);
  }

  if (search) {
    params.append(
      "or",
      `(nombres.ilike.*${search}*,codigo.ilike.*${search}*,dni.ilike.*${search}*,capataz.ilike.*${search}*,cargo.ilike.*${search}*,tramo.ilike.*${search}*)`
    );
  }

  params.append("order", "fecing.desc.nullslast,id.desc");

  const offset = (page - 1) * limit;
  const to = offset + limit - 1;

  const url = `${supabaseUrl}/rest/v1/personal_assa?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Range": `${offset}-${to}`,
        "Prefer": "count=exact",
      },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase Rest API active staff fetch failed:", errText);
      return { staff: [], totalCount: 0 };
    }

    const data = await res.json();
    const contentRange = res.headers.get("content-range");
    let totalCount = data.length;

    if (contentRange) {
      const parts = contentRange.split("/");
      if (parts.length > 1) {
        totalCount = parseInt(parts[1], 10);
      }
    }

    return {
      staff: data.map(mapPersonalToClient),
      totalCount,
    };
  } catch (error) {
    console.error("Error in getActiveStaffAction:", error);
    return { staff: [], totalCount: 0 };
  }
}

// Get requirements report grouped by frente (tramo), nro_requerimiento (solicitud) and puesto (cargo)
export async function getRequirementsReportAction(
  search?: string,
  tramo?: string,
  cargo?: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("Credentials error: Supabase variables are not set in the environment.");
    return { report: [] };
  }

  const params = new URLSearchParams();
  params.append("estado", "eq.Requerimiento");
  params.append("order", "fecha_solicitud.desc.nullslast,solicitud.desc");

  const url = `${supabaseUrl}/rest/v1/personal_assa?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase Rest API requirements fetch failed:", errText);
      return { report: [] };
    }

    const data = await res.json();
    const groups: Record<string, GroupedRequirementReport> = {};

    for (const row of data) {
      const rowTramo = row.tramo || "";
      const rowSolicitud = row.solicitud || "Sin Nro";
      const rowCargo = row.cargo || "";
      const rowFechaSolicitud = row.fecha_solicitud || null;

      if (tramo && tramo !== "All" && rowTramo !== tramo) continue;
      if (cargo && cargo !== "All" && rowCargo !== cargo) continue;

      if (search) {
        const query = search.toLowerCase();
        const match =
          rowTramo.toLowerCase().includes(query) ||
          rowSolicitud.toLowerCase().includes(query) ||
          rowCargo.toLowerCase().includes(query) ||
          (rowFechaSolicitud && rowFechaSolicitud.includes(query));
        if (!match) continue;
      }

      const key = `${rowTramo}||${rowSolicitud}||${rowCargo}`;

      if (!groups[key]) {
        groups[key] = {
          tramo: rowTramo,
          solicitud: rowSolicitud,
          cargo: rowCargo,
          cantidad: 0,
          fechaSolicitud: rowFechaSolicitud,
        };
      }
      groups[key].cantidad += 1;
    }

    const report = Object.values(groups).sort((a, b) => {
      const dateA = a.fechaSolicitud || "";
      const dateB = b.fechaSolicitud || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return b.solicitud.localeCompare(a.solicitud);
    });

    return { report };
  } catch (error) {
    console.error("Error in getRequirementsReportAction:", error);
    return { report: [] };
  }
}

// Create a new requirement. Inserts 'cantidad' rows in database
export async function createPersonalRequirementAction(data: {
  tramo: string;
  solicitud: string;
  fechaSolicitud: string;
  cargo: string;
  cantidad: number;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: "Supabase credentials are missing." };
  }

  const { tramo, solicitud, fechaSolicitud, cargo, cantidad } = data;

  if (!tramo || !cargo || cantidad <= 0) {
    return { success: false, error: "Datos de requerimiento inválidos o incompletos." };
  }

  const newRows = [];
  for (let i = 0; i < cantidad; i++) {
    newRows.push({
      tramo,
      solicitud: solicitud || null,
      fecha_solicitud: fechaSolicitud || null,
      estado: "Requerimiento",
      cargo,
      capataz: null,
      nombres: null,
      codigo: null,
      dni: null,
      fecing: null,
    });
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/personal_assa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(newRows),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase bulk POST requirements failed:", errText);
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in createPersonalRequirementAction:", error);
    return { success: false, error: error.message };
  }
}

// Get distinct cargos (puestos) from database to feed the dropdown
export async function getExistingCargosAction() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return [];
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/personal_assa?select=cargo`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const cargosSet = new Set<string>();
    data.forEach((row: any) => {
      if (row.cargo && row.cargo.trim()) {
        cargosSet.add(row.cargo.trim());
      }
    });

    return Array.from(cargosSet).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Error in getExistingCargosAction:", error);
    return [];
  }
}

// Get distinct tramos (frentes) from database
export async function getExistingTramosAction() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return [];
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/personal_assa?select=tramo`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const tramosSet = new Set<string>();
    data.forEach((row: any) => {
      if (row.tramo && row.tramo.trim()) {
        tramosSet.add(row.tramo.trim());
      }
    });

    return Array.from(tramosSet).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Error in getExistingTramosAction:", error);
    return [];
  }
}
