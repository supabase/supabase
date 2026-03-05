import type { GoPageInput } from 'marketing'

import byocEarlyAccess from './pre-release/byoc-early-access'
import boltWebinar from './webinar/bolt-webinar'
import boltWebinarThankYou from './webinar/bolt-webinar-thank-you'
import contestRules from './legal/contest-rules'
import stripeExecDinner from './events/stripe-sessions-2026/exec-dinner'
import stripeExecDinnerThankYou from './events/stripe-sessions-2026/exec-dinner-thank-you'
import stripeSessionsContest from './events/stripe-sessions-2026/contest'
import sxswContest from './events/sxsw-2026/contest'
import accentureContest from './events/accenture-reinvention-2026/contest'
import postgresconfContest from './events/postgresconf-sjc-2026/contest'
import postgresconfContestThankYou from './events/postgresconf-sjc-2026/contest-thank-you'
import startupGrindContest from './events/startup-grind-2026/contest'

const pages: GoPageInput[] = [
  byocEarlyAccess,
  contestRules,
  boltWebinar, // remove after March 31, 2026
  boltWebinarThankYou, // remove after March 31, 2026
  stripeExecDinner, // remove after May 31, 2026
  stripeExecDinnerThankYou, // remove after May 31, 2026
  stripeSessionsContest, // remove after May 31, 2026
  sxswContest, // remove after April 30, 2026
  accentureContest, // remove after May 31, 2026
  postgresconfContest, // remove after May 31, 2026
  postgresconfContestThankYou, // remove after May 31, 2026
  startupGrindContest, // remove after May 31, 2026
]

export default pages
