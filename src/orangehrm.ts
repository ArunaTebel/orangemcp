/**
 * Shared OrangeHRM API auth. Used by all modules (pim, leave, time, etc.).
 */

/** Get OrangeHRM base URL from env (trimmed, no trailing slash). */
export function getBaseUrl(): string {
  return (process.env.ORANGEHRM_BASE_URL ?? "").replace(/\/$/, "").trim();
}

/** Get access token via OAuth2 client_credentials. Requires ORANGEHRM_CLIENT_ID and ORANGEHRM_CLIENT_SECRET in env. */
export async function getAccessToken(baseUrl: string): Promise<string> {
  const clientId = process.env.ORANGEHRM_CLIENT_ID;
  const clientSecret = process.env.ORANGEHRM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("ORANGEHRM_CLIENT_ID and ORANGEHRM_CLIENT_SECRET are required");
  }

  const res = await fetch(`${baseUrl}/oauth/issueToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Token response missing access_token");
  return data.access_token;
}

/** Flatten a filters object to OrangeHRM query params: filter[key]=value, filter[key][sub]=value, filter[key][]=value */
export function flattenFilters(
  filters: Record<string, unknown>,
  prefix = "filter"
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    const fullKey = prefix + "[" + key + "]";
    if (Array.isArray(value)) {
      value.forEach((v) => {
        out[fullKey + "[]"] = String(v);
      });
    } else if (typeof value === "object" && value !== null && !(value instanceof Date)) {
      const nested = flattenFilters(value as Record<string, unknown>, fullKey);
      Object.assign(out, nested);
    } else if (typeof value === "boolean") {
      out[fullKey] = value ? "1" : "0";
    } else {
      out[fullKey] = String(value);
    }
  }
  return out;
}
