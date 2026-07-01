'use client'

import Link from 'next/link'
import { useMemo, type ReactNode } from 'react'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { GlassPanel } from 'ui-patterns/GlassPanel'

import { useCommunityDocsSearch } from '@/components/CommunityDocsSearchProvider.client'
import { SupabaseMark } from '@/components/TopNav'
import {
  clientLibraries,
  clientLibraryFeatures,
  getGitHubResourceUrl,
  selfHostedProjects,
  utilityGroups,
} from '@/lib/community-resources'
import type { CommunityDocSection, CommunityDocSummary } from '@/lib/content'

type AreaIconProps = {
  className?: string
}

type ResourceSlugByName = Map<string, string>

const languageColorByName: Record<string, string> = {
  JavaScript: 'bg-yellow-500',
  TypeScript: 'bg-blue-500',
  Rust: 'bg-orange-700',
  Go: 'bg-cyan-500',
  Swift: 'bg-orange-500',
  Kotlin: 'bg-purple-500',
  Python: 'bg-blue-400',
  PHP: 'bg-indigo-400',
  Ruby: 'bg-red-500',
  Vue: 'bg-emerald-500',
  Svelte: 'bg-orange-600',
}

const areas = [
  {
    label: 'Database',
    icon: 'database',
    description: 'Community guides and examples for Postgres, schemas, and data workflows.',
  },
  {
    label: 'Auth',
    icon: 'auth',
    description: 'Sign-in, sessions, and identity integrations from the community.',
  },
  {
    label: 'Storage',
    icon: 'storage',
    description: 'Uploads, buckets, and file-serving examples.',
  },
  {
    label: 'Realtime',
    icon: 'realtime',
    description: 'Live updates, channels, and presence.',
  },
  {
    label: 'Edge Functions',
    icon: 'edge-functions',
    description: 'Serverless and edge deploy patterns from the community.',
  },
  {
    label: 'Other',
    icon: 'other',
    description: 'Cross-cutting or mixed-area community contributions.',
  },
] as const

const getAreaIcon = (label: string) => areas.find((area) => area.label === label)?.icon ?? 'other'

const featuredSections = [
  {
    label: 'Client Libraries',
    description: 'Browse clients by language.',
    href: '#client-libraries',
  },
  {
    label: 'Self-hosted',
    description: 'Deploy Supabase yourself.',
    href: '#self-hosted',
  },
  {
    label: 'Utilities',
    description: 'Find community tools and examples.',
    href: '#utilities',
  },
] as const

const mutedHeadingClassName = 'text-xl font-medium tracking-[-0.03em] text-foreground-light'

