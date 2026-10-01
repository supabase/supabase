import type { GoPageInput } from 'marketing'
import Image from 'next/image'

import authors from '@/lib/authors.json'

const bil = authors.find((a) => a.author_id === 'bilharmer')

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'select-2026/ciso-dinner',
  metadata: {
    title: 'CISO Dinner | Supabase Select 2026',
    description:
      'An intimate dinner for security leaders, hosted by Supabase CISO Bil Harmer at Flour + Water in San Francisco on October 1, 2026. Cocktails at 7:00 PM, dinner at 7:30 PM.',
  },
  hero: {
    title: 'A dinner for security leaders',
    subtitle: 'An intimate CISO dinner hosted by Bil Harmer',
    description:
      'Join a small group of CISOs for a candid, off-the-record dinner on the problems defining the role right now — securing AI-assisted development, protecting data as it scales, and earning trust without slowing the business down. Hosted by Supabase CISO Bil Harmer, this is a peer conversation between security leaders, not a vendor pitch.',
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
      title: 'Your host',
      children: (
        <div className="border border-muted rounded-xl overflow-hidden max-w-sm mx-auto">
          <div className="flex flex-col items-center gap-4 p-6 sm:p-8 text-center">
            {bil?.author_image_url && (
              <Image
                src={bil.author_image_url}
                alt={bil.author}
                width={192}
                height={192}
                className="rounded-full object-cover aspect-square w-48 h-48"
              />
            )}
            <div className="flex flex-col items-center gap-0">
              <p className="text-foreground font-medium text-base">{bil?.author}</p>
              <p className="text-foreground-lighter text-sm mt-2 leading-relaxed">
                {bil?.position && `${bil.position}, `}Supabase
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      type: 'form',
      id: 'rsvp',
      title: 'Reserve your seat',
      description:
        "Seats are limited to a small group of security leaders. Let us know you're coming.",
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
          placeholder: 'CISO',
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
      successRedirect: '/go/select-2026/ciso-dinner/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        notion: {
          database_id: '6765004b775f8232bf9581010da530c9',
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
