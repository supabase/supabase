import { CommunityDocsHome } from '@/components/CommunityDocsHome.client'
import { getCommunityDocSections } from '@/lib/content'

const HomePage = async () => {
  const sections = await getCommunityDocSections()

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-8 pb-16">
      <CommunityDocsHome sections={sections} />
    </main>
  )
}

export default HomePage
