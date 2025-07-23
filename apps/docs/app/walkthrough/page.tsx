import {
  CodeFirstSchemaContent,
  NoCodeSchemaContent,
  CodeFirstAuthConfig,
  NoCodeAuthConfig,
  ConnectToAppContent,
  CreateProjectContent,
  CodeFirstBranchingContent,
  NoCodeBranchingContent,
} from './step-content'
import { WalkthroughClientPage } from './client-page'

export default function WalkthroughsPage() {
  return (
    <WalkthroughClientPage
      codeFirstSchemaContent={<CodeFirstSchemaContent />}
      noCodeSchemaContent={<NoCodeSchemaContent />}
      codeFirstAuthConfig={<CodeFirstAuthConfig />}
      noCodeAuthConfig={<NoCodeAuthConfig />}
      connectToAppContent={<ConnectToAppContent />}
      createProjectContent={<CreateProjectContent />}
      codeFirstBranchingContent={<CodeFirstBranchingContent />}
      noCodeBranchingContent={<NoCodeBranchingContent />}
    />
  )
}
