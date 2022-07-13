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

import smoothscroll from 'smoothscroll-polyfill';

let installed = false;

export default function scroll(opts: ScrollToOptions) {
  if (!installed) {
    try {
      smoothscroll.polyfill();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('smoothscroll polyfill failed', err);
      return;
    }
    installed = true;
  }

  try {
    window.scroll({ behavior: 'smooth', ...opts });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('smoothscroll polyfill failed', err);
  }
}

export const scrollTo = (el: HTMLElement, offset = 0) => {
  scroll({
    top: el.offsetTop + offset
  });
};
