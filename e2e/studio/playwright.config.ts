import { defineConfig } from '@playwright/test'
import { env, STORAGE_STATE_PATH } from './env.config.js'

const IS_CI = !!process.env.CI

const WEB_SERVER_TIMEOUT = Number(process.env.WEB_SERVER_TIMEOUT) || 10 * 60 * 1000
const WEB_SERVER_PORT = Number(process.env.WEB_SERVER_PORT) || 8082

// 15 minutes for platform, 2 minutes for self-hosted. Takes longer to setup a full project on platform.
const setupTimeout = env.IS_PLATFORM ? 15 * 60 * 1000 : 120 * 1000

const createWebServerConfig = () => {
  if (env.IS_PLATFORM && env.IS_APP_RUNNING_ON_LOCALHOST) {
    return {
      command: 'pnpm --workspace-root run e2e:setup:platform',
      port: WEB_SERVER_PORT,
      timeout: WEB_SERVER_TIMEOUT,
      reuseExistingServer: true,
    }
  }

  // Apps running on runner using the vercel staging environment
  if (env.IS_PLATFORM && !env.IS_APP_RUNNING_ON_LOCALHOST) {
    return undefined
  }

  return {
    command: 'pnpm --workspace-root run e2e:setup:selfhosted',
    port: WEB_SERVER_PORT,
    timeout: WEB_SERVER_TIMEOUT,
    reuseExistingServer: true,
  }
}

export default defineConfig({
  timeout: 120 * 1000,
  testDir: './features',
  testMatch: /.*\.spec\.ts/,
  forbidOnly: IS_CI,
  retries: IS_CI ? 5 : 0,
  maxFailures: 3,
  expect: {
    timeout: 20_000,
  },
  // Due to rate API rate limits run tests in serial mode on platform.
  fullyParallel: !env.IS_PLATFORM,
  workers: env.IS_PLATFORM ? 1 : 3,
  use: {
    baseURL: env.STUDIO_URL,
    screenshot: 'off',
    video: 'retain-on-failure',
    headless: true || IS_CI,
    trace: 'retain-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
    extraHTTPHeaders: {
      'x-vercel-protection-bypass':
        process.env.VERCEL_AUTOMATION_BYPASS_SELFHOSTED_STUDIO || 'false',
      'x-vercel-set-bypass-cookie': 'true',
    },
    launchOptions: {
      args: [
        // Security/Sandbox settings (required for CI environments)
        '--no-sandbox', // Disables Chrome's sandbox - required in Docker/CI where user namespaces aren't available
        '--disable-setuid-sandbox', // Alternative sandbox method - disabled for CI compatibility
        '--allow-insecure-localhost', // Allows tests against localhost with self-signed certificates
        // Memory and resource management
        '--disable-dev-shm-usage', // Use /tmp instead of /dev/shm to avoid shared memory issues in containers
        '--js-flags=--max_old_space_size=4096', // Increase V8 heap size to 4GB to handle memory-intensive tests
        '--memory-pressure-off', // Prevents Chrome from killing tabs due to memory pressure in CI
        '--enable-low-end-device-mode', // Optimizes memory usage for resource-constrained environments
        // GPU and rendering (disabled for headless/CI performance)
        '--disable-gpu', // Disables hardware GPU - not needed in headless mode
        '--disable-software-rasterizer', // Disables software-based rendering fallback
        // Performance optimizations for testing
        '--disable-background-timer-throttling', // Prevents Chrome from throttling timers in background tabs
        '--disable-backgrounding-occluded-windows', // Keeps hidden windows running at full speed
        '--disable-renderer-backgrounding', // Prevents renderer processes from being deprioritized
        '--disable-ipc-flooding-protection', // Allows high-frequency IPC messages needed for automation
        // Disable unnecessary features to reduce overhead
        '--disable-extensions', // Disables all browser extensions
        '--disable-sync', // Disables Chrome sync service
        '--disable-default-apps', // Prevents loading of default Chrome apps
        '--disable-component-update', // Disables automatic component updates during tests
        '--disable-background-networking', // Disables background network requests
        '--disable-features=TranslateUI', // Disables translation UI prompts
        '--disable-features=MediaRouter,site-per-process', // Disables Cast and site isolation for performance
        '--disable-features=HardwareMediaKeyHandling', // Disables hardware media key handling
        // Disable monitoring and crash reporting
        '--disable-breakpad', // Disables crash reporting system
        '--disable-crash-reporter', // Disables crash reporter UI
        '--disable-hang-monitor', // Disables hang detection monitoring
        '--metrics-recording-only', // Disables metric uploads while still collecting them
        // Disable security features not needed for testing
        '--disable-client-side-phishing-detection', // Disables phishing detection checks
        '--safebrowsing-disable-auto-update', // Disables safe browsing database updates
        '--disable-domain-reliability', // Disables domain reliability monitoring
        // Disable user prompts and UI elements
        '--disable-popup-blocking', // Allows popups without user confirmation
        '--disable-prompt-on-repost', // Skips form resubmission confirmation dialogs
        '--no-first-run', // Skips first-run wizards and setup dialogs
        '--no-default-browser-check', // Prevents "set as default browser" prompts
        // Process management
        '--no-zygote', // Disables zygote process for spawning renderers - reduces memory in single-use scenarios
        // Headless mode configuration
        '--headless=new', // Uses new headless mode (more stable than old headless)
        '--window-size=1280,720', // Sets consistent viewport size for screenshot/visual consistency
        '--hide-scrollbars', // Hides scrollbars for cleaner screenshots
        '--mute-audio', // Prevents audio output during tests
        // Network configuration
        '--enable-features=NetworkService,NetworkServiceInProcess', // Uses modern network service in-process for better performance
      ],
    },
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      timeout: setupTimeout,
    },
    {
      name: 'Features',
      testDir: './features',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        browserName: 'chromium',
        screenshot: 'off',

        // Only use storage state if authentication is enabled. When AUTHENTICATION=false
        // we should not require a pre-generated storage state file.
        storageState: env.AUTHENTICATION ? STORAGE_STATE_PATH : undefined,
      },
    },
  ],
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
  ],
  webServer: createWebServerConfig(),
})
