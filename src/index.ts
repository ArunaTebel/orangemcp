import "dotenv/config";
import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { registerTools } from "./tools.js";

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "orangehrm-mcp",
    version: "0.2.0",
  });
  registerTools(server);
  return server;
}

const transportsBySessionId = new Map<string, StreamableHTTPServerTransport>();

async function main() {
  const port = Number(process.env.PORT ?? "3000");
  const app = createMcpExpressApp();

  app.post("/mcp", async (req: IncomingMessage & { body?: unknown }, res: ServerResponse) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport = sessionId ? transportsBySessionId.get(sessionId) : undefined;

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
      await createMcpServer().connect(transport);
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
    const transport = sessionId ? transportsBySessionId.get(sessionId) : undefined;
    if (!transport) {
      res.statusCode = 400;
      res.end("Invalid or missing session ID");
      return;
    }
    await transport.handleRequest(req, res);
  });

  app.listen(port, () => {
    console.error(`OrangeHRM MCP API listening on http://127.0.0.1:${port}/mcp`);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
