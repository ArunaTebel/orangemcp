import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "../../..");
const referencePath = path.join(packageRoot, "scripts", "sample-leave-rule.xml");

let cachedReference: string | null = null;

function getReferenceXml(): string {
  if (cachedReference === null) {
    cachedReference = readFileSync(referencePath, "utf-8");
  }
  return cachedReference;
}

const INSTRUCTION =
  "Use the 'description' attributes and structure in the reference XML below to explain the user's leave-rule XML in plain language. " +
  "Map each element and value in their XML to the corresponding description; mention any differences or missing sections.\n\n";

/** Register leave-rule MCP tools (get_leave_rule_reference). */
export function registerLeaveRulesTools(server: McpServer): void {
  server.registerTool(
    "get_leave_rule_reference",
    {
      title: "Get leave rule reference XML",
      description:
        "Returns the reference leave-rule XML with human-readable descriptions for each element and value. " +
        "Use when the user provides a leave-rule XML and wants it explained: call this tool (optionally passing their XML as user_xml), " +
        "then use the reference descriptions to explain their XML in plain language. " +
        "The reference describes flow (who can apply/assign, attachments, working days), groups, apply restrictions, eligibility, entitlement/accrual, and rollover.",
      inputSchema: {
        user_xml: z
          .string()
          .optional()
          .describe(
            "Optional. If provided, the response includes this XML plus the reference so you can explain it in one step."
          ),
      },
    },
    async ({ user_xml }) => {
      const reference = getReferenceXml();
      let text: string;
      if (user_xml?.trim()) {
        text =
          "User-provided leave-rule XML to explain:\n\n" +
          "```xml\n" +
          user_xml.trim() +
          "\n```\n\n" +
          "--- Reference (use the 'description' attributes below to explain the user's XML) ---\n\n" +
          reference;
      } else {
        text =
          INSTRUCTION +
          "--- Reference leave-rule XML (with descriptions) ---\n\n" +
          reference;
      }
      return { content: [{ type: "text" as const, text }] };
    }
  );
}
