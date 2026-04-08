import type { GoPageInput } from 'marketing'

import accentureContest from './events/accenture-reinvention-2026/contest'
import aiEngineerEuropeContest from './events/ai-engineer-europe-2026/contest'
import aiEngineerEuropeContestThankYou from './events/ai-engineer-europe-2026/contest-thank-you'
import mcpDevSummitContest from './events/mcp-dev-nyc-2026/contest'
import mcpDevSummitContestThankYou from './events/mcp-dev-nyc-2026/contest-thank-you'
import pgconfDevContest from './events/pgconf-dev-2026/contest'
import pgconfDevContestThankYou from './events/pgconf-dev-2026/contest-thank-you'
import postgresconfContest from './events/postgresconf-sjc-2026/contest'
import postgresconfContestThankYou from './events/postgresconf-sjc-2026/contest-thank-you'
import startupGrindContest from './events/startup-grind-2026/contest'
import stripeSessionsContest from './events/stripe-sessions-2026/contest'
import stripeExecDinner from './events/stripe-sessions-2026/exec-dinner'
import stripeExecDinnerThankYou from './events/stripe-sessions-2026/exec-dinner-thank-you'
import stripeMeetingScheduler from './events/stripe-sessions-2026/meeting-scheduler'
import stripeParty from './events/stripe-sessions-2026/party'
import sxswContest from './events/sxsw-2026/contest'
import exampleLeadGen from './lead-gen/example-lead-gen'
import amoe from './legal/amoe'
import amoeThankYou from './legal/amoe-thankyou'
import contestRules from './legal/contest-rules'
import byocEarlyAccess from './pre-release/byoc-early-access'
import supabaseStripeProjects from './stripe-projects/supabase-stripe-projects'
import boltWebinar from './webinar/bolt-webinar'
import boltWebinarThankYou from './webinar/bolt-webinar-thank-you'
import figmaWebinarMay2026 from './webinar/figma-webinar-may2026'
import figmaWebinarMay2026ThankYou from './webinar/figma-webinar-may2026-thankyou'

const pages: GoPageInput[] = [
  exampleLeadGen,
  byocEarlyAccess,
  amoe,
  amoeThankYou,
  contestRules,
  figmaWebinarMay2026,
  figmaWebinarMay2026ThankYou,
  boltWebinar,
  boltWebinarThankYou,
  stripeExecDinner,
  stripeExecDinnerThankYou,
  stripeMeetingScheduler,
  stripeSessionsContest,
  stripeParty,
  sxswContest,
  accentureContest,
  postgresconfContest,
  postgresconfContestThankYou,
  mcpDevSummitContest,
  mcpDevSummitContestThankYou,
  pgconfDevContest,
  pgconfDevContestThankYou,
  aiEngineerEuropeContest,
  aiEngineerEuropeContestThankYou,
  startupGrindContest,
  supabaseStripeProjects,
]

export default pages
