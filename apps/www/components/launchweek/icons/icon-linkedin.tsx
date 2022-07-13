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

import styles from './icon-transition.module.css';

type Props = { width: number | string };

export default function IconLinkedin({ width }: Props) {
  return (
    <svg width={width} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 1.67079C0 0.748038 0.747522 0 1.67079 0H18.3292C19.252 0 20 0.747522 20 1.67079V18.3292C20 19.252 19.2525 20 18.3292 20H1.67079C0.748038 20 0 19.2525 0 18.3292V1.67079ZM7.91667 7.625H10.625V8.98583C11.0154 8.20333 12.0158 7.5 13.5187 7.5C16.3996 7.5 17.0833 9.0575 17.0833 11.9154V17.2083H14.1667V12.5662C14.1667 10.9388 13.7762 10.0208 12.7833 10.0208C11.4062 10.0208 10.8333 11.0104 10.8333 12.5662V17.2083H7.91667V7.625ZM2.91667 17.0833H5.83333V7.5H2.91667V17.0833ZM6.25 4.375C6.25 5.41042 5.41042 6.25 4.375 6.25C3.33958 6.25 2.5 5.41042 2.5 4.375C2.5 3.33958 3.33958 2.5 4.375 2.5C5.41042 2.5 6.25 3.33958 6.25 4.375Z"
        className={styles['fill-black']}
      />
    </svg>
  );
}
