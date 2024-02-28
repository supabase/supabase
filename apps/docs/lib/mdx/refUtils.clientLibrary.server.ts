import { type IncludeList } from '~/components/Navigation/NavigationMenu/utils.server'
import { flattenSections } from '~/lib/helpers'
import { assertServer } from '~/lib/server'
import commonSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }
import { getGenericRefStaticPaths, getGenericRefStaticProps } from './refUtils.server'

assertServer()

const flatCommonSections = flattenSections(commonSections)

const getClientRefStaticProps = async ({
  spec,
  libraryPath,
  excludedName,
  includeList,
}: {
  spec: any
  libraryPath: `/${string}`
  excludedName?: string
  includeList?: IncludeList
}) => {
  return getGenericRefStaticProps({
    sections: commonSections,
    flatSections: flatCommonSections,
    spec,
    libraryPath,
    excludedName,
    includeList,
  })
}

const getClientRefStaticPaths = () => {
  return getGenericRefStaticPaths({ flatSections: flatCommonSections })
}

export { getClientRefStaticProps, getClientRefStaticPaths }
