export const exPgMetaKeys = {
  optIn: (projectRef: string | undefined) => ['projects', projectRef, 'ex-pg-meta-opt-in'] as const,
}
