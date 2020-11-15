import { supabase } from '@/lib/supabase'
import { ref } from 'vue'

const allTodos = ref<any[]>([])

const fetchTodos = async function() {
    console.log("getting todos");
    
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .order('id')
  if (error) console.log('error', error)

  if(todos === null){
    allTodos.value = []
    return
  }

  allTodos.value = todos
  console.log("got todos!", allTodos.value);
  
}

export { allTodos, fetchTodos }
