import type { GoPageInput } from 'marketing'

const agenda: { time: string; session: string; notes?: string }[] = [
  {
    time: '2:00 - 2:30pm',
    session: 'Arrival + light snacks',
    notes: 'Casual opportunity to meet your fellow partners',
  },
  {
    time: '2:30 - 2:45pm',
    session: 'Welcome',
    notes: 'Ecosystem momentum and why partners are so critical to the success of Supabase.',
  },
  {
    time: '2:45 - 3:15pm',
    session: 'Business update + Roadmap preview',
    notes: 'An early look at what\u2019s coming at Select',
  },
  {
    time: '3:15 - 3:45pm',
    session: 'Partner demos / \u201cwins\u201d',
    notes: 'Demos by some partners on what they\u2019ve built / building.',
  },
  {
    time: '3:45 - 4:15pm',
    session: 'Partner panel',
    notes: 'Challenges and opportunities for partners in the Supabase ecosystem.',
  },
  {
    time: '4:15 - 4:30pm',
    session: 'Ecosystem announcements roundup + partner awards',
    notes: 'Celebrate the organizations that have delivered innovative results through the year.',
  },
  {
    time: '4:30pm and beyond',
    session: 'Happy hour',
  },
]

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'select-2026/partner-day',
  metadata: {
    title: 'Partner Day | Supabase Select 2026',
    description:
      'Join the Supabase partner community for an afternoon of business updates, partner demos, panels, and ecosystem announcements, followed by a happy hour.',
  },
  hero: {
    title: 'Supabase Partner Day',
    subtitle: 'Celebrating the Supabase ecosystem',
    description:
      'Spend the afternoon with the Supabase team and fellow partners. Hear a business update and roadmap preview, watch lightning demos of what partners are building, join a partner panel, and celebrate the latest ecosystem announcements and partner awards -- capped off with a happy hour.',
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
          <p className="mt-4 text-lg font-medium text-foreground">Location</p>
          <p>San Francisco, CA</p>
          <p className="mt-4 text-lg font-medium text-foreground">Schedule</p>
          <p>2:00 PM — Arrival and light snacks</p>
          <p>4:30 PM — Happy hour</p>
        </div>
      ),
    },
    {
      type: 'single-column',
      title: 'Agenda',
      children: (
        <div className="border border-muted rounded-xl overflow-hidden text-left">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-100 text-foreground">
                <th className="w-40 align-top p-4 font-medium border-b border-muted">Time</th>
                <th className="align-top p-4 font-medium border-b border-muted">Session</th>
                <th className="align-top p-4 font-medium border-b border-muted">Notes</th>
              </tr>
            </thead>
            <tbody>
              {agenda.map((item, index) => (
                <tr key={item.time} className={index > 0 ? 'border-t border-muted' : undefined}>
                  <td className="w-40 align-top p-4 font-medium text-foreground whitespace-nowrap">
                    {item.time}
                  </td>
                  <td className="align-top p-4 text-foreground">{item.session}</td>
                  <td className="align-top p-4 text-foreground-light">{item.notes ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      type: 'feature-grid',
      title: "What you'll gain",
      columns: 3,
      items: [
        {
          title: 'Strengthen key relationships',
          description:
            "Join Supabase's inaugural Partner Summit and build deeper connections with the Supabase team and the wider partner community in one room.",
        },
        {
          title: 'Get recognized for your work',
          description:
            'Top-performing partners are celebrated with Partner Awards, recognizing your impact across product integrations and go-to-market.',
        },
        {
          title: 'See where Supabase is heading',
          description:
            'Get a business update and an early look at the product roadmap, giving you forward-looking context to plan your own bets.',
        },
        {
          title: 'Unlock new opportunities',
          description:
            'Be first to hear about new partner programs, partner benefits, and product integration opportunities you can take advantage of.',
        },
        {
          title: 'Shape the partnership',
          description:
            "Meet the team in person to share what's working, surface points of friction, and give feedback that directly informs how we collaborate.",
        },
        {
          title: 'Grow your visibility',
          description:
            "Be part of the partner ecosystem spotlight and get featured across Supabase's social channels.",
        },
      ],
    },
    {
      type: 'form',
      id: 'rsvp',
      title: 'Reserve your spot',
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
