import React, {useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {Styles} from '../lib/constants';
import {supabaseClient} from '../lib/initSupabase';

import {Button, Input} from 'react-native-elements';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState('');

  const handleLogin = async type => {
    setLoading(type);
    const {error, user} =
      type === 'LOGIN'
        ? await supabaseClient.auth.signIn({email, password})
        : await supabaseClient.auth.signUp({email, password});
    console.log('Error: ', error);
    console.log('User: ', user);
    if (!error && user && type === 'SIGNUP') {
      Alert.alert('Check your email for the login link!');
    }
    if (error) {
      Alert.alert(error.message);
    }
    setLoading('');
  };

  return (
    <View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{type: 'font-awesome', name: 'envelope'}}
          onChangeText={text => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize={'none'}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Password"
          leftIcon={{type: 'font-awesome', name: 'lock'}}
          onChangeText={text => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize={'none'}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title="Sign in"
          disabled={!!loading.length}
          loading={loading === 'LOGIN'}
          onPress={() => handleLogin('LOGIN')}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Button
          title="Sign up"
          disabled={!!loading.length}
          loading={loading === 'SIGNUP'}
          onPress={() => handleLogin('SIGNUP')}
        />
      </View>
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
});
