import type { GoPageInput } from 'marketing'
import Image from 'next/image'
import { cn } from 'ui'

import authors from '@/lib/authors.json'

const sugu = authors.find((a) => a.author_id === 'sugu_sougoumarane')
const paul = authors.find((a) => a.author_id === 'paul_copplestone')
const ant = authors.find((a) => a.author_id === 'ant_wilson')
const deepthi = authors.find((a) => a.author_id === 'deepthi_sigireddi')

const hosts = [paul, ant, sugu, deepthi]

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'select-2026/vip-dinner',
  metadata: {
    title: 'VIP Dinner | Supabase Select 2026',
    description:
      'Join Supabase leaders for an intimate dinner at Flour + Water in San Francisco on October 1, 2026. Cocktails at 7:00 PM, dinner at 7:30 PM.',
  },
  hero: {
    title: 'The future of scalable databases',
    subtitle: 'An intimate VIP dinner hosted by Supabase',
    description:
      'Join Supabase product and engineering leaders for a dinner conversation about where Postgres is headed -- from scaling beyond single-node limits to managing globally distributed workloads. Expect sharp perspectives, good food, and the opportunity to connect with other engineering leaders.',
    image: {
      src: '/images/landing-pages/select-2026/flourwater.jpg',
      alt: 'Private dining room at Flour + Water, San Francisco',
      width: 600,
      height: 450,
    },
    ctas: [
      {
        label: 'Reserve your seat',
        href: '#rsvp',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'single-column',
      title: 'Details',
      children: (
        <div className="flex flex-col items-center gap-2 text-foreground-light">
          <p className="text-lg font-medium text-foreground">Date</p>
          <p>October 1, 2026</p>
          <p className="mt-4 text-lg font-medium text-foreground">Location</p>
          <p>Flour + Water</p>
          <p>San Francisco, CA</p>
          <p className="mt-4 text-lg font-medium text-foreground">Schedule</p>
          <p>7:00 PM — Cocktails and introductions</p>
          <p>7:30 PM — Dinner and discussion</p>
        </div>
      ),
    },
    {
      type: 'single-column',
      title: 'Your hosts',
      children: (
        <div className="border border-muted rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {hosts.map((host, i) => (
              <div
                key={host?.author_id ?? i}
                className={cn(
                  'flex flex-col items-center gap-4 p-6 sm:p-8 text-center',
                  i % 2 === 0 && 'sm:border-r border-muted',
                  i < 2 && 'sm:border-b border-muted',
                  i < hosts.length - 1 && 'max-sm:border-b max-sm:border-muted'
                )}
              >
                {host?.author_image_url && (
                  <Image
                    src={host.author_image_url}
                    alt={host.author}
                    width={192}
                    height={192}
                    className="rounded-full object-cover aspect-square w-48 h-48"
                  />
                )}
                <div className="flex flex-col items-center gap-0">
                  <p className="text-foreground font-medium text-base">{host?.author}</p>
                  <p className="text-foreground-lighter text-sm mt-2 leading-relaxed">
                    {host?.position && `${host.position}, `}Supabase
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      type: 'form',
      id: 'rsvp',
      title: 'Reserve your seat',
      description: "Space is limited. Let us know you're coming.",
      fields: [
        {
          type: 'text',
          name: 'first_name',
          label: 'First Name',
          placeholder: 'First Name',
          required: true,
          half: true,
        },
        {
          type: 'text',
          name: 'last_name',
          label: 'Last Name',
          placeholder: 'Last Name',
          required: true,
          half: true,
        },
        {
          type: 'email',
          name: 'email_address',
          label: 'Email',
          placeholder: 'Work email',
          required: true,
        },
        {
          type: 'text',
          name: 'company_name',
          label: 'Company',
          placeholder: 'ACME, Inc.',
          required: true,
        },
        {
          type: 'text',
          name: 'job_title',
          label: 'Job Title',
          placeholder: 'VP of Engineering',
          required: false,
        },
        {
          type: 'text',
          name: 'phone_number',
          label: 'Phone Number',
          placeholder: '+1 212 555 1212',
          required: false,
        },
        {
          type: 'select',
          name: 'attending',
          label: 'Are you attending Select 2026?',
          placeholder: 'Select an option',
          required: true,
          options: [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' },
          ],
        },
      ],
      submitLabel: 'Confirm RSVP',
      successRedirect: '/go/select-2026/vip-dinner/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          formGuid: 'd0699f2e-225a-4224-91b5-341fb5336613',
          fieldMap: {
            first_name: 'firstname',
            last_name: 'lastname',
            email_address: 'email',
            company_name: 'company',
            job_title: 'jobtitle',
            phone_number: 'phone',
          },
          // `attending` is a Notion-only field — keep it out of the HubSpot payload.
          excludeFields: ['attending'],
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
        notion: {
          database_id: '37d5004b775f809e8cc4e29fdec302aa',
          columnMap: {
            first_name: 'First Name',
            last_name: 'Last Name',
            email_address: 'Email',
            company_name: 'Company',
            job_title: 'Job Title',
            phone_number: 'Phone Number',
            attending: 'Attending',
          },
        },
      },
    },
  ],
}

export default page
