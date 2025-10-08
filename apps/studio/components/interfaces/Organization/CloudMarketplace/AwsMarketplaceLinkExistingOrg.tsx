import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@ui/lib/utils'
import { Boxes, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { RadioGroupCard, RadioGroupCardItem } from '@ui/components/radio-group-card'
import { useOrganizationLinkAwsMarketplaceMutation } from 'data/organizations/organization-link-aws-marketplace-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { DOCS_URL } from 'lib/constants'
import { Organization } from 'types'
import {
  Button,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Form_Shadcn_,
  FormField_Shadcn_,
  Skeleton,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '../../../layouts/Scaffold'
import { ActionCard } from '../../../ui/ActionCard'
import { ButtonTooltip } from '../../../ui/ButtonTooltip'
import AwsMarketplaceAutoRenewalWarning from './AwsMarketplaceAutoRenewalWarning'
import AwsMarketplaceOnboardingSuccessModal from './AwsMarketplaceOnboardingSuccessModal'
import { CloudMarketplaceOnboardingInfo } from './cloud-marketplace-query'
import NewAwsMarketplaceOrgModal from './NewAwsMarketplaceOrgModal'

interface Props {
  organizations?: Organization[] | undefined
  onboardingInfo?: CloudMarketplaceOnboardingInfo | undefined
  isLoadingOnboardingInfo: boolean
}

const FormSchema = z.object({
  orgSlug: z.string(),
})

export type LinkExistingOrgForm = z.infer<typeof FormSchema>

const AwsMarketplaceLinkExistingOrg = ({
  organizations,
  onboardingInfo,
  isLoadingOnboardingInfo,
}: Props) => {
  const router = useRouter()
  const {
    query: { buyer_id: buyerId },
  } = router

  const form = useForm<LinkExistingOrgForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      orgSlug: undefined,
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const isDirty = !!Object.keys(form.formState.dirtyFields).length

  // Sort organizations by name ascending
  const sortedOrganizations = useMemo(() => {
    return organizations?.slice().sort((a, b) => a.name.localeCompare(b.name))
  }, [organizations])

  const { orgsLinkable, orgsNotLinkable } = useMemo(() => {
    const orgQualifiesForLinking = (org: Organization) => {
      const validationResult = onboardingInfo?.organization_linking_eligibility.find(
        (result) => result.slug === org.slug
      )

      return validationResult?.is_eligible ?? false
    }

    const linkable: Organization[] = []
    const notLinkable: Organization[] = []
    sortedOrganizations?.forEach((org) => {
      if (orgQualifiesForLinking(org)) {
        linkable.push(org)
      } else {
        notLinkable.push(org)
      }
    })
    return { orgsLinkable: linkable, orgsNotLinkable: notLinkable }
  }, [sortedOrganizations, onboardingInfo?.organization_linking_eligibility])

  const { data } = useProjectsQuery()
  const projects = data?.projects ?? []

  const [isNotLinkableOrgListOpen, setIsNotLinkableOrgListOpen] = useState(false)
  const [orgLinkedSuccessfully, setOrgLinkedSuccessfully] = useState(false)
  const [showOrgCreationDialog, setShowOrgCreationDialog] = useState(false)
  const [orgToRedirectTo, setOrgToRedirectTo] = useState('')

  const { mutate: linkOrganization, isLoading: isLinkingOrganization } =
    useOrganizationLinkAwsMarketplaceMutation({
      onSuccess: (_) => {
        //TODO(thomas): send tracking event?
        setOrgLinkedSuccessfully(true)
        setOrgToRedirectTo(form.getValues('orgSlug'))
      },
      onError: (res) => {
        toast.error(res.message, {
          duration: 7_000,
        })
      },
    })

  const onSubmit: SubmitHandler<LinkExistingOrgForm> = async (values) => {
    linkOrganization({ slug: values.orgSlug, buyerId: buyerId as string })
  }

  return (
    <>
      {onboardingInfo && !onboardingInfo.aws_contract_auto_renewal && (
        <AwsMarketplaceAutoRenewalWarning
          awsContractEndDate={onboardingInfo.aws_contract_end_date}
          awsContractSettingsUrl={onboardingInfo.aws_contract_settings_url}
        />
      )}
      <ScaffoldSection>
        <ScaffoldSectionDetail className="text-base">
          <>
            <p>
              You’ve subscribed to the Supabase {onboardingInfo?.plan_name_selected_on_marketplace}{' '}
              Plan via the AWS Marketplace. As a final step, you need to link a Supabase
              organization to that subscription. Select the organization you want to be managed and
              billed through AWS.
            </p>

            <p>
              You can read more on billing through AWS in our {''}
              {/*TODO(thomas): Update docs link once the new docs exist*/}
              <Link href={`${DOCS_URL}/guides/platform`} target="_blank" className="underline">
                Billing Docs.
              </Link>
            </p>

            <p className="mt-10">
              <span className="font-bold text-foreground-light">Want to start fresh?</span> Create a
              new organization and it will be linked automatically.
            </p>
            <Button
              size="tiny"
              htmlType="submit"
              type="primary"
              onClick={async (e) => {
                e.preventDefault()
                setShowOrgCreationDialog(true)
              }}
            >
              Create organization
            </Button>
          </>
        </ScaffoldSectionDetail>

        <ScaffoldSectionContent className="lg:ml-10">
          <Form_Shadcn_ {...form}>
            <form className="flex flex-col">
              <FormField_Shadcn_
                name="orgSlug"
                control={form.control}
                render={({ field }) => (
                  <RadioGroupCard
                    {...field}
                    defaultValue={field.value}
                    onValueChange={(value: string) => {
                      form.setValue('orgSlug', value, {
                        shouldDirty: true,
                        shouldValidate: false,
                      })
                    }}
                  >
                    <FormItemLayout id={field.name}>
                      <div className={'grid gap-4 grid-cols-1'}>
                        {isLoadingOnboardingInfo ? (
                          Array(3)
                            .fill(0)
                            .map((_, i) => (
                              <Skeleton key={i} className="w-full h-[110px] rounded-md" />
                            ))
                        ) : (
                          <>
                            <p className="font-bold text-foreground-light">
                              Organizations that can be linked
                            </p>
                            {orgsLinkable.length === 0 ? (
                              <p className="text-sm text-foreground-light">
                                None of your organizations can be linked to your AWS Marketplace
                                subscription at the moment.
                              </p>
                            ) : (
                              <>
                                {orgsLinkable.map((org) => {
                                  const numProjects = projects.filter(
                                    (p) => p.organization_slug === org.slug
                                  ).length
                                  return (
                                    <RadioGroupCardItem
                                      id={org.slug}
                                      key={org.slug}
                                      showIndicator={false}
                                      value={org.slug}
                                      className={cn(
                                        'relative text-sm text-left flex flex-col gap-0 p-0 [&_label]:w-full group] w-full'
                                      )}
                                      label={
                                        <ActionCard
                                          className="[&>div]:items-center border-0 bg-surface-0 group-data-[state=checked]:opacity-100"
                                          key={org.id}
                                          icon={
                                            <Boxes
                                              size={18}
                                              strokeWidth={1}
                                              className="text-foreground"
                                            />
                                          }
                                          title={org.name}
                                          description={`${org.plan.name} Plan • ${numProjects > 0 ? `${numProjects} Project${numProjects > 1 ? 's' : ''}` : '0 Projects'}`}
                                        />
                                      }
                                    />
                                  )
                                })}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </FormItemLayout>
                  </RadioGroupCard>
                )}
              />
            </form>
          </Form_Shadcn_>

          {orgsNotLinkable.length > 0 && !isLoadingOnboardingInfo && (
            <Collapsible_Shadcn_
              className="-space-y-px"
              open={isNotLinkableOrgListOpen || orgsLinkable.length === 0}
              onOpenChange={() => setIsNotLinkableOrgListOpen((prev) => !prev)}
            >
              <CollapsibleTrigger_Shadcn_ className="py-2 w-full flex items-center group justify-between">
                <p className="text-xs font-bold text-foreground-light">
                  Organizations that can't be linked
                </p>
                <ChevronRight
                  size={16}
                  className="text-foreground-lighter transition-all group-data-[state=open]:rotate-90"
                  strokeWidth={1}
                />
              </CollapsibleTrigger_Shadcn_>
              <CollapsibleContent_Shadcn_
                className={cn(
                  'flex flex-col gap-4 transition-all',
                  'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'
                )}
              >
                <p className="text-foreground-light text-xs">
                  The following organizations can’t be linked to your AWS Marketplace subscription
                  at the moment. This may be due to missing permissions, outstanding invoices, or an
                  existing marketplace link. If you'd like to link one of these organizations,
                  please review the organization settings. You need to be Owner or Administrator of
                  the organization to link it.
                </p>
                <div className="text-sm text-left flex flex-col gap-4 p-0 [&_label]:w-full group] w-full opacity-60">
                  {orgsNotLinkable.map((org) => {
                    const numProjects = projects.filter(
                      (p) => p.organization_slug === org.slug
                    ).length
                    return (
                      <ActionCard
                        className="[&>div]:items-center cursor-not-allowed"
                        key={org.id}
                        icon={<Boxes size={18} strokeWidth={1} className="text-foreground" />}
                        title={org.name}
                        description={`${org.plan.name} Plan • ${numProjects > 0 ? `${numProjects} Project${numProjects > 1 ? 's' : ''}` : '0 Projects'}`}
                      />
                    )
                  })}
                </div>
              </CollapsibleContent_Shadcn_>
            </Collapsible_Shadcn_>
          )}

          <div className={cn('flex gap-3 justify-end')}>
            <ButtonTooltip
              size="medium"
              htmlType="submit"
              type="primary"
              onClick={async () => {
                await onSubmit(form.getValues())
              }}
              loading={isLinkingOrganization}
              disabled={!isDirty || isLinkingOrganization || isLoadingOnboardingInfo}
              tooltip={{
                content: {
                  side: 'top',
                  text: !isDirty ? 'No organization selected' : undefined,
                },
              }}
            >
              Link organization
            </ButtonTooltip>
          </div>
        </ScaffoldSectionContent>
      </ScaffoldSection>

      <AwsMarketplaceOnboardingSuccessModal
        visible={orgLinkedSuccessfully}
        onClose={() => {
          setOrgLinkedSuccessfully(false)
          router.push(`/org/${orgToRedirectTo}`)
        }}
      />

      <NewAwsMarketplaceOrgModal
        visible={showOrgCreationDialog}
        onClose={() => setShowOrgCreationDialog(false)}
        buyerId={buyerId as string}
        onSuccess={(newlyCreatedOrgSlug) => {
          setShowOrgCreationDialog(false)
          setOrgToRedirectTo(newlyCreatedOrgSlug)
          setOrgLinkedSuccessfully(true)
        }}
      />
    </>
  )
}

export default AwsMarketplaceLinkExistingOrg
