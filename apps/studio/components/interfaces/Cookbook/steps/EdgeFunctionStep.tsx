import { useMemo, useState } from 'react'
import { EdgeFunctionBlock } from 'components/ui/EdgeFunctionBlock/EdgeFunctionBlock'
import { ConfirmFooter } from 'components/ui/AIAssistantPanel/ConfirmFooter'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { deployEdgeFunction } from 'data/edge-functions/edge-functions-deploy-mutation'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { parseTemplateVariables } from 'lib/cookbook/template-parser'
import type { EdgeFunctionStep as EdgeFunctionStepType, RecipeContext } from 'types/cookbook'

interface EdgeFunctionStepProps {
  step: EdgeFunctionStepType
  context: RecipeContext
  projectRef: string
  onComplete: (outputs?: Record<string, any>) => void
  isActive: boolean
  isCompleted: boolean
  isDisabled: boolean
}

export function EdgeFunctionStep({
  step,
  context,
  projectRef,
  onComplete,
  isActive,
  isCompleted,
  isDisabled,
}: EdgeFunctionStepProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [isDeployed, setIsDeployed] = useState(false)
  const [errorText, setErrorText] = useState<string>()
  const [showReplaceWarning, setShowReplaceWarning] = useState(false)

  // Parse function content with context variables
  const parsedContent = parseTemplateVariables(step.run.content, context)
  const functionName = parseTemplateVariables(step.run.deploy.name, context)

  const { data: settings } = useProjectSettingsV2Query({ projectRef }, { enabled: !!projectRef })
  const { data: existingFunction } = useEdgeFunctionQuery(
    { projectRef, slug: functionName },
    { enabled: !!projectRef && !!functionName }
  )

  const functionUrl = useMemo(() => {
    const endpoint = settings?.app_config?.endpoint
    if (!endpoint || !projectRef || !functionName) return undefined

    try {
      const url = new URL(`https://${endpoint}`)
      const restUrlTld = url.hostname.split('.').pop()
      return restUrlTld
        ? `https://${projectRef}.supabase.${restUrlTld}/functions/v1/${functionName}`
        : undefined
    } catch (error) {
      return undefined
    }
  }, [settings?.app_config?.endpoint, projectRef, functionName])

  const deploymentDetailsUrl = useMemo(() => {
    if (!projectRef || !functionName) return undefined
    return `/project/${projectRef}/functions/${functionName}/details`
  }, [projectRef, functionName])

  const downloadCommand = useMemo(() => {
    if (!functionName) return undefined
    return `supabase functions download ${functionName}`
  }, [functionName])

  const performDeploy = async () => {
    setIsDeploying(true)
    setErrorText(undefined)

    try {
      const files = [
        {
          name: 'index.ts',
          content: parsedContent,
        },
      ]

      const data = await deployEdgeFunction({
        projectRef,
        slug: functionName,
        metadata: {
          entrypoint_path: 'index.ts',
          name: functionName,
          verify_jwt: false,
        },
        files,
      })

      setIsDeployed(true)

      // Parse outputs if defined
      let outputs: Record<string, any> | undefined
      if (step.output) {
        outputs = {}
        Object.entries(step.output).forEach(([key, template]) => {
          outputs![key] = parseTemplateVariables(template, context, { ...data, url: functionUrl })
        })
      }

      setShowReplaceWarning(false)

      // Auto-advance after successful deployment
      setTimeout(() => {
        onComplete(outputs)
      }, 1000)
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to deploy edge function')
    } finally {
      setIsDeploying(false)
    }
  }

  const handleDeploy = () => {
    if (isDeploying) return

    if (existingFunction) {
      setShowReplaceWarning(true)
      return
    }

    void performDeploy()
  }

  const showConfirmFooter = isActive && !isCompleted && !isDeployed

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-medium mb-1">{step.title}</h3>
        <p className="text-sm text-foreground-light">{step.description}</p>
      </div>

      <div className="w-auto overflow-x-hidden">
        <EdgeFunctionBlock
          label={`Edge Function: ${functionName}`}
          code={parsedContent}
          functionName={functionName}
          disabled={isDisabled || isCompleted || showConfirmFooter}
          isDeploying={isDeploying}
          isDeployed={isDeployed}
          errorText={errorText}
          functionUrl={functionUrl}
          deploymentDetailsUrl={deploymentDetailsUrl}
          downloadCommand={downloadCommand}
          showReplaceWarning={showReplaceWarning}
          onCancelReplace={() => setShowReplaceWarning(false)}
          onConfirmReplace={() => void performDeploy()}
          onDeploy={handleDeploy}
          hideDeployButton={showConfirmFooter}
        />
        {showConfirmFooter && (
          <div className="mx-4">
            <ConfirmFooter
              message="Ready to deploy this Edge Function?"
              cancelLabel="Skip"
              confirmLabel="Deploy"
              isLoading={isDeploying}
              onCancel={() => {
                // Skip - do nothing, user can come back later
              }}
              onConfirm={handleDeploy}
            />
          </div>
        )}
      </div>
    </div>
  )
}
