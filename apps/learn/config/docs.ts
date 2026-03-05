import { SidebarNavGroup } from 'types/nav'

export const courses: SidebarNavGroup = {
  title: 'Courses',
  items: [
    {
      title: 'Foundations',
      href: '/foundations',
      items: [
        {
          title: 'Introduction',
          href: '/foundations/introduction',
        },
        {
          title: 'Platform Architecture',
          items: [
            {
              title: 'Supabase Architecture',
              href: '/foundations/supabase-architecture',
            },
            {
              title: 'When to Choose Supabase',
              href: '/foundations/when-to-choose-supabase',
            },
            {
              title: 'Project Setup and Configuration',
              href: '/foundations/project-setup-and-configuration',
            },
            {
              title: 'Local Development Workflow',
              href: '/foundations/local-development-workflow',
            },
          ],
        },
        {
          title: 'Database Design & Postgres',
          items: [
            {
              title: 'Schema Design for Supabase',
              href: '/foundations/schema-design-for-supabase',
            },
            {
              title: 'Essential Postgres Data Types',
              href: '/foundations/essential-postgres-data-types',
            },
            {
              title: 'Database Functions and Triggers',
              href: '/foundations/database-functions-and-triggers',
            },
            {
              title: 'Key Postgres Extensions',
              href: '/foundations/key-postgres-extensions',
            },
            {
              title: 'Migrations and Version Control',
              href: '/foundations/migrations-and-version-control',
            },
            {
              title: 'Replication',
              href: '/foundations/replication',
            },
          ],
        },
        {
          title: 'Authentication & Users',
          items: [
            {
              title: 'Authentication Fundamentals',
              href: '/foundations/authentication-fundamentals',
            },
            {
              title: 'Authentication Methods',
              href: '/foundations/authentication-methods',
            },
            {
              title: 'Advanced Authentication',
              href: '/foundations/advanced-authentication',
            },
            {
              title: 'User Management',
              href: '/foundations/user-management',
            },
            {
              title: 'Security Considerations',
              href: '/foundations/security-considerations',
            },
          ],
        },
        {
          title: 'Row Level Security',
          items: [
            {
              title: 'RLS Fundamentals',
              href: '/foundations/rls-fundamentals',
            },
            {
              title: 'RLS Patterns',
              href: '/foundations/policy-patterns',
            },
          ],
        },
        {
          title: 'Storage',
          items: [
            {
              title: 'Storage Architecture',
              href: '/foundations/storage-architecture',
            },
            {
              title: 'Access Control',
              href: '/foundations/access-control',
            },
            {
              title: 'File Operations',
              href: '/foundations/file-operations',
            },
            {
              title: 'Image Transformations',
              href: '/foundations/image-transformations',
            },
            {
              title: 'Integration Patterns',
              href: '/foundations/integration-patterns',
            },
          ],
        },
        {
          title: 'Realtime',
          items: [
            {
              title: 'Realtime Architecture',
              href: '/foundations/realtime-architecture',
            },
            {
              title: 'Database Changes',
              href: '/foundations/database-changes',
            },
            {
              title: 'Broadcast',
              href: '/foundations/broadcast',
            },
            {
              title: 'Presence',
              href: '/foundations/presence',
            },
            {
              title: 'Real-World Patterns',
              href: '/foundations/real-world-patterns',
            },
          ],
        },
        {
          title: 'Edge Functions',
          items: [
            {
              title: 'Edge Functions Fundamentals',
              href: '/foundations/edge-functions-architecture',
            },
            {
              title: 'Edge Functions Patterns',
              href: '/foundations/common-patterns',
            },
            {
              title: 'Integrate AI Services',
              href: '/foundations/ai-and-llm-integration',
            },
          ],
        },
        {
          title: 'Search and Embeddings',
          items: [
            {
              title: 'Embeddings and Vector Search',
              href: '/foundations/vector-fundamentals',
            },
            {
              title: 'Building a RAG Pipeline',
              href: '/foundations/rag-implementation',
            },
          ],
        },
        {
          title: 'Production Readiness',
          items: [
            {
              title: 'Performance Optimization',
              href: '/foundations/performance-optimization',
            },
            {
              title: 'Monitoring & Observability',
              href: '/foundations/monitoring-and-observability',
            },
            {
              title: 'Security Hardening',
              href: '/foundations/security-hardening',
            },
            {
              title: 'Backup and Recovery',
              href: '/foundations/backup-and-recovery',
            },
            {
              title: 'Deployment Patterns',
              href: '/foundations/deployment-patterns',
            },
            {
              title: 'Client Considerations',
              href: '/foundations/client-considerations',
            },
          ],
        },
      ],
      commandItemLabel: 'Foundations',
    },
  ],
}

// Recursively extract all items with hrefs for command palette
function extractCommandItems(
  items: any[],
  parentLabel?: string
): { label: string; href: string }[] {
  const result: { label: string; href: string }[] = []

  items.forEach((item) => {
    if (item.href) {
      const label = parentLabel ? `${parentLabel}: ${item.title}` : item.title
      result.push({ label, href: item.href })
    }

    if (item.items && item.items.length > 0) {
      const childLabel = item.commandItemLabel || item.title
      result.push(...extractCommandItems(item.items, childLabel))
    }
  })

  return result
}

export const COMMAND_ITEMS = extractCommandItems(courses.items)
