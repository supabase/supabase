// 38x43 pixel logo inlined as a data URI so it renders in any host app regardless
// of its public assets or basePath.
const DEV_TOOLBAR_LOGO_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAArBAMAAADmjedDAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAVUExURUdwTBcXFxgYGBcXFxgYGBcXFxcXF3Y86DkAAAAGdFJOUwCgPuNgcJApY/cAAABWSURBVCjPY2CAgrS0JAZ0QFUxRUFBDDG3tDTqiTG5uIihizGmQQDtxNIwQNKQFBOEAqhAsqCgELofk1Hjl0IxY2NDDDEB9DREbbFUJSUFGqZxIEAKNwCAcpJYod0/5gAAAABJRU5ErkJggg=='

export function DevToolbarLogo({ className }: { className?: string }) {
  return (
    <img
      src={DEV_TOOLBAR_LOGO_DATA_URI}
      alt=""
      width={16}
      height={16}
      style={{
        filter:
          'brightness(0) saturate(100%) invert(72%) sepia(57%) saturate(431%) hue-rotate(108deg) brightness(95%) contrast(91%)',
      }}
      aria-hidden="true"
      className={className}
    />
  )
}
