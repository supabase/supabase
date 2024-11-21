import { useParams } from 'common'
import dynamic from 'next/dynamic'

// Loads pages in dynamically depending on the route
export function IntegrationPageHandler() {
  const { id, pageId, childId } = useParams()

  if (id?.includes('_wrapper')) {
    switch (pageId) {
      case undefined:
        return dynamic(
          () =>
            import('components/interfaces/Integrations/Wrappers/OverviewTab').then(
              (mod) => mod.WrapperOverviewTab
            ),
          {
            loading: () => <div>Loading {id.replace('_wrapper', '')}...</div>,
          }
        )
      case 'wrappers':
        console.log('found actual wrappers')
        return dynamic(
          () =>
            import('components/interfaces/Integrations/Wrappers/WrappersTab').then(
              (mod) => mod.WrappersTab
            ),
          {
            loading: () => <div>Loading {id.replace('_wrapper', '')} wrappers...</div>,
          }
        )
    }
  }

  switch (id) {
    case 'queues':
      if (childId) {
        return dynamic(
          () =>
            import('components/interfaces/Integrations/NewQueues/QueueTab').then(
              (mod) => mod.QueueTab
            ),
          {
            loading: () => <div>Loading {childId} Queue...</div>,
          }
        )
      }
      switch (pageId) {
        case undefined:
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Integration/IntegrationOverviewTab').then(
                (mod) => mod.IntegrationOverviewTab
              ),
            {
              loading: () => <div>Loading Qeueus...</div>,
            }
          )
        case 'queues':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/NewQueues/QueuesTab').then(
                (mod) => mod.QueuesTab
              ),
            {
              loading: () => <div>Loading Queues...</div>,
            }
          )
      }
      break
    case 'webhooks':
      switch (pageId) {
        case undefined:
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Webhooks/OverviewTab').then(
                (mod) => mod.WebhooksOverviewTab
              ),
            {
              loading: () => <div>Loading Webhooks...</div>,
            }
          )
        case 'webhooks':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Webhooks/ListTab').then(
                (mod) => mod.WebhooksListTab
              ),
            {
              loading: () => <div>Loading Webhooks...</div>,
            }
          )
      }
    case 'cron-jobs':
      switch (pageId) {
        case undefined:
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Integration/IntegrationOverviewTab').then(
                (mod) => mod.IntegrationOverviewTab
              ),
            {
              loading: () => <div>Loading Cron Jobs...</div>,
            }
          )
        case 'cron-jobs':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/NewCronJobs/CronjobsTab').then(
                (mod) => mod.CronjobsTab
              ),
            {
              loading: () => <div>Loading Cron Jobs...</div>,
            }
          )
      }
      break
    case 'graphiql':
      switch (pageId) {
        case undefined:
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Integration/IntegrationOverviewTab').then(
                (mod) => mod.IntegrationOverviewTab
              ),
            {
              loading: () => <div>Loading GraphiQL...</div>,
            }
          )
        case 'graphiql':
          return dynamic(
            () =>
              import('components/interfaces/Integrations/GraphQL/GraphiQLTab').then(
                (mod) => mod.GraphiQLTab
              ),
            {
              loading: () => <div>Loading GraphiQL...</div>,
            }
          )
      }
      break
    case 'vault':
      switch (pageId) {
        case undefined:
          return dynamic(
            () =>
              import('components/interfaces/Integrations/Integration/IntegrationOverviewTab').then(
                (mod) => mod.IntegrationOverviewTab
              ),
            {
              loading: () => <div>Loading Vault...</div>,
            }
          )
        case 'keys':
          return dynamic(
            () =>
              import('components/interfaces/Settings/Vault').then(
                (mod) => mod.EncryptionKeysManagement
              ),
            {
              loading: () => <div>Loading Vault...</div>,
            }
          )
        case 'secrets':
          return dynamic(
            () =>
              import('components/interfaces/Settings/Vault').then((mod) => mod.SecretsManagement),
            {
              loading: () => <div>Loading Vault...</div>,
            }
          )
      }
      break
  }
  return null
}
