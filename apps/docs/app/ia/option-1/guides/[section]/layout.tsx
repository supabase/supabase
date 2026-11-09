import GettingStartedLayout from '~/app/guides/getting-started/layout'
import IntegrationsLayout from '~/app/guides/integrations/layout'
import Layout from '~/layouts/guides'

const SECTION_LAYOUTS: Record<
  string,
  (props: { children: React.ReactNode }) => React.ReactNode | Promise<React.ReactNode>
> = {
  'getting-started': GettingStartedLayout,
  integrations: IntegrationsLayout,
}

export default async function Option1GuidesLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  const SectionLayout = SECTION_LAYOUTS[section] ?? Layout

  return <SectionLayout>{children}</SectionLayout>
}
