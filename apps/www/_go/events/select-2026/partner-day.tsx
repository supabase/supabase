import type { GoPageInput } from 'marketing'

const whatToExpect: { title: string; description: string }[] = [
  {
    title: 'A founder welcome',
    description:
      'Hear directly from Supabase leadership on the momentum behind the ecosystem and why this room matters.',
  },
  {
    title: 'Where partnerships are headed',
    description:
      "A look ahead at the Supabase partner ecosystem and how we're investing in the people who build with us.",
  },
  {
    title: 'A product sneak peek',
    description:
      "A preview of what we're building, with a focus on the things that matter most to partners.",
  },
  {
    title: 'Open conversation',
    description: 'Bring your questions, ideas, and hot takes straight to the Supabase team.',
  },
  {
    title: 'Meet the ecosystem',
    description:
      "You'll be standing next to the builders, founders, and partner teams behind some of your favorite tools.",
  },
  {
    title: 'Happy hour',
    description:
      'We close out the afternoon with food and drinks with the wider Supabase community.',
  },
]

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'select-2026/partner-day',
  metadata: {
    title: 'Partner Day | Supabase Select 2026',
    description:
      'Join the Supabase team and your fellow partners for our first ever Partner Day: an intimate afternoon of real talk, sneak peeks, and good company on October 1, 2026, the day before Select.',
  },
  hero: {
    title: 'Supabase Partner Day',
    subtitle: 'Supabase Select 2026',
    description:
      "You're helping us build this ecosystem, so come celebrate it with us. Join the Supabase team and your fellow partners for our first ever Partner Day: an intimate afternoon of real talk, sneak peeks, and good company.",
    ctas: [
      {
        label: 'Reserve your spot',
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
          <p className="text-sm text-foreground-lighter italic">
            The day before Supabase Select 2026
          </p>
          <p className="mt-4 text-lg font-medium text-foreground">Location</p>
          <p>San Francisco, CA</p>
          <p className="text-sm text-foreground-lighter italic">
            Venue details will be shared soon
          </p>
          <p className="mt-4 text-lg font-medium text-foreground">Time</p>
          <p>Doors open at 2:30 PM</p>
          <p>Happy hour from 4:30 PM</p>
        </div>
      ),
    },
    {
      type: 'feature-grid',
      title: 'What to expect',
      description:
        'The plan is simple: a couple of hours with the people building the Supabase ecosystem.',
      columns: 3,
      items: whatToExpect,
    },
    {
      type: 'single-column',
      title: "Why we're doing this",
      children: (
        <div className="max-w-2xl mx-auto flex flex-col gap-4 text-foreground-light text-lg text-center text-balance">
          <p>
            This is Supabase's inaugural Partner Day: the partnerships we're shipping together have
            become a real part of what makes Supabase work, and we want to celebrate that IRL.
          </p>
          <p>
            <span className="text-foreground font-medium">And then there's Select.</span> Partner
            Day flows straight into Select the next day. If you haven't sorted your pass yet, your
            Partner Day invite has you covered.
          </p>
        </div>
      ),
    },
    {
      type: 'form',
      id: 'rsvp',
      title: 'Reserve your spot',
      description: "Space is limited and this one's invite-only, so let us know you're coming.",
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
          placeholder: 'Head of Partnerships',
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
          label: 'Would you like to attend Supabase Select on October 2?',
          hint: 'Your Partner Day invite covers it',
          placeholder: 'Select an option',
          required: true,
          options: [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' },
          ],
        },
      ],
      submitLabel: 'Confirm RSVP',
      successRedirect: '/go/select-2026/partner-day/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          formGuid: 'a6e8cf87-5fd0-4ed0-acce-60e37447fb23',
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
          database_id: '37d5004b775f80e48618c7ac1013c889',
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
