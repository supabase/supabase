import { supabase } from '@/lib/supabase'
import { ref } from 'vue'

const allTodos = ref<any[] | null>([])

const fetchTodos = async function() {
    console.log("getting todos");
    
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .order('id')
  if (error) console.log('error', error)
  allTodos.value = todos
  console.log("got todos!", allTodos.value);
  
}

export { allTodos, fetchTodos }
