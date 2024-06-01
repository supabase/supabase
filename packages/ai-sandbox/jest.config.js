/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  setupFiles: ['./test/setup.ts'],
  transformIgnorePatterns: ['node_modules/(?!(@jitl/quickjs-wasmfile-.*)/)'],
}
