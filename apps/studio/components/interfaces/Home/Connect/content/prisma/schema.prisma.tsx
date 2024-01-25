import { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <div>
      <SimpleCodeBlock className="bash">
        {`
datasource db {
  provider  = "postgresql"
  url       = env(${projectKeys.apiUrl ?? '"DATABASE_URL"'})
  directUrl = env(${projectKeys.apiUrl ?? '"DIRECT_URL"'})
}
        `}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
