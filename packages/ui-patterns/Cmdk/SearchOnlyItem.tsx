import { CommandItem } from './Command.utils'
import { useRouter } from 'next/router'
import { useCommandMenu } from './CommandMenuProvider'

interface SearchOnlyItemProps {
  children: React.ReactNode
  url: string
}

export default function SearchOnlyItem({ children, url }: SearchOnlyItemProps) {
  const { project, setIsOpen, setSearch } = useCommandMenu()
  const router = useRouter()

  const baseURL = process.env.NEXT_PUBLIC_SITE_URL
  function handleRouteChange(url: string) {
    const localizedURL = project?.ref
      ? `${baseURL}${url.replace('/_/', `/${project?.ref}/`)}`
      : `${baseURL}${url}`

    router.push(localizedURL)
    setIsOpen(false)
    setSearch('')
  }
  return (
    <CommandItem type="link" onSelect={() => handleRouteChange(url)}>
      {children}
    </CommandItem>
  )
}
