import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'cjs', 'json', 'node',],
  // globalSetup: './test/hooks.ts',
  // globalTeardown: './teardown.js',
  setupFilesAfterEnv: [
    './jest-custom-reporter.ts',
  ],
  // setupFilesAfterEnv: ['jest-allure2-adapter/dist/setup-default',],
  testTimeout: 25000,
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
};
export default config;