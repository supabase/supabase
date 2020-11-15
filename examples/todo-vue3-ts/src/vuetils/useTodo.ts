import { supabase } from '@/lib/supabase'
import { ref } from 'vue'

const allTodos = ref<any[]>([])

async function fetchTodos() {
  try {
    const { data: todos, error } = await supabase
      .from('todos')
      .select('*')
      .order('id')
    if (error) console.log('error', error)

    if (todos === null) {
      allTodos.value = []
      return
    }

    allTodos.value = todos
    console.log('got todos!', allTodos.value)
  } catch (err) {
    console.error('Error retrieving data from db', err)
  }
}

export { allTodos, fetchTodos }
