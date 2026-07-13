import { FrameworksSection } from './_components/FrameworksSection'
import { HomeContent } from './_components/HomeContent'

export default function HomePage() {
  return <HomeContent frameworksSlot={<FrameworksSection />} />
}
