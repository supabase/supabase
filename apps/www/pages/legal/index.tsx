import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import PageHeader from '~/components/Sections/PageHeader'
import { FileText, List } from 'lucide-react'
import { NextSeo } from 'next-seo'
import Link from 'next/link'

const sections = [
  {
    id: 'customer-legal-resources',
    title: 'Customer Legal Resources',
    links: [
      {
        label: 'Terms of Service',
        href: '/terms',
        type: 'document' as const,
      },
      {
        label: 'Support Policy',
        href: '/support-policy',
        type: 'document' as const,
      },
      {
        label: 'Service Level Agreement',
        href: '/sla',
        type: 'document' as const,
      },
    ],
  },
  {
    id: 'partner-legal-resources',
    title: 'Partner Legal Resources',
    links: [
      {
        label: 'Master Partner Program Agreement',
        href: '/legal/partner-resources/master-partner-program-agreement',
        type: 'document' as const,
      },
      {
        label: 'Program Addenda',
        href: '/legal/partner-resources/program-addenda',
        type: 'index' as const,
      },
    ],
  },
]

const linkIcons = {
  document: FileText,
  index: List,
}

export default function LegalHubPage() {
  return (
    <DefaultLayout>
      <NextSeo title="Legal Hub" description="Supabase legal documents and resources." />
      <PageHeader
        h1="Legal Hub"
        subheader="Legal documents and resources for Supabase customers and partners."
      />
      <SectionContainer className="prose">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {sections.map((section) => (
            <section key={section.title} id={section.id} className="scroll-mt-24">
              <h2 className="mt-0">{section.title}</h2>
              <div className="divide-y divide-border">
                {section.links.map((link) => {
                  const Icon = linkIcons[link.type]
                  return (
                    <div key={link.href} className="flex items-center gap-3 py-4">
                      <Icon size={15} className="shrink-0 text-foreground-muted" />
                      <Link
                        href={link.href}
                        className="text-foreground-light transition-colors hover:text-foreground hover:underline"
                      >
                        {link.label}
                      </Link>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </SectionContainer>
    </DefaultLayout>
  )
}
