import { DOCS_CONTENT_CONTAINER_ID } from '~/features/ui/helpers.constants'

const SkipToContent = () => {
  return (
    <a href={`#${DOCS_CONTENT_CONTAINER_ID}`} className="skip-link">
      Skip to content
    </a>
  )
}

export { SkipToContent }
