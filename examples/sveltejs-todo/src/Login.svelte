<script>
import Supabase from '@supabase/supabase-js'
const {SNOWPACK_PUBLIC_SUPABASE_URL,SNOWPACK_PUBLIC_SUPABASE_KEY} =import.meta.env

const supabase = Supabase.createClient(SNOWPACK_PUBLIC_SUPABASE_URL, SNOWPACK_PUBLIC_SUPABASE_KEY)
let values = {}

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
      alert("Logged in as " + response.body.user.email)
    })
    .catch((err) => {
      alert(err.response.text)
    })
}

const logInSubmitted = (event) => {
  event.preventDefault()
  // const email = event.target[0].value
  // const password = event.target[1].value
  const {email,password} = values
  supabase.auth
    .login(email, password)
    .then((response) => {
      document.querySelector('#access-token').value = response.body.access_token
      document.querySelector('#refresh-token').value = response.body.refresh_token
      alert("Logged in as " + response.body.user.email)
    })
    .catch((err) => {
      alert(err.response.text)
    })
}

const fetchUserDetails = () => {
  supabase.auth
    .user()
    .then((response) => {
      alert(JSON.stringify(response))
    })
    .catch((err) => {
      alert(err.response.text)
    })
}

const logoutSubmitted = (event) => {
  event.preventDefault()

  supabase.auth
    .logout()
    .then((response) => {
      document.querySelector('#access-token').value = ''
      document.querySelector('#refresh-token').value = ''
      alert("Logout successful")
    })
    .catch((err) => {
      alert(err.response.text)
    })
}

</script>
<style>
body {
  /* margin: 0; */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
    'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: rgb(250, 217, 246);
}

label {
  margin: 0.5em;
}

.section {
  margin: 1em;
}

</style>
    <div class='container'>
        <div class='section'>
            <h1>Supabase Svelte Auth Example</h1>
        </div>
        <div class='section'>
            <a href="https://github.com/supabase/supabase/tree/master/examples/auth-vanilla-js">View the code on GitHub</a>
        </div>
        <div class='section'>
            <form id='sign-up'>
                <h3>Sign Up</h3>
                <control>
                  <label>Email</label><input autocomplete="email" type='email' name='email' bind:value={values.email}/>
                </control>
                <label>Password</label><input autocomplete="current-password" type='password' name='password' bind:value={values.password}/>
                <input on:click={signUpSubmitted} type='submit'>
            </form>
        </div>
        <div class='section'>
            <form id='log-in'>
                <h3>Log In</h3>
                <label>Email</label><input autocomplete="email"  type='email' name='email' bind:value={values.email}/>
                <label>Password</label><input autocomplete="current-password"  type='password' name='password' bind:value={values.password}/>
                <input on:click={logInSubmitted}  type='submit'>
            </form>
        </div>
        <div class='section'>
            <form id='validate'>
                <h3>Access Token</h3>
                <input readonly=readonly type='text' id='access-token' /> <small>Default expiry is 60 minutes</small>
                <h3>Refresh Token</h3>
                <input readonly=readonly type='text' id='refresh-token' /> <small>Supabase-js will use this to automatically fetch a new accessToken for you every 60 mins whilst the client is running</small> 
            </form>
        </div>
        <div class='section'>
            <h3>Fetch User Details</h3>
            <button on:click={fetchUserDetails} id='user-button'>Fetch</button>
        </div>
        <div class='section'>
            <h3>Logout</h3>
            <button on:click={logoutSubmitted} id='logout-button'>Logout</button>
        </div>
    </div>
