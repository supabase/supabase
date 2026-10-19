import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'storage-object-versioning-early-access',
  metadata: {
    title: 'Object Versioning and Lifecycle Policies - Request access',
    description:
      'Request access to the Object Versioning and Lifecycle Policies private alpha for Supabase Storage. Keep every version of a file and expire old ones.',
  },
  hero: {
    title: 'Storage Object Versioning and Lifecycle Policies',
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
        'Versioning is enabled per bucket, so you can turn it on for the files that matter and leave the rest alone.',
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
          type: 'email',
          name: 'email',
          label: 'Email address',
          placeholder: 'Work email',
          required: true,
        },
        {
          type: 'text',
          name: 'project_ref',
          label: 'Supabase project ref',
          placeholder: 'abcdefghijklmnopqrst',
          description:
            'Use the ref from your Supabase dashboard URL, for example /project/abcdefghijklmnopqrst.',
          required: true,
        },
      ],
      submitLabel: 'Request access',
      successRedirect: '/go/storage-object-versioning-early-access/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy) and that my use of the Storage Object Versioning and Lifecycle Policies private alpha is a Beta Release, as defined in the Terms of Service, and is subject to the [Terms of Service](https://supabase.com/terms#c-beta-releases).',
      crm: {
        hubspot: {
          // TODO(storage-versioning): replace with the real HubSpot form GUID before launch.
          // The all-zero placeholder keeps the schema valid and makes HubSpot reject the
          // submission, rather than quietly filing signups against another team's form.
          formGuid: '00000000-0000-0000-0000-000000000000',
          fieldMap: {
            email: 'email',
            // TODO(storage-versioning): set the HubSpot property name for the project ref.
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
      },
    },
  ],
}

export default page
