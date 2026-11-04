import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefVersionDropdown from '~/components/RefVersionDropdown'
import { GuideTocMenu, TocAnchorsProvider } from '~/features/docs/GuidesMdx.client'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import { components as mdxComponents } from '~/features/docs/MdxBase.shared'
import {
  cliMarkdownUrl,
  cliPageDescription,
  cliPageRel,
  cliPageTitle,
  cliRelatedCommands,
  getCliMdxPage,
  getCliModel,
  getCliVersionHrefs,
  resolveCliPage,
  type CliModel,
  type CliPage,
} from '~/features/docs/Reference.cli'
import {
  CliNavigationLinks,
  CliPageAside,
  CliReveal,
  type CliNavGroup,
} from '~/features/docs/Reference.cli.client'
import {
  CLI_GLOBAL_FLAGS_SLUG,
  CLI_MIGRATION_GUIDE_SLUG,
  cliCommandName,
  cliCommandRel,
  cliMigrationGuideHref,
  cliPageHref,
  describeFlag,
  LATEST_CLI_VERSION,
  psqlTable,
  psqlTables,
  restatesSummary,
  sentence,
  shortLabel,
} from '~/features/docs/Reference.cli.utils'
import { CodeBlock } from '~/features/ui/CodeBlock/CodeBlock'
import type { CliCommand, CliFlag } from '~/generator/types/CliSpec'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import { PageTitleObserver } from '~/layouts/MobileHeaderSlots'
import { BASE_PATH } from '~/lib/constants'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { type ComponentProps, type PropsWithChildren, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge, cn, Heading } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

