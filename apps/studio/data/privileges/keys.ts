export const privilegeKeys = {
  tablePrivilegesList: (projectRef: string | undefined, includedSchemas?: string[]) =>
    ['projects', projectRef, 'database', 'table-privileges', includedSchemas].filter(Boolean),
  columnPrivilegesList: (projectRef: string | undefined, schema?: string | undefined) =>
    ['projects', projectRef, 'database', 'column-privileges', schema].filter(Boolean),
  exposedTablesInfinite: (projectRef: string | undefined, search?: string) =>
    [
      'projects',
      projectRef,
      'privileges',
      'exposed-tables-infinite',
      ...(search ? ([{ search }] as const) : []),
    ] as const,
  exposedTablesAll: (projectRef: string | undefined) =>
    ['projects', projectRef, 'privileges', 'exposed-tables-all'] as const,
  exposedFunctionsAll: (projectRef: string | undefined) =>
    ['projects', projectRef, 'privileges', 'exposed-functions-all'] as const,
  exposedTableCounts: (projectRef: string | undefined, selectedSchemas?: string[]) =>
    [
      'projects',
      projectRef,
      'privileges',
      'exposed-table-counts',
      ...(selectedSchemas ? ([selectedSchemas] as const) : []),
    ] as const,
  exposedFunctionsInfinite: (projectRef: string | undefined, search?: string) =>
    [
      'projects',
      projectRef,
      'privileges',
      'exposed-functions-infinite',
      ...(search ? ([{ search }] as const) : []),
    ] as const,
  exposedFunctionCounts: (projectRef: string | undefined, selectedSchemas?: string[]) =>
    [
      'projects',
      projectRef,
      'privileges',
      'exposed-function-counts',
      ...(selectedSchemas ? ([selectedSchemas] as const) : []),
    ] as const,
  defaultPrivileges: (projectRef: string | undefined, schema?: string) =>
    [
      'projects',
      projectRef,
      'privileges',
      'default-privileges',
      ...(schema ? [schema] : []),
    ] as const,
}
