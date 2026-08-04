import { toast } from 'sonner'
import {
  Badge,
  Card,
  copyToClipboard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import type { DefaultEdgeFunctionSecret } from './DefaultEdgeFunctionSecrets.utils'

interface DefaultEdgeFunctionSecretsProps {
  secrets: DefaultEdgeFunctionSecret[]
}

export const DefaultEdgeFunctionSecrets = ({ secrets }: DefaultEdgeFunctionSecretsProps) => {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {secrets.map((secret) => (
            <SecretRow key={secret.name} secret={secret} />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

const SecretRow = ({ secret }: { secret: DefaultEdgeFunctionSecret }) => {
  return (
    <TableRow key={secret.name}>
      <TableCell>
        <div className="flex items-center gap-x-2 py-1">
          <Tooltip>
            <TooltipTrigger
              onClick={() => {
                copyToClipboard(secret.name)
                toast.success(`Copied ${secret.name}`)
              }}
            >
              <p className="truncate">
                <code className="text-code-inline">{secret.name}</code>
              </p>
            </TooltipTrigger>
            <TooltipContent side="bottom">Click to copy</TooltipContent>
          </Tooltip>

          {secret.isDeprecated && <Badge variant="warning">Deprecated</Badge>}
        </div>
      </TableCell>
      <TableCell>
        <p className="text-sm text-foreground-light">{secret.description}</p>
      </TableCell>
    </TableRow>
  )
}
