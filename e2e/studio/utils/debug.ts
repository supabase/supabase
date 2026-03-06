import { Page } from '@playwright/test'

/**
 * Utility function that applies CPU and/or Network throttling. Useful to debug flaky tests on CI
 */
export const useTestThrottling = async (page: Page, { cpu, network }: {
  cpu?: 2 | 4 | 6,
  network?: keyof typeof NETWORK_PRESETS
}) => {
  const context = page.context()
  const cdpSession = await context.newCDPSession(page)
  // 4-6x CPU throttling is what worked well for my M1 Pro.
  if (cpu) {
    await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  }
  if (network) {
    const networkConfig = NETWORK_PRESETS[network];
    if (!networkConfig) {
      throw new Error('Invalid Network Throttling Configuration')
    }

    await cdpSession.send('Network.emulateNetworkConditions', networkConfig)
  }
}

export const NETWORK_PRESETS = {
    NoThrottle: {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0,
    },
    Regular2G: {
        offline: false,
        downloadThroughput: (250 * 1024) / 8,
        uploadThroughput: (50 * 1024) / 8,
        latency: 300,
        connectionType: 'cellular2g',
    },
    Good2G: {
        offline: false,
        downloadThroughput: (450 * 1024) / 8,
        uploadThroughput: (150 * 1024) / 8,
        latency: 150,
        connectionType: 'cellular2g',
    },
    Regular3G: {
        offline: false,
        downloadThroughput: (750 * 1024) / 8,
        uploadThroughput: (250 * 1024) / 8,
        latency: 100,
        connectionType: 'cellular3g',
    },
    Good3G: {
        offline: false,
        downloadThroughput: (1.5 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
        latency: 40,
        connectionType: 'cellular3g',
    },
    Regular4G: {
        offline: false,
        downloadThroughput: (4 * 1024 * 1024) / 8,
        uploadThroughput: (3 * 1024 * 1024) / 8,
        latency: 20,
        connectionType: 'cellular4g',
    },
    WiFi: {
        offline: false,
        downloadThroughput: (30 * 1024 * 1024) / 8,
        uploadThroughput: (15 * 1024 * 1024) / 8,
        latency: 2,
        connectionType: 'wifi',
    }
} as const;