export async function CliReferencePage({ version, path }: { version: string; path: string[] }) {
  const page = await resolveCliPage(version, path)
  if (!page) notFound()

  const model = await getCliModel(version)
  const rel = cliPageRel(page)
  const versionHrefs = await getCliVersionHrefs(rel)
  const markdownPath = `${cliPageHref(version, rel)}.md`

  return (
    <SidebarSkeleton
      menuId={MenuId.RefCli}
      NavigationMenu={
        <CliNavigation
          model={model}
          activeHref={cliPageHref(version, rel)}
          versionHrefs={versionHrefs}
        />
      }
    >
      <LayoutMainContent>
        <TocAnchorsProvider>
          <div className="grid grid-cols-12 relative gap-4">
            <article
              // Used to get headings for the table of contents
              id="sb-docs-guide-main-article"
              className="col-span-12 md:col-span-9 min-w-0"
            >
              <GuideTocMenu />
              {version !== LATEST_CLI_VERSION && (
                <OlderVersionBanner
                  version={version}
                  latestHref={versionHrefs[LATEST_CLI_VERSION]}
                />
              )}
              <CliPageBody model={model} page={page} />
            </article>
            <CliPageAside
              markdownHref={`${BASE_PATH}${markdownPath}`}
              publicMarkdownUrl={cliMarkdownUrl(version, rel)}
              className={cn(
                'hidden md:flex md:col-span-3 md:col-start-10',
                'self-start sticky',
                'top-[calc(var(--header-height)+3rem)]',
                'max-h-[calc(100vh-var(--header-height)-4rem)]'
              )}
            />
          </div>
        </TocAnchorsProvider>
        <CliReveal />
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}

function CliNavigation({
  model,
  activeHref,
  versionHrefs,
}: {
  model: CliModel
  activeHref: string
  versionHrefs: Record<string, string>
}) {
  const { version } = model
  const links = [
    { href: cliPageHref(version, ''), label: 'Overview', title: 'Supabase CLI' },
    {
      href: cliPageHref(version, CLI_GLOBAL_FLAGS_SLUG),
      label: 'Global flags',
      title: 'Global flags',
    },
    {
      href: cliPageHref(LATEST_CLI_VERSION, CLI_MIGRATION_GUIDE_SLUG),
      label: 'Migrating from v2',
      title: 'Migrating from v2',
    },
  ]
  const groups: CliNavGroup[] = model.categories.map((category) => {
    const names = category.commands.map((command) => cliCommandName(command.title))
    return {
      id: category.id,
      title: category.title,
      items: category.commands
        .map((command) => ({
          href: cliPageHref(version, cliCommandRel(command.title)),
          label: shortLabel(cliCommandName(command.title), names),
          title: command.title,
        }))
        // Sorting by the full path puts each parent right before its own subcommands.
        .sort((a, b) => a.title.localeCompare(b.title)),
    }
  })

  return (
    <div className="w-full flex flex-col pt-3 pb-5 gap-3">
      <div className="flex items-center gap-3">
        <MenuIconPicker icon="reference-cli" width={21} height={21} />
        <span className="text-base text-brand-600">Supabase CLI</span>
        <RefVersionDropdown library="cli" currentVersion={version} hrefs={versionHrefs} />
      </div>
      <CliNavigationLinks links={links} groups={groups} activeHref={activeHref} />
    </div>
  )
}

function OlderVersionBanner({ version, latestHref }: { version: string; latestHref: string }) {
  return (
    <Admonition type="note" className="not-prose mb-8" title={`You're viewing the ${version} docs`}>
      <p className="m-0">
        {LATEST_CLI_VERSION} is the latest version.{' '}
        <Link href={latestHref} className="underline underline-offset-2">
          Go to {LATEST_CLI_VERSION}
        </Link>
        {' · '}
        <Link href={cliMigrationGuideHref()} className="underline underline-offset-2">
          Migrating from v2
        </Link>
      </p>
    </Admonition>
  )
}

async function CliPageBody({ model, page }: { model: CliModel; page: CliPage }) {
  switch (page.kind) {
    case 'overview':
      return <CliOverview model={model} />
    case 'global-flags':
      return <CliGlobalFlags model={model} />
    case 'migration-guide':
      return <CliMigrationGuide model={model} />
    case 'command':
      return <CliCommandPage model={model} command={page.command} />
  }
}

// ---------------------------------------------------------------------------
// Building blocks

function PageHeader({
  crumbs,
  title,
  lede,
  version,
}: {
  crumbs: ReactNode[]
  title: string
  lede: string
  version: string
}) {
  return (
    <header className="mb-8">
      <nav aria-label="Breadcrumb" className="cli-crumb">
        <Link href={cliPageHref(version, '')}>CLI</Link>
        {crumbs.map((crumb, index) => (
          <span key={index}>
            <span aria-hidden className="mx-1.5">
              /
            </span>
            {crumb}
          </span>
        ))}
      </nav>
      <h1 className="cli-title font-mono">
        <PageTitleObserver title={title} />
        {title}
      </h1>
      <p className="cli-lede">{lede}</p>
    </header>
  )
}

function Section({
  id,
  title,
  tag = 'h2',
  children,
}: PropsWithChildren<{ id: string; title: string; tag?: 'h2' | 'h3' }>) {
  return (
    <section data-cli-reveal className={tag === 'h2' ? 'mt-12' : 'mt-6'}>
      <Heading
        tag={tag}
        customAnchor={id}
        className={cn('cli-heading mt-0', tag === 'h2' ? 'text-2xl mb-3' : 'text-base mb-2')}
      >
        {title}
      </Heading>
      {children}
    </section>
  )
}

const markdownComponents = {
  pre: ({ node: _node, ...props }: ComponentProps<'pre'> & { node?: unknown }) => (
    <CodeBlock
      {...(props as ComponentProps<typeof CodeBlock>)}
      lineNumbers={false}
      skipTypeGeneration
    />
  ),
  table: ({ node: _node, ...props }: ComponentProps<'table'> & { node?: unknown }) => (
    <div className="cli-data-table">
      <table {...props} />
    </div>
  ),
}

/** Spec descriptions are plain Markdown; psql output fences become tables. */
function CliMarkdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn('prose max-w-none', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {psqlTables(source)}
      </ReactMarkdown>
    </div>
  )
}

