import { flattenFilters, orangehrmApiRequest } from "../../orangehrm.js";
import { EMPLOYEE_INCLUDE_OPTIONS } from "./includes.js";

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export type ListEmployeesResult =
  | { success: true; data: unknown; meta?: Record<string, unknown> }
  | { success: false; error: string };

export async function listEmployees(params: {
  limit?: number;
  offset?: number;
  name?: string;
  filters?: Record<string, unknown>;
  include?: string[];
}): Promise<ListEmployeesResult> {
  const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
  const offset = Math.max(0, params.offset ?? 0);

  const query: Record<string, string> = {
    "page[limit]": String(limit),
    "page[offset]": String(offset),
  };

  if (params.include?.length) {
    const allowed = new Set<string>(EMPLOYEE_INCLUDE_OPTIONS);
    const valid = params.include.filter((v) => allowed.has(v));
    if (valid.length) {
      query["include"] = valid.join(",");
    }
  }

  if (params.name?.trim()) {
    query["filter[employee_name_or_id]"] = params.name.trim();
  }
  if (params.filters && Object.keys(params.filters).length > 0) {
    Object.assign(query, flattenFilters(params.filters));
  }

  try {
    const res = await orangehrmApiRequest("/api/employees", { query });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${text}`);
    }
    const data = (await res.json()) as { data?: unknown; meta?: Record<string, unknown> };
    return { success: true, data: data.data ?? data, meta: data.meta };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: `OrangeHRM API: ${msg}` };
  }
}
