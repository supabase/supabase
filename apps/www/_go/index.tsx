import type { GoPageInput } from 'marketing'

import byocEarlyAccess from './pre-release/byoc-early-access'
import boltWebinar from './webinar/bolt-webinar'
import boltWebinarThankYou from './webinar/bolt-webinar-thank-you'
import contestRules from './legal/contest-rules'
import stripeExecDinner from './events/stripe-exec-dinner'
import stripeExecDinnerThankYou from './events/stripe-exec-dinner-thank-you'
import stripeSessionsContest from './events/stripe-sessions-contest'

const pages: GoPageInput[] = [
  byocEarlyAccess,
  contestRules,
  boltWebinar, // remove after March 31, 2026
  boltWebinarThankYou, // remove after March 31, 2026
  stripeExecDinner,
  stripeExecDinnerThankYou,
  stripeSessionsContest,
]

export default pages
