import { getBaseUrl, getAccessToken, flattenFilters } from "../../orangehrm.js";
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
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return { success: false, error: "ORANGEHRM_BASE_URL is not set." };
  }

  let token: string;
  try {
    token = await getAccessToken(baseUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Failed to get access token: ${msg}` };
  }

  const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
  const offset = Math.max(0, params.offset ?? 0);

  const url = new URL("/api/employees", baseUrl);
  url.searchParams.set("page[limit]", String(limit));
  url.searchParams.set("page[offset]", String(offset));

  if (params.include?.length) {
    const allowed = new Set<string>(EMPLOYEE_INCLUDE_OPTIONS);
    const valid = params.include.filter((v) => allowed.has(v));
    if (valid.length) {
      url.searchParams.set("include", valid.join(","));
    }
  }

  if (params.name?.trim()) {
    url.searchParams.set("filter[employee_name_or_id]", params.name.trim());
  }
  if (params.filters && Object.keys(params.filters).length > 0) {
    const flat = flattenFilters(params.filters);
    for (const [k, v] of Object.entries(flat)) {
      url.searchParams.set(k, v);
    }
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
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
