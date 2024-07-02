import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useProjectByRef } from 'hooks'
import { copyToClipboard } from 'lib/helpers'
import { Link } from 'lucide-react'
import { Badge } from 'ui'
import { useRegisterCommands, useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'

const useApiUrlCommand = () => {
  const setIsOpen = useSetCommandMenuOpen()

  const { ref } = useParams()
  const project = useProjectByRef(ref)
  const { data: settings } = useProjectApiQuery({ projectRef: ref }, { enabled: !!ref })

  const apiUrl = `${settings?.autoApiService.protocol}://${settings?.autoApiService.endpoint}`

  useRegisterCommands(
    'Project tools',
    [
      {
        id: 'api-url',
        name: 'Copy API URL',
        action: () => {
          copyToClipboard(apiUrl)
          setIsOpen(false)
        },
        icon: () => <Link />,
        badge: () => <Badge>Project: {project?.name}</Badge>,
      },
    ],
    { enabled: !!project, deps: [apiUrl, project] }
  )
}

export { useApiUrlCommand }
