import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'legal/amoe',
  metadata: {
    title: 'Alternative Mode of Entry',
    description: 'Submit your entry for Supabase promotions without making a purchase.',
  },
  hero: {
    title: 'Alternative Mode of Entry',
    description: 'Enter without purchase. Complete the form below.',
  },
  sections: [
    {
      type: 'form',
      id: 'form',
      title: 'Enter',
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
          label: 'Email Address',
          placeholder: 'Work email',
          required: true,
        },
        {
          type: 'text',
          name: 'company_name',
          label: 'Company',
          placeholder: 'Company (optional)',
          required: false,
        },
      ],
      submitLabel: 'Submit',
      successRedirect: '/go/legal/amoe-thankyou',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        customerio: {
          event: 'amoe_entered',
          profileMap: {
            email_address: 'email',
            first_name: 'first_name',
            last_name: 'last_name',
            company_name: 'company_name',
          },
        },
      },
    },
  ],
}

export default page
