export default function WidthWrapper({ isFullwidth, children }) {
  if (!isFullwidth) return <div className="section container p-b-none p-t-none">{children}</div>
  else return <>{children}</>
}
