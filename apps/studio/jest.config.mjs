import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const config = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['<rootDir>', 'node_modules'],
  setupFiles: ['jest-canvas-mock', './tests/setup/radix'],
  testEnvironment: 'jsdom',
  testTimeout: 10000,
  testRegex: '(.*\\.test.(js|jsx|ts|tsx)$)',
  maxConcurrency: 3,
  maxWorkers: '50%',
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
    '^@ui/(.*)$': '<rootDir>/../../packages/ui/src/$1',
  },
}

export default createJestConfig(config)
