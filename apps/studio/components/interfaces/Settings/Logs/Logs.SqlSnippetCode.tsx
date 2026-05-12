const SqlSnippetCode: React.FC<React.PropsWithChildren> = ({ children }) => (
  <pre className="text-foreground text-sm wrap-break-word py-4 px-3 w-full">{children}</pre>
)

export default SqlSnippetCode
