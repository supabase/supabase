import { GuideTemplate } from '~/features/docs/GuidesMdx.template'
import { genGuideMeta, getGuidesMarkdown } from '~/features/docs/GuidesMdx.utils'

const DatabaseAdvisorDocs = async () => {
  const data = await getGuidesMarkdown(['database', 'database-advisors'])

  return <GuideTemplate {...data!} />
}

const generateMetadata = genGuideMeta(() => getGuidesMarkdown(['database', 'database-advisors']))

export default DatabaseAdvisorDocs
export { generateMetadata }
