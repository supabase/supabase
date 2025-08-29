import { cn } from 'ui'

export interface ProjectListItemStatusProps {
  totalIssues: number
  hasErrors: boolean
  hasWarnings: boolean
  renderMode?: 'inline' | 'separate' // inline for table rows, separate for cards
  className?: string
}

export const ProjectListItemStatus = ({ 
  totalIssues, 
  hasErrors, 
  hasWarnings, 
  renderMode = 'inline',
  className 
}: ProjectListItemStatusProps) => {
  if (totalIssues === 0) return null
  
  const issueText = `${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} need${totalIssues === 1 ? 's' : ''} attention`
  
  if (renderMode === 'separate') {
    // For ProjectCard - separate section below status
    return (
      <div className={cn("px-5 pb-3", className)}>
        <p className="text-xs text-foreground-light">
          {issueText}{' '}
          <span className={hasErrors ? 'text-destructive' : 'text-warning'}>
            attention
          </span>
        </p>
      </div>
    )
  }
  
  // For ProjectTableRow - inline under ID
  return (
    <p className={cn("text-xs text-foreground-light", className)}>
      {issueText}{' '}
      <span className={hasErrors ? 'text-destructive' : 'text-warning'}>
        attention
      </span>
    </p>
  )
}
