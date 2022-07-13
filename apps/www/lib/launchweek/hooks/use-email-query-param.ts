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

import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * If `paramName` exists in query string, then call `setEmail()` with the value
 * and delete it from the URL.
 */
export default function useEmailQueryParam(
  paramName: string,
  setEmail: (email: string) => unknown
) {
  const router = useRouter();
  useEffect(() => {
    if ('URLSearchParams' in window) {
      const { search, pathname } = window.location;
      const params = new URLSearchParams(search);
      const email = params.get(paramName);
      if (email) {
        setEmail(email);
        params.delete(paramName);
        const newSearch = params.toString();
        const newAsPath = pathname + (newSearch ? `?${newSearch}` : '');
        const newPathname = router.pathname + (newSearch ? `?${newSearch}` : '');
        history.replaceState(
          { url: newPathname, as: newAsPath, options: { shallow: true } },
          '',
          newAsPath
        );
      }
    }
  }, [setEmail, router.pathname, paramName]);
}
