import type { GoPageInput } from 'marketing'
import Image from 'next/image'
import { cn } from 'ui'

import authors from '@/lib/authors.json'

const kris = authors.find((a) => a.author_id === 'kris_talajic')
const harold = authors.find((a) => a.author_id === 'harold_gimenez')

const hosts = [kris, harold]

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'aws-reinvent/spago-dinner',
  metadata: {
    title: 'Spago Dinner | Supabase at AWS re:Invent 2026',
    description:
      'Join Supabase leaders for an intimate dinner at Spago in Las Vegas on December 1, 2026, during AWS re:Invent. Cocktails at 7:30 PM, dinner at 8:00 PM.',
  },
  hero: {
    title: 'Building for the agentic future',
    subtitle: 'Dinner with Supabase at AWS re:Invent',
    description:
      "Join Supabase leaders for dinner at Spago while you're in Las Vegas for AWS re:Invent. Kris Talajic and Harold Gimenez will host a conversation about building agentic apps on Postgres, from scaling past single-node limits to running globally distributed workloads.",
    image: {
      src: '/images/landing-pages/aws-reinvent/spago.jpg',
      alt: 'Patio at Spago at Bellagio, Las Vegas, at sunset',
      width: 600,
      height: 400,
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
          <p>December 1, 2026</p>
          <p className="mt-4 text-lg font-medium text-foreground">Location</p>
          <p>Spago</p>
          <p>Las Vegas, NV</p>
          <p className="mt-4 text-lg font-medium text-foreground">Schedule</p>
          <p>7:30 PM — Cocktails and introductions</p>
          <p>8:00 PM — Dinner and discussion</p>
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
      ],
      submitLabel: 'Confirm RSVP',
      successRedirect: '/go/aws-reinvent/spago-dinner/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          formGuid: 'a693e1f1-0b6d-4cf3-b350-8836f101075a',
          fieldMap: {
            first_name: 'firstname',
            last_name: 'lastname',
            email_address: 'email',
            company_name: 'company',
            job_title: 'jobtitle',
            phone_number: 'phone',
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
        notion: {
          database_id: 'feda1d5a85054176a99efe0e55b45140',
          columnMap: {
            first_name: 'First Name',
            last_name: 'Last Name',
            email_address: 'Email',
            company_name: 'Company',
            job_title: 'Job Title',
            phone_number: 'Phone Number',
          },
        },
      },
    },
  ],
}

export default page
