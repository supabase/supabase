import Integration from './Integration'

const IntegrationSettings = () => {
  return (
    <div className="grid grid-cols-2 gap-y-8 mt-8">
      <Integration
        title="Vercel"
        description="Supabase will keep the right environment variables up to date in each of the projects you assign to a Supabase project. You can also link multiple Vercel Projects to the same Supabase project."
        note="Your Vercel connection has access to 7 Vercel Projects. You can change the scope of the access for Supabase by configuring here."
        organizationConnections={[
          {
            id: '1',
            orgName: "Alaister's Org",
            addedByUser: 'Alaister',
          },
        ]}
        projectConnections={[
          {
            id: '1',
            createdAt: '2021-08-12T00:00:00.000Z',
            fromProjectName: 'supabase-vercel',
            toProjectName: 'alaister',
          },
        ]}
      />
    </div>
  )
}

export default IntegrationSettings
