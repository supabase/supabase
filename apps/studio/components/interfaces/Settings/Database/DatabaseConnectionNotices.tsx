import { ExternalLink } from 'lucide-react'

import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { WarningIcon } from 'ui-patterns/Icons/StatusIcons'

export const IPv4DeprecationNotice = () => {
  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>
        Direct database access is only available via IPv6-compatible networks.
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="space-y-3">
        <p>
          We strongly recommend using connection pooling to connect to your database because it's
          compatible with both IPv4 and IPv6 networks. You'll only need to change the connection
          credentials that you're using in your application to the pooler's connection credentials.
        </p>
        <Button asChild type="default" icon={<ExternalLink />}>
          <a
            href="https://github.com/orgs/supabase/discussions/17817"
            target="_blank"
            rel="noreferrer"
          >
            Learn more
          </a>
        </Button>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export const IPv4AddonDirectConnectionNotice = () => {
  return (
    <Alert_Shadcn_ variant="default">
      <AlertTitle_Shadcn_>
        Direct database connections is recommended if you're connecting with session mode.
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="space-y-3">
        <p>
          We strongly recommend you connect directly to your database instead of connection pooling
          when you're using session mode for lower latency.
        </p>
        <p>
          If you remove the IPv4 add on you'll need to switch back to connection pooling for session
          mode unless your network supports IPv6.
        </p>
        <Button asChild type="default" icon={<ExternalLink />}>
          <a
            href="https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler"
            target="_blank"
            rel="noreferrer"
          >
            Learn more
          </a>
        </Button>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export const DefaultSessionModeNotice = () => {
  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>You are not yet in Transaction mode.</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="space-y-3">
        <p>
          You need to set your <span className="text-foreground">Pool Mode</span> to{' '}
          <span className="text-foreground">Transaction</span> in the{' '}
          <span className="text-foreground">Connection pooling configuration</span> section below in
          order to use transaction mode on port 6543.
        </p>
        <p>
          Otherwise, port 6543 will continue to connect in{' '}
          <span className="text-foreground">Session</span> mode.
        </p>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
