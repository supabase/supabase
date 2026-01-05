import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Code, Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { IS_PLATFORM, useParams } from 'common'
import { getContentById } from 'data/content/content-id-query'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { useSQLSnippetFolderCreateMutation } from 'data/content/sql-folder-create-mutation'
import { Snippet } from 'data/content/sql-folders-query'
import {
  SnippetWithContent,
  useSnippetFolders,
  useSqlEditorV2StateSnapshot,
} from 'state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  PopoverContent,
  PopoverTrigger,
  Popover,
  ScrollArea,
} from 'ui'

interface MoveQueryModalProps {
  visible: boolean
  snippets?: Snippet[]
  onClose: () => void
}

/**
 * [Joshen] Just FYI react-accessible-tree-view doesn't support drag and drop for moving
 * files out of the box and we'll need to figure out a way to support this ideal UX. Same
 * thing for the Storage Explorer actually. So this is just a temporary UX till we can figure
 * out drag and drop that works nicely with the tree view. React beautiful dnd unfortunately
 * doesn't support drag drop into a folder kind of UX.
 */

export const MoveQueryModal = ({ visible, snippets = [], onClose }: MoveQueryModalProps) => {
  const { ref } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabsSnap = useTabsStateSnapshot()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string>()

  const { mutateAsync: createFolder, isPending: isCreatingFolder } =
    useSQLSnippetFolderCreateMutation({
      onError: (error) => {
        toast.error(`Failed to create new folder: ${error.message}`)
      },
    })
  const { mutateAsync: moveSnippetAsync, isPending: isMovingSnippet } = useContentUpsertMutation({
    onError: (error) => {
      toast.error(`Failed to move query: ${error.message}`)
    },
  })

  const getFormSchema = () => {
    if (selectedId === 'new-folder') {
      return z
        .object({
          name: z.string().min(1, 'Please provide a name for the folder'),
        })
        .refine((data) => !snapV2.allFolderNames.includes(data.name), {
          message: 'This folder name already exists',
          path: ['name'],
        })
    } else {
      return z.object({})
    }
  }

  const FormSchema = getFormSchema()

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '' },
  })

  const folders = useSnippetFolders(ref as string)
  const selectedFolder =
    selectedId === 'root'
      ? 'Root of the editor'
      : selectedId === 'new-folder'
        ? 'Create a new folder'
        : folders.find((f) => f.id === selectedId)?.name
  const isCurrentFolder =
    snippets.length === 1 &&
    ((!snippets[0].folder_id && selectedId === 'root') || snippets[0].folder_id === selectedId)
  const isMovingToSameFolder =
    snippets.length === 1 &&
    ((!snippets[0].folder_id && selectedId === 'root') || snippets[0].folder_id === selectedId)

  const onConfirmMove = async (values: z.infer<typeof FormSchema>) => {
    if (!ref) return console.error('Project ref is required')

    try {
      let folderId = selectedId

      if (selectedId === 'new-folder' && 'name' in values) {
        const { id } = await createFolder({
          projectRef: ref,
          name: values.name,
        })
        folderId = id
      }

      await Promise.all(
        snippets.map(async (snippet) => {
          let snippetContent = (snippet as SnippetWithContent)?.content
          if (snippetContent === undefined) {
            const { content } = await getContentById({ projectRef: ref, id: snippet.id })
            if ('sql' in content) {
              snippetContent = content
            }
          }

          if (snippetContent === undefined) {
            return toast.error('Failed to save snippet: Unable to retrieve snippet contents')
          } else {
            const movedSnippet = await moveSnippetAsync({
              projectRef: ref,
              payload: {
                id: snippet.id,
                type: 'sql',
                name: snippet.name,
                description: snippet.description,
                visibility: snippet.visibility,
                project_id: snippet.project_id,
                owner_id: snippet.owner_id,
                folder_id: selectedId === 'root' ? null : folderId,
                content: snippetContent as any,
              },
            })
            if (IS_PLATFORM) {
              snapV2.updateSnippet({
                id: snippet.id,
                snippet: { ...snippet, folder_id: selectedId === 'root' ? null : folderId },
                skipSave: true,
              })
            } else if (movedSnippet) {
              // On selfhosted, we need to update the state with the moved snippet because the snippet depends on the
              // folder_id the moved snippet has a different id than the original snippet.

              // remove the old snippet from the state without saving to API
              snapV2.removeSnippet(snippet.id, true)

              snapV2.addSnippet({ projectRef: ref, snippet: movedSnippet })

              // remove the tab for the old snippet if the snippet was open. Moving can also happen when the tab is not open.
              const tabId = createTabId('sql', { id: snippet.id })
              if (tabsSnap.hasTab(tabId)) {
                tabsSnap.removeTab(tabId)
                await router.push(`/project/${ref}/sql/${movedSnippet.id}`)
              }
            }
          }
        })
      )

      toast.success(
        `Successfully moved ${snippets.length === 1 ? `"${snippets[0].name}"` : `${snippets.length} snippets`} to ${selectedId === 'root' ? 'the root of the editor' : selectedFolder}`
      )

      onClose()
    } catch (error: any) {
      // error will be handled by the mutation's onError callback
      console.error('Error moving snippets:', error)
    }
  }

  useEffect(() => {
    if (visible && snippets !== undefined) {
      if (snippets.length === 1) {
        setSelectedId(snippets[0].folder_id ?? 'root')
      } else {
        setSelectedId('root')
      }
      form.reset({ name: '' })
    }
  }, [visible, snippets])

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent>
        <Form_Shadcn_ {...form}>
          <form id="move-snippet" onSubmit={form.handleSubmit(onConfirmMove)}>
            <DialogHeader>
              <DialogTitle>
                Move {snippets.length === 1 ? `"${snippets[0].name}"` : `${snippets.length}`}{' '}
                snippet{snippets.length > 1 ? 's' : ''} to a folder
              </DialogTitle>
              <DialogDescription>
                Select which folder to move your quer{snippets.length > 1 ? 'ies' : 'y'} to
              </DialogDescription>
            </DialogHeader>

            <DialogSectionSeparator />

            <DialogSection className="py-5 flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <Label_Shadcn_ className="text-foreground-light">Select a folder</Label_Shadcn_>
                <Popover open={open} onOpenChange={setOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      block
                      size="small"
                      type="default"
                      className="pr-2 justify-between"
                      iconRight={
                        <Code
                          className="text-foreground-light rotate-90"
                          strokeWidth={2}
                          size={12}
                        />
                      }
                    >
                      <div className="flex items-center space-x-2">
                        {selectedFolder}
                        {isCurrentFolder && ` (Current)`}
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" side="bottom" align="start" sameWidthAsTrigger>
                    <Command_Shadcn_>
                      <CommandInput_Shadcn_ placeholder="Find folder..." />
                      <CommandList_Shadcn_>
                        <CommandEmpty_Shadcn_>No folders found</CommandEmpty_Shadcn_>
                        <CommandGroup_Shadcn_>
                          <ScrollArea className={(folders || []).length > 6 ? 'h-[210px]' : ''}>
                            <CommandItem_Shadcn_
                              key="root"
                              value="root"
                              className="cursor-pointer w-full justify-between"
                              onSelect={() => {
                                setOpen(false)
                                setSelectedId('root')
                              }}
                              onClick={() => {
                                setOpen(false)
                                setSelectedId('root')
                              }}
                            >
                              <span>
                                Root of the editor
                                {snippets.length === 1 &&
                                  snippets[0].folder_id === null &&
                                  ` (Current)`}
                              </span>
                              {selectedId === 'root' && <Check size={14} />}
                            </CommandItem_Shadcn_>
                            {folders?.map((folder) => (
                              <CommandItem_Shadcn_
                                key={folder.id}
                                value={folder.name}
                                className="cursor-pointer w-full justify-between"
                                onSelect={() => {
                                  setOpen(false)
                                  setSelectedId(folder.id)
                                }}
                                onClick={() => {
                                  setOpen(false)
                                  setSelectedId(folder.id)
                                }}
                              >
                                <span>
                                  {folder.name}
                                  {snippets.length === 1 &&
                                    snippets[0].folder_id === folder.id &&
                                    ` (Current)`}
                                </span>
                                {folder.id === selectedId && <Check size={14} />}
                              </CommandItem_Shadcn_>
                            ))}
                          </ScrollArea>
                        </CommandGroup_Shadcn_>
                        <CommandSeparator_Shadcn_ />
                        <CommandGroup_Shadcn_>
                          <CommandItem_Shadcn_
                            className="cursor-pointer w-full justify-start gap-x-2"
                            onSelect={(e) => {
                              setOpen(false)
                              setSelectedId('new-folder')
                            }}
                            onClick={() => {
                              setOpen(false)
                              setSelectedId('new-folder')
                            }}
                          >
                            <Plus size={14} strokeWidth={1.5} />
                            <p>New folder</p>
                          </CommandItem_Shadcn_>
                        </CommandGroup_Shadcn_>
                      </CommandList_Shadcn_>
                    </Command_Shadcn_>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedId === 'new-folder' && (
                <div className="flex flex-col gap-y-2">
                  <FormField_Shadcn_
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormLabel_Shadcn_>Provide a name for your new folder</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            autoFocus
                            {...field}
                            autoComplete="off"
                            disabled={isMovingSnippet || isCreatingFolder}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  />
                </div>
              )}
            </DialogSection>

            <DialogFooter>
              <Button
                type="default"
                disabled={isMovingSnippet || isCreatingFolder}
                onClick={() => onClose()}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                disabled={isMovingToSameFolder}
                loading={isMovingSnippet || isCreatingFolder}
              >
                Move file
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
