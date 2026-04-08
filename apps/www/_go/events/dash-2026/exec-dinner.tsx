import type { GoPageInput } from 'marketing'
import Image from 'next/image'

import authors from '@/lib/authors.json'

const sugu = authors.find((a) => a.author_id === 'sugu_sougoumarane')

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'dash-2026/exec-dinner',
  metadata: {
    title: 'Executive Dinner | Supabase at DASH 2026',
    description:
      'Join Supabase leaders for an intimate dinner. Location to be announced. Cocktails at 6:30 PM, dinner at 7:00 PM.',
  },
  hero: {
    title: 'The future of scalable databases',
    subtitle: 'An intimate executive dinner hosted by Supabase',
    description:
      'Join Supabase product and engineering leaders for a dinner conversation about where Postgres is headed -- from scaling beyond single-node limits to managing globally distributed workloads. Expect sharp perspectives, good food, and the opportunity to connect with other engineering leaders.',
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
          <p className="text-lg font-medium text-foreground">Location</p>
          <p>To be announced</p>
          <p className="mt-4 text-lg font-medium text-foreground">Schedule</p>
          <p>6:30 PM — Cocktails and introductions</p>
          <p>7:00 PM — Dinner and discussion</p>
        </div>
      ),
    },
    {
      type: 'single-column',
      title: 'Your hosts',
      children: (
        <div className="border border-muted rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col items-center gap-4 p-6 sm:p-8 md:border-r border-muted max-md:border-b text-center">
              {sugu?.author_image_url && (
                <Image
                  src={sugu.author_image_url}
                  alt={sugu.author}
                  width={192}
                  height={192}
                  className="rounded-full object-cover aspect-square w-48 h-48"
                />
              )}
              <div className="flex flex-col items-center gap-0">
                <p className="text-foreground font-medium text-base">{sugu?.author}</p>
                <p className="text-foreground-lighter text-sm mt-2 leading-relaxed">
                  {sugu?.position && `${sugu.position}, `}Supabase
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 p-6 sm:p-8 text-center">
              <div
                className="flex shrink-0 items-center justify-center rounded-full bg-muted aspect-square w-48 h-48 text-foreground-lighter text-sm font-medium"
                aria-hidden
              >
                TBA
              </div>
              <div className="flex flex-col items-center gap-0">
                <p className="text-foreground font-medium text-base">To be announced</p>
                <p className="text-foreground-lighter text-sm mt-2 leading-relaxed">Supabase</p>
              </div>
            </div>
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
          placeholder: 'Company name',
          required: true,
        },
      ],
      submitLabel: 'Confirm RSVP',
      successRedirect: '/go/dash-2026/exec-dinner/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          formGuid: 'e8c8bb70-4edc-46d7-b752-df18001bb40d',
          fieldMap: {
            first_name: 'firstname',
            last_name: 'lastname',
            email_address: 'email',
            company_name: 'company',
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
      },
    },
  ],
}

export default page
