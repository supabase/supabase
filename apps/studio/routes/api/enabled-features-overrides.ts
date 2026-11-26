import { createFileRoute } from '@tanstack/react-router'
import { IS_PLATFORM } from 'common'
import { getEnabledFeaturesOverrideDisabledList } from 'common/enabled-features/overrides'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/enabled-features-overrides')({
  server: {
    handlers: createApiHandlers({
      GET: () => {
        if (IS_PLATFORM) {
          return Response.json({ disabled_features: [] })
        }

        return Response.json({
          disabled_features: getEnabledFeaturesOverrideDisabledList(process.env),
        })
      },
    }),
  },
})
