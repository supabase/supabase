import { useRouter } from 'next/router'
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Separator,
  Input_Shadcn_ as Input,
  Label_Shadcn_ as Label,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Button_Shadcn_,
} from 'ui'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Check, Copy } from 'lucide-react'
import { Tabs } from 'ui'
import { CodeBlock, type CodeBlockLang } from '@ui/components/CodeBlock/CodeBlock'

import DefaultLayout from 'components/layouts/DefaultLayout'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useEdgeFunctionDeployMutation } from 'data/edge-functions/edge-functions-deploy-mutation'
import recipesData from 'lib/recipes.json' // Assuming recipes.json is in lib
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { toast } from 'sonner'
import { wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { isRoleImpersonationEnabled, useGetImpersonatedRole } from 'state/role-impersonation-state'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import type { NextPageWithLayout } from 'types'
import Image from 'next/image'

const LOCAL_STORAGE_KEY = 'package-manager-recipe-command'
type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

function RecipeCommandCopyButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  return (
    <Button_Shadcn_
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={() => {
        navigator.clipboard.writeText(command)
        setCopied(true)
        toast.success('Copied command to clipboard!')
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button_Shadcn_>
  )
}

function RecipeCommand({ name }: { name: string }) {
  const [value, setValue] = useState<PackageManager>('npm')

  const commands = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const componentPath = `/api/projects/templates/ui/${name}.json`
    return {
      npm: `npx shadcn-ui@latest add ${baseUrl}${componentPath}`,
      pnpm: `pnpm dlx shadcn-ui@latest add ${baseUrl}${componentPath}`,
      yarn: `yarn dlx shadcn-ui@latest add ${baseUrl}${componentPath}`,
      bun: `bunx --bun shadcn-ui@latest add ${baseUrl}${componentPath}`,
    }
  }, [name])

  useEffect(() => {
    const storedManager = localStorage.getItem(LOCAL_STORAGE_KEY) as PackageManager | null
    if (storedManager && commands[storedManager]) {
      setValue(storedManager)
    }
  }, [commands])

  const handleValueChange = (newValue: string) => {
    const newManager = newValue as PackageManager
    setValue(newManager)
    localStorage.setItem(LOCAL_STORAGE_KEY, newManager)
  }

  return (
    <Tabs_Shadcn_ value={value} onValueChange={handleValueChange} className="w-full">
      <div className="w-full group relative rounded-lg bg-surface-100 px-4 py-2 overflow-hidden border">
        <motion.div
          className="absolute inset-0 bg-gradient-to-l from-transparent via-white to-transparent opacity-10 z-0"
          initial={{ x: '100%' }}
          animate={{ x: '-100%' }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
            ease: 'linear',
            repeatType: 'loop',
          }}
        />
        <div className="flex flex-col">
          <TabsList_Shadcn_ className="gap-2 relative mb-2 z-10 h-7">
            {(Object.keys(commands) as PackageManager[]).map((manager) => (
              <TabsTrigger_Shadcn_ key={manager} value={manager} className="text-xs h-5 px-1.5">
                {manager}
              </TabsTrigger_Shadcn_>
            ))}
          </TabsList_Shadcn_>

          {(Object.keys(commands) as PackageManager[]).map((manager) => (
            <TabsContent_Shadcn_ key={manager} value={manager} className="m-0">
              <div className="flex items-center">
                <div className="flex-1 font-mono text-sm text-foreground relative z-10 overflow-x-auto whitespace-nowrap scrollbar-hide pr-2">
                  <span className="mr-2 text-[#888]">$</span>
                  {commands[manager]}
                </div>
                <div className="relative z-10 pl-2">
                  <RecipeCommandCopyButton command={commands[manager]} />
                </div>
              </div>
            </TabsContent_Shadcn_>
          ))}
        </div>
      </div>
    </Tabs_Shadcn_>
  )
}

interface Step {
  id: string
  title: string
  description: string
  type: 'sql' | 'edge_function' | 'manual' | 'final' | 'front'
  action: any
  command?: string
  files?: { path: string; content: string }[]
  skippable?: boolean
}

interface Recipe {
  id: string
  name: string
  introduction: {
    title: string
    description: string
    image?: string
  }
  steps: Step[]
}

const RecipePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = router.query
  const project = useSelectedProject()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [stepVariables, setStepVariables] = useState<string[]>([])
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [substitutedContent, setSubstitutedContent] = useState<any>(null)

  const getImpersonatedRole = useGetImpersonatedRole()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()
  const { data: databases } = useReadReplicasQuery({ projectRef: ref as string | undefined })

  const { mutate: executeSql, isLoading: isExecutingSql } = useExecuteSqlMutation({
    onSuccess: () => {
      toast.success('SQL step executed successfully!')
      handleNext()
    },
    onError: (error) => {
      toast.error(`Failed to execute SQL: ${error.message}`)
      setIsLoading(false)
    },
  })

  const { mutate: deployFunction, isLoading: isDeployingFunction } = useEdgeFunctionDeployMutation({
    onSuccess: () => {
      toast.success('Edge function deployed successfully!')
      handleNext()
    },
    onError: (error: any) => {
      toast.error(`Failed to deploy edge function: ${error.message}`)
      setIsLoading(false)
    },
  })

  const extractVariables = useCallback((content: any): string[] => {
    if (!content) return []
    const regex = /{{\s*(\w+)\s*}}/g
    let matches: string[] = []
    let contentString = ''

    if (typeof content === 'string') {
      contentString = content
    } else if (typeof content === 'object' && content !== null) {
      if (content.slug && typeof content.slug === 'string') {
        contentString += content.slug + '\n'
      }
      if (content.name && typeof content.name === 'string') {
        contentString += content.name + '\n'
      }
      if (content.command && typeof content.command === 'string') {
        contentString += content.command + '\n'
      }
      if (Array.isArray(content.files)) {
        contentString += content.files.map((f: any) => f.content || '').join('\n')
      }
    }

    let match
    while ((match = regex.exec(contentString)) !== null) {
      matches.push(match[1])
    }
    return [...new Set(matches)]
  }, [])

  const substituteVariables = useCallback((content: any, values: Record<string, string>): any => {
    if (!content) return content

    let substituted = JSON.parse(JSON.stringify(content))

    const performSubstitution = (text: string): string => {
      let result = text
      let regex: RegExp
      for (const key in values) {
        if (values[key]) {
          regex = new RegExp(`{{\s*${key}\s*}}`, 'g')
          result = result.replace(regex, values[key])
        }
      }
      return result
    }

    if (typeof substituted === 'string') {
      substituted = performSubstitution(substituted)
    } else if (Array.isArray(substituted.files)) {
      substituted.files = substituted.files.map((file: any) => ({
        ...file,
        content: performSubstitution(file.content || ''),
      }))
    }
    if (typeof substituted === 'object' && substituted !== null) {
      if (substituted.slug && typeof substituted.slug === 'string') {
        substituted.slug = performSubstitution(substituted.slug)
      }
      if (substituted.name && typeof substituted.name === 'string') {
        substituted.name = performSubstitution(substituted.name)
      }
    }

    return substituted
  }, [])

  useEffect(() => {
    if (recipe && recipe.steps[currentStepIndex]) {
      const currentStep = recipe.steps[currentStepIndex]
      const contentToScan =
        currentStep.type === 'front'
          ? { command: currentStep.command, files: currentStep.files }
          : currentStep.action
      const variables = extractVariables(contentToScan)
      setStepVariables(variables)
      setVariableValues({})
    }
  }, [recipe, currentStepIndex, extractVariables])

  useEffect(() => {
    if (recipe && recipe.steps[currentStepIndex]) {
      const currentStep = recipe.steps[currentStepIndex]
      const contentToSubstitute =
        currentStep.type === 'front'
          ? { command: currentStep.command, files: currentStep.files }
          : currentStep.action
      const substituted = substituteVariables(contentToSubstitute, variableValues)
      setSubstitutedContent(substituted)
    } else {
      setSubstitutedContent(null)
    }
  }, [recipe, currentStepIndex, variableValues, substituteVariables])

  const handleVariableChange = (varName: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [varName]: value }))
  }

  useEffect(() => {
    if (id) {
      const foundRecipe = recipesData.find((r) => r.id === id) as Recipe | undefined
      setRecipe(foundRecipe || null)
    }
  }, [id])

  const handleNext = () => {
    if (!recipe) return

    // Reset substituted content on step transition to avoid stale state issues
    setSubstitutedContent(null)

    const nextStepIndex = currentStepIndex + 1
    if (nextStepIndex < recipe.steps.length) {
      setCurrentStepIndex(nextStepIndex)
    }
    setIsLoading(false)
  }

  const runCurrentStepAction = () => {
    if (currentStepIndex < 0) {
      handleNext()
      return
    }

    if (!recipe || !project || !ref) return

    const step = recipe.steps[currentStepIndex]
    setIsLoading(true)

    const finalActionContent = substituteVariables(step.action, variableValues)

    console.log(finalActionContent)

    switch (step.type) {
      case 'sql':
        if (!finalActionContent) {
          toast.error('Cannot execute SQL: Missing content')
          setIsLoading(false)
          return
        }
        executeSql({
          projectRef: project.ref,
          connectionString: project?.connectionString,
          sql: finalActionContent,
        })
        break
      case 'edge_function':
        if (!finalActionContent?.slug || !finalActionContent?.files) {
          toast.error('Cannot deploy function: Missing slug or files')
          setIsLoading(false)
          return
        }
        deployFunction({
          projectRef: project.ref,
          slug: finalActionContent.slug,
          metadata: {
            entrypoint_path: finalActionContent.entrypoint_path,
            name: finalActionContent.name,
            verify_jwt: finalActionContent.verify_jwt,
          },
          files: finalActionContent.files,
        })
        break
      case 'manual':
      case 'final':
      case 'front':
        handleNext()
        break
      default:
        console.warn('Unknown step type:', step.type)
        setIsLoading(false)
        break
    }
  }

  const rightPanelContent = useMemo(() => {
    const isIntro = currentStepIndex === -1
    const stepForPanel = !isIntro && recipe ? recipe.steps[currentStepIndex] : null

    if (isIntro) return 'intro'
    if (!stepForPanel) return 'loading'

    switch (stepForPanel.type) {
      case 'sql':
        return substitutedContent ? 'sql_code' : 'variable_needed'
      case 'edge_function':
        return substitutedContent?.files?.length > 0 ? 'edge_function_files' : 'variable_needed'
      case 'front':
        return stepForPanel.files && stepForPanel.files?.length > 0
          ? 'front_files'
          : 'front_no_files'
      case 'manual':
        return 'manual_prompt'
      case 'final':
        return 'final_prompt'
      default:
        return 'loading'
    }
  }, [currentStepIndex, recipe, substitutedContent])

  if (!recipe) {
    return (
      <div className="flex items-center justify-center h-full">
        {id ? (
          <Alert title="Recipe not found" variant="warning">
            Could not find a recipe with ID: {id}
          </Alert>
        ) : (
          <Loader2 className="animate-spin" />
        )}
      </div>
    )
  }

  const currentStep = currentStepIndex >= 0 ? recipe.steps[currentStepIndex] : null
  const isIntroductionStep = currentStepIndex === -1
  const isLastStep = currentStepIndex === recipe.steps.length - 1

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-grow overflow-auto">
        <div className="flex flex-col space-y-4 bg-surface-100/25 p-24 border-r border-muted overflow-y-auto justify-center">
          {isIntroductionStep ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{recipe.introduction.title}</h2>
              <p className="text-sm text-foreground-light">{recipe.introduction.description}</p>
            </div>
          ) : currentStep ? (
            <div>
              <Badge
                variant={
                  currentStep.type === 'sql'
                    ? 'brand'
                    : currentStep.type === 'edge_function'
                      ? 'warning'
                      : currentStep.type === 'front'
                        ? 'success'
                        : 'default'
                }
              >
                {currentStep.type.replace('_', ' ').toUpperCase()}
              </Badge>
              <h3 className="text-md font-semibold mt-4 mb-2">{currentStep.title}</h3>
              <p className="text-sm text-foreground-light">{currentStep.description}</p>
            </div>
          ) : null}

          {!isIntroductionStep && currentStep?.type === 'front' && currentStep.command && (
            <div className="pt-4">
              <h3 className="text-xs font-mono tracking-wide text-foreground-light mb-3">
                INSTALL COMMAND
              </h3>
              <RecipeCommand name={currentStep.command} />
            </div>
          )}

          <div className="mt-auto">
            {!isIntroductionStep && stepVariables.length > 0 && (
              <div className="space-y-2 pt-4">
                <h3 className="text-xs font-mono tracking-wide text-foreground-light mb-4">
                  STEP VARIABLES
                </h3>
                <div className="space-y-4">
                  {stepVariables.map((varName) => (
                    <div key={varName}>
                      <Label htmlFor={`var-${varName}`} className="block mb-2">
                        {varName}
                      </Label>
                      <Input
                        id={`var-${varName}`}
                        size="small"
                        value={variableValues[varName] || ''}
                        onChange={(e) => handleVariableChange(varName, e.target.value)}
                        placeholder={`Enter value for {{${varName}}}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col bg-surface-75 overflow-auto h-full">
          {rightPanelContent === 'intro' && (
            <div className="relative flex items-center justify-center h-full text-foreground-lighter text-sm">
              {recipe?.introduction.image ? (
                <Image
                  src={recipe.introduction.image}
                  layout="fill"
                  objectFit="contain"
                  alt="Recipe Introduction"
                  className="opacity-50"
                />
              ) : (
                'Code for the steps will appear here.'
              )}
            </div>
          )}

          {rightPanelContent === 'sql_code' && (
            <CodeBlock
              language="sql"
              className="!bg-surface-75 flex-grow h-full border-none rounded-none !py-3"
              wrapperClassName="h-full flex-grow flex flex-col"
              hideLineNumbers={false}
            >
              {substitutedContent}
            </CodeBlock>
          )}

          {rightPanelContent === 'edge_function_files' && (
            <Tabs type="underlined" size="small" baseClassNames="flex flex-col flex-grow h-full">
              {substitutedContent.files.map((file: any, index: number) => (
                <Tabs.Panel
                  key={file.name || `file-${index}`}
                  id={file.name || `file-${index}`}
                  label={file.name || `File ${index + 1}`}
                  className="flex flex-col flex-grow h-full"
                >
                  <CodeBlock
                    language="ts"
                    wrapperClassName="h-full flex-grow flex flex-col"
                    className="!bg-surface-75 flex-grow h-full border-none rounded-none !py-3"
                    hideLineNumbers={false}
                  >
                    {file.content}
                  </CodeBlock>
                </Tabs.Panel>
              ))}
            </Tabs>
          )}

          {rightPanelContent === 'front_files' && (
            <Tabs_Shadcn_
              defaultValue={currentStep?.files?.[0]?.path || 'file-0'}
              className="flex flex-col flex-grow h-full"
            >
              <TabsList_Shadcn_ className="border-b gap-4 px-4">
                {currentStep?.files?.map((file: any, index: number) => (
                  <TabsTrigger_Shadcn_
                    key={file.path || `file-${index}`}
                    value={file.path || `file-${index}`}
                  >
                    {file.path?.split('/').pop() || `File ${index + 1}`}
                  </TabsTrigger_Shadcn_>
                ))}
              </TabsList_Shadcn_>
              {currentStep?.files?.map((file: any, index: number) => (
                <TabsContent_Shadcn_
                  key={file.path || `file-${index}`}
                  value={file.path || `file-${index}`}
                >
                  <CodeBlock
                    language="ts"
                    wrapperClassName="h-full flex-grow flex flex-col"
                    className="!bg-surface-75 flex-grow h-full border-none rounded-none !py-3"
                    hideLineNumbers={false}
                  >
                    {file.content}
                  </CodeBlock>
                </TabsContent_Shadcn_>
              ))}
            </Tabs_Shadcn_>
          )}

          {rightPanelContent === 'variable_needed' && (
            <div className="flex items-center justify-center h-full text-foreground-lighter text-sm">
              Fill in variables to see the code.
            </div>
          )}

          {rightPanelContent === 'manual_prompt' && (
            <div className="flex items-center justify-center h-full text-foreground-lighter text-sm">
              Follow the instructions in the left panel.
            </div>
          )}

          {rightPanelContent === 'final_prompt' && (
            <div className="flex items-center justify-center h-full text-foreground-lighter text-sm">
              Recipe complete!
            </div>
          )}

          {rightPanelContent === 'front_no_files' && (
            <div className="flex items-center justify-center h-full text-foreground-lighter text-sm">
              No file previews for this step. Run the command in your project.
            </div>
          )}

          {rightPanelContent === 'loading' && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin" />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between p-4 border-t bg-surface-200">
        <div></div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-foreground-light">
            Step:{' '}
            {isIntroductionStep
              ? 'Introduction'
              : `${currentStepIndex + 1} / ${recipe.steps.length}`}
          </p>
          {!isIntroductionStep && currentStep?.skippable && currentStep?.type !== 'final' && (
            <Button
              type="default"
              onClick={handleNext}
              disabled={isLoading || isExecutingSql || isDeployingFunction}
            >
              Skip Step
            </Button>
          )}
          <Button
            type="primary"
            onClick={runCurrentStepAction}
            loading={isLoading || (!isIntroductionStep && (isExecutingSql || isDeployingFunction))}
            disabled={
              isLoading ||
              (!isIntroductionStep &&
                (isExecutingSql || isDeployingFunction || currentStep?.type === 'final'))
            }
            iconRight={isIntroductionStep || currentStep?.type !== 'final' ? <ArrowRight /> : null}
          >
            {isIntroductionStep
              ? 'Start Recipe'
              : currentStep?.type === 'final'
                ? 'Finished'
                : isLastStep
                  ? 'Finish Step'
                  : currentStep?.type === 'sql'
                    ? 'Run SQL & Next'
                    : currentStep?.type === 'edge_function'
                      ? 'Deploy Function & Next'
                      : 'Next Step'}
          </Button>
        </div>
      </div>
    </div>
  )
}

RecipePage.getLayout = (page: React.ReactNode) => <DefaultLayout>{page}</DefaultLayout>

export default RecipePage
