export function mockCreateLruCache(overrides: Record<string, unknown>): void {
  vi.doMock('@internal/cache', async () => {
    const actual = await vi.importActual<typeof import('@internal/cache')>('@internal/cache')

    return {
      ...actual,
      createLruCache: ((optionsOrName: unknown, maybeOptions?: Record<string, unknown>) => {
        if (typeof optionsOrName === 'string') {
          return actual.createLruCache(
            optionsOrName as never,
            {
              ...(maybeOptions || {}),
              ...overrides,
            } as never
          )
        }

        return actual.createLruCache({
          ...(optionsOrName as Record<string, unknown>),
          ...overrides,
        } as never)
      }) as typeof actual.createLruCache,
    }
  })
}
