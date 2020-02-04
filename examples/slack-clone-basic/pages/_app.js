import React from 'react'
import App from 'next/app'
import Router from 'next/router'
import UserContext from '~/lib/UserContext'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export default class SupabaseSlackClone extends App {
  state = {
    authLoaded: false,
    user: null,
  }

  componentDidMount = () => {
    const user = localStorage.getItem('supabase-slack-clone')
    if (user) this.setState({ user, authLoaded: true })
    else Router.push('/')
  }

  /**
   * Dummy function 
   * DO NOT USE IN PRODUCTION
   */
  signIn = async username => {
    var user = {}
    let { body } = await supabase
      .from('users')
      .match({ username })
      .select('id, username')
    if (!body.length) {
      // @TODO: upsert
      await supabase.from('users').insert([{ username }])
      let { body } = await supabase
        .from('users')
        .match({ username })
        .select('id, username')
      user = body[0].id
    } else {
      user = body[0].id
    }
    localStorage.setItem('supabase-slack-clone', user)
    this.setState({ user }, () => {
      Router.push('/channels/[id]', '/channels/1')
    })
  }

  signOut = () => {
    localStorage.removeItem('supabase-slack-clone')
    this.setState({ user: null })
    Router.push('/')
  }

  render() {
    const { Component, pageProps } = this.props
    return (
      <UserContext.Provider
        value={{
          authLoaded: this.state.authLoaded,
          user: this.state.user,
          signIn: this.signIn,
          signOut: this.signOut,
        }}
      >
        <Component {...pageProps} />
      </UserContext.Provider>
    )
  }
}
