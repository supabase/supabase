<style>
</style>

<script>
  import { createClient } from '@supabase/supabase-js'

  let importEnv = true
  try {
    if (process.env.NODE_ENV === 'test') importEnv = false
  } catch (error) {}

  const { SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY } = !importEnv
    ? process.env
    : import.meta.env

  const supabase = createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
  let values = {}
  export let user
  window.userToken = null
  const forgotPassword = (event) => {
    alert('todo forgotPassword' + JSON.stringify(event))
  }
  const signUpSubmitted = (event) => {
    event.preventDefault()
    const { email, password } = values
    supabase.auth
      .signUp({ email, password })
      .then((res) => {
        if (res.error) {
          document.querySelector('#login-error').value = res.error
        } else {
          document.querySelector('#access-token').value = res.data.access_token
          document.querySelector('#refresh-token').value = res.data.refresh_token
          user = res.user
        }
      })
      .catch((err) => {
        document.querySelector('#login-error').value = err
      })
  }

  const logInSubmitted = (event) => {
    event.preventDefault()
    // const email = event.target[0].value
    // const password = event.target[1].value
    const { email, password } = values
    supabase.auth
      .signIn({ email, password })
      .then((res) => {
        const { data, error } = res
        console.log({ data, user: res.user, error })
        if (error) {
          document.querySelector('#login-error').value = error
        } else {
          document.querySelector('#access-token').value = data.access_token
          document.querySelector('#refresh-token').value = data.refresh_token
          // setContext("user" ,response.body.user)
          user = res.user
          localStorage.setItem('user-todolist', JSON.stringify(user))
        }
        // alert('Logged in as ' + response.body.user.email)
      })
      .catch((err) => {
        alert(JSON.stringify(err))
      })
  }

  const logoutSubmitted = (event) => {
    event.preventDefault()

    supabase.auth
      .signOut()
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

<header><img src="/supabase.svg" alt="Supabase Logo" className="logo" /></header>
<form>
  <div>
    <label class="block mb-2 text-indigo-500" for="username">Email</label>
    <input
      class="w-full p-2 mb-6 text-indigo-700 border-b-2 border-indigo-500 outline-none focus:bg-gray-300"
      placeholder="Your Username"
      autocomplete="email"
      type="email"
      name="email"
      bind:value="{values.email}"
    />
  </div>
  <div>
    <label class="block mb-2 text-indigo-500" for="password">Password</label>
    <input
      class="w-full p-2 mb-6 text-indigo-700 border-b-2 border-indigo-500 outline-none focus:bg-gray-300"
      autocomplete="current-password"
      className="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
      placeholder="Your password"
      type="password"
      name="password"
      bind:value="{values.password}"
    />
  </div>
  <div>
    <button
      on:click="{logInSubmitted}"
      class="has-hover-pointer w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10"
      on:click="{logInSubmitted}"
      href="{'/LoggedIn'}"
    >
      Login
    </button>
  </div>

  <footer>
    <a
      class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded text-green-700 border-green-500 hover:text-green-500 hover:bg-green-50 focus:outline-none focus:shadow-outline focus:border-green-300 transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10 float-left"
      on:click="{forgotPassword}"
      href="{'/Login'}"
    >Forgot Password?</a>
    <a
      on:click="{signUpSubmitted}"
      href="{'/Login'}"
      class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded text-green-700 border-green-500 hover:text-green-500 hover:bg-green-50 focus:outline-none focus:shadow-outline focus:border-green-300 transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10 float-right"
    >Sign Up</a>
  </footer>
</form>

<div class="section">
  <form id="validate">
    <h3>Access Token</h3>
    <input readonly="readonly" type="text" id="access-token" />
    <small>Default expiry is 60 minutes</small>
    <h3>Refresh Token</h3>
    <input readonly="readonly" type="text" id="refresh-token" />
    <small>Supabase-js will use this to automatically fetch a new accessToken for you every 60 mins
      whilst the client is running</small>
    <br />
    <input 
    class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded text-red-700 border-red-500 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:shadow-outline focus:border-red-300 transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10 float-right"

    readonly="readonly" type="text" id="login-error" />
  </form>
</div>
<div class="section">
  <button
    class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded text-green-700 border-green-500 hover:text-green-500 hover:bg-green-50 focus:outline-none focus:shadow-outline focus:border-green-300 transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10 float-left"
    on:click="{logoutSubmitted}"
    id="logout-button"
  >Logout</button>
</div>
