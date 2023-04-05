import { CommandGroup } from 'cmdk-supabase'
import { useCommandMenu } from './CommandMenuProvider'
import SearchOnlyItem from './SearchOnlyItem'
import { Badge } from '../Badge'
import { CommandItem } from './Command.utils'
import { IconAlertCircle } from './../Icon/icons/IconAlertCircle'

const APIKeys = ({ isSubItem = false }) => {
  const { setIsOpen, project } = useCommandMenu()
  const { apiKeys } = project ?? {}

  const copyToClipboard = (str: string, callback = () => {}) => {
    const focused = window.document.hasFocus()
    if (focused) {
      window.navigator?.clipboard?.writeText(str).then(callback)
    } else {
      console.warn('Unable to copy to clipboard')
    }
  }

  return (
    <CommandGroup>
      {apiKeys?.anon !== undefined && (
        <SearchOnlyItem
          isSubItem={isSubItem}
          onSelect={() => {
            copyToClipboard(apiKeys?.anon ?? '')
            setIsOpen(false)
          }}
          className="space-x-2"
        >
          <p>Copy anonymous key</p>
          <Badge color="gray">Public</Badge>
        </SearchOnlyItem>
      )}
      {apiKeys?.service !== undefined && (
        <SearchOnlyItem
          isSubItem={isSubItem}
          onSelect={() => {
            copyToClipboard(apiKeys?.service ?? '')
            setIsOpen(false)
          }}
          className="space-x-2"
        >
          <p>Copy service key</p>
          <Badge color="red">Secret</Badge>
        </SearchOnlyItem>
      )}
      {apiKeys?.anon === undefined && apiKeys?.service === undefined && (
        <CommandItem type="link" className="items-start">
          <IconAlertCircle strokeWidth={1.5} className="text-scale-1100" />
          <div>
            <p>No API keys available</p>
            <p className="text-scale-1000">
              You may not have the necessary permissions to view the project's API keys
            </p>
          </div>
        </CommandItem>
      )}
    </CommandGroup>
  )
}

export default APIKeys
