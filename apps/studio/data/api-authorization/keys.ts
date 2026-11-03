export const resourceKeys = {
  resource: (id: string | undefined) => ['api-authorization', id] as const,
  preflight: (slug: string | undefined, id: string | undefined) =>
    ['api-authorization', id, 'preflight', slug] as const,
}
