import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = () => {
  return (
    <div>
      <SimpleCodeBlock className="typescript">
        {`
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <ul>
      {todos?.map((todo) => (
        <li>{todo}</li>
      ))}
    </ul>
  )
}

`}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
