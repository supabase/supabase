import { z } from 'zod'

export const voiceDraftSchema = z.object({
  entity: z
    .enum(['lead', 'quote', 'activity'])
    .describe('Which kind of CRM entry this update is about.'),
  lead: z
    .object({
      name: z.string().describe("The person's name."),
      company: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      source: z.string().nullable().describe('How the lead came in, e.g. referral, inbound, event.'),
      status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']),
      estimated_value: z.number().nullable(),
      notes: z.string().nullable(),
    })
    .nullable()
    .describe('Fill this only when entity is "lead", otherwise null.'),
  quote: z
    .object({
      title: z.string(),
      amount: z.number(),
      stage: z.enum(['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired']),
      valid_until: z.string().nullable().describe('ISO date (YYYY-MM-DD) if a deadline was mentioned.'),
      notes: z.string().nullable(),
      lead_name_hint: z.string().nullable().describe('Name of the lead/contact this quote is for, if mentioned.'),
    })
    .nullable()
    .describe('Fill this only when entity is "quote", otherwise null.'),
  activity: z
    .object({
      type: z.enum(['call', 'email', 'meeting', 'note', 'follow_up']),
      subject: z.string(),
      notes: z.string().nullable(),
      due_at: z.string().nullable().describe('ISO 8601 datetime if a date/time was mentioned, resolved against the current date given below.'),
      lead_name_hint: z.string().nullable().describe('Name of the lead/contact this activity is about, if mentioned.'),
    })
    .nullable()
    .describe('Fill this only when entity is "activity", otherwise null.'),
})

export type VoiceDraft = z.infer<typeof voiceDraftSchema>
