import { Severity } from 'allure-js-commons'
import { FEATURE } from '../templates/enums'

describe('authentication', () => {
    beforeEach(() => {
        reporter
            .description('Feature should work cool')
            .feature(FEATURE.AUTHENTICATION)
        reporter.severity(Severity.BLOCKER)
        reporter.step('setup actions', () => {
            /* implement it here */
        })
    })

    test('New users', () => {
        reporter.description('When user sign up then he should be logged in')

        reporter.step('Create Supabase anonymous client', () => {
            /* implement it here */
        })

        reporter.step('I sign up with a valid email and password', () => {
            /* implement it here */
        })

        reporter.step('Check if I am logged in', () => {
            /* implement it here */
        })

        reporter.step('Check if I am being able to log out', () => {
            /* implement it here */
        })
    })

    test('Existing users', () => {
        reporter.description('When user is already signed up then he should be able to logged in')

        reporter.step('Create a valid user', () => {
            /* implement it here */
        })

        reporter.step('I sign in with a valid email and password', () => {
            /* implement it here */
        })

        reporter.step('Check if I am logged in', () => {
            /* implement it here */
        })

        reporter.step('Check if I am being able to log out', () => {
            /* implement it here */
        })
    })
})
