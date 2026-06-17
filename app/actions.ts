"use server";

import { revalidatePath } from "next/cache";
import { Requirement } from "./components/types";

// Helper to map DB row to client Requirement
function mapToClient(dbRow: any): Requirement {
  return {
    code: dbRow.code,
    type: dbRow.type,
    requestDate: dbRow.request_date,
    description: dbRow.description,
    status: dbRow.status,
    attachmentUrl: dbRow.attachment_url || undefined,
    requestor: dbRow.requestor,
    priority: dbRow.priority,
    module: dbRow.module,
  };
}

// Helper to map client Requirement to DB row
function mapToDb(clientReq: Requirement): any {
  return {
    code: clientReq.code,
    type: clientReq.type,
    request_date: clientReq.requestDate,
    description: clientReq.description,
    status: clientReq.status,
    attachment_url: clientReq.attachmentUrl || null,
    requestor: clientReq.requestor,
    priority: clientReq.priority,
    module: clientReq.module,
  };
}

// Get paginated and filtered requirements from Supabase
export async function getRequirementsAction(
  page: number = 1,
  limit: number = 5,
  search?: string,
  type?: string,
  sort?: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("Credentials error: Supabase variables are not set in the environment.");
    return { requirements: [], totalCount: 0 };
  }

  const params = new URLSearchParams();

  // Filter by type
  if (type && type !== "All") {
    params.append("type", `eq.${type}`);
  }

  // Filter by search query
  if (search) {
    // PostgREST or syntax: or=(col1.ilike.*val*,col2.ilike.*val*)
    params.append(
      "or",
      `(code.ilike.*${search}*,description.ilike.*${search}*,module.ilike.*${search}*,requestor.ilike.*${search}*)`
    );
  }

  // Sorting
  if (sort) {
    if (sort === "newest") {
      params.append("order", "request_date.desc,id.desc");
    } else if (sort === "oldest") {
      params.append("order", "request_date.asc,id.asc");
    } else if (sort === "priority") {
      params.append("order", "priority.asc,request_date.desc");
    } else if (sort === "status") {
      params.append("order", "status.asc,request_date.desc");
    }
  } else {
    // Default sorting
    params.append("order", "request_date.desc,id.desc");
  }

  const offset = (page - 1) * limit;
  const to = offset + limit - 1;

  const url = `${supabaseUrl}/rest/v1/requirements?${params.toString()}`;

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
      next: { revalidate: 0 } // Bypass static cache to ensure fresh data
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase Rest API fetch failed:", errText);
      return { requirements: [], totalCount: 0 };
    }

    const data = await res.json();
    const contentRange = res.headers.get("content-range");
    let totalCount = data.length;

    if (contentRange) {
      // Format: 0-4/15
      const parts = contentRange.split("/");
      if (parts.length > 1) {
        totalCount = parseInt(parts[1], 10);
      }
    }

    return {
      requirements: data.map(mapToClient),
      totalCount,
    };
  } catch (error) {
    console.error("Error in getRequirementsAction:", error);
    return { requirements: [], totalCount: 0 };
  }
}

// Add a new requirement
export async function addRequirementAction(req: Requirement) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const dbRow = mapToDb(req);

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/requirements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey!,
        "Authorization": `Bearer ${anonKey!}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(dbRow),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase POST failed:", errText);
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in addRequirementAction:", error);
    return { success: false, error: error.message };
  }
}

// Update an existing requirement
export async function updateRequirementAction(req: Requirement) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const dbRow = mapToDb(req);

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/requirements?code=eq.${req.code}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey!,
        "Authorization": `Bearer ${anonKey!}`,
      },
      body: JSON.stringify(dbRow),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase PATCH failed:", errText);
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateRequirementAction:", error);
    return { success: false, error: error.message };
  }
}

// Change the status of a requirement
export async function changeStatusAction(code: string, status: Requirement["status"]) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/requirements?code=eq.${code}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey!,
        "Authorization": `Bearer ${anonKey!}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase PATCH status failed:", errText);
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in changeStatusAction:", error);
    return { success: false, error: error.message };
  }
}

// Delete a requirement
export async function deleteRequirementAction(code: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/requirements?code=eq.${code}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey!,
        "Authorization": `Bearer ${anonKey!}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase DELETE failed:", errText);
      return { success: false, error: errText };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteRequirementAction:", error);
    return { success: false, error: error.message };
  }
}
