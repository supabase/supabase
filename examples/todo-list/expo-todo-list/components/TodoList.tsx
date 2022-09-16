import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, SafeAreaView, FlatList } from 'react-native'
import { Styles } from '../lib/constants'
import { Text } from 'react-native-elements'
import { supabase } from '../lib/initSupabase'
import { useUser } from '../components/UserContext'

import { Button, Input, ListItem, CheckBox } from 'react-native-elements'

/** URL polyfill. Required for Supabase queries to work in React Native. */
import 'react-native-url-polyfill/auto'

type Todo = {
  id: number
  user_id: string
  task: string
  is_complete: boolean
  inserted_at: Date
}

export default function TodoList() {
  const { user } = useUser()
  const [todos, setTodos] = useState<Array<Todo>>([])
  const [newTaskText, setNewTaskText] = useState<string>('')

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    const { data: todos, error } = await supabase
      .from<Todo>('todos')
      .select('*')
      .order('id', { ascending: false })
    if (error) console.log('error', error)
    else setTodos(todos!)
  }

  const addTodo = async (taskText: string) => {
    const task = taskText.trim()
    console.log('newtask:', task)
    if (task.length) {
      const { data: todo, error } = await supabase
        .from<Todo>('todos')
        .insert({ task, user_id: user!.id })
        .single()
      if (error) console.log(error.message)
      else {
        setTodos([todo!, ...todos])
        setNewTaskText('')
      }
    }
  }

  const toggleCompleted = async (id: number, is_complete: boolean) => {
    const { data, error } = await supabase
      .from<Todo>('todos')
      .update({ is_complete: !is_complete })
      .eq('id', id)
      .single()
    if (error) console.log(error)
    else setTodos(todos.map((todo) => (todo.id === id ? data! : todo)))
  }

  const deleteTodo = async (id: number) => {
    const { error } = await supabase.from<Todo>('todos').delete().eq('id', id)
    if (error) console.log('error', error)
    else setTodos(todos.filter((x) => x.id !== Number(id)))
  }

  return (
    <View>
      <View style={[styles.verticallySpaced, { marginTop: 20 }]}>
        <Button title="Sign out" onPress={() => supabase.auth.signOut()} />
      </View>
      <View style={[styles.verticallySpaced, { marginTop: 20 }]}>
        <Input
          label="New todo"
          leftIcon={{ type: 'font-awesome', name: 'tasks' }}
          onChangeText={(text) => setNewTaskText(text)}
          value={newTaskText}
        />
        <Button title="Add" onPress={() => addTodo(newTaskText)} />
      </View>
      <SafeAreaView style={styles.verticallySpaced}>
        <FlatList
          scrollEnabled={true}
          data={todos}
          keyExtractor={(item) => `${item.id}`}
          renderItem={({ item: todo }) => (
            <ListItem bottomDivider>
              <ListItem.Content>
                <View
                  style={[
                    { display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
                  ]}
                >
                  <CheckBox
                    checked={todo.is_complete}
                    onPress={() => toggleCompleted(todo.id, todo.is_complete)}
                  />
                  <Text h3 style={{ margin: 'auto' }}>
                    {todo.task}
                  </Text>
                  <Button title="Delete" onPress={() => deleteTodo(todo.id)}></Button>
                </View>
              </ListItem.Content>
            </ListItem>
          )}
        />
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: Styles.spacing,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
})
