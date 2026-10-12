import { cn } from 'ui'

export const YouTube = ({
  id,
  title,
  className,
}: {
  id: string
  title: string
  className?: string
}) => (
  <div className={cn('video-container', className)}>
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${id}`}
      title={`Youtube video: ${title}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
)
