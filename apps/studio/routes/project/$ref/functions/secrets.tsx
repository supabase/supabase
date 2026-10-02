import { createFileRoute } from '@tanstack/react-router'

import SecretsPage, { SecretsPageWrapper } from '@/pages/project/[ref]/functions/secrets'

export const Route = createFileRoute('/project/$ref/functions/secrets')({
  component: FunctionsSecretsRoute,
  staticData: {
    functionsLayoutTitle: 'Secrets',
  },
})

function FunctionsSecretsRoute() {
  return (
    <SecretsPageWrapper>
      <SecretsPage dehydratedState={undefined} />
    </SecretsPageWrapper>
  )
}
