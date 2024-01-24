import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = () => {
  return (
    <div>
      <SimpleCodeBlock className="typescript">
        {`
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

function Page() {
  const [todos, setTodos] = useState([])

  useEffect(() => {
    function getTodos() {
      const { data: todos } = await supabase.from('todos').select()

      if (todos.length > 1) {
        setTodos(todos)
      }
    }

    getTodos()
  }, [])

  return (
    <div>
      {todos.map((todo) => (
        <li key={todo}>{todo}</li>
      ))}
    </div>
  )
}
export default Page
`}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
