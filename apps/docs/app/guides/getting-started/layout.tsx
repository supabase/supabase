import { type NavMenuSection } from '~/components/Navigation/Navigation.types'
import Layout from '~/layouts/guides'
import { getAiPrompts } from '../getting-started/ai-prompts/[slug]/AiPrompts.utils'

export default async function GettingStartedLayout({ children }: { children: React.ReactNode }) {
  const additionalNavItems = { prompts: await getPrompts() }

  return <Layout additionalNavItems={additionalNavItems}>{children}</Layout>
}

async function getPrompts() {
  const prompts = await getAiPrompts()
  return prompts.map(
    (prompt) =>
      ({
        name: prompt.heading,
        url: `/guides/getting-started/ai-prompts/${prompt.filename}`,
      }) as Partial<NavMenuSection>
  )
}
