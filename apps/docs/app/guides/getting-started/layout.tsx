import { type NavMenuSection } from '~/components/Navigation/Navigation.types'
import Layout from '~/layouts/guides'
import { getAiPrompts } from '../getting-started/ai-prompts/[slug]/AiPrompts.utils'
import { getAiSkills } from '../getting-started/ai-skills/[slug]/AiSkills.utils'

export default async function GettingStartedLayout({ children }: { children: React.ReactNode }) {
  const additionalNavItems = {
    prompts: await getPrompts(),
    skills: await getSkills()
  }

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

async function getSkills() {
  const skills = await getAiSkills()
  return skills.map(
    (skill) =>
      ({
        name: skill.heading,
        url: `/guides/getting-started/ai-skills/${skill.filename}`,
      }) as Partial<NavMenuSection>
  )
}
