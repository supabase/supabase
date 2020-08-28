
var SUPABASE_URL = 'https://varxfsgggoffdfqxlmmj.supabase.co'
var SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTU5ODQyMzU3OCwiZXhwIjoxOTEzOTk5NTc4fQ.V6J-ybbfFfk2EkYAzs24jLP4-aoCDzZQzdhTFiJ6KeI'

var supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
window.userToken = null

window.onload = function () {
  var signUpForm = document.querySelector('#sign-up')
  signUpForm.onsubmit = signUpSubmitted.bind(signUpForm)

  var logInForm = document.querySelector('#log-in')
  logInForm.onsubmit = logInSubmitted.bind(logInForm)

  var userDetailsButton = document.querySelector('#user-button')
  userDetailsButton.onclick = fetchUserDetails.bind(userDetailsButton)

  var logoutButton = document.querySelector('#logout-button')
  logoutButton.onclick = logoutSubmitted.bind(logoutButton)
}

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
  const email = event.target[0].value
  const password = event.target[1].value

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
