<style>
</style>

<script>
  import TailwindStyles from './TailwindStyles.svelte'
  // import {createClient} from '@supabase/supabase-js'
  import Supabase from '@supabase/supabase-js'
  let importEnv = true
  try {
    if (process.env.NODE_ENV === 'test') importEnv = false
  } catch (error) {}

  const { SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY } = !importEnv
    ? process.env
    : import.meta.env

  const supabase = Supabase.createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
  let values = {}
  export let user
  window.userToken = null

  const signUpSubmitted = (event) => {
    event.preventDefault()
    const email = event.target[0].value
    const password = event.target[1].value

    supabase.auth
      .signup(email, password)
      .then((response) => {
        document.querySelector('#access-token').value = response.body.access_token
        document.querySelector('#refresh-token').value = response.body.refresh_token
        // alert('Logged in as ' + response.body.user.email)
      })
      .catch((err) => {
        alert(err.response.text)
      })
  }

  const logInSubmitted = (event) => {
    event.preventDefault()
    // const email = event.target[0].value
    // const password = event.target[1].value
    const { email, password } = values
    supabase.auth
      .login(email, password)
      .then((response) => {
        document.querySelector('#access-token').value = response.body.access_token
        document.querySelector('#refresh-token').value = response.body.refresh_token
        // setContext("user" ,response.body.user)
        user = response.body.user
        localStorage.setItem('user-todolist', JSON.stringify(user))
        // alert('Logged in as ' + response.body.user.email)
      })
      .catch((err) => {
        alert(JSON.stringify(err))
      })
  }

  const logoutSubmitted = (event) => {
    event.preventDefault()

    supabase.auth
      .logout()
      .then((response) => {
        document.querySelector('#access-token').value = ''
        document.querySelector('#refresh-token').value = ''
        alert('Logout successful')
      })
      .catch((err) => {
        alert(JSON.stringify(err))
      })
  }
</script>

<div className="w-full h-full flex justify-center items-center p-4 bg-gray-300">
  <div className="w-full sm:w-1/2 xl:w-1/3">
    <div className="border-teal p-8 border-t-12 bg-white mb-6 rounded-lg shadow-lg bg-white">
      <div className="mb-4">
        <label className="font-bold text-grey-darker block mb-2">Email</label>
        <form id="sign-up">
          <h3>Sign Up</h3>
          <control>
            <label>Email</label><input
              className="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
              placeholder="Your Username"
              autocomplete="email"
              type="email"
              name="email"
              bind:value="{values.email}"
            />
          </control>
          <label>Password</label><input
            autocomplete="current-password"
            className="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
            placeholder="Your password"
            type="password"
            name="password"
            bind:value="{values.password}"
          />
        </form>
      </div>
    </div>

    <div className="flex flex-col gap-2">
      <button
        on:click="{logInSubmitted}"
        href="{'/LoggedIn'}"
        className="border border-indigo-700 text-indigo-700 py-2 px-4 rounded w-full text-center transition duration-150 hover:bg-indigo-700 hover:text-white"
      >
        Login
      </button>
      <a
        on:click="{signUpSubmitted}"
        href="{'/Login'}"
        className="border border-indigo-700 text-indigo-700 py-2 px-4 rounded w-full text-center transition duration-150 hover:bg-indigo-700 hover:text-white"
      >
        Signup
      </a>
    </div>

    <div class="section">
      <form id="validate">
        <h3>Access Token</h3>
        <input readonly="readonly" type="text" id="access-token" />
        <small>Default expiry is 60 minutes</small>
        <h3>Refresh Token</h3>
        <input readonly="readonly" type="text" id="refresh-token" />
        <small>Supabase-js will use this to automatically fetch a new accessToken for you every 60
          mins whilst the client is running</small>
      </form>
    </div>
    <div class="section">
      <button on:click="{logoutSubmitted}" id="logout-button">Logout</button>
    </div>
  </div>
</div>
