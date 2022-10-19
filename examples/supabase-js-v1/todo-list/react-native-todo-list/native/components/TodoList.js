import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, SafeAreaView, FlatList} from 'react-native';
import {Styles} from '../lib/constants';
import {Text} from 'react-native-elements';
import {supabaseClient} from '../lib/initSupabase';
import {useUser} from './UserContext';

import {Button, Input, ListItem, CheckBox} from 'react-native-elements';
/** URL polyfill. Required for Supabase queries to work in React Native. */
import 'react-native-url-polyfill/auto';
export default function TodoList() {
  const {user} = useUser();
  const [todos, setTodos] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const componentMounted = useRef(true);

  useEffect(() => {
    const fetchTodos = async () => {
      const {data, error} = await supabaseClient
        .from('todos')
        .select('*')
        .order('id', {ascending: false});
      if (error) {
        console.log('error', error);
      } else {
        console.log('Todos: ', data);
        setTodos(data);
      }
    };
    if (componentMounted.current) {
      fetchTodos();
    }

    return () => {
      componentMounted.current = false;
    };
  }, []);

  const addTodo = async taskText => {
    const task = taskText.trim();
    console.log('newtask:', task);
    if (task.length) {
      const {data: todo, error} = await supabaseClient
        .from('todos')
        .insert({task, user_id: user.id})
        .single();
      if (error) {
        console.log(error.message);
      } else {
        setTodos([todo, ...todos]);
        setNewTaskText('');
      }
    }
  };

  const toggleCompleted = async (id, is_complete) => {
    const {data, error} = await supabaseClient
      .from('todos')
      .update({is_complete: !is_complete})
      .eq('id', id)
      .single();
    if (error) {
      console.log(error);
    } else {
      setTodos(todos.map(todo => (todo.id === id ? data : todo)));
    }
  };

  const deleteTodo = async id => {
    const {error} = await supabaseClient.from('todos').delete().eq('id', id);
    if (error) {
      console.log('error', error);
    } else {
      setTodos(todos.filter(x => x.id !== Number(id)));
    }
  };

  return (
    <View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title="Sign out"
          onPress={() => supabaseClient.auth.signOut()}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          autoFocus
          label="New todo"
          leftIcon={{type: 'font-awesome', name: 'tasks'}}
          onChangeText={text => setNewTaskText(text)}
          value={newTaskText}
        />
        <Button title="Add" onPress={() => addTodo(newTaskText)} />
      </View>
      <SafeAreaView style={styles.verticallySpaced}>
        <FlatList
          scrollEnabled={true}
          data={todos}
          keyExtractor={item => `${item.id}`}
          renderItem={({item: todo}) => (
            <ListItem bottomDivider>
              <ListItem.Content>
                <View style={[styles.dFlex]}>
                  <CheckBox
                    checked={todo.is_complete}
                    onPress={() => toggleCompleted(todo.id, todo.is_complete)}
                  />
                  <Text h4 style={[styles.mtAuto]}>
                    {todo.task}
                  </Text>
                  <Button title="Delete" onPress={() => deleteTodo(todo.id)} />
                </View>
              </ListItem.Content>
            </ListItem>
          )}
        />
      </SafeAreaView>
    </View>
  );
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
  mt20: {
    marginTop: 20,
  },
  mtAuto: {
    margin: 'auto',
  },
  dFlex: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
