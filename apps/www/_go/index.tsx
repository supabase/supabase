import type { GoPageInput } from 'marketing'

import accentureContest from './events/accenture-reinvention-2026/contest'
import aiEngineerEuropeContest from './events/ai-engineer-europe-2026/contest'
import aiEngineerEuropeContestThankYou from './events/ai-engineer-europe-2026/contest-thank-you'
import datadogContest from './events/dash-2026/contest'
import datadogDinner from './events/dash-2026/exec-dinner'
import datadogContestThankYou from './events/dash-2026/exec-dinner-thank-you'
import postgresconfContest from './events/postgresconf-sjc-2026/contest'
import postgresconfContestThankYou from './events/postgresconf-sjc-2026/contest-thank-you'
import startupGrindContest from './events/startup-grind-2026/contest'
import stripeSessionsContest from './events/stripe-sessions-2026/contest'
import stripeExecDinner from './events/stripe-sessions-2026/exec-dinner'
import stripeExecDinnerThankYou from './events/stripe-sessions-2026/exec-dinner-thank-you'
import stripeMeetingScheduler from './events/stripe-sessions-2026/meeting-scheduler'
import stripeParty from './events/stripe-sessions-2026/party'
import awsActivateOffer from './lead-gen/aws-activate-offer'
import exampleLeadGen from './lead-gen/example-lead-gen'
import amoe from './legal/amoe'
import amoeThankYou from './legal/amoe-thankyou'
import contestRules from './legal/contest-rules'
import byocEarlyAccess from './pre-release/byoc-early-access'
import supabaseStripeProjects from './stripe-projects/supabase-stripe-projects'

const pages: GoPageInput[] = [
  awsActivateOffer, // maintain forever
  exampleLeadGen, // sample lead gen page
  byocEarlyAccess, // maintain until PM says to remove
  amoe, // maintain forever
  amoeThankYou, // maintain forever
  contestRules, // maintain forever
  stripeExecDinner, // remove after May 31, 2026
  stripeExecDinnerThankYou, // remove after May 31, 2026
  stripeMeetingScheduler, // remove after May 31, 2026
  stripeSessionsContest, // remove after May 31, 2026
  stripeParty, // remove after May 31, 2026
  accentureContest, // remove after May 31, 2026
  postgresconfContest, // remove after May 31, 2026
  postgresconfContestThankYou, // remove after May 31, 2026
  datadogContest, // remove after June 30, 2026
  datadogContestThankYou, // remove after June 30, 2026
  datadogDinner, // remove after June 30, 2026
  aiEngineerEuropeContest,
  aiEngineerEuropeContestThankYou,
  startupGrindContest, // remove after May 31, 2026
  supabaseStripeProjects,
]

export default pages
