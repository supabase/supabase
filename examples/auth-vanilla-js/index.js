console.log('Auth, Auth, Baby')

import { createClient } from '@supabase/supabase-js'
var supabase = createClient(
  'https://fulOwPFqTbTnOvyYbWWe.supabase.net',
  'EoDbmkko2n6JQudMRVPvrHBJYEq5tc'
)
window.userToken = null

window.onload = function () {
  var signUpForm = document.querySelector('#sign-up')
  signUpForm.onsubmit = signUpSubmitted.bind(signUpForm)

  var logInForm = document.querySelector('#log-in')
  logInForm.onsubmit = logInSubmitted.bind(logInForm)

  var validateForm = document.querySelector('#validate')
  validateForm.onsubmit = validateSubmitted.bind(validateForm)
}

const signUpSubmitted = (event) => {
  event.preventDefault()

  supabase
    .rpc('signup', {
      email: event.target[0].value,
      fullname: event.target[1].value,
      password: event.target[2].value,
    })
    .then((response) => {
      window.userToken = response.body
      document.querySelector('#user-token').innerHTML = window.userToken
    })
    .catch(console.error)
}

const logInSubmitted = (event) => {
  event.preventDefault()
  console.log(event)

  supabase
    .rpc('login', {
      email: event.target[0].value,
      password: event.target[1].value,
    })
    .then((response) => {
      window.userToken = response.body
      document.querySelector('#user-token').value = window.userToken
    })
    .catch(console.error)
}
