import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const config = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['<rootDir>', 'node_modules'],
  maxConcurrency: 3,
  maxWorkers: '50%',
  moduleNameMapper: {
    '^@ui/(.*)$': '<rootDir>/../../packages/ui/src/$1',
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    'react-markdown': '<rootDir>/__mocks__/react-markdown.js',
    'sse.js': '<rootDir>/__mocks__/sse.js',
    'react-dnd': '<rootDir>/__mocks__/react-dnd.js',
    // [Joshen] There's bound to be a better way to do this and we'll need to figure this out
    'lib/common/fetch': '<rootDir>/__mocks__/lib/common/fetch',
    // 'hooks/analytics/useLogsQuery': '<rootDir>/__mocks__/hooks/analytics/useLogsQuery',
    'data/reports/api-report-query': '<rootDir>/__mocks__/hooks/useApiReport',
    'data/reports/storage-report-query': '<rootDir>/__mocks__/hooks/useStorageReport',
    'data/subscriptions/org-subscription-query':
      '<rootDir>/__mocks__/data/subscriptions/org-subscription-query',
  },
  testEnvironment: 'jsdom',
  testTimeout: 10000,
  testRegex: '(.*\\.test.(js|jsx|ts|tsx)$)',
  setupFiles: ['jest-canvas-mock', './tests/setup/radix', './tests/setup/polyfills'],
}

export default createJestConfig(config)