function Command({ code, output }: { code: string; output?: string }) {
  const trimmedOutput = output?.trimEnd()
  const table = trimmedOutput ? psqlTable(trimmedOutput) : undefined
  return (
    <div className="cli-command">
      <CodeBlock contents={code} lang="bash" lineNumbers={false} skipTypeGeneration />
      {trimmedOutput?.trim() &&
        (table ? (
          <div className="cli-output cli-data-table">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{table}</ReactMarkdown>
          </div>
        ) : (
          <pre className="cli-output overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre text-foreground-light">
            {trimmedOutput}
          </pre>
        ))}
    </div>
  )
}

function FlagsTable({ flags, changedFlags }: { flags: CliFlag[]; changedFlags?: Set<string> }) {
  return (
    <div className="overflow-x-auto">
      <table className="cli-flags cli-flags-stacked">
        <thead>
          <tr>
            <th>Flag</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((flag) => {
            const described = describeFlag(flag)
            const anchor = `flag-${described.id}`
            return (
              <tr key={described.id} id={anchor}>
                <td className="cli-flag-name">
                  <a href={`#${anchor}`}>{described.label}</a>
                  {described.long && changedFlags?.has(described.long) && (
                    <Badge variant="warning" className="ml-1.5 align-middle">
                      v3
                    </Badge>
                  )}
                  {described.required && (
                    <Badge variant="destructive" className="ml-1.5 align-middle">
                      required
                    </Badge>
                  )}
                </td>
                <td>
                  {described.description}
                  {!described.choices && described.defaultValue && (
                    <span className="text-sm text-foreground-lighter">
                      {' '}
                      Default <code>{described.defaultValue}</code>
                    </span>
                  )}
                  {described.choices && (
                    <span className="cli-choices">
                      {described.choices.map((choice) => (
                        <code
                          key={choice}
                          data-default={choice === described.defaultValue || undefined}
                          title={choice === described.defaultValue ? 'Default' : undefined}
                        >
                          {choice}
                        </code>
                      ))}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CommandCards({ model, commands }: { model: CliModel; commands: CliCommand[] }) {
  return (
    <div className="cli-cards">
      {commands.map((command) => (
        <Link
          key={command.id}
          className="cli-card"
          href={cliPageHref(model.version, cliCommandRel(command.title))}
        >
          <span className="font-mono text-sm font-medium text-foreground">
            {cliCommandName(command.title)}
          </span>
          <span className="text-sm text-foreground-lighter">{sentence(command.summary)}</span>
        </Link>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pages

function CliCommandPage({ model, command }: { model: CliModel; command: CliCommand }) {
  const { version } = model
  const name = cliCommandName(command.title)
  const category = model.categoryOf.get(command.id)
  const [first = '', ...rest] = (command.description ?? '').trim().split(/\n\n+/)
  const showFirst = first.trim() !== '' && !restatesSummary(command.summary, first)
  const breakingChanges = command.breaking_changes ?? []
  const changedFlags = new Set(breakingChanges.flatMap((change) => change.flags ?? []))
  const subcommands = command.subcommands
    .map((id) => model.byId.get(id))
    .filter((sub): sub is CliCommand => !!sub)
  const related = cliRelatedCommands(model, command)

  return (
    <>
      <PageHeader
        version={version}
        crumbs={[category?.title, <b key="name">{name}</b>].filter(Boolean)}
        title={name}
        lede={sentence(command.summary)}
      />
      {breakingChanges.map((change) => (
        <Admonition
          key={change.id}
          type="warning"
          className="not-prose"
          title={
            change.direction === 'upcoming' ? `Changes in v${change.major}` : 'Changed since v2'
          }
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="m-0">{children}</p>,
              a: ({ node: _node, ...props }) => (
                <a {...props} className="underline underline-offset-2" />
              ),
            }}
          >{`${change.summary} [Migration guide](${BASE_PATH}${cliMigrationGuideHref(change.id)})`}</ReactMarkdown>
        </Admonition>
      ))}
      {showFirst && <CliMarkdown source={first} />}
      <Section id="usage" title="Usage">
        <Command code={command.usage ?? command.title} />
      </Section>
      {subcommands.length > 0 && (
        <Section id="subcommands" title="Subcommands">
          <CommandCards model={model} commands={subcommands} />
        </Section>
      )}
      {command.flags.length > 0 && (
        <Section id="options" title="Options">
          <FlagsTable flags={command.flags} changedFlags={changedFlags} />
          <p className="cli-muted">
            Plus <Link href={cliPageHref(version, CLI_GLOBAL_FLAGS_SLUG)}>global flags</Link>.
          </p>
        </Section>
      )}
      {(command.examples?.length ?? 0) > 0 && (
        <Section id="examples" title="Examples">
          {command.examples!.map((example) => (
            <Section key={example.id} id={`example-${example.id}`} title={example.name} tag="h3">
              <Command code={example.code} output={example.response} />
            </Section>
          ))}
        </Section>
      )}
      {rest.length > 0 && (
        <Section id="details" title="Details">
          <CliMarkdown source={rest.join('\n\n')} />
        </Section>
      )}
      {related.length > 0 && (
        <Section id="related" title="Related">
          <CommandCards model={model} commands={related} />
        </Section>
      )}
    </>
  )
}

const OVERVIEW_PREVIEW = 6

function CliOverview({ model }: { model: CliModel }) {
  const { version } = model
  return (
    <>
      <PageHeader
        version={version}
        crumbs={[]}
        title={cliPageTitle({ kind: 'overview' })}
        lede={cliPageDescription({ kind: 'overview' })}
      />
      <Section id="install" title="Install">
        <Command code="npx supabase init" />
        <p className="cli-muted">
          See{' '}
          <a href={`${BASE_PATH}/guides/local-development/cli/getting-started`}>Getting started</a>{' '}
          for other ways to install the CLI.
        </p>
      </Section>
      {model.categories.map((category) => {
        const width = Math.max(...category.commands.map((command) => command.title.length))
        const preview = category.commands
          .slice(0, OVERVIEW_PREVIEW)
          .map((command) => `${command.title.padEnd(width + 2)}# ${command.summary}`)
          .join('\n')
        const more = category.commands.length - OVERVIEW_PREVIEW
        return (
          <Section key={category.id} id={category.id} title={category.title}>
            <div className="cli-command">
              <CodeBlock contents={preview} lang="bash" lineNumbers={false} skipTypeGeneration />
            </div>
            <p className="cli-links">
              {more > 0 && <span className="text-foreground-lighter">+{more} more: </span>}
              {category.commands.map((command, index) => (
                <span key={command.id}>
                  {index > 0 && <span aria-hidden> · </span>}
                  <Link href={cliPageHref(version, cliCommandRel(command.title))}>
                    {cliCommandName(command.title)}
                  </Link>
                </span>
              ))}
            </p>
          </Section>
        )
      })}
    </>
  )
}

async function CliGlobalFlags({ model }: { model: CliModel }) {
  const { version } = model
  const { content } = await getCliMdxPage(version, CLI_GLOBAL_FLAGS_SLUG)
  const lede = cliPageDescription({ kind: 'global-flags' })
  // The MDX opens with the same sentence as the lede; render what follows.
  const body = content.trim().replace(/^[^\n<]+\n+/, '')

  return (
    <>
      <PageHeader
        version={version}
        crumbs={[<b key="t">Global flags</b>]}
        title="Global flags"
        lede={lede}
      />
      <div className="prose max-w-none">
        <MDXRemoteBase
          source={body}
          components={{
            ...mdxComponents,
            CliGlobalFlagsHandler: () => (
              <div className="not-prose">
                <FlagsTable flags={model.spec.flags} />
              </div>
            ),
          }}
        />
      </div>
    </>
  )
}

async function CliMigrationGuide({ model }: { model: CliModel }) {
  const { version } = model
  const { content } = await getCliMdxPage(version, CLI_MIGRATION_GUIDE_SLUG)
  return (
    <>
      <PageHeader
        version={version}
        crumbs={[<b key="t">Migrating from v2</b>]}
        title="Migrating from v2"
        lede={cliPageDescription({ kind: 'migration-guide' })}
      />
      <div className="prose max-w-none">
        <MDXRemoteBase source={content} />
      </div>
    </>
  )
}
