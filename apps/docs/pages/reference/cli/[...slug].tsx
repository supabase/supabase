import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import { flattenSections } from '~/lib/helpers'
import { getGenericRefStaticPaths, getGenericRefStaticProps } from '~/lib/mdx/refUtils.server'
import spec from '~/spec/cli_v1_commands.yaml' assert { type: 'yml' }
import cliCommonSections from '~/spec/common-cli-sections.json' assert { type: 'json' }

const flatSections = flattenSections(cliCommonSections)
const libraryPath = '/cli'

const CliRef = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <RefSectionHandler
      menuId={MenuId.RefCli}
      menuData={props.menuData}
      sections={props.flatSections}
      docs={props.docs}
      spec={spec}
      type="cli"
    />
  )
}

const getStaticProps = (() => {
  const includeList = { tag: 'command', list: spec.commands.map((command: any) => command.id) }

  return getGenericRefStaticProps({
    sections: cliCommonSections,
    flatSections,
    libraryPath,
    includeList,
  })
}) satisfies GetStaticProps

const getStaticPaths = (() => {
  return getGenericRefStaticPaths({ flatSections })
}) satisfies GetStaticPaths

export default CliRef
export { getStaticPaths, getStaticProps }
