/**
 * Schema of OrangeHRM employee list filters that accept direct values
 * (no related-entity IDs required). Used so the AI can map user prompts
 * to the correct filter keys. "userPromptHints" tell the AI which natural
 * language to map to this filter.
 * Source: getValidatorArrayForCommonFilters / getValidatorArrayForSpecialFilters
 * in EmployeesEndpointV2.php (direct-value filters only).
 */
export const EMPLOYEE_FILTER_SCHEMA = [
  {
    key: "employee_name_or_id",
    type: "string",
    description: "Partial match on employee name or employee ID",
    userPromptHints: "e.g. 'named X', 'name contains X', 'employee ID X', 'search for X'",
    example: "Kayla",
  },
  {
    key: "employee_name",
    type: "string",
    description: "Filter by employee name",
    userPromptHints: "e.g. 'employee name X', 'name is X'",
    example: "Kayla",
  },
  {
    key: "middleName",
    type: "string",
    description: "Filter by middle name",
    userPromptHints: "e.g. 'middle name X', 'middle name is X'",
    example: "Jane",
  },
  {
    key: "lastName",
    type: "string",
    description: "Filter by last name",
    userPromptHints: "e.g. 'last name X', 'surname X', 'family name X'",
    example: "Abbey",
  },
  {
    key: "search",
    type: "object",
    description: "Search with specific fields. searchBy: comma-separated firstName, lastName, employeeId. searchTerm: string",
    userPromptHints: "e.g. 'search by first and last name for X'",
    example: { searchBy: "firstName,lastName", searchTerm: "Kayla" },
  },
  {
    key: "termination",
    type: "string",
    description: "Employment status: 1 = current, 2 = current and past, 3 = past only",
    userPromptHints: "e.g. 'current employees', 'past employees', 'terminated'",
    example: "1",
  },
  {
    key: "joined_date",
    type: "object | string",
    description:
      "Filter by join date. Use object with from (Y-m-d), to (Y-m-d), optional equal (0/1). For exact day use same from and to. Or 'pim_undefined' for unset.",
    userPromptHints:
      "e.g. 'joined on 2015-01-01', 'joined date 2015-01-01', 'joined between 2015-01-01 and 2015-12-31', 'joined in 2015' → use from/to (same date for exact day)",
    example: { from: "2015-01-01", to: "2015-12-31" },
  },
  {
    key: "probation_end_date",
    type: "object | string",
    description: "Filter by probation end date. Same shape as joined_date.",
    userPromptHints: "e.g. 'probation ended on X', 'probation end between X and Y'",
    example: { from: "2020-01-01", to: "2020-01-31" },
  },
  {
    key: "permanency_date",
    type: "object | string",
    description: "Filter by permanency date. Same shape as joined_date.",
    userPromptHints: "e.g. 'permanency date X', 'permanency between X and Y'",
    example: { from: "2020-01-01", to: "2020-01-31" },
  },
  {
    key: "supervisor_name",
    type: "string",
    description: "Filter by supervisor name",
    userPromptHints: "e.g. 'supervisor is X', 'reporting to X'",
    example: "Abbey",
  },
  {
    key: "supervisor_name_or_id",
    type: "string",
    description: "Filter by supervisor name or employee ID",
    userPromptHints: "e.g. 'supervisor X', 'reports to X'",
    example: "Abbey",
  },
  {
    key: "cost_code",
    type: "string",
    description: "Filter by cost centre code",
    userPromptHints: "e.g. 'cost code X', 'cost centre code X'",
    example: "CC001",
  },
  {
    key: "cost_centre_name",
    type: "string",
    description: "Filter by cost centre name",
    userPromptHints: "e.g. 'cost centre X', 'cost center X'",
    example: "Sales",
  },
  {
    key: "country_list",
    type: "array | string",
    description: "Filter by country code(s). Array or comma-separated (e.g. GB, US)",
    userPromptHints: "e.g. 'in country GB', 'countries US, GB'",
    example: ["GB", "US"],
  },
  {
    key: "is_supervisor",
    type: "boolean",
    description: "Filter to supervisors only",
    userPromptHints: "e.g. 'who are supervisors', 'only supervisors'",
    example: true,
  },
  {
    key: "has_work_email",
    type: "boolean",
    description: "Filter to employees with work email",
    userPromptHints: "e.g. 'with work email', 'have work email'",
    example: true,
  },
  {
    key: "includeDeleted",
    type: "number",
    description: "Include deleted records (1 to include)",
    userPromptHints: "e.g. 'include deleted employees'",
    example: 1,
  },
  {
    key: "includePurged",
    type: "number",
    description: "Include purged records (1 to include)",
    userPromptHints: "e.g. 'include purged'",
    example: 1,
  },
  {
    key: "onlyDeletedOrTerminated",
    type: "number",
    description: "Only deleted or terminated employees (1 to filter)",
    userPromptHints: "e.g. 'only deleted or terminated'",
    example: 1,
  },
] as const;

export type EmployeeFilterSchema = (typeof EMPLOYEE_FILTER_SCHEMA)[number];
