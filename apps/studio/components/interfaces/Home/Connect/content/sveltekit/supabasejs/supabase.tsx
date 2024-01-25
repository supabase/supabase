import { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <div>
      <SimpleCodeBlock className="bash">
        {`
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(https://supabaseUrl.supabase.co', 'supabaseKey')
`}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
