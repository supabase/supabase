import { PermissionAction } from '@supabase/shared-types/out/constants'
import { MoreVertical, Trash } from 'lucide-react'
import {
  Button,
  Card,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

interface RedirectUrlListProps {
  allowList: string[]
  selectedUrls: string[]
  onSelectUrl: (urls: string[]) => void
  onSelectRemoveURLs: () => void
  onSelectClearSelection: () => void
}

export const RedirectUrlList = ({
  allowList,
  selectedUrls,
  onSelectUrl,
  onSelectRemoveURLs,
  onSelectClearSelection,
}: RedirectUrlListProps) => {
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const isAllSelected = allowList.length > 0 && selectedUrls.length === allowList.length

  const handleToggleUrl = (url: string) => {
    onSelectUrl(
      selectedUrls.includes(url)
        ? selectedUrls.filter((selectedUrl) => selectedUrl !== url)
        : [...selectedUrls, url]
    )
  }

  const handleRemoveSingleUrl = (url: string) => {
    onSelectUrl([url])
    onSelectRemoveURLs()
  }

  return (
    <div className="flex flex-col gap-y-2">
      {selectedUrls.length > 0 && (
        <div className="flex items-center justify-between gap-x-2">
          <p className="text-sm text-foreground-light">{selectedUrls.length} selected</p>
          <div className="flex items-center gap-x-2">
            <Button onClick={() => onSelectClearSelection()}>Clear selection</Button>
            <ButtonTooltip
              disabled={!canUpdateConfig}
              icon={<Trash />}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canUpdateConfig
                    ? 'You need additional permissions to remove redirect URLs'
                    : undefined,
                },
              }}
              onClick={() => onSelectRemoveURLs()}
            >
              Remove ({selectedUrls.length})
            </ButtonTooltip>
          </div>
        </div>
      )}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllSelected}
                  disabled={allowList.length === 0}
                  aria-label="Select all redirect URLs"
                  onCheckedChange={(checked) => onSelectUrl(checked ? allowList : [])}
                />
              </TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {allowList.length === 0 ? (
              <TableRow className="[&>td]:hover:bg-inherit">
                <TableCell colSpan={3}>
                  <p className="text-sm text-foreground">No redirect URLs</p>
                  <p className="text-sm text-foreground-lighter">
                    Add a URL that auth providers can redirect to after authentication
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              allowList.map((url) => {
                const isSelected = selectedUrls.includes(url)
                return (
                  <TableRow key={url} data-state={isSelected ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        aria-label={`Select ${url}`}
                        onCheckedChange={() => handleToggleUrl(url)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-foreground break-all">{url}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="px-1"
                            icon={<MoreVertical />}
                            aria-label={`Actions for ${url}`}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end" className="w-40">
                          <DropdownMenuItem
                            className="space-x-2"
                            disabled={!canUpdateConfig}
                            onClick={() => handleRemoveSingleUrl(url)}
                          >
                            <Trash size={12} />
                            <p>Remove URL</p>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
          {allowList.length > 0 && (
            <TableCaption>
              {allowList.length} redirect URL{allowList.length > 1 ? 's' : ''}
            </TableCaption>
          )}
        </Table>
      </Card>
    </div>
  )
}
