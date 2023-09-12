module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['<rootDir>', 'node_modules'],
  setupFiles: ['jest-canvas-mock', './tests/setup/radix'],
  testTimeout: 10000,
  transform: { '^.+\\.(t|j)sx?$': 'ts-jest' },
  testRegex: '(.*\\.test.(js|jsx|ts|tsx)$)',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  maxConcurrency: 3,
  maxWorkers: '50%',
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
    '^@ui/(.*)$': '<rootDir>/../packages/ui/src/$1',
  },
}
