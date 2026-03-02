/**
 * Shared OrangeHRM API auth and HTTP client. Used by all modules (pim, leave, time, etc.).
 */

/** Central fetch for all OrangeHRM HTTP calls. Use this instead of global fetch so behavior (retries, logging, etc.) can be added in one place. */
export async function orangehrmFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return fetch(input, init);
}

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

  const res = await orangehrmFetch(`${baseUrl}/oauth/issueToken`, {
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

export type OrangeHrmApiRequestOptions = {
  method?: string;
  body?: BodyInit;
  headers?: HeadersInit;
  /** Query params merged into the request URL (path can already contain a query string). */
  query?: Record<string, string>;
};

/**
 * Authenticated request to the OrangeHRM API. Resolves base URL and access token, then calls orangehrmFetch.
 * Use this for all API calls (employees, leave, time, etc.); avoid calling getBaseUrl/getAccessToken in modules.
 * @param path - API path (e.g. "/api/employees"), optionally with query string
 * @param options - method, body, headers, and/or query params
 * @returns Promise<Response>; callers should check res.ok and parse res.json() / res.text() as needed
 * @throws if ORANGEHRM_BASE_URL is not set or token request fails
 */
export async function orangehrmApiRequest(
  path: string,
  options?: OrangeHrmApiRequestOptions
): Promise<Response> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error("ORANGEHRM_BASE_URL is not set.");
  }

  const token = await getAccessToken(baseUrl);
  const url = new URL(path, baseUrl);
  if (options?.query) {
    for (const [k, v] of Object.entries(options.query)) {
      url.searchParams.set(k, v);
    }
  }

  const headers: HeadersInit = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...options?.headers,
  };

  return orangehrmFetch(url.toString(), {
    method: options?.method ?? "GET",
    body: options?.body,
    headers,
  });
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
