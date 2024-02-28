import { type IncludeList } from '~/components/Navigation/NavigationMenu/utils.server'
import { type TypeSpec } from '~/components/reference/Reference.types'
import { flattenSections } from '~/lib/helpers'
import { assertServer } from '~/lib/server'
import commonSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }
import typeSpec from '~/spec/enrichments/tsdoc_v2/combined.json'
import { getGenericRefStaticPaths, getGenericRefStaticProps } from './refUtils.server'

assertServer()

type ExtendProps<
  OldProps extends { props: unknown },
  NewProps extends Record<string, unknown>,
> = OldProps & { props: NewProps }

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
  const refStaticProps = (await getGenericRefStaticProps({
    sections: commonSections,
    flatSections: flatCommonSections,
    spec,
    libraryPath,
    excludedName,
    includeList,
  })) as ExtendProps<Awaited<ReturnType<typeof getGenericRefStaticProps>>, { typeSpec: TypeSpec }>
  refStaticProps.props.typeSpec = typeSpec as TypeSpec

  return refStaticProps
}

const getClientRefStaticPaths = () => {
  return getGenericRefStaticPaths({ flatSections: flatCommonSections })
}

export { getClientRefStaticProps, getClientRefStaticPaths }
