export default function WidthWrapper({ isFullwidth, children }) {
  if (!isFullwidth) return <div class="section container p-b-none p-t-none">{children}</div>
  else return <>{children}</>
}
