/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  setupFiles: ['./test/setup.ts'],
  setupFilesAfterEnv: ['./test/extensions.ts'],
  testTimeout: 15000,
  transformIgnorePatterns: [
    'node_modules/(?!(mdast-.*|micromark|micromark-.*|unist-.*|decode-named-character-reference|character-entities)/)',
  ],
}
