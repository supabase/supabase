import { Severity } from 'allure-js-commons'

import { FEATURE } from './enums'

describe('authentication', () => {
  beforeEach(() => {
    reporter.feature(FEATURE.AUTHENTICATION)
    reporter.severity(Severity.BLOCKER)
  })

  test('New users', () => {
    reporter.description('When user sign up then he should be logged in')

    reporter.step('Create Supabase anonymous client', () => {
      /* don't modify! */
    })

    reporter.step('I sign up with a valid email and password', () => {
      /* don't modify! */
    })

    reporter.step('Check if I am logged in', () => {
      /* don't modify! */
    })

    reporter.step('Check if I am being able to log out', () => {
      /* don't modify! */
    })
  })

  test('Existing users', () => {
    reporter.description('When user is already signed up then he should be able to logged in')

    reporter.step('Create a valid user', () => {
      /* don't modify! */
    })

    reporter.step('I sign in with a valid email and password', () => {
      /* don't modify! */
    })

    reporter.step('Check if I am logged in', () => {
      /* don't modify! */
    })

    reporter.step('Check if I am being able to log out', () => {
      /* don't modify! */
    })
  })
})
