import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from 'ui'

export interface ApiAuthorizationInvalidScreenProps {
  missingParameters: Array<string>
}

export function ApiAuthorizationInvalidScreen({
  missingParameters,
}: ApiAuthorizationInvalidScreenProps): ReactNode {
  const isPlural = missingParameters.length > 1
  const paragraphFontClass = 'text-sm text-muted-foreground'

  return (
    <Card>
      <CardHeader>Missing parameters</CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className={paragraphFontClass}>
          Cannot authorize this request because the URL is missing the following parameter
          {isPlural ? 's' : ''}: {missingParameters.join(', ')}.
        </p>
        <p className={paragraphFontClass}>
          If you followed a link here, please check the link and try again.
        </p>
      </CardContent>
    </Card>
  )
}
