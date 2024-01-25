import Zoom from 'react-medium-image-zoom'
import ZoomContent from './ZoomContent'
import { useBreakpoint } from 'common'

const ZoomableImg = ({ zoomable = true, children }: any) => {
  const isMobile = useBreakpoint()
  const Component = zoomable ? Zoom : 'span'

  return (
    <Component
      {...(zoomable ? { ZoomContent: ZoomContent, zoomMargin: isMobile ? 20 : 80 } : undefined)}
    >
      {children}
    </Component>
  )
}

export default ZoomableImg
