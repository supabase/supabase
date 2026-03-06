import { notFound } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { AddPartnerMemberForm } from '@/app/protected/[partnerslug]/settings/add-partner-member-form'
import { PartnerDetailsForm } from '@/app/protected/[partnerslug]/settings/partner-details-form'
import { createClient } from '@/lib/supabase/server'

type PartnerSettingsPageProps = {
  params: {
    partnerslug: string
  }
}

export default async function PartnerSettingsPage({ params }: PartnerSettingsPageProps) {
  const { partnerslug } = params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('id, slug, title, description, website, logo_url')
    .eq('slug', partnerslug)
    .maybeSingle()

  if (partnerError || !partner) {
    notFound()
  }

  const { data: myMembership, error: membershipError } = await supabase
    .from('partner_members')
    .select('role')
    .eq('partner_id', partner.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError || !myMembership) {
    notFound()
  }

  const { data: members, error: membersError } = await supabase
    .from('partner_members')
    .select('user_id, role, created_at')
    .eq('partner_id', partner.id)
    .order('created_at', { ascending: true })

  if (membersError) {
    throw new Error(membersError.message)
  }

  const canManageMembers = myMembership.role === 'admin'
  const memberRows = (members ?? []).map((member) => ({
    userId: member.user_id,
    role: member.role,
    addedAt: member.created_at ? new Date(member.created_at).toLocaleDateString() : 'Unknown',
  }))

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Partner settings</PageHeaderTitle>
            <PageHeaderDescription>{partner.slug}</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Partner details</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <PartnerDetailsForm
              partnerId={partner.id}
              partnerSlug={partner.slug}
              defaultValues={{
                title: partner.title,
                description: partner.description ?? '',
                website: partner.website ?? '',
                logoUrl: partner.logo_url ?? '',
              }}
            />
          </PageSectionContent>
        </PageSection>
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Members</PageSectionTitle>
              <PageSectionDescription>
                Only admins can add members or grant admin access.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <section className="space-y-4">
              {canManageMembers ? (
                <AddPartnerMemberForm partnerId={partner.id} partnerSlug={partner.slug} />
              ) : null}

              {memberRows.length === 0 ? (
                <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
                  No members have been added yet.
                </div>
              ) : (
                <div className="rounded-lg border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberRows.map((member) => (
                        <TableRow key={member.userId}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {member.userId}
                          </TableCell>
                          <TableCell className="capitalize">{member.role}</TableCell>
                          <TableCell className="text-muted-foreground">{member.addedAt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
