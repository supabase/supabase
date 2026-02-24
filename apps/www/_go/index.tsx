import type { GoPageInput } from 'marketing'

import exampleLeadGen from './lead-gen/example-lead-gen'
import exampleLegal from './legal/example-legal'
import exampleThankYou from './thank-you/example-thank-you'
import boltWebinar from './webinar/bolt-webinar'
import boltWebinarThankYou from './webinar/bolt-webinar-thank-you'

const pages: GoPageInput[] = [
  exampleLeadGen,
  exampleThankYou,
  exampleLegal,
  boltWebinar,
  boltWebinarThankYou,
]

export default pages
