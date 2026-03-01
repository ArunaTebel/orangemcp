import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listEmployees, DEFAULT_LIMIT, MAX_LIMIT } from "./api.js";
import { EMPLOYEE_FILTER_SCHEMA, FILTER_BY_RELATED_NAME_PATTERN } from "./filters.js";
import { EMPLOYEE_INCLUDE_SCHEMA } from "./includes.js";

/** Register employee MCP tools (list_employees, get_employee_filter_schema, get_employee_include_schema). */
export function registerEmployeeTools(server: McpServer): void {
  server.registerTool(
    "list_employees",
    {
      title: "List employees",
      description:
        "List employees from OrangeHRM. Base URL and token from env. " +
        "Filtering by related-entity name (location, job title, sub unit, cost centre, etc.): the API accepts only IDs for these. When the user asks by name (e.g. 'employees in New York Office'), call list_employees with the relevant include (e.g. locations, jobTitle, subDivision, costCentre), then filter the returned data client-side by that name. See get_employee_filter_schema for the full pattern (filterByRelatedNamePattern). " +
        "For other filters use 'filters'. For extra data use 'include'. Call get_employee_include_schema for include keys.",
      inputSchema: {
        limit: z.number().int().min(1).max(MAX_LIMIT).optional().default(DEFAULT_LIMIT),
        offset: z.number().int().min(0).optional().default(0),
        name: z.string().optional().describe("Quick filter: employee name or ID (partial match)"),
        filters: z
          .record(z.unknown())
          .optional()
          .describe(
            "Optional filters by ID or direct value (e.g. joined_date, lastName, supervisor_name_or_id). For location/job title/sub unit/cost centre by name, use include and filter client-side (see get_employee_filter_schema filterByRelatedNamePattern)."
          ),
        include: z
          .array(z.string())
          .optional()
          .describe(
            "Include extra data in the response (e.g. ['workExperience'], ['skills','languages']). Use get_employee_include_schema to map user prompt (e.g. 'work experience only') to include keys."
          ),
      },
    },
    async ({ limit, offset, name, filters, include }) => {
      const result = await listEmployees({ limit, offset, name, filters, include });
      const text = result.success
        ? JSON.stringify(result.meta ? { data: result.data, meta: result.meta } : result.data, null, 2)
        : result.error;
      return {
        content: [{ type: "text" as const, text }],
        ...(result.success ? {} : { isError: true }),
      };
    }
  );

  server.registerTool(
    "get_employee_filter_schema",
    {
      title: "Get employee filter schema",
      description:
        "Returns supported employee filters and the generic pattern for filtering by related-entity name (location, job title, sub unit, cost centre, etc.). Use when mapping user intent to list_employees, and when the user asks by name for a related entity (see filterByRelatedNamePattern).",
      inputSchema: {},
    },
    async () => {
      const payload = {
        filters: EMPLOYEE_FILTER_SCHEMA,
        filterByRelatedNamePattern: FILTER_BY_RELATED_NAME_PATTERN,
      };
      const text = JSON.stringify(payload, null, 2);
      return { content: [{ type: "text" as const, text }] };
    }
  );

  server.registerTool(
    "get_employee_include_schema",
    {
      title: "Get employee include schema",
      description:
        "Returns supported include keys with description and userPromptHints. Use when the user wants specific data (e.g. 'work experience only', 'skills and languages'): map their words to include keys and pass as list_employees 'include' array.",
      inputSchema: {},
    },
    async () => {
      const text = JSON.stringify(EMPLOYEE_INCLUDE_SCHEMA, null, 2);
      return { content: [{ type: "text" as const, text }] };
    }
  );
}
