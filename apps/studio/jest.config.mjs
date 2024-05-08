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
  },
  testEnvironment: 'jsdom',
  testTimeout: 10000,
  testRegex: '(.*\\.test.(js|jsx|ts|tsx)$)',
  setupFiles: ['jest-canvas-mock', './tests/setup/radix', './tests/setup/polyfills'],
}

export default createJestConfig(config)
