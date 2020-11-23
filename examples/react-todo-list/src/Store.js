import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
)

export const useStore = (props) => {
  const [list, setList] = useState(null)
  const [tasks, setTasks] = useState([])
  const [newTask, handleNewTask] = useState()
  const [taskListener, setTaskListener] = useState(null)

  useEffect(() => {
    fetchList(props.uuid)
      .then((response) => {
        setList(response)
        setTasks(response.tasks.sort((a, b) => b.id - a.id))
      })
      .catch(console.error)
  }, [props.uuid])

  useEffect(() => {
    const handleAsync = async () => {
      if (newTask) {
        // could be an update
        let update = tasks.find((task, i) => {
          if (task.id === newTask.id) {
            tasks[i] = newTask
            return true
          } else {
            return false
          }
        })
        if (update) {
          setTasks((t) => [...tasks]) // update
        } else {
          tasks.unshift(newTask)
          setTasks((t) => [...tasks]) // new
        }
      }
    }
    handleAsync()
  }, [newTask])

  useEffect(() => {
    if (!taskListener && list) {
      setTaskListener(
        supabase
          .from(`tasks:list_id=eq.${list.id}`)
          .on('INSERT', (payload) => handleNewTask(payload.new))
          .on('UPDATE', (payload) => handleNewTask(payload.new))
          .subscribe()
      )
    }
  }, [list, taskListener])

  return { list, tasks, setTasks }
}

export const addTask = async (task_text, list_id) => {
  try {
    let { data, error } = await supabase.from('tasks').insert([{ task_text, list_id }])
    if (error) {
      throw new Error(error)
    }
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export const updateTask = async (task_id, values) => {
  try {
    let { data, error } = await supabase.from('tasks').update(values).eq('id', task_id)
    if (error) {
      throw new Error(error)
    }
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export const createList = async (uuid) => {
  try {
    let { data, error } = await supabase.from('lists').insert([{ uuid }])
    if (error) {
      throw new Error(error)
    }
    return data[0]
  } catch (error) {
    console.log('error', error)
  }
}

export const fetchList = async (list_uuid) => {
  try {
    let { data, error } = await supabase
      .from('lists')
      .select(`*, tasks(*)`)
      .eq('uuid', list_uuid)
      .single()
    if (error) {
      throw new Error(error)
    }
    return data
  } catch (error) {
    console.log('error', error)
  }
}
