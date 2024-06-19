import { CommandGroup } from 'cmdk'
import { useCommandMenu } from './CommandMenuProvider'
import { Badge } from 'ui/src/components/shadcn/ui/badge'
import { CommandItem, copyToClipboard } from './Command.utils'
import { IconAlertCircle } from 'ui/src/components/Icon/icons/IconAlertCircle'
import ChildItem from './ChildItem'

const APIKeys = ({ isSubItem = false }) => {
  const { setIsOpen, project } = useCommandMenu()
  const { apiKeys } = project ?? {}

  return (
    <CommandGroup>
      {apiKeys?.anon !== undefined && (
        <ChildItem
          isSubItem={isSubItem}
          onSelect={() => {
            copyToClipboard(apiKeys?.anon ?? '')
            setIsOpen(false)
          }}
          className="space-x-2"
        >
          <p>Copy anonymous key</p>
          <Badge>Public</Badge>
        </ChildItem>
      )}
      {apiKeys?.service !== undefined && (
        <ChildItem
          isSubItem={isSubItem}
          onSelect={() => {
            copyToClipboard(apiKeys?.service ?? '')
            setIsOpen(false)
          }}
          className="space-x-2"
        >
          <p>Copy service key</p>
          <Badge variant="destructive">Secret</Badge>
        </ChildItem>
      )}
      {apiKeys?.anon === undefined && apiKeys?.service === undefined && (
        <CommandItem type="link" className="items-start">
          <IconAlertCircle strokeWidth={1.5} className="text-foreground-light" />
          <div>
            <p>No API keys available</p>
            <p className="text-foreground-lighter">
              You may not have the necessary permissions to view the project's API keys
            </p>
          </div>
        </CommandItem>
      )}
    </CommandGroup>
  )
}

export default APIKeys
