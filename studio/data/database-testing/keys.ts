export const databaseTestingKeys = {
  isDbDevInstalled: (projectRef?: string) => ['isDbDevInstalled', projectRef] as const,
  isSupabaseTestHelpersInstalled: (projectRef?: string) =>
    ['isSupabaseTestHelpersInstalled', projectRef] as const,
}
