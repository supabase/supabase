export const edgeFunctionsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'edge-functions'] as const,
  detail: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'edge-function', slug, 'detail'] as const,
  body: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'edge-function', slug, 'body'] as const,
  deployments: (projectRef: string | undefined, slug: string | undefined) =>
    ['projects', projectRef, 'edge-function', slug, 'deployments'] as const,
  deploymentCode: (projectRef: string | undefined, slug: string | undefined, version: number) =>
    ['projects', projectRef, 'edge-function', slug, 'deployments', version, 'code'] as const,
}
