import type { FederatedContentSource } from '../types'

// We fetch these docs at build time from an external repo
const ci: FederatedContentSource = {
  section: 'deployment/ci',
  org: 'supabase',
  repo: 'setup-cli',
  branch: 'gh-pages',
  docsDir: 'docs',
  externalSite: 'https://supabase.github.io/setup-cli',
  pageMap: [
    {
      slug: 'generating-types',
      meta: {
        title: 'Generate types using GitHub Actions',
        description: 'End-to-end type safety across client, server, and database.',
        subtitle: 'End-to-end type safety across client, server, and database.',
        tocVideo: 'VSNgAIObBdw',
      },
      remoteFile: 'generating-types.md',
      dropLeadingHeading: true,
    },
    {
      slug: 'testing',
      meta: {
        title: 'Automated testing using GitHub Actions',
        description: 'Run your tests when you or your team make changes.',
        subtitle: 'Run your tests when you or your team make changes.',
      },
      remoteFile: 'testing.md',
      dropLeadingHeading: true,
    },
    {
      slug: 'backups',
      meta: {
        title: 'Automated backups using GitHub Actions',
        description: 'Backup your database on a regular basis.',
        subtitle: 'Backup your database on a regular basis.',
      },
      remoteFile: 'backups.md',
      dropLeadingHeading: true,
    },
  ],
}

export default ci
