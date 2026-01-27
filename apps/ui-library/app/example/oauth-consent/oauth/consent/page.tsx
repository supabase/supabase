import { Button } from '@/registry/default/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/registry/default/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

const OAuthConsentDemo = () => {
  const clientName = 'Claude Desktop'
  const userEmail = 'user@example.com'
  const scopes = ['Access your account information', 'Use MCP tools on your behalf']

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Authorize Application</CardTitle>
          <CardDescription className="break-all">{clientName}</CardDescription>
          <p className="text-xs text-muted-foreground">Logged in as {userEmail}</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="mb-3 text-sm font-medium">This application is requesting access to:</p>
            <ul className="space-y-2">
              {scopes.map((scope) => (
                <li key={scope} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{scope}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button variant="outline" className="flex-1">
            Deny
          </Button>
          <Button className="flex-1">Allow</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default OAuthConsentDemo
