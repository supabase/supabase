import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'cjs', 'json', 'node'],
  // globalSetup: './test/hooks.ts',
  // globalTeardown: './teardown.js',
  setupFiles: ['<rootDir>/.jest/jest-env.js'],
  setupFilesAfterEnv: ['<rootDir>/.jest/jest-custom-reporter.ts'],
  testRunner: 'jest-jasmine2',
  testTimeout: 5000,
  // testEnvironmentOptions: {
  //   jiraUrl: ""
  // },
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
}
export default config
