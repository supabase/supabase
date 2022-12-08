// @ts-expect-error
import spec from '~/../../spec/cli_v1_commands_new_shape.yaml' assert { type: 'yml' }

import { MDXRemote } from 'next-mdx-remote'
import components from '~/components/index'
import OldLayout from '~/layouts/Default'
import { flattenSections } from '~/lib/helpers'

import cliCommonSections from '~/../../spec/common-cli-sections.json' assert { type: 'json' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'

const sections = flattenSections(cliCommonSections)

export type AcceptedValue = {
  id: string
  name: string
  type: 'string' | 'boolean' | 'object'
  description?: string
}

export type Flag = {
  id: string
  name: string
  description: string
  default_value: string
  accepted_values: AcceptedValue[]
}

export type Command = {
  id: string
  title: string
  description: string
  flags?: Flag[]
  summary: string
  tags?: []
  links?: []
  subcommands?: []
  usage?: string
}

export default function Config(props) {
  console.log(props.docs)

  console.log(
    spec.commands.map((x) => {
      return {
        id: x.id,
        title: x.title,
        slug: x.id,
        isFunc: true,
      }
    })
  )

  /*
   * handle old ref pages
   */
  if (process.env.NEXT_PUBLIC_NEW_DOCS === 'false') {
    return (
      // @ts-ignore
      <OldLayout meta={props.meta} toc={props.toc}>
        <MDXRemote {...props.content} components={components} />
      </OldLayout>
    )
  }

  return <RefSectionHandler sections={sections} spec={spec} pageProps={props} type="cli" />
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  return handleRefStaticProps(sections, params, '/cli', '/cli')
}

export function getStaticPaths() {
  return handleRefGetStaticPaths()
}
