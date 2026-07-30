import type { FederatedContentSource } from '../types'

// We fetch these docs at build time from an external repo
const terraform: FederatedContentSource = {
  section: 'deployment/terraform',
  org: 'supabase',
  repo: 'terraform-provider-supabase',
  branch: 'v1.1.3',
  docsDir: 'docs',
  externalSite: 'https://github.com/supabase/terraform-provider-supabase/blob/v1.1.3',
  rawFallback: true,
  pageMap: [
    {
      meta: {
        title: 'Terraform Provider',
      },
      remoteFile: 'README.md',
      useRoot: true,
      dropLeadingHeading: true,
    },
    {
      slug: 'tutorial',
      meta: {
        title: 'Using the Supabase Terraform Provider',
      },
      remoteFile: 'tutorial.md',
    },
  ],
  rawFiles: [{ remoteFile: 'schema.json', outFile: 'terraform.schema.json' }],
}

export default terraform
