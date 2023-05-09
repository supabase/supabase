import { ICommonSection } from '~/components/reference/Reference.types'

async function handleRefGetStaticPaths(sections: ICommonSection[], libraryPath: string) {
  return {
    paths: sections.map((section) => {
      return {
        params: {
          slug: libraryPath
            .split('/')
            .filter((dir) => !!dir)
            .concat(section.slug),
        },
      }
    }),
    fallback: 'blocking',
  }
}

export default handleRefGetStaticPaths
