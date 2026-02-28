import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const EMPLOYEE_FIELDS =
  "empNumber,firstName,middleName,lastName,employeeId,joinedDate,termination_id,deletedEmployee";
const EMPLOYEE_INCLUDE = "jobTitle,employeeStatus,subDivision,locations";

function getConfig(): {
  baseUrl: string;
  accessToken: string;
} {
  const baseUrl = process.env.ORANGEHRM_BASE_URL?.replace(/\/$/, "") ?? "";
  const accessToken =
    process.env.ORANGEHRM_ACCESS_TOKEN ??
    (process.env.ORANGEHRM_CLIENT_ID && process.env.ORANGEHRM_CLIENT_SECRET
      ? ""
      : "");

  if (!baseUrl || !accessToken) {
    if (!baseUrl) {
      console.error(
        "ORANGEHRM_BASE_URL is required (e.g. https://roster.test-webubuntu83.orangehrmdev.com)"
      );
    }
    if (!accessToken && !(process.env.ORANGEHRM_CLIENT_ID && process.env.ORANGEHRM_CLIENT_SECRET)) {
      console.error(
        "ORANGEHRM_ACCESS_TOKEN is required, or set ORANGEHRM_CLIENT_ID and ORANGEHRM_CLIENT_SECRET to fetch a token"
      );
    }
  }

  return { baseUrl, accessToken };
}

async function fetchAccessToken(baseUrl: string): Promise<string> {
  const clientId = process.env.ORANGEHRM_CLIENT_ID;
  const clientSecret = process.env.ORANGEHRM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("ORANGEHRM_CLIENT_ID and ORANGEHRM_CLIENT_SECRET are required to fetch token");
  }

  const url = `${baseUrl}/oauth/issueToken`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (fetchError) {
    console.error("Access token fetch (network) error:", fetchError);
    if (fetchError instanceof Error && fetchError.cause) {
      console.error("Access token fetch (network) error cause:", fetchError.cause);
    }
    throw fetchError;
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("Access token HTTP error:", res.status, text);
    throw new Error(`Failed to get token: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Token response missing access_token");
  }
  return data.access_token;
}

async function makeOrangeHRMRequest<T>(
  baseUrl: string,
  accessToken: string,
  path: string,
  searchParams?: Record<string, string>
): Promise<T> {
  const url = new URL(path, baseUrl);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const headers: Record<string, string> = {
    Accept: "application/json; version=4",
    Authorization: `Bearer ${accessToken}`,
  };

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OrangeHRM API error: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}

interface EmployeesResponse {
  data?: unknown[];
  meta?: Record<string, unknown>;
}

/** Creates a new MCP server instance with list_employees tool (one per session). */
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "orangehrm-mcp",
    version: "0.2.0",
  });

  server.registerTool(
    "list_employees",
    {
    title: "List employees",
    description:
      "List employees accessible to the current user. Supports pagination and optional name/search filter.",
    inputSchema: {
      limit: z
        .number()
        .int()
        .min(1)
        .max(MAX_LIMIT)
        .optional()
        .default(DEFAULT_LIMIT)
        .describe(
          `Maximum number of employees to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT})`
        ),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(0)
        .describe("Number of records to skip for pagination"),
      name: z
        .string()
        .optional()
        .describe("Filter by employee name or employee ID (partial match)"),
    },
  },
  async ({ limit, offset, name }) => {
    const { baseUrl, accessToken } = getConfig();
    if (!baseUrl) {
      return {
        content: [{ type: "text" as const, text: "ORANGEHRM_BASE_URL is not set." }],
      };
    }

    let token = accessToken;
    if (!token && process.env.ORANGEHRM_CLIENT_ID && process.env.ORANGEHRM_CLIENT_SECRET) {
      try {
        token = await fetchAccessToken(baseUrl);
      } catch (e) {
        // Debug: log full error to see actual cause (e.g. network, TLS, DNS)
        console.error("Access token fetch error:", e);
        if (e instanceof Error) {
          if (e.cause) console.error("Access token fetch error cause:", e.cause);
          if (e.stack) console.error("Access token fetch error stack:", e.stack);
        }
        const msg = e instanceof Error ? e.message : String(e);
        return {
          content: [{ type: "text" as const, text: `Failed to get access token: ${msg}` }],
        };
      }
    }
    if (!token) {
      return {
        content: [
          {
            type: "text" as const,
            text: "ORANGEHRM_ACCESS_TOKEN is not set and client credentials were not provided.",
          },
        ],
      };
    }

    const limitVal = Math.min(MAX_LIMIT, Math.max(1, limit ?? DEFAULT_LIMIT));
    const offsetVal = Math.max(0, offset ?? 0);

    const params: Record<string, string> = {
      "page[limit]": String(limitVal),
      "page[offset]": String(offsetVal),
      fields: EMPLOYEE_FIELDS,
      include: EMPLOYEE_INCLUDE,
    };
    if (name != null && String(name).trim() !== "") {
      params["filter[employee_name_or_id]"] = String(name).trim();
    }

    try {
      const data = await makeOrangeHRMRequest<EmployeesResponse>(
        baseUrl,
        token,
        "/api/employees",
        params
      );
      const text =
        typeof data === "object" && data !== null
          ? JSON.stringify(data, null, 2)
          : String(data);
      return {
        content: [{ type: "text" as const, text }],
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        content: [{ type: "text" as const, text: `Error calling OrangeHRM API: ${msg}` }],
        isError: true,
      };
    }
  }
  );
  return server;
}

const transportsBySessionId = new Map<string, StreamableHTTPServerTransport>();

async function main() {
  const port = Number(process.env.PORT ?? "3000");
  const app = createMcpExpressApp();

  app.post("/mcp", async (req: IncomingMessage & { body?: unknown }, res: ServerResponse) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport | undefined = sessionId
      ? transportsBySessionId.get(sessionId)
      : undefined;

    if (transport) {
      await transport.handleRequest(req, res, req.body);
      return;
    }
    if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          if (transport) transportsBySessionId.set(id, transport);
        },
      });
      const server = createMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session ID provided" },
        id: null,
      })
    );
  });

  app.get("/mcp", async (req: IncomingMessage, res: ServerResponse) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transportsBySessionId.has(sessionId)) {
      res.statusCode = 400;
      res.end("Invalid or missing session ID");
      return;
    }
    const transport = transportsBySessionId.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  app.listen(port, () => {
    console.error(`OrangeHRM MCP API listening on http://127.0.0.1:${port}/mcp`);
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
