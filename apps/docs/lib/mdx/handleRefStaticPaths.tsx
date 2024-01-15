import { ICommonSection } from '~/components/reference/Reference.types'

async function handleRefGetStaticPaths(sections: ICommonSection[]) {
  // In preview environments, don't generate static pages (faster builds)
  if (process.env.SKIP_BUILD_STATIC_GENERATION) {
    return {
      paths: [],
      fallback: 'blocking',
    }
  }

  // In production, generate static pages for every sub-section (better SEO)
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
