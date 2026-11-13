import { useParams } from 'common'
import { useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { type CloudProvider } from 'shared-data'
import {
  Checkbox,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Input,
  useWatch,
} from 'ui'
import { CollapsibleCardSection } from 'ui-patterns/CollapsibleCardSection'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CloudProviderSelector } from './CloudProviderSelector'
import { PostgresVersionSelector } from './PostgresVersionSelector'
import { CreateProjectForm } from './ProjectCreation.schema'
import Panel from '@/components/ui/Panel'
import { useIsV3AdvancedDeploymentEnabled } from '@/hooks/misc/useIsV3AdvancedDeploymentEnabled'

interface InternalOnlyConfigurationProps {
  form: UseFormReturn<CreateProjectForm>
}

export const InternalOnlyConfiguration = ({ form }: InternalOnlyConfigurationProps) => {
  const { slug } = useParams()
  const showNonProdFields = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'
  const v3AdvancedDeploymentEnabled = useIsV3AdvancedDeploymentEnabled(slug)
  const canConfigureDeployment = showNonProdFields || v3AdvancedDeploymentEnabled
  const highAvailability = useWatch({ control: form.control, name: 'highAvailability' })
  const cloudProvider = useWatch({ control: form.control, name: 'cloudProvider' })
  const dbRegion = useWatch({ control: form.control, name: 'dbRegion' })
  const kubernetesClusterId = useWatch({ control: form.control, name: 'kubernetesClusterId' })
  const useOrioleDbForCreate = useWatch({ control: form.control, name: 'useOrioleDb' })
  const canOverrideCluster =
    canConfigureDeployment &&
    (cloudProvider === 'AWS_K8S' || (showNonProdFields && cloudProvider === 'AWS_NIMBUS'))
  // Held here (outside the collapsible content) so the selector's last valid
  // selection survives the section being collapsed and reopened.
  const lastValidPostgresVersionSelection = useRef('')

  return (
    <Panel.Content>
      <CollapsibleCardSection
        title="Internal-only Configuration"
        description="Configure additional project deployment settings"
      >
        <div className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-4">
            <FormField
              control={form.control}
              name="postgresVersionSelection"
              render={({ field }) => (
                <PostgresVersionSelector
                  field={field}
                  form={form}
                  cloudProvider={cloudProvider as CloudProvider}
                  organizationSlug={slug}
                  dbRegion={dbRegion}
                  disabled={highAvailability}
                  highAvailability={highAvailability}
                  lastValidSelectionRef={lastValidPostgresVersionSelection}
                  useOrioleDbForCreate={useOrioleDbForCreate}
                  description={
                    useOrioleDbForCreate
                      ? undefined
                      : 'Choose OrioleDB in the advanced configuration if you want to use it'
                  }
                />
              )}
            />
          </div>

          {canConfigureDeployment && <CloudProviderSelector form={form} />}

          {showNonProdFields && (
            <div>
              <p className="text-xs text-foreground-lighter mb-6">
                The settings below are only applicable for local/staging projects
              </p>
              <div className="flex flex-col gap-y-4">
                {!highAvailability && (
                  <FormField
                    control={form.control}
                    name="postgresVersion"
                    render={({ field }) => (
                      <FormItemLayout
                        label="Custom Postgres version"
                        layout="horizontal"
                        description="Specify a custom version of Postgres (defaults to the latest)."
                      >
                        <FormControl>
                          <Input placeholder="e.g 17.6.1.104" {...field} autoComplete="off" />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="instanceType"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Custom instance type"
                      layout="horizontal"
                      description="Specify a custom instance type."
                    >
                      <FormControl>
                        <Input placeholder="e.g t3.nano" {...field} autoComplete="off" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </div>
            </div>
          )}

          {canOverrideCluster && (
            <FormField
              control={form.control}
              name="kubernetesClusterId"
              render={({ field }) => (
                <FormItemLayout
                  label="Kubernetes cluster ID"
                  layout="horizontal"
                  description="Override the Kubernetes cluster this project is created on, bypassing load-balancing. Use the full cluster ID (e.g. dev-gbl-a001-c003-k001-0-eksCluster-038b450), not the short cluster name (e.g. dev-gbl-a001-c003-k001)."
                >
                  <FormControl>
                    {/* The backend matches against the kubernetes_clusters.id primary
                              key, which is the full `<cluster-name>-eksCluster-<hash>` value —
                              not the short cluster name shown elsewhere (e.g. admin_studio's
                              project page). The short name alone won't match any cluster. */}
                    <Input
                      placeholder="e.g dev-gbl-a001-c003-k001-0-eksCluster-038b450"
                      {...field}
                      autoComplete="off"
                    />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          )}

          {canOverrideCluster && !!kubernetesClusterId && (
            <FormField
              control={form.control}
              name="kubernetesClusterForce"
              render={({ field }) => (
                <FormItem className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={field.disabled}
                      onCheckedChange={(value) => field.onChange(value === true)}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-sm text-foreground">
                      Force-deploy to this cluster
                    </FormLabel>
                    <FormDescription className="text-foreground-lighter">
                      Allows deliberately targeting a CORDONED cluster. PENDING and REMOVED clusters
                      remain ineligible, and the cluster still needs a mapped filesystem to
                      provision onto.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}
        </div>
      </CollapsibleCardSection>
    </Panel.Content>
  )
}
