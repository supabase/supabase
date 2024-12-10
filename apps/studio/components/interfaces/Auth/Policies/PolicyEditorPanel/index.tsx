import { zodResolver } from '@hookform/resolvers/zod'
import { Monaco } from '@monaco-editor/react'
import type { PostgresPolicy } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { isEqual } from 'lodash'
import { memo, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { IStandaloneCodeEditor } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabasePolicyUpdateMutation } from 'data/database-policies/database-policy-update-mutation'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Checkbox_Shadcn_,
  Form_Shadcn_,
  Label_Shadcn_,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetFooter,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { checkIfPolicyHasChanged, generateCreatePolicyQuery } from './PolicyEditorPanel.utils'
import { LockedCreateQuerySection, LockedRenameQuerySection } from './LockedQuerySection'
import { PolicyDetailsV2 } from './PolicyDetailsV2'
import { PolicyEditorPanelHeader } from './PolicyEditorPanelHeader'
import { PolicyTemplates } from './PolicyTemplates'
import { QueryError } from './QueryError'
import { RLSCodeEditor } from './RLSCodeEditor'

interface PolicyEditorPanelProps {
  visible: boolean
  schema: string
  searchString?: string
  selectedTable?: string
  selectedPolicy?: PostgresPolicy
  onSelectCancel: () => void
  authContext: 'database' | 'realtime'
}

/**
 * Using memo for this component because everything rerenders on window focus because of outside fetches
 */
