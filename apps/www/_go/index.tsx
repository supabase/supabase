import type { GoPageInput } from 'marketing'

import byocEarlyAccess from './pre-release/byoc-early-access'
import exampleLeadGen from './lead-gen/example-lead-gen'
import exampleLegal from './legal/example-legal'
import exampleThankYou from './thank-you/example-thank-you'
import boltWebinar from './webinar/bolt-webinar'
import boltWebinarThankYou from './webinar/bolt-webinar-thank-you'

const pages: GoPageInput[] = [
  byocEarlyAccess,
  exampleLeadGen,
  exampleThankYou,
  exampleLegal,
  boltWebinar,
  boltWebinarThankYou,
]

export default pages
