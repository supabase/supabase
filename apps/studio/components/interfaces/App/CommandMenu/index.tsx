import dynamic from 'next/dynamic'
import { useCommandMenuInitiated } from 'ui-patterns/CommandMenu'

const LazyCommandMenu = dynamic(
  () => import('./CommandMenu').then((mod) => mod.StudioCommandMenu),
  {
    ssr: false,
  }
)

export const StudioCommandMenu = () => {
  const isInitiated = useCommandMenuInitiated()
  return isInitiated && <LazyCommandMenu />
}
