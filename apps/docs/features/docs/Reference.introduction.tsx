import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, cn } from 'ui'

import { getRefMarkdown, MDXRemoteRefs } from '~/features/docs/Reference.mdx'
import { ReferenceSectionWrapper } from '~/features/docs/Reference.ui.client'
import commonClientLibSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }

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
    <Alert_Shadcn_ variant="warning" className={cn('not-prose', className)}>
      <AlertTriangle />
      <AlertTitle_Shadcn_ className="font-medium">Version out of date</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        There&apos;s a newer version of this library! Migrate to the{' '}
        <Link href={`/reference/${libPath}`} className="underline underline-offset-2">
          newest version
        </Link>
        .
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
