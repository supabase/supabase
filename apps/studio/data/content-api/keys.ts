export const contentApiKeys = {
  errorCodes: ({ code, service }: { code: string; service?: string }) =>
    ['content-api', 'error-codes', { code, service }] as const,
}
