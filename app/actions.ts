"use server";

import { revalidatePath } from "next/cache";
import { PersonalAssa, GroupedRequirementReport, MaterialRequirement, MaterialReceipt } from "./components/types";

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

// Helper to map DB row to client MaterialRequirement
function mapMaterialToClient(row: any): MaterialRequirement {
  return {
    id: row.id,
    codigoRequerimiento: row.codigo_requerimiento,
    codigoRecurso: row.codigo_recurso,
    recurso: row.recurso,
    unidad: row.unidad,
    cantidad: row.cantidad,
    partidaControlCode: row.partida_control_code,
    partidaControl: row.partida_control,
    estado: row.estado,
    cantidadOriginal: row.cantidad_original,
    cantidadCotizacion: row.cantidad_cotizacion,
    cantidadOrdenCompra: row.cantidad_orden_compra,
    cantidadAlmacen: row.cantidad_almacen,
    cantidadRecibir: row.cantidad_recibir,
    cronogramaEntrega: row.cronograma_entrega,
    codigoAlternoPc: row.codigo_alterno_pc,
    fechaPedido: row.fecha_pedido,
    pdfUrl: row.pdf_url,
    receipts: [],
  };
}

// Helper to map DB row to client MaterialReceipt
function mapReceiptToClient(row: any): MaterialReceipt {
  return {
    id: row.id,
    materialRequirementId: row.material_requirement_id,
    cantidad: typeof row.cantidad === 'number' ? row.cantidad : parseFloat(row.cantidad) || 0,
    fecha: row.fecha,
  };
}

// Fetch all material requirements from Supabase (along with their receipts)
export async function getAllMaterialRequirementsAction(): Promise<MaterialRequirement[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("Credentials error: Supabase variables are not set in the environment.");
    return [];
  }

  const reqUrl = `${supabaseUrl}/rest/v1/material_requirements?order=codigo_requerimiento.asc,id.asc`;
  const recUrl = `${supabaseUrl}/rest/v1/material_receipts?order=fecha.asc,id.asc`;

  try {
    const reqRes = await fetch(reqUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      next: { revalidate: 0 }
    });

    if (!reqRes.ok) {
      const errText = await reqRes.text();
      console.error("Supabase Rest API getAllMaterialRequirementsAction req fetch failed:", errText);
      return [];
    }

    const reqData = await reqRes.json();
    const requirements: MaterialRequirement[] = reqData.map(mapMaterialToClient);

    const recRes = await fetch(recUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      next: { revalidate: 0 }
    });

    let receipts: MaterialReceipt[] = [];
    if (recRes.ok) {
      const recData = await recRes.json();
      receipts = recData.map(mapReceiptToClient);
    }

    // Join and calculate arrived quantities dynamically
    requirements.forEach((req) => {
      req.receipts = receipts.filter((r) => r.materialRequirementId === req.id);
      if (req.receipts.length > 0) {
        const sum = req.receipts.reduce((acc, r) => acc + r.cantidad, 0);
        req.cantidadAlmacen = sum.toString();
      }
    });

    return requirements;
  } catch (error) {
    console.error("Error in getAllMaterialRequirementsAction:", error);
    return [];
  }
}

// Update the arrived quantity of a material requirement in Supabase
export async function updateMaterialAlmacenAction(id: number, cantidadAlmacen: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: "Supabase credentials are missing from environment." };
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/material_requirements?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        cantidad_almacen: cantidadAlmacen || null,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase Rest API updateMaterialAlmacenAction PATCH failed:", errText);
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateMaterialAlmacenAction:", error);
    return { success: false, error: error.message };
  }
}

// Update customizable fields in material requirements (e.g. fecha_pedido, partida_control)
export async function updateMaterialRequirementFieldAction(
  id: number,
  fields: {
    fechaPedido?: string | null;
    partidaControl?: string | null;
    partidaControlCode?: string | null;
  }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: "Supabase credentials are missing." };
  }

  const body: any = {};
  if (fields.fechaPedido !== undefined) body.fecha_pedido = fields.fechaPedido;
  if (fields.partidaControl !== undefined) body.partida_control = fields.partidaControl;
  if (fields.partidaControlCode !== undefined) body.partida_control_code = fields.partidaControlCode;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/material_requirements?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Add a partial receipt log to public.material_receipts
export async function addMaterialReceiptAction(
  materialRequirementId: number,
  cantidad: number,
  fecha: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: "Supabase credentials are missing." };
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/material_receipts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        material_requirement_id: materialRequirementId,
        cantidad,
        fecha: fecha || null,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete a partial receipt log from public.material_receipts
