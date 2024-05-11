import {
  Alert_Shadcn_,
  IconAlertTriangle,
  AlertTitle_Shadcn_,
  AlertDescription_Shadcn_,
  Button,
  IconExternalLink,
} from 'ui'

export const IPv4DeprecationNotice = () => {
  return (
    <Alert_Shadcn_ variant="warning">
      <IconAlertTriangle strokeWidth={2} />
      <AlertTitle_Shadcn_>
        Direct database access is only available via IPv6-compatible networks or if your project has
        the IPv4 add on.
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="space-y-3">
        <p>
          We strongly recommend using <span className="text-foreground">connection pooling</span> to
          connect to your database because it's compatible with both IPv4 and IPv6 networks.
        </p>
        <p>
          You'll only need to change the connection credentials that you're using in your
          application to the pooler's connection credentials.
        </p>
        <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
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
