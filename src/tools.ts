import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPimTools } from "./pim/tools.js";

export function registerTools(server: McpServer): void {
  registerPimTools(server);
}
