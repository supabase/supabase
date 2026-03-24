import type { GoPageInput } from 'marketing'
import Image from 'next/image'

import authors from '@/lib/authors.json'

const sugu = authors.find((a) => a.author_id === 'sugu_sougoumarane')
const deepthi = authors.find((a) => a.author_id === 'deepthi_sigireddi')
const joe = authors.find((a) => a.author_id === 'joe_sciarrino')

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'stripe/exec-dinner',
  metadata: {
    title: 'Executive Dinner: The Future of Scalable Databases | Supabase',
    description:
      'Join Supabase leaders for an intimate dinner exploring what comes next for Postgres at scale. April 29, 2026 at Spruce, San Francisco.',
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
          <p className="text-lg font-medium text-foreground">Spruce Restaurant</p>
          <p>3640 Sacramento St, San Francisco, CA</p>
          <p className="mt-4 text-lg font-medium text-foreground">Wednesday, April 29, 2026</p>
          <p>6:30 PM -- Cocktails and introductions</p>
          <p>7:00 PM -- Dinner and discussion</p>
        </div>
      ),
    },
    {
      type: 'single-column',
      title: 'Your hosts',
      children: (
        <div className="border border-muted rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
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
            <div className="flex flex-col items-center gap-4 p-6 sm:p-8 md:border-r border-muted max-md:border-b text-center">
              {deepthi?.author_image_url && (
                <Image
                  src={deepthi.author_image_url}
                  alt={deepthi.author}
                  width={192}
                  height={192}
                  className="rounded-full object-cover aspect-square w-48 h-48"
                />
              )}
              <div className="flex flex-col items-center gap-0">
                <p className="text-foreground font-medium text-base">{deepthi?.author}</p>
                <p className="text-foreground-lighter text-sm mt-2 leading-relaxed">
                  {deepthi?.position && `${deepthi.position}, `}Supabase
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 p-6 sm:p-8 text-center">
              {joe?.author_image_url && (
                <Image
                  src={joe.author_image_url}
                  alt={joe.author}
                  width={192}
                  height={192}
                  className="rounded-full object-cover aspect-square w-48 h-48"
                />
              )}
              <div className="flex flex-col items-center gap-0">
                <p className="text-foreground font-medium text-base">{joe?.author}</p>
                <p className="text-foreground-lighter text-sm mt-2 leading-relaxed">
                  {joe?.position}
                </p>
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
      successRedirect: '/go/stripe/exec-dinner/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          formGuid: 'eb135982-73b5-4701-a3e9-909564107087',
          fieldMap: {
            first_name: 'firstname',
            last_name: 'lastname',
            email_address: 'email',
            company_name: 'company',
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
        customerio: {
          event: 'event_registered',
          profileMap: {
            email_address: 'email',
            first_name: 'first_name',
            last_name: 'last_name',
            company_name: 'company_name',
          },
          staticProperties: {
            event_name: 'Stripe Sessions 2026 Exec Dinner',
          },
        },
      },
    },
  ],
}

export default page
