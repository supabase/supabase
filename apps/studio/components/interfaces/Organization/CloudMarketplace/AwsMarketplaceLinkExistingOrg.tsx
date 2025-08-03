import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Form_Shadcn_,
  FormField_Shadcn_,
} from 'ui'
import { RadioGroupCard, RadioGroupCardItem } from '@ui/components/radio-group-card'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { Skeleton } from '@ui/components/shadcn/ui/skeleton'
import { cn } from '@ui/lib/utils'
import { ActionCard } from '../../../ui/ActionCard'
import { Boxes, ChevronRight } from 'lucide-react'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '../../../layouts/Scaffold'
import { ButtonTooltip } from '../../../ui/ButtonTooltip'
import { z } from 'zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCloudMarketplaceEligibilityQuery } from '../../../../data/organizations/organizations-query'
import { useMemo, useState } from 'react'
import { Organization } from '../../../../types'
import { useProjectsQuery } from '../../../../data/projects/projects-query'
import { useOrganizationLinkAwsMarketplaceMutation } from '../../../../data/organizations/organization-link-aws-marketplace-mutation'
import { toast } from 'sonner'
import AwsMarketplaceLinkingSuccess from './AwsMarketplaceLinkingSuccess'
import NewAwsMarketplaceOrgModal from './NewAwsMarketplaceOrgModal'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface Props {
  organizations?: Organization[] | undefined
  isLoadingOrganizations: boolean
}

const FormSchema = z.object({
  orgSlug: z.string(),
})

export type LinkExistingOrgForm = z.infer<typeof FormSchema>

const AwsMarketplaceLinkExistingOrg = ({ organizations, isLoadingOrganizations }: Props) => {
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

  const { data: eligibilityCheckResult } = useCloudMarketplaceEligibilityQuery()

  // Sort organizations by name ascending
  const sortedOrganizations = useMemo(() => {
    return organizations?.slice().sort((a, b) => a.name.localeCompare(b.name))
  }, [organizations])

  const { orgsLinkable, orgsNotLinkable } = useMemo(() => {
    const orgQualifiesForLinking = (org: Organization) => {
      const validationResult = eligibilityCheckResult?.find((result) => result.slug === org.slug)

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
  }, [sortedOrganizations, eligibilityCheckResult])

  const { data: projects = [] } = useProjectsQuery()

  const [isNotLinkableOrgListOpen, setIsNotLinkableOrgListOpen] = useState(false)
  const [orgLinkedSuccessfully, setOrgLinkedSuccessfully] = useState(false)
  const [showOrgCreationDialog, setShowOrgCreationDialog] = useState(false)

  const { mutate: linkOrganization, isLoading: isLinkingOrganization } =
    useOrganizationLinkAwsMarketplaceMutation({
      onSuccess: (_) => {
        //TODO(thomas): send tracking event
        setOrgLinkedSuccessfully(true)
        setTimeout(() => form.reset(), 0)
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
      <ScaffoldSection>
        <ScaffoldSectionDetail>
          <p className="mb-6 text-base">
            You’ve subscribed to our product on the AWS Marketplace. As a final step, please link a
            Supabase organization to your AWS Marketplace subscription. Choose the organization you
            want to be managed and billed through AWS.
          </p>
          <p className="text-xs">
            <span className="font-bold">Managed and billed through AWS Marketplace</span>
            <br />
            Supabase will no longer invoice you directly. Instead, AWS will handle billing for your
            Supabase subscription and charge the payment method saved in your AWS account. {''}
            <Link
              href="https://supabase.com/docs/guides/platform"
              target="_blank"
              className="underline"
            >
              Read more.
            </Link>
          </p>
          <div className="mt-10">
            <Alert_Shadcn_ variant="warning" title={'fdasfdsafdsa'}>
              <AlertTitle_Shadcn_ className="text-foreground font-bold text-orange-1000">
                “Auto Renewal” is currently turned OFF for your AWS Marketplace subscription
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_ className="flex flex-col gap-3 break-words">
                <div>
                  As a result, your Supabase organization will be downgraded to the Free Plan at the
                  end of your current billing cycle. If you have more than 2 projects running, all
                  your projects will be paused. To ensure uninterrupted service, please enable “Auto
                  Renewal” in your AWS Marketplace subscription settings.
                </div>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          </div>

          <p className="mt-14 text-base">
            <span className="font-bold">Want to start fresh?</span> Create a new organization and it
            will be linked automatically.
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
                        {isLoadingOrganizations ? (
                          Array(3)
                            .fill(0)
                            .map((_, i) => (
                              <Skeleton key={i} className="w-full h-[110px] rounded-md" />
                            ))
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
                      </div>
                    </FormItemLayout>
                  </RadioGroupCard>
                )}
              />
            </form>
          </Form_Shadcn_>

          {orgsNotLinkable.length > 0 && (
            <Collapsible_Shadcn_
              className="-space-y-px"
              open={isNotLinkableOrgListOpen}
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
                  The following organizations can’t be linked to AWS Marketplace at the moment. This
                  may be due to missing permissions, outstanding invoices, or an existing
                  marketplace link. If you'd like to link one of these organizations, please review
                  the organization settings. You need to be Owner or Administrator of the
                  organization to link it.
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
        </ScaffoldSectionContent>
      </ScaffoldSection>

      <ScaffoldSection isFullWidth className="pt-0">
        <ScaffoldSectionContent>
          <div className={cn('flex gap-3 justify-end')}>
            <ButtonTooltip
              size="medium"
              htmlType="submit"
              type="primary"
              onClick={async () => {
                await onSubmit(form.getValues())
              }}
              loading={isLinkingOrganization}
              disabled={!isDirty || isLinkingOrganization || isLoadingOrganizations}
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

      <AwsMarketplaceLinkingSuccess
        visible={orgLinkedSuccessfully}
        onClose={() => {
          router.push(`/org/${form.getValues('orgSlug')}`)
        }}
      />

      <NewAwsMarketplaceOrgModal
        visible={showOrgCreationDialog}
        onClose={() => setShowOrgCreationDialog(false)}
        buyerId={buyerId as string}
        onSuccess={() => {
          setShowOrgCreationDialog(false)
        }}
      />
    </>
  )
}

export default AwsMarketplaceLinkExistingOrg
