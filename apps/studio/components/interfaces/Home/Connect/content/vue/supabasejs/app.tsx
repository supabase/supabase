import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = () => {
  return (
    <div>
      <SimpleCodeBlock className="typescript">
        {`
<script setup>
  import { supabase } from '../utils/supabase'
  const todos = ref([])

  async function getTodos() {
    const { data: todos } = await supabase.from('todos').select()
    countries.value = todos
  }

  onMounted(() => {
    getTodos()
  })

</script>

<template>
  <ul>
    <li v-for="todo in todos" :key="todo.id">{{ todo.name }}</li>
  </ul>
</template>
`}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
