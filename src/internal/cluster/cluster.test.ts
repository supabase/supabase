import { vi } from 'vitest'

const { ecsLoaded, eksLoaded, getEcsClusterSize, getEksClusterSize } = vi.hoisted(() => ({
  ecsLoaded: vi.fn(),
  eksLoaded: vi.fn(),
  getEcsClusterSize: vi.fn(() => Promise.resolve(2)),
  getEksClusterSize: vi.fn(() => Promise.resolve(3)),
}))

vi.mock('@internal/monitoring', () => ({
  logger: {
    info: vi.fn(),
  },
}))

vi.mock('./ecs', () => {
  ecsLoaded()

  return {
    ClusterDiscoveryECS: class {
      getClusterSize() {
        return getEcsClusterSize()
      }
    },
  }
})

vi.mock('./eks', () => {
  eksLoaded()

  return {
    ClusterDiscoveryEKS: class {
      getClusterSize() {
        return getEksClusterSize()
      }
    },
  }
})

describe('Cluster', () => {
  const originalClusterDiscovery = process.env.CLUSTER_DISCOVERY

  beforeEach(() => {
    vi.resetModules()
    ecsLoaded.mockClear()
    eksLoaded.mockClear()
    getEcsClusterSize.mockClear()
    getEksClusterSize.mockClear()
  })

  afterEach(() => {
    if (originalClusterDiscovery === undefined) {
      delete process.env.CLUSTER_DISCOVERY
    } else {
      process.env.CLUSTER_DISCOVERY = originalClusterDiscovery
    }
  })

  it.each([
    { discovery: 'ECS', size: 2, selected: ecsLoaded, skipped: eksLoaded },
    { discovery: 'EKS', size: 3, selected: eksLoaded, skipped: ecsLoaded },
  ])('loads only the $discovery discovery implementation', async ({
    discovery,
    size,
    selected,
    skipped,
  }) => {
    process.env.CLUSTER_DISCOVERY = discovery

    const { Cluster } = await import('./cluster')
    const abortController = new AbortController()

    try {
      await Cluster.init(abortController.signal)

      expect(Cluster.size).toBe(size)
      expect(selected).toHaveBeenCalledTimes(1)
      expect(skipped).not.toHaveBeenCalled()
    } finally {
      abortController.abort()
    }
  })

  it('does not load a discovery implementation when CLUSTER_DISCOVERY is unset', async () => {
    delete process.env.CLUSTER_DISCOVERY

    const { Cluster } = await import('./cluster')

    await Cluster.init(new AbortController().signal)

    expect(Cluster.size).toBe(0)
    expect(ecsLoaded).not.toHaveBeenCalled()
    expect(eksLoaded).not.toHaveBeenCalled()
  })

  it('does not initialize discovery when the abort signal is already aborted', async () => {
    process.env.CLUSTER_DISCOVERY = 'ECS'

    const { Cluster } = await import('./cluster')
    const abortController = new AbortController()
    abortController.abort()

    await Cluster.init(abortController.signal)

    expect(Cluster.size).toBe(0)
    expect(ecsLoaded).not.toHaveBeenCalled()
    expect(eksLoaded).not.toHaveBeenCalled()
  })

  it('stops initialization when aborted while loading discovery', async () => {
    process.env.CLUSTER_DISCOVERY = 'ECS'

    const { Cluster } = await import('./cluster')
    const abortController = new AbortController()

    const initialization = Cluster.init(abortController.signal)
    abortController.abort()
    await initialization

    expect(Cluster.size).toBe(0)
    expect(getEcsClusterSize).not.toHaveBeenCalled()
  })

  it('does not publish or watch a cluster size when aborted while loading it', async () => {
    process.env.CLUSTER_DISCOVERY = 'ECS'

    const { Cluster } = await import('./cluster')
    const abortController = new AbortController()
    const intervalSpy = vi.spyOn(globalThis, 'setInterval')
    getEcsClusterSize.mockImplementationOnce(async () => {
      await Promise.resolve()
      abortController.abort()
      return 2
    })

    try {
      await Cluster.init(abortController.signal)

      expect(Cluster.size).toBe(0)
      expect(getEcsClusterSize).toHaveBeenCalledOnce()
      expect(intervalSpy).not.toHaveBeenCalled()
    } finally {
      intervalSpy.mockRestore()
    }
  })
})
