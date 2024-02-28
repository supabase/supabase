import { type InferGetStaticPropsType, type GetStaticPaths, type GetStaticProps } from 'next'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import RefSectionHandler from '~/components/reference/RefSectionHandler'
import {
	getClientRefStaticPaths,
	getClientRefStaticProps,
} from '~/lib/mdx/refUtils.clientLibrary.server'
import spec from '~/spec/supabase_csharp_v0.yml' assert { type: 'yml' }

const libraryPath = '/csharp'

const CSharpReferencePage = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
	return (
		<RefSectionHandler
			menuId={MenuId.RefCSharpV0}
			menuData={props.menuData}
			sections={props.flatSections}
			docs={props.docs}
			spec={spec}
			type="client-lib"
		/>
	)
}

const getStaticProps = (async () => {
	return getClientRefStaticProps({
		spec,
		libraryPath,
		excludedName: 'reference_csharp_v0',
	})
}) satisfies GetStaticProps

const getStaticPaths = (async () => {
	return getClientRefStaticPaths()
}) satisfies GetStaticPaths

export default CSharpReferencePage
export { getStaticProps, getStaticPaths }
