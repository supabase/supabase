import { createFileRoute } from '@tanstack/react-router'

import ComputeSecretsPage, {
  ComputeSecretsPageWrapper,
} from '@/pages/project/[ref]/compute/secrets'

export const Route = createFileRoute('/project/$ref/compute/secrets')({
  component: ComputeSecretsRoute,
  staticData: {
    computeLayoutTitle: 'Secrets',
  },
})

function ComputeSecretsRoute() {
  return (
    <ComputeSecretsPageWrapper>
      <ComputeSecretsPage dehydratedState={undefined} />
    </ComputeSecretsPageWrapper>
  )
}
