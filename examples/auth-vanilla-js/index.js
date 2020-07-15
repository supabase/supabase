console.log('Auth, Auth, Baby')

import { createClient } from '@supabase/supabase-js'

var SUPABASE_URL = 'https://UxtUdvoEHGzXftFJhwwT.supabase.net'
var SUPABASE_KEY = 'XbBJdEH2WdymQ0Hq9Huk1JqCCmggPX'

var supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
window.userToken = null

window.onload = function () {
  var signUpForm = document.querySelector('#sign-up')
  signUpForm.onsubmit = signUpSubmitted.bind(signUpForm)

  var logInForm = document.querySelector('#log-in')
  logInForm.onsubmit = logInSubmitted.bind(logInForm)
}

const signUpSubmitted = (event) => {
  event.preventDefault()
  const email = event.target[0].value
  const password = event.target[1].value

  var xmlHttp = new XMLHttpRequest()
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      alert(xmlHttp.responseText)
    }
  }
  xmlHttp.open('post', SUPABASE_URL + `/auth/v1/signup?apikey=${SUPABASE_KEY}`)
  xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
  xmlHttp.send(JSON.stringify({ email: email, password: password }))
}

const logInSubmitted = (event) => {
  event.preventDefault()
  console.log(event)
  const email = event.target[0].value
  const password = event.target[1].value

  var xmlHttp = new XMLHttpRequest()
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      alert(xmlHttp.responseText)
      let data = xmlHttp.responseText
      window.accessToken = data.access_token
      document.querySelector('#access-token').innerHTML = window.accessToken

      window.refreshToken = data.access_token
      document.querySelector('#refresh-token').innerHTML = window.refreshToken
    }
  }
  xmlHttp.open('post', SUPABASE_URL + `/auth/v1/token?apikey=${SUPABASE_KEY}&grant_type=password&username=${email}&password=${password}`)
  xmlHttp.send()
}

// manual signup
// curl --header "Content-Type: application/json" \
//   --request POST \
//   --data '{"email":"antwilson@hotmail.co.uk","password":"password"}' \
//   https://UxtUdvoEHGzXftFJhwwT.supabase.net/auth/v1/signup?apikey=XbBJdEH2WdymQ0Hq9Huk1JqCCmggPX

// manual login
// curl --header "Content-Type: application/json" \             
//   --request POST \
//   "https://UxtUdvoEHGzXftFJhwwT.supabase.net/auth/v1/token?username=antwilson@hotmail.co.uk&password=password&grant_type=password&apikey=XbBJdEH2WdymQ0Hq9Huk1JqCCmggPX"
