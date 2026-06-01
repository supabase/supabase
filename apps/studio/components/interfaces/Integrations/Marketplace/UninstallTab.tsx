import { ConstrainedIntegrationTabScaffold } from '@/components/interfaces/Integrations/ConstrainedIntegrationTabScaffold'
import { MarkdownContent } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/MarkdownContent'
import { useIntegrationDetail } from '@/components/interfaces/Integrations/Landing/useIntegrationDetail'

export const UninstallTab = () => {
  const { integration } = useIntegrationDetail()

  return (
    <ConstrainedIntegrationTabScaffold>
      <div className="mx-auto max-w-2xl">
        <MarkdownContent content={integration?.uninstall_steps} />
      </div>
    </ConstrainedIntegrationTabScaffold>
  )
}
