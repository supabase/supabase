console.log('Auth, Auth, Baby')

import { createClient } from '@supabase/supabase-js'

var SUPABASE_URL = 'https://qgxofzpdhwflxckfyoyz.supabase.net'
var SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTU5NTU3OTM1MywiZXhwIjoxOTExMTU1MzUzfQ.zS6U4PuJsHJ0wbBQXANpg2fbvHazUtfCgWonJ_TXlRk'

var supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
window.userToken = null

document.addEventListener('DOMContentLoaded', function (event) {
  var signUpForm = document.querySelector('#sign-up')
  signUpForm.onsubmit = signUpSubmitted.bind(signUpForm)

  var logInForm = document.querySelector('#log-in')
  logInForm.onsubmit = logInSubmitted.bind(logInForm)

  var userDetailsButton = document.querySelector('#user-button')
  userDetailsButton.onclick = fetchUserDetails.bind(userDetailsButton)
})

const signUpSubmitted = (event) => {
  event.preventDefault()
  const email = event.target[0].value
  const password = event.target[1].value

  supabase.auth
    .signup(email, password)
    .then((response) => {
      alert(JSON.stringify(response.body))
    })
    .catch((err) => {
      alert(err.response.text)
    })
}

const logInSubmitted = (event) => {
  event.preventDefault()
  const email = event.target[0].value
  const password = event.target[1].value

  supabase.auth
    .login(email, password)
    .then((response) => {
      document.querySelector('#access-token').value = response.body.access_token
      document.querySelector('#refresh-token').value = response.body.refresh_token
      alert(JSON.stringify(response.body))
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
