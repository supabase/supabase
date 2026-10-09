import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'storage-object-versioning-early-access',
  metadata: {
    title: 'Storage object versioning - Request access',
    description:
      'Request access to the Storage object versioning private alpha. Keep previous copies of a file, archive instead of delete, restore any version, and expire the rest with lifecycle policies.',
  },
  hero: {
    title: 'Storage object versioning',
    subtitle: 'Private alpha',
    description:
      'Keep the previous copy every time a file changes, archive files instead of destroying them, and restore any version. The private alpha is by invite.',
    ctas: [
      {
        label: 'Request access',
        href: '#form',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'feature-grid',
      title: 'Recover a file after a bad write',
      description:
        'Versioning is set per bucket, so you can turn it on for the files that matter and leave the rest alone.',
      columns: 2,
      items: [
        {
          title: 'Version history',
          description:
            'Every overwrite keeps the copy it replaced, addressed by its own version id.',
        },
        {
          title: 'Archive instead of delete',
          description:
            'A deleted file leaves the bucket listing but stays recoverable until you remove it for good.',
        },
        {
          title: 'Restore',
          description: 'Put back an archived file, or roll a live one back to an earlier version.',
        },
        {
          title: 'Lifecycle policies',
          description:
            'Expire old versions by age, or keep a set number per file. Retained versions stay billable until they expire.',
        },
      ],
    },
    {
      type: 'form',
      id: 'form',
      title: 'Request access',
      description:
        'Tell us what you store and we will get in touch as places open up. The alpha is limited while we work through feedback.',
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
          name: 'email',
          label: 'Email Address',
          placeholder: 'Work email',
          required: true,
        },
        {
          type: 'text',
          name: 'company_name',
          label: 'Company Name',
          placeholder: 'Company name',
          required: true,
        },
        {
          type: 'text',
          name: 'supabase_org_name',
          label: 'Supabase Organization Name',
          placeholder: 'Organization name (if applicable)',
          required: false,
        },
      ],
      submitLabel: 'Request access',
      successMessage: "Thanks. We'll be in touch when a place opens up.",
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          // TODO(storage-versioning): replace with the real HubSpot form GUID before launch.
          // The all-zero placeholder keeps the schema valid and makes HubSpot reject the
          // submission, rather than quietly filing signups against another team's form.
          formGuid: '00000000-0000-0000-0000-000000000000',
          fieldMap: {
            first_name: 'firstname',
            last_name: 'lastname',
            email: 'email',
            company_name: 'company',
            supabase_org_name: 'what_is_your_supabase_org_slug',
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
      },
    },
  ],
}

export default page
