import { Telemetry } from './src/index'

const sendEvent = <K extends Telemetry.EventName>(
  action: K,
  customProperties?: Telemetry.EventProps<K>
) => {
  const properties = !!customProperties ? customProperties : {}
  console.log(action, properties)
}

console.log(sendEvent('sign_in'))

console.log(
  sendEvent('$pageleave', {
    current_url: 'http://localhost:3000',
    pathname: '/studio',
  })
)

console.log(
  sendEvent('$pageview', {
    current_url: 'http://localhost:3000',
    page_title: 'Studio',
    pathname: '/studio',
  })
)

/**
 * checks that no empty params object is sent if no params are defined
 */

// console.log(sendEvent('sign_in', {}))

/**
 * Checks that all required fields are present in the params
 */

// console.log(
//   sendEvent('$pageview', {
//     current_url: 'http://localhost:3000',
//     page_title: 'Studio',
//   })
// )

/**
 * Check that enum values are correct in the params
 */

// console.log(
//   sendEvent('subscription_canceled', {
//     canceledPlanBillingCycle: 'monthly',
//     canceledPlanName: 'Pro',
//     canceledPlanValue: 10,
//   })
// )
