// Default-cluster requests retain the API's omission semantics.
export const toRequestClusterId = (
  clusterId: string | null | undefined,
  defaultClusterId: string | undefined
) => (clusterId === null || clusterId === defaultClusterId ? undefined : clusterId)
