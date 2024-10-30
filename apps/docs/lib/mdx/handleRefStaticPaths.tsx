import type { ICommonSection } from '~/components/reference/Reference.types'

async function handleRefGetStaticPaths(sections: ICommonSection[]) {
  return {
    paths: sections.map((section) => {
      return {
        params: {
          slug: [section.slug],
        },
      }
    }),
    fallback: 'blocking',
  }
}

export default handleRefGetStaticPaths
