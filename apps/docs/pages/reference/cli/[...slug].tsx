import spec from '~/spec/cli_v1_commands.yaml' assert { type: 'yml' }

import { flattenSections } from '~/lib/helpers'

import cliCommonSections from '~/spec/common-cli-sections.json' assert { type: 'json' }
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import handleRefGetStaticPaths from '~/lib/mdx/handleRefStaticPaths'
import handleRefStaticProps from '~/lib/mdx/handleRefStaticProps'

const sections = flattenSections(cliCommonSections)
const libraryPath = '/cli'

export default function CliRef(props) {
  return <RefSectionHandler sections={sections} spec={spec} pageProps={props} type="cli" />
}

export async function getStaticProps() {
  return handleRefStaticProps(sections, libraryPath)
}

export async function getStaticPaths() {
  return handleRefGetStaticPaths(sections)
}
