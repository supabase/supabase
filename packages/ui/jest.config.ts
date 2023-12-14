import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  // Restricting test file pattern to just tsx files since the js files need a babel preset to run
  // and most likely won't pass now anyway - the tests were ported from the UI repo and are out of date
  testRegex: '(.*\\.test.tsx$)',
  moduleNameMapper: {
    '^@ui/(.*)$': '<rootDir>/src/$1',
  },
}

export default config
