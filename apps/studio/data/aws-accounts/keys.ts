export const awsAccountKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'aws-accounts'] as const,
}
