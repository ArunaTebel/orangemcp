/**
 * Supported include parameters for /api/employees (list).
 * Source: EmployeesEndpoint.php $availableIncludes['list'] (lines 53–83).
 * userPromptHints help the AI add the right includes from the user prompt (e.g. "work experience" → workExperience).
 */
export const EMPLOYEE_INCLUDE_OPTIONS = [
  "supervisors",
  "jobTitle",
  "subDivision",
  "locations",
  "employeeStatus",
  "workSchedule",
  "fullSubUnitHierarchy",
  "costCentre",
  "jobCategory",
  "JobRecord",
  "CustomFieldValues",
  "dependents",
  "immigrations",
  "EmployeeMembership",
  "emergencyContacts",
  "socialMedia",
  "DirectDepositRecord",
  "contactDetails",
  "workExperience",
  "education",
  "skills",
  "languages",
  "EmployeeLicense",
  "SalaryRecord",
  "SalaryHistoryRecord",
  "EmployeeSalaryComponent",
  "photo",
  "supervisorsWithReportingMethod",
  "hasEmail",
] as const;

export type EmployeeIncludeKey = (typeof EMPLOYEE_INCLUDE_OPTIONS)[number];

export const EMPLOYEE_INCLUDE_SCHEMA: ReadonlyArray<{
  key: EmployeeIncludeKey;
  description: string;
  userPromptHints: string;
}> = [
  { key: "supervisors", description: "Supervisor(s) of the employee", userPromptHints: "e.g. 'supervisors', 'reporting to', 'who they report to'" },
  { key: "jobTitle", description: "Job title", userPromptHints: "e.g. 'job title', 'position', 'role'" },
  { key: "subDivision", description: "Sub unit / division", userPromptHints: "e.g. 'sub unit', 'division', 'department'" },
  { key: "locations", description: "Work location(s)", userPromptHints: "e.g. 'locations', 'work location', 'office'" },
  { key: "employeeStatus", description: "Employment status", userPromptHints: "e.g. 'employment status', 'full time', 'part time'" },
  { key: "workSchedule", description: "Work schedule", userPromptHints: "e.g. 'work schedule', 'schedule'" },
  { key: "fullSubUnitHierarchy", description: "Full sub unit hierarchy", userPromptHints: "e.g. 'unit hierarchy', 'org hierarchy'" },
  { key: "costCentre", description: "Cost centre", userPromptHints: "e.g. 'cost centre', 'cost center'" },
  { key: "jobCategory", description: "Job category", userPromptHints: "e.g. 'job category'" },
  { key: "JobRecord", description: "Job record / contract", userPromptHints: "e.g. 'job record', 'contract'" },
  { key: "CustomFieldValues", description: "Custom field values", userPromptHints: "e.g. 'custom fields'" },
  { key: "dependents", description: "Dependents", userPromptHints: "e.g. 'dependents', 'dependants'" },
  { key: "immigrations", description: "Immigration records", userPromptHints: "e.g. 'immigration', 'visa', 'work permit'" },
  { key: "EmployeeMembership", description: "Memberships", userPromptHints: "e.g. 'memberships', 'membership'" },
  { key: "emergencyContacts", description: "Emergency contacts", userPromptHints: "e.g. 'emergency contacts', 'emergency contact'" },
  { key: "socialMedia", description: "Social media", userPromptHints: "e.g. 'social media'" },
  { key: "DirectDepositRecord", description: "Direct deposit details", userPromptHints: "e.g. 'direct deposit', 'bank details'" },
  { key: "contactDetails", description: "Contact details", userPromptHints: "e.g. 'contact details', 'contact info', 'address', 'phone'" },
  { key: "workExperience", description: "Work experience", userPromptHints: "e.g. 'work experience', 'experience', 'employment history'" },
  { key: "education", description: "Education", userPromptHints: "e.g. 'education', 'qualifications', 'degrees'" },
  { key: "skills", description: "Skills", userPromptHints: "e.g. 'skills', 'competencies'" },
  { key: "languages", description: "Languages", userPromptHints: "e.g. 'languages', 'language'" },
  { key: "EmployeeLicense", description: "Licenses", userPromptHints: "e.g. 'licenses', 'licences', 'certifications'" },
  { key: "SalaryRecord", description: "Salary record", userPromptHints: "e.g. 'salary', 'pay', 'compensation'" },
  { key: "SalaryHistoryRecord", description: "Salary history", userPromptHints: "e.g. 'salary history', 'pay history'" },
  { key: "EmployeeSalaryComponent", description: "Salary components", userPromptHints: "e.g. 'salary components', 'pay components'" },
  { key: "photo", description: "Photo", userPromptHints: "e.g. 'photo', 'picture', 'avatar'" },
  { key: "supervisorsWithReportingMethod", description: "Supervisors with reporting method", userPromptHints: "e.g. 'supervisors with reporting method'" },
  { key: "hasEmail", description: "Whether employee has work email", userPromptHints: "e.g. 'has email', 'work email'" },
];
