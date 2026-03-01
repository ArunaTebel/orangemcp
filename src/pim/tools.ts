import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEmployeeTools } from "./employees/tools.js";

/** Register all PIM (Personal Information Management) tools. Currently: employees. */
export function registerPimTools(server: McpServer): void {
  registerEmployeeTools(server);
}
