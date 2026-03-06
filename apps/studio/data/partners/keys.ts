export const stripeFabricKeys = {
  get: (arId: string | undefined) => ['stripe', 'fabric', arId] as const,
}
