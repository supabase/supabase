import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import { ReferenceNavigation } from '~/features/docs/Reference.navigation.new'
import Layout from '~/layouts/guides'
import { type GuideFrontmatter } from '~/lib/docs'
import { type AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'

interface ReferencePageLayoutProps {
  name: string
  icon: string
  library: string
  version: string
  isLatestVersion: boolean
  sections: AbbrevApiReferenceSection[]
  meta: GuideFrontmatter
  content: string
}

export function ReferencePageLayout({
  name,
  icon,
  library,
  version,
  isLatestVersion,
  sections,
  meta,
  content,
}: ReferencePageLayoutProps) {
  return (
    <Layout
      NavigationMenu={
        <ReferenceNavigation
          name={name}
          icon={icon}
          library={library}
          version={version}
          isLatestVersion={isLatestVersion}
          sections={sections}
        />
      }
    >
      <GuideTemplate meta={meta} content={content} />
    </Layout>
  )
}
