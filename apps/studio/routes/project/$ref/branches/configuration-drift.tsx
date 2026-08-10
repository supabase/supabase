import { createFileRoute, redirect, type AnyRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$ref/branches/configuration-drift')({
  beforeLoad: ({ params, location }) => {
    throw redirect<AnyRouter, string>({
      to: `/project/${params.ref}/settings/configuration-drift`,
      search: location.search,
      hash: location.hash,
      statusCode: 307,
    })
  },
})
