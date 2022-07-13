/**
 * Copyright 2020 Vercel Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import htmlescape from 'htmlescape'
import { GitHubOAuthData } from '~/lib/launchweek/types'
import { SITE_ORIGIN } from '~/lib/launchweek/constants'

export function renderSuccess(data?: GitHubOAuthData) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Authorize application</title>
    <style>
      html {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
          'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
          'Helvetica Neue', sans-serif;
        background: #000;
      }

      body {
        margin: 0;
        color: #fff;
        min-height: 100vh;
        padding: 60px 20px;
        display: flex;
        width: 100%;
        align-items: center;
        flex-direction: column;
        justify-content: center;
      }

      h1 {
        font-size: 64px;
        letter-spacing: -0.05em;
        line-height: 1;
        margin: 20px 0;
        max-width: 600px;
        text-align: center;
      }

      p {
        font-size: 24px;
        line-height: 1.4;
        margin: 0;
        text-align: center;
        max-width: 400px;
      }

      *,
      *:before,
      *:after {
        box-sizing: inherit;
      }
    </style>
  </head>
  <body>
    <svg
      width="69"
      height="72"
      viewBox="0 0 69 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 0C14.32 0 0 14.6822 0 32.8094C0 47.3276 9.16 59.5901 21.88 63.9373C23.48 64.2244 24.08 63.2401 24.08 62.3789C24.08 61.5997 24.04 59.0159 24.04 56.2681C16 57.7856 13.92 54.2585 13.28 52.413C12.92 51.4697 11.36 48.5579 10 47.7787C8.88 47.1635 7.28 45.6461 9.96 45.6051C12.48 45.5641 14.28 47.9837 14.88 48.968C17.76 53.9305 22.36 52.5361 24.2 51.6748C24.48 49.5422 25.32 48.1068 26.24 47.2865C19.12 46.4663 11.68 43.6365 11.68 31.0869C11.68 27.5189 12.92 24.566 14.96 22.2694C14.64 21.4491 13.52 18.0862 15.28 13.5749C15.28 13.5749 17.96 12.7136 24.08 16.9379C26.64 16.1996 29.36 15.8305 32.08 15.8305C34.8 15.8305 37.52 16.1996 40.08 16.9379C46.2 12.6726 48.88 13.5749 48.88 13.5749C50.64 18.0862 49.52 21.4491 49.2 22.2694C51.24 24.566 52.48 27.4779 52.48 31.0869C52.48 43.6775 45 46.4663 37.88 47.2865C39.04 48.3118 40.04 50.2804 40.04 53.3563C40.04 57.7445 40 61.2716 40 62.3789C40 63.2401 40.6 64.2654 42.2 63.9373C48.5526 61.7385 54.0727 57.5525 57.9834 51.9685C61.894 46.3846 63.9983 39.6838 64 32.8094C64 14.6822 49.68 0 32 0Z"
        fill="white"
      />
      <path
        d="M57 50C51.4771 50 47 54.4771 47 60C47 65.5228 51.4771 70 57 70C62.5228 70 67 65.5228 67 60C67 54.4771 62.5228 50 57 50Z"
        fill="white"
        stroke="black"
        strokeWidth="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M53 59.8571L55.5 62.3572L60.8572 57"
        stroke="black"
        strokeWidth="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <h1>Success!</h1>
    <p>You may close this window and see your ticket image.</p>
    <script>
      if (window.opener) {
        window.opener.postMessage(${htmlescape(data || '')}, ${htmlescape(SITE_ORIGIN || '*')});
      } else {
        window.close();
      }
    </script>
  </body>
</html>
`
}

export function renderError() {
  return `
 <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Authorize application</title>
    <style>
      html {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
          'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
          'Helvetica Neue', sans-serif;
        background: #000;
      }

      body {
        margin: 0;
        color: red;
        min-height: 100vh;
        padding: 60px 20px;
        display: flex;
        width: 100%;
        align-items: center;
        flex-direction: column;
        justify-content: center;
      }

      h1 {
        font-size: 64px;
        letter-spacing: -0.05em;
        line-height: 1;
        margin: 20px 0;
        max-width: 600px;
        text-align: center;
      }

      p {
        font-size: 24px;
        line-height: 1.4;
        margin: 0;
        text-align: center;
        max-width: 400px;
      }

      *,
      *:before,
      *:after {
        box-sizing: inherit;
      }
    </style>
  </head>
  <body>
    <svg
      width="69"
      height="72"
      viewBox="0 0 69 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 0C14.32 0 0 14.6822 0 32.8094C0 47.3276 9.16 59.5901 21.88 63.9373C23.48 64.2244 24.08 63.2401 24.08 62.3789C24.08 61.5997 24.04 59.0159 24.04 56.2681C16 57.7856 13.92 54.2585 13.28 52.413C12.92 51.4697 11.36 48.5579 10 47.7787C8.88 47.1635 7.28 45.6461 9.96 45.6051C12.48 45.5641 14.28 47.9837 14.88 48.968C17.76 53.9305 22.36 52.5361 24.2 51.6748C24.48 49.5422 25.32 48.1068 26.24 47.2865C19.12 46.4663 11.68 43.6365 11.68 31.0869C11.68 27.5189 12.92 24.566 14.96 22.2694C14.64 21.4491 13.52 18.0862 15.28 13.5749C15.28 13.5749 17.96 12.7136 24.08 16.9379C26.64 16.1996 29.36 15.8305 32.08 15.8305C34.8 15.8305 37.52 16.1996 40.08 16.9379C46.2 12.6726 48.88 13.5749 48.88 13.5749C50.64 18.0862 49.52 21.4491 49.2 22.2694C51.24 24.566 52.48 27.4779 52.48 31.0869C52.48 43.6775 45 46.4663 37.88 47.2865C39.04 48.3118 40.04 50.2804 40.04 53.3563C40.04 57.7445 40 61.2716 40 62.3789C40 63.2401 40.6 64.2654 42.2 63.9373C48.5526 61.7385 54.0727 57.5525 57.9834 51.9685C61.894 46.3846 63.9983 39.6838 64 32.8094C64 14.6822 49.68 0 32 0Z"
        fill="#EE0000"
      />
      <path
        d="M57 70C62.5228 70 67 65.5228 67 60C67 54.4772 62.5228 50 57 50C51.4772 50 47 54.4772 47 60C47 65.5228 51.4772 70 57 70Z"
        fill="#EE0000"
        stroke="black"
        strokeWidth="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M60 57L54 63"
        stroke="black"
        strokeWidth="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M54 57L60 63"
        stroke="black"
        strokeWidth="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <h1>GitHub authentication has failed.</h1>
    <p>Please try again.</p>
  </body>
</html>
`
}
