import Zoom from 'react-medium-image-zoom'
import ZoomContent from './ZoomContent'

const ZoomableImg = ({ zoomable = true, children }: any) => {
  const Component = zoomable ? Zoom : 'span'

  return (
    <Component {...(zoomable ? { ZoomContent: ZoomContent } : undefined)}>{children}</Component>
  )
}

export default ZoomableImg
