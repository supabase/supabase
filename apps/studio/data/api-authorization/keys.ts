export const resourceKeys = {
  resource: (id: string | undefined) => ['api-authorization', id] as const,
}