export const PolicyEditorPanel = memo(function ({
  visible,
  schema,
  searchString,
  selectedTable,
  selectedPolicy,
  onSelectCancel,
  authContext,
}: PolicyEditorPanelProps) {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const selectedProject = useSelectedProject()

  const canUpdatePolicies = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  // [Joshen] Hyrid form fields, just spit balling to get a decent POC out
  const [using, setUsing] = useState('')
  const [check, setCheck] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [showCheckBlock, setShowCheckBlock] = useState(true)

  const monacoOneRef = useRef<Monaco | null>(null)
  const editorOneRef = useRef<IStandaloneCodeEditor | null>(null)
  const [expOneLineCount, setExpOneLineCount] = useState(1)
  const [expOneContentHeight, setExpOneContentHeight] = useState(0)

  const monacoTwoRef = useRef<Monaco | null>(null)
  const editorTwoRef = useRef<IStandaloneCodeEditor | null>(null)
  const [expTwoLineCount, setExpTwoLineCount] = useState(1)
  const [expTwoContentHeight, setExpTwoContentHeight] = useState(0)

  const [error, setError] = useState<QueryResponseError>()
  const [errorPanelOpen, setErrorPanelOpen] = useState<boolean>(true)
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [selectedDiff, setSelectedDiff] = useState<string>()

  const [showTools, setShowTools] = useState<boolean>(false)
  const [isClosingPolicyEditorPanel, setIsClosingPolicyEditorPanel] = useState<boolean>(false)

  const formId = 'rls-editor'
  const FormSchema = z.object({
    name: z.string().min(1, 'Please provide a name'),
    table: z.string(),
    behavior: z.string(),
    command: z.string(),
    roles: z.string(),
  })
  const defaultValues = {
    name: '',
    table: '',
    behavior: 'permissive',
    command: 'select',
    roles: '',
  }
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const { name, table, behavior, command, roles } = form.watch()
  const supportWithCheck = ['update', 'all'].includes(command)
  const isRenamingPolicy = selectedPolicy !== undefined && name !== selectedPolicy.name

  const { mutate: executeMutation, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: async () => {
      // refresh all policies
      await queryClient.invalidateQueries(databasePoliciesKeys.list(ref))
      toast.success('Successfully created new policy')
      onSelectCancel()
    },
    onError: (error) => setError(error),
  })

  const { mutate: updatePolicy, isLoading: isUpdating } = useDatabasePolicyUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated policy')
      onSelectCancel()
    },
  })

  const onClosingPanel = () => {
    const editorOneValue = editorOneRef.current?.getValue().trim() ?? null
    const editorOneFormattedValue = !editorOneValue ? null : editorOneValue
    const editorTwoValue = editorTwoRef.current?.getValue().trim() ?? null
    const editorTwoFormattedValue = !editorTwoValue ? null : editorTwoValue

    const policyCreateUnsaved =
      selectedPolicy === undefined &&
      (name.length > 0 || roles.length > 0 || editorOneFormattedValue || editorTwoFormattedValue)
    const policyUpdateUnsaved =
      selectedPolicy !== undefined
        ? checkIfPolicyHasChanged(selectedPolicy, {
            name,
            roles: roles.length === 0 ? ['public'] : roles.split(', '),
            definition: editorOneFormattedValue,
            check: command === 'INSERT' ? editorOneFormattedValue : editorTwoFormattedValue,
          })
        : false

    if (policyCreateUnsaved || policyUpdateUnsaved) {
      setIsClosingPolicyEditorPanel(true)
    } else {
      onSelectCancel()
    }
  }

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const { name, table, behavior, command, roles } = data
    let using = editorOneRef.current?.getValue().trim() ?? undefined
    let check = editorTwoRef.current?.getValue().trim()

    // [Terry] b/c editorOneRef will be the check statement in this scenario
    if (command === 'insert') {
      check = using
    }

    if (command === 'insert' && (check === undefined || check.length === 0)) {
      return setFieldError('Please provide a SQL expression for the WITH CHECK statement')
    } else if (command !== 'insert' && (using === undefined || using.length === 0)) {
      return setFieldError('Please provide a SQL expression for the USING statement')
    } else {
      setFieldError(undefined)
    }

    if (selectedPolicy === undefined) {
      const sql = generateCreatePolicyQuery({
        name: name,
        schema,
        table,
        behavior,
        command,
        roles: roles.length === 0 ? 'public' : roles,
        using: using ?? '',
        check: command === 'insert' ? using ?? '' : check ?? '',
      })

      setError(undefined)
      executeMutation({
        sql,
        projectRef: selectedProject?.ref,
        connectionString: selectedProject?.connectionString,
        handleError: (error) => {
          throw error
        },
      })
    } else if (selectedProject !== undefined) {
      const payload: {
        name?: string
        definition?: string
        check?: string
        roles?: string[]
      } = {}
      const updatedRoles = roles.length === 0 ? ['public'] : roles.split(', ')

      if (name !== selectedPolicy.name) payload.name = name
      if (!isEqual(selectedPolicy.roles, updatedRoles)) payload.roles = updatedRoles
      if (selectedPolicy.definition !== null && selectedPolicy.definition !== using)
        payload.definition = using

      if (selectedPolicy.command === 'INSERT') {
        // [Joshen] Cause editorOneRef will be the check statement in this scenario
        if (selectedPolicy.check !== null && selectedPolicy.check !== using) payload.check = using
      } else {
        if (selectedPolicy.check !== null && selectedPolicy.check !== check) payload.check = check
      }

      if (Object.keys(payload).length === 0) return onSelectCancel()

      updatePolicy({
        id: selectedPolicy.id,
        projectRef: selectedProject.ref,
        connectionString: selectedProject?.connectionString,
        payload,
      })
    }
  }

  // when the panel is closed, reset all values
  useEffect(() => {
    if (!visible) {
      editorOneRef.current?.setValue('')
      editorTwoRef.current?.setValue('')
      setShowTools(false)
      setIsClosingPolicyEditorPanel(false)
      setError(undefined)
      setShowDetails(false)
      setSelectedDiff(undefined)

      setUsing('')
      setCheck('')
      setShowCheckBlock(false)
      setFieldError(undefined)

      form.reset(defaultValues)
    } else {
      if (canUpdatePolicies) setShowTools(true)
      if (selectedPolicy !== undefined) {
        const { name, action, table, command, roles } = selectedPolicy
        form.reset({
          name,
          table,
          behavior: action.toLowerCase(),
          command: command.toLowerCase(),
          roles: roles.length === 1 && roles[0] === 'public' ? '' : roles.join(', '),
        })
        if (selectedPolicy.definition) setUsing(`  ${selectedPolicy.definition}`)
        if (selectedPolicy.check) setCheck(`  ${selectedPolicy.check}`)
        if (selectedPolicy.check && selectedPolicy.command !== 'INSERT') {
          setShowCheckBlock(true)
        }
      } else if (selectedTable !== undefined) {
        form.reset({ ...defaultValues, table: selectedTable })
      }
    }
  }, [visible])

  // whenever the deps (current policy details, new error or error panel opens) change, recalculate
  // the height of the editor
  useEffect(() => {
    editorOneRef.current?.layout({ width: 0, height: 0 })
    window.requestAnimationFrame(() => {
      editorOneRef.current?.layout()
    })
  }, [showDetails, error, errorPanelOpen])

  return (
    <>
      <Form_Shadcn_ {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
          <Sheet open={visible} onOpenChange={() => onClosingPanel()}>
            <SheetContent
              showClose={false}
              size={showTools ? 'lg' : 'default'}
              className={cn(
                'bg-surface-200 p-0 flex flex-row gap-0',
                showTools ? '!min-w-[1000px]' : '!min-w-[600px]'
              )}
            >
              <div className={cn('flex flex-col grow w-full', showTools && 'w-[60%]')}>
                <PolicyEditorPanelHeader
                  selectedPolicy={selectedPolicy}
                  showTools={showTools}
                  setShowTools={setShowTools}
                />

                <div className="flex flex-col h-full w-full justify-between overflow-y-auto">
                  <PolicyDetailsV2
                    schema={schema}
                    searchString={searchString}
                    selectedTable={selectedTable}
                    isEditing={selectedPolicy !== undefined}
                    form={form}
                    onUpdateCommand={(command: string) => {
                      setFieldError(undefined)
                      if (!['update', 'all'].includes(command)) {
                        setShowCheckBlock(false)
                      } else {
                        setShowCheckBlock(true)
                      }
                    }}
                    authContext={authContext}
                  />
                  <div className="h-full">
                    <LockedCreateQuerySection
                      schema={schema}
                      selectedPolicy={selectedPolicy}
                      formFields={{ name, table, behavior, command, roles }}
                    />

                    <div
                      className="mt-1 relative block"
                      style={{
                        height:
                          expOneContentHeight <= 100 ? `${8 + expOneContentHeight}px` : '108px',
                      }}
                    >
                      <RLSCodeEditor
                        disableTabToUsePlaceholder
                        readOnly={!canUpdatePolicies}
                        id="rls-exp-one-editor"
                        placeholder={
                          command === 'insert'
                            ? '-- Provide a SQL expression for the with check statement'
                            : '-- Provide a SQL expression for the using statement'
                        }
                        defaultValue={command === 'insert' ? check : using}
                        value={command === 'insert' ? check : using}
                        editorRef={editorOneRef}
                        monacoRef={monacoOneRef as any}
                        lineNumberStart={6}
                        onChange={() => {
                          setExpOneContentHeight(editorOneRef.current?.getContentHeight() ?? 0)
                          setExpOneLineCount(editorOneRef.current?.getModel()?.getLineCount() ?? 1)
                        }}
                        onMount={() => {
                          setTimeout(() => {
                            setExpOneContentHeight(editorOneRef.current?.getContentHeight() ?? 0)
                            setExpOneLineCount(
                              editorOneRef.current?.getModel()?.getLineCount() ?? 1
                            )
                          }, 200)
                        }}
                      />
                    </div>

                    <div className="bg-surface-300 py-1">
                      <div className="flex items-center" style={{ fontSize: '14px' }}>
                        <div className="w-[57px]">
                          <p className="w-[31px] flex justify-end font-mono text-sm text-foreground-light select-none">
                            {7 + expOneLineCount}
                          </p>
                        </div>
                        <p className="font-mono tracking-tighter">
                          {showCheckBlock ? (
                            <>
                              <span className="text-[#569cd6]">with check</span>{' '}
                              <span className="text-[#ffd700]">(</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[#ffd700]">)</span>;
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {showCheckBlock && (
                      <>
                        <div
                          className="mt-1 min-h-[28px] relative block"
                          style={{
                            height:
                              expTwoContentHeight <= 100 ? `${8 + expTwoContentHeight}px` : '108px',
                          }}
                        >
                          <RLSCodeEditor
                            disableTabToUsePlaceholder
                            readOnly={!canUpdatePolicies}
                            id="rls-exp-two-editor"
                            placeholder="-- Provide a SQL expression for the with check statement"
                            defaultValue={check}
                            value={check}
                            editorRef={editorTwoRef}
                            monacoRef={monacoTwoRef as any}
                            lineNumberStart={7 + expOneLineCount}
                            onChange={() => {
                              setExpTwoContentHeight(editorTwoRef.current?.getContentHeight() ?? 0)
                              setExpTwoLineCount(
                                editorTwoRef.current?.getModel()?.getLineCount() ?? 1
                              )
                            }}
                            onMount={() => {
                              setTimeout(() => {
                                setExpTwoContentHeight(
                                  editorTwoRef.current?.getContentHeight() ?? 0
                                )
                                setExpTwoLineCount(
                                  editorTwoRef.current?.getModel()?.getLineCount() ?? 1
                                )
                              }, 200)
                            }}
                          />
                        </div>
                        <div className="bg-surface-300 py-1">
                          <div className="flex items-center" style={{ fontSize: '14px' }}>
                            <div className="w-[57px]">
                              <p className="w-[31px] flex justify-end font-mono text-sm text-foreground-light select-none">
                                {8 + expOneLineCount + expTwoLineCount}
                              </p>
                            </div>
                            <p className="font-mono tracking-tighter">
                              <span className="text-[#ffd700]">)</span>;
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {isRenamingPolicy && (
                      <LockedRenameQuerySection
                        oldName={selectedPolicy.name}
                        newName={name}
                        schema={schema}
                        table={table}
                        lineNumber={8 + expOneLineCount + (showCheckBlock ? expTwoLineCount : 0)}
                      />
                    )}

                    {fieldError !== undefined && (
                      <p className="px-5 py-2 pb-0 text-sm text-red-900">{fieldError}</p>
                    )}

                    {supportWithCheck && (
                      <div className="px-5 py-3 flex items-center gap-x-2">
                        <Checkbox_Shadcn_
                          id="use-check"
                          name="use-check"
                          checked={showCheckBlock}
                          onCheckedChange={() => {
                            setFieldError(undefined)
                            setShowCheckBlock(!showCheckBlock)
                          }}
                        />
                        <Label_Shadcn_ className="text-xs cursor-pointer" htmlFor="use-check">
                          Use check expression
                        </Label_Shadcn_>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    {error !== undefined && (
                      <QueryError error={error} open={errorPanelOpen} setOpen={setErrorPanelOpen} />
                    )}
                    <SheetFooter className="flex items-center !justify-end px-5 py-4 w-full border-t">
                      <Button
                        type="default"
                        disabled={isExecuting || isUpdating}
                        onClick={() => onClosingPanel()}
                      >
                        Cancel
                      </Button>

                      <ButtonTooltip
                        form={formId}
                        htmlType="submit"
                        loading={isExecuting || isUpdating}
                        disabled={!canUpdatePolicies || isExecuting || isUpdating}
                        tooltip={{
                          content: {
                            side: 'top',
                            text: !canUpdatePolicies
                              ? 'You need additional permissions to update policies'
                              : undefined,
                          },
                        }}
                      >
                        Save policy
                      </ButtonTooltip>
                    </SheetFooter>
                  </div>
                </div>
              </div>
              {showTools && (
                <div
                  className={cn(
                    'border-l shadow-[rgba(0,0,0,0.13)_-4px_0px_6px_0px] z-10',
                    showTools && 'w-[50%]',
                    'bg-studio overflow-auto'
                  )}
                >
                  <Tabs_Shadcn_ defaultValue="templates" className="flex flex-col h-full w-full">
                    <TabsList_Shadcn_ className="flex gap-4 px-content pt-2">
                      <TabsTrigger_Shadcn_
                        key="templates"
                        value="templates"
                        className="px-0 data-[state=active]:bg-transparent"
                      >
                        Templates
                      </TabsTrigger_Shadcn_>
                    </TabsList_Shadcn_>

                    <TabsContent_Shadcn_
                      value="templates"
                      className={cn(
                        '!mt-0 overflow-y-auto',
                        'data-[state=active]:flex data-[state=active]:grow'
                      )}
                    >
                      <ScrollArea className="h-full w-full">
                        <PolicyTemplates
                          schema={schema}
                          table={table}
                          selectedPolicy={selectedPolicy}
                          selectedTemplate={selectedDiff}
                          onSelectTemplate={(value) => {
                            form.setValue('name', value.name)
                            form.setValue('behavior', 'permissive')
                            form.setValue('command', value.command.toLowerCase())
                            form.setValue('roles', value.roles.join(', ') ?? '')

                            setUsing(`  ${value.definition}`)
                            setCheck(`  ${value.check}`)
                            setExpOneLineCount(1)
                            setExpTwoLineCount(1)
                            setFieldError(undefined)

                            if (!['update', 'all'].includes(value.command.toLowerCase())) {
                              setShowCheckBlock(false)
                            } else if (value.check.length > 0) {
                              setShowCheckBlock(true)
                            } else {
                              setShowCheckBlock(false)
                            }
                          }}
                        />
                      </ScrollArea>
                    </TabsContent_Shadcn_>
                  </Tabs_Shadcn_>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </form>
      </Form_Shadcn_>

      <ConfirmationModal
        visible={isClosingPolicyEditorPanel}
        title="Discard changes"
        confirmLabel="Discard"
        onCancel={() => setIsClosingPolicyEditorPanel(false)}
        onConfirm={() => {
          onSelectCancel()
          setIsClosingPolicyEditorPanel(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to close the editor? Any unsaved changes on your policy and
          conversations with the Assistant will be lost.
        </p>
      </ConfirmationModal>
    </>
  )
})

PolicyEditorPanel.displayName = 'PolicyEditorPanel'
