/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  setupFiles: ['./test/setup.ts'],
  testTimeout: 30000,
  transformIgnorePatterns: [
    'node_modules/(?!(@jitl/quickjs-wasmfile-.*|mdast-.*|micromark|micromark-.*|unist-.*|decode-named-character-reference|character-entities|zwitch|longest-streak|chalk)/)',
  ],
}
