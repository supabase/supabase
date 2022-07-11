module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['<rootDir>', 'node_modules'],
  setupFiles: ['jest-canvas-mock', './tests/setup/radix'],
  testEnvironment: 'jsdom',
  testRegex: '(.*\\.test.(js|jsx|ts|tsx)$)',
  transform: { '^.+\\.(t|j)sx?$': 'ts-jest' },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
}