function getAreaId(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatCount(value: number) {
  if (value >= 1000) {
    return `${Number.parseFloat((value / 1000).toFixed(1))}k`
  }

  return value.toString()
}

const IconAreaDatabase = ({ className }: AreaIconProps) => (
  <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.5 2.99915C2.5 2.17072 3.17157 1.49915 4 1.49915H12C12.8284 1.49915 13.5 2.17072 13.5 2.99915V4.99915C13.5 5.53212 13.222 6.00017 12.8032 6.26623V9.73377C13.222 9.99983 13.5 10.4679 13.5 11.0009V13.0009C13.5 13.8293 12.8284 14.5009 12 14.5009H4C3.17157 14.5009 2.5 13.8293 2.5 13.0009V11.0009C2.5 10.4615 2.78461 9.98872 3.21183 9.72437V6.27563C2.78461 6.01128 2.5 5.53845 2.5 4.99915V2.99915ZM12.0158 5.4989H3.98422C3.71538 5.49057 3.5 5.27001 3.5 4.99915V2.99915C3.5 2.723 3.72386 2.49915 4 2.49915H12C12.2761 2.49915 12.5 2.723 12.5 2.99915V4.99915C12.5 5.27001 12.2846 5.49057 12.0158 5.4989ZM4.21183 6.49915V9.4989H11.8032V6.49915H4.21183ZM4 10.5009C3.72386 10.5009 3.5 10.7247 3.5 11.0009V13.0009C3.5 13.277 3.72386 13.5009 4 13.5009H12C12.2761 13.5009 12.5 13.277 12.5 13.0009V11.0009C12.5 10.7247 12.2761 10.5009 12 10.5009H4Z"
      fill="currentColor"
    />
  </svg>
)

const IconAreaAuth = ({ className }: AreaIconProps) => (
  <svg className={className} viewBox="0 0 16 16" width={16} height={16} fill="none">
    <path
      d="M3.49414 9.97461H8.49414M3.49414 9.97461V11.9746H8.49414V9.97461M3.49414 9.97461V7.97461H8.49414V9.97461M10 5V3C10 1.89543 9.10457 1 8 1C6.89543 1 6 1.89543 6 3V5M3.47266 7L3.47266 12C3.47266 13.1046 4.36809 14 5.47266 14H10.4727C11.5772 14 12.4727 13.1046 12.4727 12V7C12.4727 5.89543 11.5772 5 10.4727 5L5.47266 5C4.36809 5 3.47266 5.89543 3.47266 7Z"
      stroke="currentColor"
      strokeMiterlimit="10"
      strokeLinejoin="bevel"
    />
  </svg>
)

const IconAreaStorage = ({ className }: AreaIconProps) => (
  <svg className={className} viewBox="0 0 16 16" width={16} height={16} fill="none">
    <path
      d="M12.9997 7.50869V5.60119L9.38151 2.00024H3.99967C3.44739 2.00024 2.99967 2.44796 2.99967 3.00024V5.99976M12.9645 5.58447L9.38004 2L9.38004 4.58447C9.38004 5.13676 9.82776 5.58447 10.38 5.58447L12.9645 5.58447ZM4.44135 5.99976H2.97363C2.42135 5.99976 1.97363 6.44747 1.97363 6.99976V11.9998C1.97363 13.1043 2.86906 13.9998 3.97363 13.9998H11.9736C13.0782 13.9998 13.9736 13.1043 13.9736 11.9998V8.50869C13.9736 7.95641 13.5259 7.50869 12.9736 7.50869H6.79396C6.53157 7.50869 6.27968 7.40556 6.09263 7.22153L5.14268 6.28692C4.95563 6.10289 4.70375 5.99976 4.44135 5.99976Z"
      stroke="currentColor"
      strokeMiterlimit="10"
      strokeLinejoin="bevel"
    />
  </svg>
)

const IconAreaRealtime = ({ className }: AreaIconProps) => (
  <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.85669 1.07837C6.13284 1.07837 6.35669 1.30223 6.35669 1.57837V4.07172C6.35669 4.34786 6.13284 4.57172 5.85669 4.57172C5.58055 4.57172 5.35669 4.34786 5.35669 4.07172V1.57837C5.35669 1.30223 5.58055 1.07837 5.85669 1.07837ZM1.51143 1.51679C1.70961 1.32449 2.02615 1.32925 2.21845 1.52743L4.3494 3.72353C4.5417 3.9217 4.53694 4.23825 4.33876 4.43055C4.14058 4.62285 3.82403 4.61809 3.63173 4.41991L1.50078 2.22381C1.30848 2.02564 1.31325 1.70909 1.51143 1.51679ZM5.10709 6.49114C4.74216 5.65659 5.59204 4.80844 6.42584 5.17508L14.3557 8.66199C15.2287 9.04582 15.1201 10.3175 14.1948 10.5478L11.1563 11.3041L10.4159 14.1716C10.1783 15.0916 8.91212 15.1928 8.53142 14.3222L5.10709 6.49114ZM13.9532 9.5774L6.02332 6.09049L9.44766 13.9216L10.2625 10.7658C10.3083 10.5882 10.4478 10.4499 10.6258 10.4056L13.9532 9.5774ZM1.04663 5.79688C1.04663 5.52073 1.27049 5.29688 1.54663 5.29688H3.99057C4.26671 5.29688 4.49057 5.52073 4.49057 5.79688C4.49057 6.07302 4.26671 6.29688 3.99057 6.29688H1.54663C1.27049 6.29688 1.04663 6.07302 1.04663 5.79688Z"
      fill="currentColor"
    />
  </svg>
)

const IconAreaEdgeFunctions = ({ className }: AreaIconProps) => (
  <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.62624 10.8978C1.22391 10.0142 1 9.03261 1 8C1 4.13401 4.13401 1 8 1C9.03686 1 10.0223 1.22575 10.9087 1.63122C11.2997 1.37784 11.766 1.23071 12.2665 1.23071C13.6473 1.23071 14.7665 2.35 14.7665 3.73071C14.7665 4.23073 14.6197 4.69646 14.3669 5.08716C14.7736 5.97467 15 6.96155 15 8C15 11.866 11.866 15 8 15C6.94896 15 5.95081 14.768 5.05508 14.3521C4.67477 14.5858 4.22715 14.7206 3.74805 14.7206C2.36733 14.7206 1.24805 13.6013 1.24805 12.2206C1.24805 11.7349 1.38656 11.2815 1.62624 10.8978ZM2 8C2 4.68629 4.68629 2 8 2C8.75898 2 9.48416 2.14069 10.1515 2.39715C9.90768 2.7831 9.76654 3.24042 9.76654 3.73071C9.76654 3.77457 9.76768 3.81815 9.76991 3.86145C9.22664 3.6288 8.62833 3.5 7.99994 3.5C5.51466 3.5 3.49994 5.51472 3.49994 8C3.49994 8.61006 3.62134 9.19177 3.8413 9.72228C3.81035 9.72115 3.77927 9.72058 3.74805 9.72058C3.24584 9.72058 2.77822 9.86866 2.38647 10.1235C2.13679 9.46389 2 8.74838 2 8ZM5.83493 13.5976C6.50608 13.8574 7.23593 14 8 14C11.3137 14 14 11.3137 14 8C14 7.23965 13.8588 6.51324 13.6015 5.84486C13.2152 6.08924 12.7574 6.23071 12.2665 6.23071C12.2232 6.23071 12.1802 6.22961 12.1374 6.22743C12.3707 6.77139 12.4999 7.3706 12.4999 8C12.4999 10.4853 10.4852 12.5 7.99994 12.5C7.37809 12.5 6.78569 12.3739 6.24695 12.1458C6.24768 12.1706 6.24805 12.1956 6.24805 12.2206C6.24805 12.7294 6.09603 13.2027 5.83493 13.5976ZM10.7665 3.73071C10.7665 2.90229 11.4381 2.23071 12.2665 2.23071C13.095 2.23071 13.7665 2.90229 13.7665 3.73071C13.7665 4.55914 13.095 5.23071 12.2665 5.23071C11.4381 5.23071 10.7665 4.55914 10.7665 3.73071ZM5.40407 10.3477C5.48532 10.4196 5.56185 10.4967 5.63315 10.5785C6.25623 11.1507 7.08729 11.5 7.99994 11.5C9.93294 11.5 11.4999 9.933 11.4999 8C11.4999 6.067 9.93294 4.5 7.99994 4.5C6.06695 4.5 4.49994 6.067 4.49994 8C4.49994 8.90336 4.84218 9.72678 5.40407 10.3477ZM3.74805 10.7206C4.11285 10.7206 4.44724 10.8508 4.70725 11.0673C4.77215 11.1369 4.83923 11.2045 4.90838 11.2699C5.12065 11.5287 5.24805 11.8598 5.24805 12.2206C5.24805 13.049 4.57647 13.7206 3.74805 13.7206C2.91962 13.7206 2.24805 13.049 2.24805 12.2206C2.24805 11.3921 2.91962 10.7206 3.74805 10.7206Z"
      fill="currentColor"
    />
  </svg>
)

const IconAreaOther = ({ className }: AreaIconProps) => (
  <svg className={className} width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path
      d="M3.5 8H3.51M8 8H8.01M12.5 8H12.51M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function AreaIcon({ icon }: { icon: (typeof areas)[number]['icon'] }) {
  const className = 'h-4 w-4'

  switch (icon) {
    case 'database':
      return <IconAreaDatabase className={className} />
    case 'auth':
      return <IconAreaAuth className={className} />
    case 'storage':
      return <IconAreaStorage className={className} />
    case 'realtime':
      return <IconAreaRealtime className={className} />
    case 'edge-functions':
      return <IconAreaEdgeFunctions className={className} />
    case 'other':
      return <IconAreaOther className={className} />
  }
}

const FeaturedSectionsNav = () => (
  <nav aria-labelledby="community-docs-featured-sections-heading">
    <div className="mb-5 space-y-1.5">
      <h2 id="community-docs-featured-sections-heading" className={mutedHeadingClassName}>
        Community resources
      </h2>
      <p className="text-sm text-foreground-lighter">Jump to curated community resources.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      {featuredSections.map((section) => (
        <Link key={section.href} href={section.href} passHref className="block h-full">
          <GlassPanel title={section.label}>{section.description}</GlassPanel>
        </Link>
      ))}
    </div>
  </nav>
)

const AreasNav = () => (
  <nav className="pt-8" aria-labelledby="community-docs-areas-heading">
    <div className="mb-5 space-y-1.5">
      <h2 id="community-docs-areas-heading" className={mutedHeadingClassName}>
        Areas
      </h2>
      <p className="text-sm text-foreground-lighter">Browse community contributions by area.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {areas.map((area) => (
        <a key={area.label} className="block h-full" href={`#${getAreaId(area.label)}`}>
          <GlassPanel title={area.label} icon={<AreaIcon icon={area.icon} />} showIconBg>
            {area.description}
          </GlassPanel>
        </a>
      ))}
    </div>
  </nav>
)

const CommunityDocCard = ({ page }: { page: CommunityDocSummary }) => (
  <Link className="group block h-full" href={`/${page.slug}`}>
    <Card className="h-full transition-colors group-hover:border-overlay-hover">
      <CardHeader>
        <CardTitle className="text-sm normal-case tracking-normal text-brand">
          {page.frontmatter.title}
        </CardTitle>
        <CardDescription>{page.frontmatter.description}</CardDescription>
      </CardHeader>
      {page.frontmatter.tags.length > 0 && (
        <CardContent className="flex flex-wrap gap-2 border-none">
          {page.frontmatter.tags.map((tag) => (
            <Badge key={tag} className={cn('normal-case tracking-normal')}>
              {tag}
            </Badge>
          ))}
        </CardContent>
      )}
    </Card>
  </Link>
)

const PopularCard = ({
  pages,
  className,
}: {
  pages: CommunityDocSummary[]
  className?: string
}) => {
  if (pages.length === 0) return null

  return (
    <aside
      className={cn('rounded-xl border bg-surface-75 p-4 shadow-sm md:p-5 lg:mt-5', className)}
    >
      <div className="mb-5 space-y-1.5">
        <h2 className={mutedHeadingClassName}>Popular</h2>
        <p className="text-sm text-foreground-lighter">
          Start with highlighted community projects.
        </p>
      </div>

      <div className="grid gap-3">
        {pages.map((page) => (
          <Link
            key={page.slug}
            className="block rounded-lg border bg-surface-100 p-4 transition-colors hover:border-overlay-hover"
            href={`/${page.slug}`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium text-brand">{page.frontmatter.repo}</h3>
              <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-foreground-light">
                {page.frontmatter.isTemplate ? 'Public template' : 'Public'}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-foreground-lighter">
              {page.frontmatter.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-foreground-lighter">
              {page.frontmatter.language && (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      'h-3 w-3 rounded-full',
                      languageColorByName[page.frontmatter.language] ?? 'bg-foreground-muted'
                    )}
                  />
                  {page.frontmatter.language}
                </span>
              )}
              <span>☆ {formatCount(page.frontmatter.stars)}</span>
              <span>⑂ {formatCount(page.frontmatter.forks)}</span>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  )
}

const SectionDivider = () => <hr className="mb-16 mt-8 border-overlay" />

const SectionHeader = ({
  title,
  description,
  withDivider = false,
}: {
  title: string
  description: string
  withDivider?: boolean
}) => (
  <div className={cn(withDivider && 'space-y-4')}>
    {withDivider && <SectionDivider />}
    <div>
      <h2 className={mutedHeadingClassName}>{title}</h2>
      <p className="text-sm text-foreground-lighter">{description}</p>
    </div>
  </div>
)

const ResourceLink = ({
  children,
  className,
  name,
  resourceSlugByName,
}: {
  children: ReactNode
  className: string
  name: string
  resourceSlugByName: ResourceSlugByName
}) => {
  const slug = resourceSlugByName.get(name)

  if (slug) {
    return (
      <Link className={className} href={`/${slug}`}>
        {children}
      </Link>
    )
  }

  return (
    <a className={className} href={getGitHubResourceUrl(name)} rel="noreferrer" target="_blank">
      {children}
    </a>
  )
}

const ClientLibraryLink = ({
  name,
  resourceSlugByName,
}: {
  name: string | null
  resourceSlugByName: ResourceSlugByName
}) => {
  if (name === null) {
    return <span className="text-foreground-muted">Not listed</span>
  }

  return (
    <ResourceLink
      className="font-medium text-brand transition-colors hover:text-brand-600"
      name={name}
      resourceSlugByName={resourceSlugByName}
    >
      {name}
    </ResourceLink>
  )
}

const ClientLibrariesSection = ({
  resourceSlugByName,
}: {
  resourceSlugByName: ResourceSlugByName
}) => (
  <section id="client-libraries" className="scroll-mt-8 space-y-4 lg:scroll-mt-12">
    <SectionHeader
      title="Client Libraries"
      description="Select a language to see the Supabase client and feature clients from the community GitHub profile."
      withDivider
    />

    <Tabs defaultValue={clientLibraries[0].language} className="overflow-hidden rounded-xl border">
      <TabsList className="gap-5 overflow-x-auto border-0 border-b bg-surface-75 px-5">
        {clientLibraries.map((clientLibrary) => (
          <TabsTrigger
            key={clientLibrary.language}
            value={clientLibrary.language}
            className="px-0 py-2.5 text-xs data-[state=active]:bg-transparent"
          >
            {clientLibrary.language}
          </TabsTrigger>
        ))}
      </TabsList>

      {clientLibraries.map((clientLibrary) => (
        <TabsContent
          key={clientLibrary.language}
          value={clientLibrary.language}
          className="m-0 bg-surface-75 p-5 data-[state=inactive]:hidden"
          forceMount
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-medium tracking-[-0.03em] text-foreground">
                {clientLibrary.language}
              </h3>
              <p className="text-sm text-foreground-lighter">
                Libraries listed in the GitHub Client Libraries table.
              </p>
            </div>
            <span className="rounded-full border px-2 py-0.5 text-xs text-foreground-light">
              {clientLibrary.group}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {clientLibraryFeatures.map((feature) => (
              <div key={feature} className="rounded-lg border bg-surface-100 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-lighter">
                  {feature}
                </p>
                <p className="mt-1 text-sm">
                  <ClientLibraryLink
                    name={clientLibrary.libraries[feature]}
                    resourceSlugByName={resourceSlugByName}
                  />
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  </section>
)

const SelfHostedSection = ({ resourceSlugByName }: { resourceSlugByName: ResourceSlugByName }) => (
  <section id="self-hosted" className="scroll-mt-8 space-y-4 lg:scroll-mt-12">
    <SectionHeader
      title="Self-hosted"
      description="Community repositories for running Supabase in your own infrastructure."
    />

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {selfHostedProjects.map((project) => (
        <ResourceLink
          key={project.name}
          className="block h-full"
          name={project.name}
          resourceSlugByName={resourceSlugByName}
        >
          <GlassPanel
            title={project.name}
            icon={<SelfHostedProjectLogo logo={project.logo} />}
            showIconBg
          >
            {project.description}
          </GlassPanel>
        </ResourceLink>
      ))}
    </div>
  </section>
)

const SelfHostedProjectLogo = ({ logo }: { logo: (typeof selfHostedProjects)[number]['logo'] }) => {
  return (
    <span
      aria-label={logo.alt}
      className="h-4 w-4 shrink-0 bg-current"
      role="img"
      style={{
        WebkitMask: `url(${logo.src}) center / contain no-repeat`,
        backgroundColor: logo.color,
        mask: `url(${logo.src}) center / contain no-repeat`,
      }}
    />
  )
}

const UtilitiesSection = ({ resourceSlugByName }: { resourceSlugByName: ResourceSlugByName }) => (
  <section id="utilities" className="scroll-mt-8 space-y-4 lg:scroll-mt-12">
    <SectionHeader
      title="Utilities"
      description="Community utility projects grouped by the headings from the GitHub profile."
    />

    <div className="grid gap-4 md:grid-cols-2 md:items-start">
      {[0, 1].map((columnIndex) => (
        <div key={columnIndex} className="grid gap-4">
          {utilityGroups
            .filter((_, index) => index % 2 === columnIndex)
            .map((group) => (
              <div key={group.heading} className="rounded-lg border bg-surface-75 p-4">
                <h3 className="text-sm font-medium text-foreground">{group.heading}</h3>
                <div className="mt-3 grid gap-3">
                  {group.items.map((item) => (
                    <ResourceLink
                      key={item.name}
                      className="block h-full"
                      name={item.name}
                      resourceSlugByName={resourceSlugByName}
                    >
                      <GlassPanel title={item.name}>{item.description ?? ''}</GlassPanel>
                    </ResourceLink>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  </section>
)

const CommunityDocsHome = ({ sections }: { sections: CommunityDocSection[] }) => {
  const { query } = useCommunityDocsSearch()
  const resourceSlugByName = useMemo(() => {
    const entries = sections.flatMap((section) =>
      section.pages.flatMap((page) => [
        [page.frontmatter.repo, page.slug] as const,
        [page.slug, page.slug] as const,
      ])
    )

    return new Map(entries)
  }, [sections])

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return sections

    return sections
      .map((section) => ({
        ...section,
        pages: section.pages.filter((page) => {
          const { tags, title } = page.frontmatter

          return (
            title.toLowerCase().includes(normalizedQuery) ||
            tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
          )
        }),
      }))
      .filter((section) => section.pages.length > 0)
  }, [query, sections])

  const filteredPages = filteredSections.flatMap((section) => section.pages)
  const popularPages = [...filteredPages]
    .sort(
      (a, b) =>
        b.frontmatter.stars - a.frontmatter.stars ||
        b.frontmatter.forks - a.frontmatter.forks ||
        a.frontmatter.repo.localeCompare(b.frontmatter.repo)
    )
    .slice(0, 6)
  const resultCount = filteredSections.reduce((count, section) => count + section.pages.length, 0)
  const totalGuideCount = sections.reduce((count, section) => count + section.pages.length, 0)

  return (
    <div>
      <div className="grid gap-x-8 gap-y-3 pb-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-16 lg:pb-0">
        <div className="pt-6 lg:col-span-full lg:row-start-1 lg:pt-10">
          <div className="max-w-2xl space-y-4">
            <h1 className="flex items-center gap-3 text-3xl font-medium tracking-[-0.04em] text-foreground md:text-4xl">
              <SupabaseMark className="h-8 w-8 text-foreground-lighter md:h-9 md:w-9" />
              <span>Supabase Community Docs</span>
            </h1>
            <p className="text-xl text-foreground-light">
              Community-built integrations, examples, and getting-started guides.
            </p>
          </div>
          <div className="relative left-1/2 mb-[2.75rem] mt-[2.5rem] h-px w-screen -translate-x-1/2 bg-overlay" />
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:-mt-12">
          <FeaturedSectionsNav />
        </div>

        <div className="max-w-2xl lg:col-start-1 lg:row-start-3 lg:-mt-12">
          <AreasNav />
          {sections.length > 0 && (
            <p className="mt-8 text-sm italic text-foreground-lighter">
              Showing {resultCount} of {totalGuideCount} guides
            </p>
          )}
        </div>

        <PopularCard
          className="relative z-10 lg:col-start-2 lg:row-span-3 lg:row-start-1"
          pages={popularPages}
        />
      </div>

      {filteredSections.length === 0 ? (
        <Card>
          <CardContent className="border-none py-8">
            <p className="text-sm text-foreground-light">
              {sections.length === 0
                ? 'No community docs have been generated yet. Run the content pipeline to create MDX files.'
                : `No community docs match "${query}".`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12 pt-6 lg:pt-0">
          <ClientLibrariesSection resourceSlugByName={resourceSlugByName} />
          <SelfHostedSection resourceSlugByName={resourceSlugByName} />
          <UtilitiesSection resourceSlugByName={resourceSlugByName} />

          {filteredSections.map((section) => (
            <section
              id={getAreaId(section.category)}
              key={section.category}
              className="scroll-mt-8 space-y-4 lg:scroll-mt-12"
            >
              <SectionDivider />
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <h2 className={cn('flex items-center gap-3', mutedHeadingClassName)}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border bg-surface-100 text-brand">
                      <AreaIcon icon={getAreaIcon(section.category)} />
                    </span>
                    {section.category}
                  </h2>
                  <p className="text-sm text-foreground-lighter">
                    {section.pages.length} {section.pages.length === 1 ? 'guide' : 'guides'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {section.pages.map((page) => (
                  <CommunityDocCard key={page.slug} page={page} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export { CommunityDocsHome }
