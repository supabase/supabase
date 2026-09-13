import { getRefMarkdown, MDXRemoteRefs } from '~/features/docs/Reference.mdx'
import { ReferenceSectionWrapper } from '~/features/docs/Reference.ui.client'
import commonClientLibSections from '~/spec/common-client-libs-sections.json' with { type: 'json' }
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle, cn } from 'ui'

function hasIntro(sections: typeof commonClientLibSections, excludeName?: string) {
  return Boolean(
    sections[0]?.type === 'markdown' &&
    sections[0]?.slug === 'introduction' &&
    (!excludeName ||
      !(
        'excludes' in sections[0] &&
        Array.isArray(sections[0].excludes) &&
        sections[0].excludes?.includes(excludeName)
      ))
  )
}

interface ClientLibIntroductionProps {
  libPath: string
  excludeName?: string
  version: string
  isLatestVersion: boolean
  className?: string
}

export async function ClientLibIntroduction({
  libPath,
  excludeName,
  version,
  isLatestVersion,
  className,
}: ClientLibIntroductionProps) {
  if (!hasIntro(commonClientLibSections, excludeName)) return null

  const content = await getRefMarkdown(
    `${libPath}/${isLatestVersion ? '' : `${version}/`}introduction`
  )

  return (
    <ReferenceSectionWrapper
      id="introduction"
      link={`/docs/reference/${libPath}/${isLatestVersion ? '' : `${version}/`}introduction`}
      className={cn('prose', className)}
    >
      <MDXRemoteRefs source={content} />
    </ReferenceSectionWrapper>
  )
}

export function OldVersionAlert({ libPath, className }: { libPath: string; className?: string }) {
  return (
    <Alert variant="warning" className={cn('not-prose', className)}>
      <AlertTriangle />
      <AlertTitle className="font-medium">Version out of date</AlertTitle>
      <AlertDescription>
        There&apos;s a newer version of this library! Migrate to the{' '}
        <Link href={`/reference/${libPath}`} className="underline underline-offset-2">
          newest version
        </Link>
        .
      </AlertDescription>
    </Alert>
  )
}
