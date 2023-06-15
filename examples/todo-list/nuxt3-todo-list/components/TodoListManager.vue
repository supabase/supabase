<template>
  <UCard class="todo-list-card">
    <template #header>
      <div class="header">
        <div class="text-4xl">Nuxt Supabase Todo</div>
        <Auth />
      </div>
      <div class="buttons m-2">
        <UButton @click="showModal = true">New Todo</UButton>
      </div>
    </template>
    <div class="todo-lists">
      <div class="todo-lists-current">
        <TodoList
          status="incomplete"
          :todos="incompleteTodos"
          @updateTodos="updateTodos"
          @deleteTodos="deleteTodos"
          class="incomplete"
        />
        <TodoList
          status="complete"
          :todos="completeTodos"
          @updateTodos="updateTodos"
          @deleteTodos="deleteTodos"
          class="complete"
        />
      </div>
      <div class="todo-lists">
        <div class="todo-list-archived">
          <TodoList
            status="archived"
            :todos="archivedTodos"
            @updateTodos="updateTodos"
            @deleteTodos="deleteTodos"
            class="archived"
          />
        </div>
      </div>
    </div>
  </UCard>
  <UModal v-model="showModal">
    <UCard :ui="{ divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        New Todo
      </template>
      <UFormGroup name="name" label="Name">
        <UInput placeholder="name your todo" v-model="formData.name" type="text"/>
      </UFormGroup>
      <template #footer>
        <div class="buttons">
          <UButton @click="showModal = false">Cancel</UButton>
          <UButton @click="handleNewTodo" :disabled="saveTodoDisabled">Save</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<style scoped>
.todo-list-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.header {
  display: flex;
  justify-content: space-between;
}
.todo-lists {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
}
.todo-lists-current {
  display: flex;
  gap: 1rem;
  align-content: stretch;
}
.todo-lists-archive {
  display: flex;
  justify-content: space-evenly;
}
.incomplete {
  background-color: #AECFDF;
  width: 50%;
}
.complete {
  background-color: #9F9FAD;
  width: 50%;
}
.archived {
  background-color: #93748A;
}
</style>

<script lang="ts" setup>
  type TodoStatus = 'complete' | 'incomplete' | 'archived'

  const supabase = useSupabaseClient()
  const showModal = ref(false)
  const formData = ref({
    name: ''
  })
  const saveTodoDisabled = computed(() => formData.value.name.length < 3)
  const handleNewTodo = async () => {
    const { data, error } = await supabase
      .rpc('create_todo', {_name: formData.value.name})

    if (error) {
      alert(error.message)
    }

    showModal.value = false
    formData.value = {
      name: ''
    }
    await loadTodos()
  }

  const allTodos = ref([])
  const incompleteTodos = computed(()=>allTodos.value.filter(td => td.status === 'incomplete') as [])
  const completeTodos = computed(()=>allTodos.value.filter(td => td.status === 'complete') as [])
  const archivedTodos = computed(()=>allTodos.value.filter(td => td.status === 'archived') as [])
  const loadTodos = async () => {
    let { data, error } = await supabase
      .from('todo')
      .select('*')
    
      allTodos.value = data || []
  }
  await loadTodos()

  const updateTodos = async (todoIds: string[],status: TodoStatus) => {
    let { data, error } = await supabase
      .rpc('update_todos_status', {
        _status: status,
        _todo_ids: todoIds
      })

    if (error) alert(error.message)
    
    await loadTodos()
  }

  const deleteTodos = async (todoIds: string[]) => {
    let { data, error } = await supabase
      .rpc('delete_todos', {
        _todo_ids: todoIds
      })

    if (error) alert(error.message)
    
    await loadTodos()
  }
</script>