export async function deleteMaterialReceiptAction(id: number) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: "Supabase credentials are missing." };
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/material_receipts?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Create multiple materials at once for a new requisition code
export async function createBulkMaterialRequirementsAction(
  codigoRequerimiento: string,
  items: Array<{
    codigoRecurso?: string | null;
    recurso: string;
    unidad: string;
    cantidad: number;
    partidaControlCode?: string | null;
    partidaControl?: string | null;
    fechaPedido?: string | null;
  }>
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: "Supabase credentials are missing." };
  }

  const dbRows = items.map((item) => ({
    codigo_requerimiento: codigoRequerimiento,
    codigo_recurso: item.codigoRecurso || null,
    recurso: item.recurso,
    unidad: item.unidad,
    cantidad: item.cantidad,
    partida_control_code: item.partidaControlCode || null,
    partida_control: item.partidaControl || null,
    fecha_pedido: item.fechaPedido || null,
    estado: "Pendiente",
    cantidad_almacen: "0",
  }));

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/material_requirements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(dbRows),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update the manual order date for all material items in a requisition
export async function updateRequisitionFechaPedidoAction(
  codigoRequerimiento: string,
  fechaPedido: string | null
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: "Supabase credentials are missing." };
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/material_requirements?codigo_requerimiento=eq.${codigoRequerimiento}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
          "Authorization": `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          fecha_pedido: fechaPedido || null,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("updateRequisitionFechaPedidoAction PATCH failed:", errText);
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateRequisitionFechaPedidoAction:", error);
    return { success: false, error: error.message };
  }
}

// Upload a PDF document to Supabase Storage and link it to the requisition items
export async function uploadRequisitionPdfAction(
  codigoRequerimiento: string,
  fileName: string,
  base64Data: string,
  mimeType: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: "Supabase credentials are missing." };
  }

  // 1. Ensure the bucket exists
  try {
    await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        id: "material-requisitions",
        name: "material-requisitions",
        public: true,
      }),
    });
  } catch (e) {
    // Ignore if bucket creation fails (e.g. if it already exists)
  }

  try {
    // 2. Decode the base64 content
    const binaryBuffer = Buffer.from(base64Data, "base64");

    // 3. Upload to Supabase Storage
    const filePath = `${codigoRequerimiento}/${fileName}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/material-requisitions/${filePath}`;

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Content-Type": mimeType,
        "x-upsert": "true",
      },
      body: binaryBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Supabase Storage PDF upload failed:", errText);
      return { success: false, error: errText };
    }

    // 4. Update the pdf_url field in the material_requirements table for this requisition code
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/material-requisitions/${filePath}`;
    const dbRes = await fetch(
      `${supabaseUrl}/rest/v1/material_requirements?codigo_requerimiento=eq.${codigoRequerimiento}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
          "Authorization": `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          pdf_url: publicUrl,
        }),
      }
    );

    if (!dbRes.ok) {
      const errText = await dbRes.text();
      console.error("Database update for PDF link failed:", errText);
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("Error in uploadRequisitionPdfAction:", error);
    return { success: false, error: error.message };
  }
}

// Overwrite a material requisition's insumos, preserving any existing fecha_pedido or pdf_url
export async function overwriteMaterialRequisitionAction(
  codigoRequerimiento: string,
  items: Array<{
    codigoRecurso?: string | null;
    recurso: string;
    unidad: string;
    cantidad: number;
    partidaControlCode?: string | null;
    partidaControl?: string | null;
  }>
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: "Supabase credentials are missing." };
  }

  try {
    // 1. Check if the requisition already exists and fetch its metadata to preserve
    let existingFechaPedido: string | null = null;
    let existingPdfUrl: string | null = null;

    const checkUrl = `${supabaseUrl}/rest/v1/material_requirements?codigo_requerimiento=eq.${codigoRequerimiento}&limit=1`;
    const checkRes = await fetch(checkUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
    });

    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (checkData && checkData.length > 0) {
        existingFechaPedido = checkData[0].fecha_pedido || null;
        existingPdfUrl = checkData[0].pdf_url || null;
      }
    }

    // 2. Delete existing items for this requisition
    const deleteRes = await fetch(
      `${supabaseUrl}/rest/v1/material_requirements?codigo_requerimiento=eq.${codigoRequerimiento}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
          "Authorization": `Bearer ${anonKey}`,
        },
      }
    );

    if (!deleteRes.ok) {
      const errText = await deleteRes.text();
      console.error("Failed to delete existing items for requisition " + codigoRequerimiento, errText);
      return { success: false, error: errText };
    }

    // 3. Map new rows using the preserved metadata
    const dbRows = items.map((item) => ({
      codigo_requerimiento: codigoRequerimiento,
      codigo_recurso: item.codigoRecurso || null,
      recurso: item.recurso,
      unidad: item.unidad,
      cantidad: item.cantidad,
      partida_control_code: item.partidaControlCode || null,
      partida_control: item.partidaControl || null,
      fecha_pedido: existingFechaPedido,
      pdf_url: existingPdfUrl,
      estado: "Pendiente",
      cantidad_almacen: "0",
    }));

    // 4. Bulk insert the new items
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/material_requirements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(dbRows),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error("Failed to insert overwritten items:", errText);
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in overwriteMaterialRequisitionAction:", error);
    return { success: false, error: error.message };
  }
}

