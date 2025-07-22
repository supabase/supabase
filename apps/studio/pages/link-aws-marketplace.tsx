import { useRouter } from 'next/router'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Form_Shadcn_,
  FormField_Shadcn_,
  RadioGroupCard,
  RadioGroupCardItem,
  Skeleton,
} from 'ui'
import {
  useCloudMarketplaceEligibilityQuery,
  useOrganizationsQuery,
} from '../data/organizations/organizations-query'
import { NextPageWithLayout, Organization } from '../types'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useForm } from 'react-hook-form'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
  ScaffoldTitle,
} from '../components/layouts/Scaffold'
import { z } from 'zod'
import { ButtonTooltip } from '../components/ui/ButtonTooltip'
import { Boxes, ChevronRight } from 'lucide-react'
import NewOrgAwsMarketplace from '../components/interfaces/Organization/CloudMarketplace/NewOrgAwsMarketplace'
import { useMemo, useState } from 'react'
import AwsConnectLayout from '../components/layouts/AwsConnectLayout'
import { ActionCard } from '../components/ui/ActionCard'
import { useProjectsQuery } from '../data/projects/projects-query'
import { useOrganizationLinkAwsMarketplaceMutation } from '../data/organizations/organization-link-aws-marketplace-mutation'
import AwsMarketplaceLinkingSuccess from '../components/interfaces/Organization/CloudMarketplace/AwsMarketplaceLinkingSuccess'
import { zodResolver } from '@hookform/resolvers/zod'
import NewOrgAwsMarketplaceForm, {
  CREATE_AWS_MANAGED_ORG_FORM_ID,
} from '../components/interfaces/Organization/CloudMarketplace/NewOrgAwsMarketplaceForm'
import Link from 'next/link'
import { toast } from 'sonner'

const LinkAwsMarketplace: NextPageWithLayout = () => {
  const orgsExisting = true

  const router = useRouter()
  const {
    query: { buyer_id: buyerId, tier },
  } = router

  const { data: organizations, isLoading: isLoadingOrganizations } = useOrganizationsQuery()
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

  const [showOrgCreationDialog, setShowOrgCreationDialog] = useState(false)
  const [orgLinkedSuccessfully, setOrgLinkedSuccessfully] = useState(false)
  const [isNotLinkableOrgListOpen, setIsNotLinkableOrgListOpen] = useState(false)

  const {
    mutate: linkOrg,
    error: linkOrgError,
    isLoading: isLinkingOrganization,
  } = useOrganizationLinkAwsMarketplaceMutation({
    onSuccess: (res) => {
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

  const formSchema = z.object({
    orgSlug: z.string(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgSlug: undefined,
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const isDirty = !!Object.keys(form.formState.dirtyFields).length

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    linkOrg({ slug: values.orgSlug, buyerId: buyerId as string })
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>AWS Marketplace Setup</ScaffoldTitle>
        </ScaffoldHeader>
        <ScaffoldDivider />
        <ScaffoldSection>
          <ScaffoldSectionDetail>
            {orgsExisting ? (
              <>
                <p className="mb-6 text-base">
                  Select an organization and link it to the AWS Marketplace contract you just
                  accepted. This organization will be managed and billed through AWS Marketplace.
                </p>
                <p className="text-xs">
                  <span className="font-bold">Managed and billed through AWS Marketplace</span>
                  <br />
                  This means any subscription plan changes are managed through AWS Marketplace, not
                  the Supabase Dashboard. Supabase will no longer invoice you directly. Instead, AWS
                  will issue invoices for your Supabase subscription and charge the payment method
                  saved in your AWS account.{' '}
                  <Link
                    href="https://supabase.com/docs/guides/platform"
                    target="_blank"
                    className="underline"
                  >
                    Read more in our docs.
                  </Link>
                </p>
                <p className="mt-14 text-base">
                  <span className="font-bold">Want to start fresh?</span> Create a new organization
                  and it will be linked automatically.
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
            ) : (
              <>
                <h1 className="font-bold text-xl mb-0">Create and link a Supabase organization</h1>
                <p className="mb-8">
                  You don’t have any organizations yet. To continue, you’ll need to create one. Once
                  created, it will be automatically linked to the AWS Marketplace contract you just
                  accepted so we can route billing through AWS.
                </p>
                <p>
                  <span className="font-bold">Billing through AWS</span>
                  <br /> That means that Supabase no longer invoices you directly. Instead, AWS
                  issues a monthly bill for your Supabase subscription and charges the payment
                  method you’ve saved in your AWS account. Any plan upgrades or downgrades are
                  managed through the AWS Marketplace.
                </p>
              </>
            )}
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent className="lg:ml-10">
            {orgsExisting ? (
              <>
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
                                            description={`${org.plan.name} Plan${numProjects > 0 ? `  •  ${numProjects} project${numProjects > 1 ? 's' : ''}` : ''}`}
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
                        The following organizations can’t be linked to AWS Marketplace at the
                        moment. This may be due to missing permissions, outstanding invoices, or an
                        existing marketplace link. If you'd like to link one of these organizations,
                        please review the organization settings. You need to be Owner or
                        Administrator of the organization to link it.
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
                              description={`${org.plan.name} Plan${numProjects > 0 ? `  •  ${numProjects} project${numProjects > 1 ? 's' : ''}` : ''}`}
                            />
                          )
                        })}
                      </div>
                    </CollapsibleContent_Shadcn_>
                  </Collapsible_Shadcn_>
                )}

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
              </>
            ) : (
              <div className="border-l px-10 pt-10">
                <NewOrgAwsMarketplaceForm
                  tier={tier as string}
                  onSuccess={() => {
                    setOrgLinkedSuccessfully(true)
                  }}
                />

                <div className="flex justify-end mt-10">
                  <Button
                    form={CREATE_AWS_MANAGED_ORG_FORM_ID}
                    htmlType="submit"
                    loading={false}
                    size="medium"
                  >
                    Create and link organization
                  </Button>
                </div>
              </div>
            )}
          </ScaffoldSectionContent>
        </ScaffoldSection>
      </ScaffoldContainer>

      <NewOrgAwsMarketplace
        visible={showOrgCreationDialog}
        onClose={() => setShowOrgCreationDialog(false)}
        tier={tier as string}
        onSuccess={() => {
          setShowOrgCreationDialog(false)
          setOrgLinkedSuccessfully(true)
        }}
      />

      <AwsMarketplaceLinkingSuccess
        visible={orgLinkedSuccessfully}
        onClose={() => {
          router.push(`/org/${form.getValues('orgSlug')}`)
        }}
      />
    </>
  )
}

LinkAwsMarketplace.getLayout = (page) => <AwsConnectLayout>{page}</AwsConnectLayout>

export default LinkAwsMarketplace
