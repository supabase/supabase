import { source } from 'common-tags'
import { notFound } from 'next/navigation'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import {
  generateAiSkillMetadata,
  generateAiSkillsStaticParams,
  getAiSkill,
} from './AiSkills.utils'

export const dynamicParams = false

export default async function AiSkillsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const { slug } = params

  const skill = await getAiSkill(slug)
  if (!skill) {
    notFound()
  }

  let { heading, content, metadata } = skill

  content = source`
    ${content}

    ## Using this Skill

    This skill can be integrated into your AI-powered development workflow. Copy the content and reference it in your AI tool's context using the methods described in the [main Skills page](/guides/getting-started/ai-skills).

    ${metadata?.github ? `View the source code on [GitHub](${metadata.github}).` : ''}
  `

  return (
    <GuideTemplate
      meta={{
        title: `AI Skill: ${heading}`,
        description: metadata?.description || `${heading} - Supabase AI Skill`
      }}
      content={content}
      editLink={newEditLink(`supabase/supabase/blob/master/examples/skills/${slug}.md`)}
    />
  )
}

export const generateMetadata = generateAiSkillMetadata
export const generateStaticParams = generateAiSkillsStaticParams
