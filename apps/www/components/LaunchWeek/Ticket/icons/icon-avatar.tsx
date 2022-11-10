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

export default function IconAvatar() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask
        id="avatar-mask0"
        mask-type="alpha"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="80"
        height="80"
      >
        <circle cx="40" cy="40" r="40" fill="white" />
      </mask>
      <g mask="url(#avatar-mask0)">
        <g style={{ mixBlendMode: 'luminosity' }}>
          <circle cx="40" cy="40" r="40" fill="#2F3336" />
        </g>
      </g>
      <path
        d="M48 49V47C48 45.9391 47.5786 44.9217 46.8284 44.1716C46.0783 43.4214 45.0609 43 44 43H36C34.9391 43 33.9217 43.4214 33.1716 44.1716C32.4214 44.9217 32 45.9391 32 47V49"
        stroke="#8A8F98"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 39C42.2091 39 44 37.2091 44 35C44 32.7909 42.2091 31 40 31C37.7909 31 36 32.7909 36 35C36 37.2091 37.7909 39 40 39Z"
        stroke="#8A8F98"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
