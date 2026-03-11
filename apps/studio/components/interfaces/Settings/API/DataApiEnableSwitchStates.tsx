import { AlertCircle } from 'lucide-react'
import { Alert_Shadcn_, AlertTitle_Shadcn_, CardContent } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export const DataApiEnableSwitchLoading = () => (
  <CardContent className="space-y-2">
    <ShimmeringLoader />
    <ShimmeringLoader className="w-3/4" delayIndex={1} />
  </CardContent>
)

export const DataApiEnableSwitchError = () => (
  <Alert_Shadcn_ variant="destructive">
    <AlertCircle size={16} />
    <AlertTitle_Shadcn_>Failed to retrieve Data API settings</AlertTitle_Shadcn_>
  </Alert_Shadcn_>
)
